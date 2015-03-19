define([
    "dojo",
    "dojo/_base/declare",
    "dojo/_base/array",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/ConnectDevice",
    "dojo/text!citrix/xenclient/templates/ConnectDevice.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    // Required in code
    "dojo/NodeList-traverse",
    // Required in template
    "citrix/common/Repeater",
    "citrix/common/BoundWidget",
    "citrix/common/CheckBox",
    "citrix/common/Button"
],
function(dojo, declare, array, connectDeviceNls, template, dialog, _boundContainerMixin) {
return declare("citrix.xenclient.ConnectDevice", [dialog, _boundContainerMixin], {

    templateString: template,
    widgetsInTemplate: true,
    canExecute: true,
    destroyOnHide: true,
    _deviceId: -1,

    constructor: function(args) {
        this.vm = XUICache.getVM(args.path);
        // Refresh when opening dialog
        this.vm.refreshUsb();
    },

    postMixInProperties: function() {
        dojo.mixin(this, connectDeviceNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(this.vm.publish_topic, this._messageHandler);
        this._bindDijit();
    },

    onDeviceSelect: function(event) {
        if (dojo.hasClass(event.currentTarget, "disabled")) {
            return;
        }
        var id = this._getDeviceID(event.currentTarget);
        if (id == this._deviceId) {
            return;
        }
        this._deviceId = id;
        this._setClass(".device", "selected", false);
        this._setClass(event.currentTarget, "selected", true);
        this._setVisible(this.alwaysUseContainer, true);
        this.alwaysUseNode.set("value", false);
        this._setEnabled(this.connectButton, true);
    },

    onExecute: function() {
        var vm = this.vm;
        var usb = this.vm.usbDevices[this._deviceId];
        var always = this.alwaysUseNode.get("value");

        var onError = function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        };
       
        ///TEMPORARY FIX
        ///ref OXT-116: https://openxt.atlassian.net/browse/OXT-116 
        ///Fix can be removed after rewrite/modification of vusb daemon fixes 
        ///race condition.

        var complete = function(reassign) {
            if(reassign){
                for(var dev in vm.usbDevices){
                    //vm.usbDevices is an object
                    if (vm.usbDevices.hasOwnProperty(dev)){ 
                        //newly reassigned usb device 
                        //is the device with the hightest ID
                        if (dev > usb.dev_id){
                            usb.dev_id = dev;
                        } 
                    }
                }     
            }
            vm.assignUsbDevice(usb.dev_id, function() {
                if (always) {
                    vm.setUsbDeviceSticky(usb.dev_id, true, undefined, onError);
                }
            }, onError);
        };
        
        //We need to explicitly remove the USB during reassign 
        var removeThenComplete = function() {
            //get vm the device is assigned to
            assignedUuid = usb.assigned_uuid; 
            if (assignedUuid !== ""){
                var curVM = XUICache.getVM(XUtils.uuidToPath(assignedUuid));    
                curVM.unassignUsbDevice(usb.dev_id, function(){
                    //Success 
                    //Give some time for the device to be removed
                    var interval = setInterval(function() {
                        clearInterval(interval);
                        complete(true);
                    }, 2000);
                }, function(error) {
                    //error
                    XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                }); 
            }
        
        };

        if (usb.assignedToOtherVM()) {
            // Confirm stealing device from another VM
            var message = (usb.state == 2) ? this.USB_FORCE_REASSIGN : this.USB_REASSIGN;
            XUICache.messageBox.showConfirmation(message, removeThenComplete);
        } else {
            complete();
        }
        ///END TEMPORARY FIX

        ///ORIGINAL CODE, REPLACE TEMPORARY FIX WITH THIS
        ///WHEN PERMENANT FIX COMPLETE
        /*var complete = function() {
            vm.assignUsbDevice(usb.dev_id, function() {
                if (always) {
                    vm.setUsbDeviceSticky(usb.dev_id, true, undefined, onError);
                }
            }, onError);
        };
       
        if (usb.assignedToOtherVM()) {
            // Confirm stealing device from another VM
            var message = (usb.state == 2) ? this.USB_FORCE_REASSIGN : this.USB_REASSIGN;
            XUICache.messageBox.showConfirmation(message, complete);
        } else {
            complete();
        }*/
        ///END ORIGINAL CODE

        this.inherited(arguments);
    },

    _bindDijit: function() {
        this.bind(this.vm);
        this.set("title", this.CONNECT_DEVICE);
        this._setVisible(this.alwaysUseContainer, false);
        this._setEnabled(this.connectButton, false);
    },

    _getDeviceID: function(node) {
        return new dojo.NodeList(node).parents("li").first()[0].getAttribute("deviceId");
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
            case XenConstants.TopicTypes.MODEL_USB_CHANGED:
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                break;
            }
        }
    }
});
});
