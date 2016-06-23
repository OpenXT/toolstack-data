// USB Service model Singleton
Namespace("XenClient.UI");

XenClient.UI.USBServiceModel = function() {
    // All we're doing is putting a shim on top of the usb_daemon interface
    // that ensures that we can time events correctly
    //
    // This interface is a layer over com.citrix.xenclient.usbdaemon and 
    // proxies assign_device, unassign_device, and set_sticky through the
    // set_usbDevice function, ensuring a few things:
    // - Reassignment works correctly, only updating the UI after completion
    // - Sticky is set/unset as needed, and does not impede any assign op
    // - USB operations will not conflict with each other via semaphore

    // Private stuffs
    var self = this;

    // Properties & Defaults
    var usbBusy = false;
    this.isUsbBusy = function(){
        return usbBusy;
    };
    
    // Services
    var services = {
        usb: new XenClient.DBus.CtxusbDaemonClient("com.citrix.xenclient.usbdaemon", "/")
    }

    var usbInterface = services.usb.com.citrix.xenclient.usbdaemon;

    // setup proxy 
    var exclude = [
        'assign_device',
        'unassign_device',
        'set_sticky'
    ];
    for(var fn in usbInterface){
        if(exclude.indexOf(fn) === -1){
            this[fn] = usbInterface[fn];
        }
    }

    /*  usbDevices setter
        Async nightmare due to ctxusb_daemon timing
        A great case for es6 promise and es7 async

        --- ASSIGNMENT----
        There are three cases:
            AssignUsb
                - Send assign message, wait for response
                - update sticky
            UnassignUsb
                - Send unassign message
                - wait for USB_DEVICE_ADDED signal
                - on response, run callback, i.e. refreshUsb
            ReassignUsb ( or async unassign then reassign)
                - Call unassignUsb with assignUsb as callback
                    - "first half" is unassigning withough usbRefresh callback
                    - "second half" is assigning with reassign param==true

        --- STICKY --
        When a device is going from sticky->not sticky, the change must be made
        before any assignment call.

        When not sticky->sticky, we must make the call after any assignment

        -- NAME --
        Doesn't work at all! Commenting all references for name change out right now.
        If name IS left in it has the change of breaking the state if the usb daemon
        is mid assignment

        --- OVERALL ORDERING ---
        Did assignment change?
            Currently sticky?
                Sticky = false
            Set assignment
        Did sticky change?
            Set Sticky
        Update all vm's usbModels
        Update the host's vm Model and send MODEL_USB_CHANGED event for UI update


        @device: the usbDevice we'll be setting values for
        @externalCallback: the callback to call after everything else is done.
    */
    this.set_usbDevice = function(device, externalCallback) {

        var usb = XUICache.Host.usbDevices[device.dev_id];
        var sticky = (device.getSticky.length > 0 && device.getSticky[0] === true) ||
                     device.getSticky === true;
        var stickyChanged = usb.getSticky() != sticky;
        var assignmentChanged = usb.assigned_uuid != device.assigned_uuid;
        var alreadySticky = usb.getSticky();
        var refreshRequired = assignmentChanged;

        var finish = function(){
            stickyChanged = usb.getSticky() != sticky;
            if (refreshRequired){
                console.log('refreshing USB')
                var finishWait = new XUtils.AsyncWait(function(){
                    usbBusy = false;
                    XUICache.Host.refreshUsb(externalCallback);
                })

                if (assignmentChanged || stickyChanged){
                    for (var path in XUICache.VMs){
                        XUICache.VMs[path].refreshUsb(undefined, finishWait.addCallback(), undefined, true);
                    }
                }
                finishWait.finish();
            }else {
                usbBusy = false;
                if(externalCallback) externalCallback();
            }
        }
        // This is the callback used to modify stick, name, and eventually refreshUsb
        // It should run last
        var setStickyAndName = function(){
            var wait = new XUtils.AsyncWait(finish);
            //Sticky
            stickyChanged = usb.getSticky() != sticky;
            if (stickyChanged) {
                console.log('Setting sticky')
                refreshRequired = true;
                usbInterface.set_sticky(device.dev_id, sticky ? 1 : 0, wait.addCallback());
            }

            // Name
            /*if (usb.name != device.name) {
                refreshRequired = true;
                interfaces.usb.name_device(device.dev_id, device.name, wait.addCallback());
            }*/
            wait.finish();
        };

        // Called ONLY if an assignment has changed
        var setAssignment = function(){
            // Figure out what type of change
            if (usb.assigned_uuid == ""){
                console.log('Assigning usb')
                // Assign a usb device that was previously unassigned or 2nd step of reassigning
                usbInterface.assign_device(device.dev_id, device.assigned_uuid, setStickyAndName);
            } else {
                // helper variable to store the next async callback
                var unassignCallback = setStickyAndName;

                // we are either unassigning or first step of reassigning
                if (device.assigned_uuid){
                    //first half reassigning
                    unassignCallback = function(message){
                        console.log('reassigning usb');
                        device.dev_id = message.data[0];
                        usbInterface.assign_device(device.dev_id, device.assigned_uuid, setStickyAndName);
                    };
                }
                // wrapper for unassign, mocks a normal callback scenario
                // Unassigning or first half or reassigning
                var handle = dojo.subscribe(XUtils.publishTopic, dojo.hitch(this, function(message){
                    if(message.type == XenConstants.TopicTypes.MODEL_USB_DEVICE_ADDED){
                        clearInterval(failInterval);
                        handle.remove();
                        console.log('unassign complete signal received');
                        // We receive the USB_DEVICE_ADDED signal from the USB daemon
                        // If we need to we can now call refreshUSB ang get the correct state
                        unassignCallback(message);
                    }
                }));

                // Sometimes dbus drops the MODEL_USB_DEVICE_ADDED signal.
                // This is the failsafe
                var failInterval = setInterval(function(){
                    handle.remove();
                    clearInterval(failInterval);
                    console.log('unassign signal lost, falling back');
                    usbInterface.list_devices(function(devices){
                        if(devices.length){
                            var newId = devices.filter(function(dev_id){
                                // give all the new devices not already cached
                                return !(XUICache.Host.usbDevices[dev_id])
                            }).reduce(function(a, b){
                                // only give the highest id
                                return  a > b ? a : b;
                            }, 0);
                            // Call unassign callback with the same structure as the normal
                            // dbus signal
                            unassignCallback({data: [newId]})
                        } else {
                            // complete fail, just continue
                            setStickyAndName();
                        }
                    })
                }, 15000)

                // unassign device
                console.log('unassigning usb')

                usbBusy = true;
                usbInterface.unassign_device(device.dev_id);
            }
        }

        ////  Process starts here! \\\\

        if (assignmentChanged){
            if(alreadySticky){
                // sticky MUST  be set to false before assignment can change

                // helper so usb.getSticky() works.
                usb.state = 0;
                console.log('pre-unassign sticky');
                usbInterface.set_sticky(device.dev_id, 0, setAssignment);
            } else {
                setAssignment();
            }
        } else {
            setStickyAndName();
        }
    };
}
