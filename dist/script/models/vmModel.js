// VM model, services and repository
Namespace("XenClient.UI");

XenClient.UI.VMModel = function(vm_path) {

    // Private stuffs
    var self = this;
    var truncateLength = 14;

    // Properties & Defaults
    this.publish_topic = vm_path;
    this.vm_path = vm_path;
    this.uuid = "";
    this.hosting_type = XenConstants.VMTypes.NORMAL;
    this.name = "";
    this.description = "";
    this.hidden_in_ui = false;
    this.slot = 0;
    this.vmtype = "";
    this.state = "";
    this.acpi_state = 0;
    this.image_path = "";
    this.tools_installed = true;
    this.tools_version = "";
    this.cd = "";
    this.gpu = "";
    this.mac = "";
    this.amt_pt = false;
    this.portica_enabled = 0; // 0 not installed, 1 installed and enabled, 2 installed and disabled
    this.seamless_traffic = false;
    this.autostart_pending = false;
    this.hidden_in_switcher = false;
    this.memory = 0;
    this.vcpus = 1;
    this.acpi_pt = false;
    this.smbios_pt = false;
    this.oem_acpi_features = false;
    this.boot = "cd";
    this.download_progress = 0;
    this.ready = false;
    this.policy_modify_vm = true; // Makes all fields read-only
    this.policy_wired_networking = true;
    this.policy_wireless_networking = true;
    this.policy_cd_access = true;
    this.policy_cd_recording = true;
    this.policy_audio_access = true;
    this.policy_audio_recording = true;
    this.start_on_boot = false;
    this.private_disk_space = "";
    this.shared_disk_space = "";
    this.control_platform_power_state = false;
    this.seconds_from_epoch = 0;
    this.show_switcher = true;
    this.native_experience = false;
    this.wireless_control = false;
    this.usb_grab_devices = false;
    this.usb_enabled = true;
    this.stubdom = false;
    this.viridian = true;
    this.hvm = true;
    this.kernel = "";
    this.kernel_extract = "";
    this.cmd_line = "";
    this.initrd = "";
    this.restrict_resolution = false;
    this.totalVirtualDiskSpaceMB = 0;
    this.totalUtilizedDiskSpace = 0;

    this.powerClicked = false;
    this.lastTransferState = null;

    this.pciDevicesAll = [];
    this.pciDevicesPT = [];
    this.usbDevices = {};
    this.nics = {};
    this.disks = {};
    this.list_product_properties = {};

    this.loaded = false;

    // ICA specific fields
    this.url = "";

    // Services
    var services = {
        vm:     new XenClient.DBus.XenmgrVmClient("com.citrix.xenclient.xenmgr", vm_path),
        host:   new XenClient.DBus.XenmgrHostClient("com.citrix.xenclient.xenmgr", "/host"),
        usb:    new XenClient.DBus.CtxusbDaemonClient("com.citrix.xenclient.usbdaemon", "/")
    };

    // Interfaces
    var interfaces = {
        vm:         services.vm.com.citrix.xenclient.xenmgr.vm,
        auth:       services.vm.com.citrix.xenclient.xenmgr.vm.auth,
        pci:        services.vm.com.citrix.xenclient.xenmgr.vm.pci,
        product:    services.vm.com.citrix.xenclient.xenmgr.vm.product,
        host:       services.host.com.citrix.xenclient.xenmgr.host,
        usb:        services.usb.com.citrix.xenclient.usbdaemon
    };

    // Mappings
    var readOnlyMap = [
        ["uuid",                                interfaces.vm],
        ["hidden_in_ui",                        interfaces.vm],
        ["vmtype",                              interfaces.vm,                          "type"],
        ["state",                               interfaces.vm],
        ["acpi_state",                          interfaces.vm],
        ["mac",                                 interfaces.vm],
        ["portica_enabled",                     interfaces.vm],
        ["autostart_pending",                   interfaces.vm],
        ["tools_installed",                     interfaces.vm,                          "pv-addons"],
        ["tools_version",                       interfaces.vm,                          "pv-addons-version"],
        ["policy_modify_vm",                    interfaces.vm,                          "policy-modify-vm-settings"],
        ["hosting_type",                        interfaces.vm.get_domstore_key,         "type"],
        ["seconds_from_epoch",                  interfaces.host.get_seconds_from_epoch],
        ["pciDevicesAll",                       interfaces.host.list_pci_devices],
        ["pciDevicesPT",                        interfaces.pci.list_pt_pci_devices],
        ["list_product_properties",             interfaces.product.list_product_properties],
        ["download_progress",                   interfaces.vm],
        ["ready",                               interfaces.vm]
    ];

    var readWriteMap = [
        ["slot",                                interfaces.vm],
        ["name",                                interfaces.vm],
        ["description",                         interfaces.vm],
        ["image_path",                          interfaces.vm],
        ["cd",                                  interfaces.vm],
        ["gpu",                                 interfaces.vm],
        ["amt_pt",                              interfaces.vm],
        ["memory",                              interfaces.vm],
        ["vcpus",                               interfaces.vm],
        ["acpi_pt",                             interfaces.vm],
        ["smbios_pt",                           interfaces.vm],
        ["boot",                                interfaces.vm],
        ["hidden_in_switcher",                  interfaces.vm],
        ["start_on_boot",                       interfaces.vm],
        ["control_platform_power_state",        interfaces.vm],
        ["oem_acpi_features",                   interfaces.vm],
        ["seamless_traffic",                    interfaces.vm],
        ["show_switcher",                       interfaces.vm],
        ["native_experience",                   interfaces.vm],
        ["wireless_control",                    interfaces.vm],
        ["usb_grab_devices",                    interfaces.vm],
        ["usb_enabled",                         interfaces.vm],
        ["policy_wired_networking",             interfaces.vm],
        ["policy_wireless_networking",          interfaces.vm],
        ["policy_cd_access",                    interfaces.vm],
        ["policy_cd_recording",                 interfaces.vm],
        ["policy_audio_access",                 interfaces.vm],
        ["policy_audio_recording",              interfaces.vm],
        ["stubdom",                             interfaces.vm],
        ["viridian",                            interfaces.vm],
        ["hvm",                                 interfaces.vm],
        ["kernel",                              interfaces.vm],
        ["kernel_extract",                      interfaces.vm],
        ["cmd_line",                            interfaces.vm],
        ["initrd",                              interfaces.vm],
        ["restrict_resolution",                 interfaces.vm,  "restrict-display-res"],
        ["url",                                 interfaces.vm.get_domstore_key, interfaces.vm.set_domstore_key, "url"]
    ];

    var refreshIgnoreMap = [
        // State is controlled by signals
        "state",
        "acpi_state"
    ];

    // Repository
    var repository = new XenClient.UI.Repository(this, readOnlyMap, readWriteMap, refreshIgnoreMap);

    function fail(error) {
        self.publish(XenConstants.TopicTypes.MODEL_FAILURE, error);
    }

    // Public stuffs
    this.publish = function(type, data) {
        dojo.publish(self.publish_topic, [{ type: type, data: data }]);
    };

    this.load = function(finish) {
        repository.load(false, function() {
            self.publish(XenConstants.TopicTypes.MODEL_CHANGED);
            var wait = new XUtils.AsyncWait(
                function() {
                    if(finish) {
                        finish(self);
                    }
                },
                finish
            );
            self.refreshUsb(undefined, wait.addCallback(), wait.error);
            self.refreshNics(undefined, wait.addCallback(), wait.error);
            self.refreshDisks(undefined, wait.addCallback(), wait.error);
            self.createCustomProperties(wait.addCallback(), wait.error);
            wait.finish();
        });
    };

    this.refresh = function(finish) {
        repository.refresh(false, function() {
            var wait = new XUtils.AsyncWait(
                function() {
                    self.publish(XenConstants.TopicTypes.MODEL_CHANGED);
                    if(finish) {
                        finish(self);
                    }
                },
                finish
            );
            self.refreshUsb(undefined, wait.addCallback(), wait.error);
            self.refreshNics(undefined, wait.addCallback(), wait.error);
            self.refreshDisks(undefined, wait.addCallback(), wait.error);
            wait.finish();
        });
    };

    this.save = repository.save;
    this.switchTo = interfaces.vm.switch_;
    this.deleteVM = interfaces.vm.delete_;
    this.addPciDevice = interfaces.pci.add_pt_rule_bdf;
    this.removePciDevice = interfaces.pci.delete_pt_rule_bdf;

    // image_path getter
    this.get_image_path = function() {
        var image = self.get_service_image_path();
        return image == "" ? "images/vms/Blue_VM.png" : image;
    };

    this.get_service_image_path = function() {
        if (self.image_path && XUICache.Host.available_vmimages.concat(XUICache.Host.available_serviceimages).contains(self.image_path)) {
            return self.image_path;
        }
        // default
        return "";
    };

    // boot getter
    this.get_boot = function() {
        return self.boot.split("");
    };

    // boot setter
    this.set_boot = function(bootOrder) {
        return bootOrder.join("");
    };

    // connectedDevices getter
    this.get_connectedDevices = function() {
        var devices = [];
        for (var id in self.usbDevices) {
            var usb = self.usbDevices[id];
            if (usb.assignedToCurrentVM()) {
                devices.push(usb);
            }
        }
        return devices;
    };

    // connectedDevices setter
    this.set_connectedDevices = function(devices) {
        if (!devices || devices == null) {
            return;
        }
        for (var i = 0; i < devices.length; i++) {
            var device = devices[i];
            var currentDevice = self.usbDevices[device.dev_id];
            if (currentDevice.name != device.name) {
                self.nameUsbDevice(device.dev_id, device.name);
            }
            if (currentDevice.getSticky() != device.getSticky) {
                self.setUsbDeviceSticky(device.dev_id, device.getSticky);
            }
        }
    };

    this.getPlatformDevices = function() {
        var devices = [];
        for (var id in self.usbDevices) {
            var usb = self.usbDevices[id];
            if (usb.isPlatformDevice()) {
                devices.push(usb);
            }
        }
        return devices;
    };

    this.getPCIDevices = function() {
        var devices = [];
        for (var id in self.pciDevicesAll) {
            if (self.pciDevicesAll.hasOwnProperty(id)) {
                var pci = self.pciDevicesAll[id];
                var state = 2; // Default to platform device

                if (XenConstants.PCIClassIDs.contains(pci.class)) {
                    state = 0; // Available
                }

                for (var index in self.pciDevicesPT) {
                    if (self.pciDevicesPT.hasOwnProperty(index)) {
                        if (self.pciDevicesPT[index].addr == pci.addr) {
                            state = 1; // Used by this VM
                            break;
                        }
                    }
                }

                pci.unavailable = (state != 0);
                pci.state = state;
                pci.info = [pci.addr, pci.class];
                devices.push(pci);
            }
        }

        return devices.sort(function(a, b) {
            return a.state - b.state;
        });
    };

    this.getPCIDevicesPT = function() {
        var devices = [];
        for (var id in self.pciDevicesPT) {
            if (self.pciDevicesPT.hasOwnProperty(id)) {
                var pci = self.pciDevicesPT[id];
                pci.unavailable = !(XenConstants.PCIClassIDs.contains(pci.class));
                // Sets whether the enabled state is controlled by the VM state
                pci.className = pci.unavailable ? "" : "pci";
                devices.push(pci);
            }
        }

        return devices;
    };

    this.getNetworks = function() {
        var networks = [];
        for(var nic in self.nics) {
            if(self.nics.hasOwnProperty(nic)) {
                networks.push(self.nics[nic]);
            }
        }
        return networks;
    };

    this.addNetwork = function(network_path, wireless, success, failure) {
        interfaces.vm.add_nic(function(nic_path) {
            var nic = new XenClient.UI.VMNicModel(nic_path);
            nic.load(function() {
                nic.save({"network_path": network_path, "wireless": wireless}, function() {
                    self.refreshNics(nic_path, success, failure);
                }, failure);
            }, failure);
        }, failure);
    };

    this.refreshNics = function(nic_path, success, failure) {
        function refreshNic(path, finish) {
            var fn = finish.extend(function() {
                self.publish(XenConstants.TopicTypes.MODEL_NIC_CHANGED);
            });
            if(self.nics[path]) {
                self.nics[path].refresh(fn);
            } else {
                self.nics[path] = new XenClient.UI.VMNicModel(path);
                self.nics[path].load(fn);
            }
        }
        var wait = new XUtils.AsyncWait(success, failure);
        if(nic_path) {
            refreshNic(nic_path, wait.addCallback());
            wait.finish();
        } else {
            var nicSuccess = function(nicArray) {
                // remove nics no longer there
                for(var nic in self.nics) {
                    if(self.nics.hasOwnProperty(nic) && !nicArray.contains(nic)) {
                        delete self.nics[nic];
                    }
                }
                // refresh or add nics
                dojo.forEach(nicArray, function(path, i) {
                    refreshNic(path, wait.addCallback());
                });
                wait.finish();
            };
            interfaces.vm.list_nics(nicSuccess, wait.error);
        }
    };

    // Management
    this.createDisk = function(vhd_path, encrypt, encryptMessage, persistent, success, failure) {
        interfaces.vm.add_disk(function(disk_path){
            var disk = new XenClient.UI.VMDiskModel(disk_path);
            var onComplete = function() {
                var wait = new XUtils.AsyncWait(success, failure);
                if(!isNaN(parseInt(encrypt))) {
                    var fn = wait.addCallback();
                    if(encryptMessage && encryptMessage != "") {
                        XUtils.publish(XenConstants.TopicTypes.UI_SHOW_POPUP, [encryptMessage, "_informationArguments"]);
                    }
                    var fnEncrypt = function() {
                        fn();
                        XUtils.publish(XenConstants.TopicTypes.UI_HIDE_POPUP);
                    };
                    disk.encrypt(parseInt(encrypt), fnEncrypt, wait.error);
                }
                if(persistent === false) {
                    disk.snapshot = XenConstants.DiskSnapshotMode.RESET;
                    disk.save(wait.addCallback(), wait.error);
                }
                wait.finish();
            };
            disk.attach_vhd(vhd_path, onComplete, failure);
        }, failure);
    };

    this.refreshDisks = function(disk_path, success, failure) {
        function total() {
            self.totalVirtualDiskSpaceMB = 0;
            self.totalUtilizedDiskSpace = 0;
            for(var disk in self.disks) {
                if(self.disks.hasOwnProperty(disk)) {
                    self.totalVirtualDiskSpaceMB += self.disks[disk].virtual_size_mb;
                    self.totalUtilizedDiskSpace += self.disks[disk].utilization_bytes;
                }
            }
            self.publish(XenConstants.TopicTypes.MODEL_DISK_CHANGED);
        }
        function refreshDisk(path, finish) {
            if(self.disks[path]) {
                self.disks[path].refresh(finish);
            } else {
                self.disks[path] = new XenClient.UI.VMDiskModel(path);
                self.disks[path].load(finish);
            }
        }
        var final = success ? success.extend(total) : total;
        var wait = new XUtils.AsyncWait(final, failure);
        if(disk_path) {
            refreshDisk(disk_path, wait.addCallback());
            wait.finish();
        } else {
            var diskSuccess = function(diskArray) {
                // remove disks no longer there
                for(var disk in self.disks) {
                    if(self.disks.hasOwnProperty(disk) && !diskArray.contains(disk)) {
                        delete self.disks[disk];
                    }
                }
                // refresh or add disks
                dojo.forEach(diskArray, function(path, i) {
                    refreshDisk(path, wait.addCallback());
                });
                wait.finish();
            };
            interfaces.vm.list_disks(diskSuccess, wait.error);
        }
    };

    this.createCustomProperties = function(success, failure) {
        var wait = new XUtils.AsyncWait(success, failure);

        dojo.forEach(self.list_product_properties, function(prop) {
            var ovfName = "ovf_" + prop.id.replace(/\./g, "_");
            if(prop["user-configurable"].bool()) {
                readWriteMap.push([ovfName, interfaces.product.get_product_property, interfaces.product.set_product_property, prop.id]);
            }
            interfaces.product.get_product_property(prop.id, wait.addCallback(function(result) {
                self[ovfName] = result;
            }), wait.error);
        });

        wait.finish();
    };

    this.get_totalVirtualSpace = function() {
        return XUtils.humanizeBytesForDiskStorage(self.totalVirtualDiskSpaceMB * 1000 * 1000);
    };

    this.get_totalUtilizedSpace = function() {
        return XUtils.humanizeBytesForDiskStorage(self.totalUtilizedDiskSpace);
    };

    this.get_allDisksReset = function() {
        if (self.get_virtualDisks().length == 0) {
            return false;
        }

        return dojo.every(self.get_virtualDisks(), function(disk) {
            return disk.snapshot == XenConstants.DiskSnapshotMode.RESET;
        });
    };

    this.get_allDisksEncrypted = function() {
        if (self.get_virtualDisks().length == 0) {
            return false;
        }

        return dojo.every(self.get_virtualDisks(), function(disk) {
            return disk.encryption_key_set == true;
        });
    };

    this.get_virtualDisks = function() {
        var arr = [];
        for(var disk in self.disks) {
            if(self.disks.hasOwnProperty(disk) && self.disks[disk].devtype == XenConstants.DiskType.DISK) {
                arr.push(self.disks[disk]);
            }
        }
        return arr;
    };

    this.set_virtualDisks = function(disks) {
        dojo.forEach(disks, function(disk, i) {
            var d = self.disks[disk.disk_path];
            if(d) {
                // snapshot
                if(d.snapshot != disk.snapshot) {
                    d.snapshot = disk.snapshot;
                    d.save();
                }
            }
        });
    };

    // Control
    this.startThreedAction = undefined;
    this.startNotifyAction = undefined;
    this.startMultipleAction = undefined;

    function controlFailure(error) {
        self.powerClicked = false;
        fail(error);
    }

    this.start = function() {
        self.background_start(function(){
            self.switchTo();
        });
    };

    this.background_start = function(success) {
        if (!self.powerClicked) {
            var fn = function() {
                self.powerClicked = true;
                interfaces.vm.start(success, controlFailure);
            };
            // Wrap external notification function only if we are undertaking further things
            if (self.startNotifyAction && success) {
                fn = fn.decorate(self.startNotifyAction);
            }
            // Wrap external multiple VM warning if tools not installed and more than 2 VMs are running
            if (self.startMultipleAction && !self.tools_installed && XUICache.runningVMCount() >= 2) {
                fn = fn.decorate(self.startMultipleAction);
            }
            // Warn about 3d graphics
            if (self.isHdxEnabled() && self.startThreedAction) {
                self.startThreedAction(fn);
            } else {
                fn();
            }
        }
    };

    this.suspend = function() {
        if (!self.powerClicked) {
            self.powerClicked = true;
            interfaces.vm.hibernate(undefined, controlFailure);
        }
    };

    this.sleep = function() {
        if (!self.powerClicked) {
            self.powerClicked = true;
            interfaces.vm.sleep(undefined, controlFailure);
        }
    };

    this.reboot = function() {
        if (!self.powerClicked) {
            self.powerClicked = true;
            self.switchTo();
            interfaces.vm.reboot(undefined, controlFailure);
        }
    };

    this.shutdown = function() {
        if (!self.powerClicked) {
            self.powerClicked = true;
            self.switchTo();
            interfaces.vm.shutdown(undefined, controlFailure);
        }
    };

    this.force_shutdown = function() {
        interfaces.vm.destroy(undefined, controlFailure);
    };

    this.local_login = function() {
        interfaces.auth.auth(undefined, controlFailure);
        XUtils.publish(XenConstants.TopicTypes.UI_SHOW_POPUP, [XUICache.alerts.AUTH_START, XUICache.alerts.AUTH_START_HEADING]);
    };

    // disk usage (privateSpace, sharedSpace)
    this.refreshDiskUsage = function(finish, failure) {
        var success = function(privateSpace, sharedSpace) {
            // this returns MeliBytes, want to store as bytes for consistency
            self.private_disk_space = (privateSpace || 0) * 1024 * 1024;
            self.shared_disk_space = (sharedSpace || 0) * 1024 * 1024;
            self.publish(XenConstants.TopicTypes.MODEL_DISK_USAGE_CHANGED);
        };
        if(finish) {
            success.extend(finish);
        }
        interfaces.vm.get_property("private-space", success, failure);
    };

    // USB
    this.refreshUsb = function(dev_id, finish, failure) {
        var wait = new XenClient.Utils.AsyncWait(function() {
            self.publish(XenConstants.TopicTypes.MODEL_USB_CHANGED);
            if (finish) {
                finish();
            }
        }, function(error) {
            fail(error);
            if (failure) {
                failure(error);
            }
        });
        var updateDevice = function(dev_id) {
            var onSuccess = wait.addCallback(function(name, state, assigned_uuid) {
                xc_debug.debug("get_device_info returned name: {0}; state: {1}; assigned_uuid: {2}", name, state, assigned_uuid);
                if (state == -1) {
                    delete self.usbDevices[dev_id];
                }
                else {
                    self.usbDevices[dev_id] = new XenClient.UI.UsbModel(dev_id, name, state, assigned_uuid);
                }
            });
            interfaces.usb.get_device_info(dev_id, self.uuid, onSuccess, wait.error);
        };
        if (dev_id === undefined) {
            // Update all USB
            interfaces.usb.list_devices(wait.addCallback(function(result) {
                if (result.length > 0) {
                    self.usbDevices = {};
                    for (var i = 0; i < result.length; i++) {
                        updateDevice(result[i]);
                    }
                }
            }), wait.error);
        }
        else {
            // Update specific USB device
            updateDevice(dev_id);
        }

        wait.finish();
    };

    this.assignUsbDevice = function(dev_id, success, failure) {
        function onSuccess() {
            self.publish(XenConstants.TopicTypes.MODEL_USB_CHANGED);
            if (success) {
                success();
            }
        }
        var usb = self.usbDevices[dev_id];
        usb.state = 4;
        interfaces.usb.assign_device(usb.dev_id, self.uuid, onSuccess, failure);
    };

    this.unassignUsbDevice = function(dev_id, success, failure) {
        function onSuccess() {
            self.publish(XenConstants.TopicTypes.MODEL_USB_CHANGED);
            if (success) {
                success();
            }
        }
        var usb = self.usbDevices[dev_id];
        usb.state = 0;
        interfaces.usb.unassign_device(usb.dev_id, onSuccess, failure);
    };

    this.setUsbDeviceSticky = function(dev_id, sticky, success, failure) {
        function onSuccess() {
            self.publish(XenConstants.TopicTypes.MODEL_USB_CHANGED);
            if (success) {
                success();
            }
        }
        var usb = self.usbDevices[dev_id];
        usb.state = (self.getState() == XenConstants.VMStates.VM_RUNNING) ? 5 : 6;
        interfaces.usb.set_sticky(usb.dev_id, sticky ? 1 : 0, onSuccess, failure);
    };

    this.nameUsbDevice = function(dev_id, name, success, failure) {
        function onSuccess() {
            self.publish(XenConstants.TopicTypes.MODEL_USB_CHANGED);
            if (success) {
                success();
            }
        }
        var usb = self.usbDevices[dev_id];
        usb.name = name;
        interfaces.usb.name_device(dev_id, name, onSuccess, failure);
    };

    // TIDY FROM HERE

    // Image transfer
    this.pause_transfer = function() {
    };

    this.resume_transfer = function() {
    };

    this.cancel_transfer = function() {
    };

    this.loadState = function(success) {
        repository.load("state", "acpi_state", success);
    };

    this.getState = function() {
        return (self.acpi_state == 3) ? XenConstants.VMStates.VM_ASLEEP : (self.acpi_state == 4) ? XenConstants.VMStates.VM_SUSPENDED : self.state;
    };

    this.setState = function(state, acpi) {
        self.state = state;
        self.acpi_state = acpi;
        self.powerClicked = false;
        self.publish(XenConstants.TopicTypes.MODEL_STATE_CHANGED);
    };

    this.getTransferProgress = function() {
        repository.load("download_progress", function() {
            self.publish(XenConstants.TopicTypes.MODEL_TRANSFER_CHANGED);
        });
    };

    this.isHdxEnabled = function() {
        return (self.gpu != "");
    };

    this.isHdxRunning = function() {
        return (self.isHdxEnabled() && self.isRunning());
    };

    this.isPublishEnabled = function() {
        return (self.portica_enabled == 1);
    };

    // Locks VM externally
    this.isReady = function() {
        return self.ready;
    };

    // Is this VM being downloaded
    this.isDownloading = function() {
        return (!self.isReady() && self.download_progress > -1);
    }

    // Does the user need to wait?
    this.isBusy = function() {
        return self.isDownloading() || [XenConstants.VMStates.VM_CREATING, XenConstants.VMStates.VM_STOPPING, XenConstants.VMStates.VM_REBOOTING, XenConstants.VMStates.VM_SUSPENDING].contains(self.getState());
    };

    this.simpleVMActions = function() {
        // If the VM is not ready, no operations are allowed
        if (!self.isReady()) {
            switch (self.getState()) {
                case XenConstants.VMStates.VM_RUNNING:
                    return ["shutdown"];
                case XenConstants.VMStates.VM_ASLEEP:
                    return ["wake"];
                case XenConstants.VMStates.VM_STOPPING:
                    return ["force_shutdown"];
                default:
                    return [];
            }
        } else {
            // The VM is ready - switch on the status to determine the allowed operations.
            switch (self.getState()) {
                case XenConstants.VMStates.VM_STOPPED:
                case XenConstants.VMStates.VM_SUSPENDED:
                    return ["start"];
                case XenConstants.VMStates.VM_RUNNING:
                    return ["shutdown"];
                case XenConstants.VMStates.VM_ASLEEP:
                    return ["wake"];
                case XenConstants.VMStates.VM_STOPPING:
                    return ["force_shutdown"];
                case XenConstants.VMStates.VM_LOCKED:
                    return ["local_login"];
                default:
                    return [];
            }
        }
    };

    this.detailedVMActions = function() {
        var canShutdownCleanly = self.tools_installed || self.isServiceVM();
        // If the VM is not ready, no operations are allowed
        if (!self.isReady()) {
            switch (self.getState()) {
                case XenConstants.VMStates.VM_RUNNING:
                    return canShutdownCleanly ? ["switch", "shutdown", "suspend", "sleep"] : ["switch", "shutdown"];
                case XenConstants.VMStates.VM_ASLEEP:
                    return canShutdownCleanly ? ["wake", "shutdown", "suspend"] : ["wake", "shutdown"];
                case XenConstants.VMStates.VM_STOPPING:
                    return ["switch", "force_shutdown"];
                default:
                    return [];
            }
        } else {
            // The VM is ready - switch on the status to determine the allowed operations.
            switch (self.getState()) {
                case XenConstants.VMStates.VM_STOPPED:
                case XenConstants.VMStates.VM_SUSPENDED:
                    return ["start"];
                case XenConstants.VMStates.VM_RUNNING:
                    return canShutdownCleanly ? ["switch", "shutdown", "reboot", "suspend", "sleep"] : ["switch", "shutdown"];
                case XenConstants.VMStates.VM_ASLEEP:
                    return canShutdownCleanly ? ["wake", "shutdown", "reboot", "suspend"] : ["wake", "shutdown"];
                case XenConstants.VMStates.VM_STOPPING:
                    return ["switch", "force_shutdown"];
                case XenConstants.VMStates.VM_LOCKED:
                    return ["local_login"];
                default:
                    return [];
            }
        }
    };

    this.truncatedName = function (length) {
        length = isNaN(Number(length)) ? truncateLength : Number(length);
        return self.name.shorten(length);
    };

    this.fullNameWhenTruncated = function (length) {
        length = isNaN(Number(length)) ? truncateLength : Number(length);
        if (self.name.length > length) {
            return self.name;
        }
        return "";
    };

    // Returns a display-friendly string that describes the state
    this.getTranslatedState = function(source) {
        var state = self.getState();

        if (!self.isReady()) {
            switch(state) {
                case XenConstants.VMStates.VM_STOPPED:
                case XenConstants.VMStates.VM_SUSPENDED: {
                    state = "locked";
                    break;
                }
            }
        }

        dojo.some(Object.keys(XenConstants.VMStates), function(key) {
            if (XenConstants.VMStates[key] == state) {
                state = (source[self.hosting_type + key]) ? source[self.hosting_type + key] : source[key];
                return true;
            }
            return false;
        }, this);
        return state.toLowerCase();
    };

    this.descriptionCut = function() {
        var text = self.description;
        if (text.length > 250) {
            text = text.substring(0, 250) + "...";
        }
        return text;
    };

    this.displayInSwitcher = function() {
        return !self.hidden_in_switcher;
    };

    this.toolsOutOfDate = function() {
        var outOfDate = true;

        if (self.tools_installed && self.tools_version != "") {

            var toolsVersion = XUICache.Host.build_tools.split(".");
            var vmVersion = self.tools_version.split(".");

            for (var i = 0; i < toolsVersion.length; i++) {
                var toolsVersionInt = parseInt(toolsVersion[i]);
                var vmVersionInt = parseInt(vmVersion[i]);

                if (toolsVersionInt > vmVersionInt) {
                    outOfDate = true;
                    break;
                }
                else if (toolsVersionInt < vmVersionInt) {
                    outOfDate = false;
                    break;
                }
                else if (i == toolsVersion.length - 1) {
                    outOfDate = false;
                }
            }
        }

        return outOfDate;
    };

    this.getDiskSpace = function() {
        if(self.private_disk_space === "" || self.shared_disk_space === "") {
            return "";
        }
        return [XUtils.humanizeBytes(self.private_disk_space, 2), XUtils.humanizeBytes(self.shared_disk_space, 2)];
    };

    this.canAddDevice = function() {
        if (!self.usb_enabled || self.getState() != XenConstants.VMStates.VM_RUNNING) {
            return false;
        }
        if (self.hosting_type == XenConstants.VMTypes.ICA) {
            return true;
        }
        return self.tools_installed;
    };

    this.canEditNics = function() {
        return (self.policy_modify_vm && self.getState() == XenConstants.VMStates.VM_STOPPED);
    };

    this.canEditDisk = function() {
        return (self.policy_modify_vm && self.getState() == XenConstants.VMStates.VM_STOPPED);
    };

    this.canDelete = function() {
        var state = self.getState();
        return (state == XenConstants.VMStates.VM_STOPPED || state == XenConstants.VMStates.VM_SUSPENDED);
    };

    this.deleteVisible = function() {
        return (self.policy_modify_vm && XUICache.Host.policy_delete_vm);
    };    

    this.canModifyPCI = function() {
        return (self.policy_modify_vm && self.getState() == XenConstants.VMStates.VM_STOPPED);
    };

    this.isManaged = function() {
        return false; // currently no way of telling
    };

    this.hasCDLock = function() {
        return dojo.some(XUICache.Host.available_cds, function(cdrom) {
            if (cdrom.vm == self.uuid) return true;
        });
    }

    this.hasUSBDevice = function() {
        for (var id in self.usbDevices) {
            var usb = self.usbDevices[id];
            if (usb.assignedToCurrentVM()) {
                return true;
            }
        }
        return false;
    }

    this.hasPendingTransferAction = function() {
        return (self.lastTransferState != null);
    };

    this.canPauseTransfer = function() {
        return false;
    };

    this.canResumeTransfer = function() {
        return false;
    };

    this.canRetryTransfer = function() {
        // functionality doesn't yet exist
        return false;
    };

    this.canCancelTransfer = function() {
        return false;
    };

    this.canEnableThreed = function() {
        return self.tools_installed && self.getState() == XenConstants.VMStates.VM_STOPPED && !self.native_experience;
    };

    this.getTransferSpeed = function() {
        return 0;
    };
    
    this.getAvailableDevices = function() {
        var devices = [];
        for (var id in self.usbDevices) {
            var usb = self.usbDevices[id];
            if (usb.availableToCurrentVM()) {
                devices.push(usb);
            }
        }
        return devices;
    };

    this.isRunning = function() {
        var running = false;
        switch(self.getState()) {
            case XenConstants.VMStates.VM_CREATING:
            case XenConstants.VMStates.VM_LOCKED:
            case XenConstants.VMStates.VM_STOPPED:
            case XenConstants.VMStates.VM_SUSPENDED: {
                // Do nothing
                break;
            }
            default: {
                running = true;
                break;
            }
        }
        return running;
    };

    this.isActive = function() {
        var active = false;
        switch(self.getState()) {
            case XenConstants.VMStates.VM_ASLEEP:
            case XenConstants.VMStates.VM_CREATING:
            case XenConstants.VMStates.VM_LOCKED:
            case XenConstants.VMStates.VM_STOPPED:
            case XenConstants.VMStates.VM_SUSPENDED: {
                // Do nothing
                break;
            }
            default: {
                active = true;
                break;
            }
        }
        return active;
    };

    this.isUserVM = function() {
        return !this.hidden_in_ui && this.slot <= XenConstants.Defaults.MAX_VMS && ["svm", "pvm"].contains(this.vmtype);
    };

    this.isServiceVM = function() {
        return !this.hidden_in_ui && !["svm", "pvm"].contains(this.vmtype);
    };
};

// Used to encapsulate code for checking if it's a VM the UI should be interested in
// to prevent unnecessary loading in the full VMModel
XenClient.UI.VMMiniModel = function(vm_path) {

    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.vm_path = vm_path;
    this.hidden_in_ui = false;
    this.slot = 0;
    this.type = "";

    // Services
    var services = {
        vm: new XenClient.DBus.XenmgrVmClient("com.citrix.xenclient.xenmgr", vm_path)
    };

    // Interfaces
    var interfaces = {
        vm: services.vm.com.citrix.xenclient.xenmgr.vm
    };

    // Mappings
    var readOnlyMap = [
        ["hidden_in_ui",    interfaces.vm],
        ["slot",            interfaces.vm],
        ["type",            interfaces.vm]
    ];

    // Repository
    //var repository = new XenClient.UI.Repository(this, readOnlyMap, [], []);

    // for now getting just 2 properties individually is quicker than letting the repository do GetAll
    // it's 200 ms vs 400+ ms
    this.load = function(finish) {
        var wait = new XenClient.Utils.AsyncWait(
            function() {
                finish(self);
            },
            function(error) {
                self.publish(XenConstants.TopicTypes.MODEL_FAILURE, error);
            }
        );
        var getProperty = function(prop) {
            prop[1].get_property(prop[0].replace(/_/g, "-"), wait.addCallback(function(result) {
                self[prop[0]] = result;
            }), wait.error);
        };
        for(var i = 0; i < readOnlyMap.length; i++) {
            getProperty(readOnlyMap[i]);
        }
        wait.finish();
    };

    this.publish = function(type, data) {
        // Do nothing when publishing CRUD events
    };

    // Service or user VM
    this.forUI = function() {
        var userVMTypes = ["svm", "pvm"];
        return !this.hidden_in_ui && (!userVMTypes.contains(this.type) || this.slot <= XenConstants.Defaults.MAX_VMS);
    };

    this.isUserVM = function() {
        return !this.hidden_in_ui && this.slot <= XenConstants.Defaults.MAX_VMS && ["svm", "pvm"].contains(this.type);
    };

    this.isServiceVM = function() {
        return !this.hidden_in_ui && !["svm", "pvm"].contains(this.type);
    };
};