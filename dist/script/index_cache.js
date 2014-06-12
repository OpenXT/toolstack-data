// Cache Singleton
Namespace("XenClient.UI");

XenClient.UI.Cache = (function() {
    var onAddVM = function(vm) {
        vm.loadState(function() {
            XUtils.publish(XenConstants.TopicTypes.UI_VM_CREATED);
        });
    };
    // this loads a full VMModel
    var loadVMModel = function(vm_path, success, error, userVM, serviceVM) {
        var vm = new XenClient.UI.VMModel(vm_path);
        // It's important we add to the cache BEFORE LOAD otherwise much trouble ensues
        if(userVM) {
            XUICache.VMs[vm_path] = vm;
        } else if(serviceVM) {
            XUICache.ServiceVMs[vm_path] = vm;
        }
        vm.load(success, error);
    };
    // this will load a VM mini model to see if it's valid for the UI, and if so, will load the full model and
    // register the VM with the UI.
    var loadVMIntoUi = function(vm_path, success, error) {
        var testVM = new XenClient.UI.VMMiniModel(vm_path);
        testVM.load(function(vm) {
            if(vm.forUI()) {
                loadVMModel(vm_path, onAddVM.extend(success), error, vm.isUserVM(), vm.isServiceVM());
            } else if(success) {
                success();
            }
        }, error);
    };
    var loadVMs = function() {
        XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);

        var error = function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        };

        // Get the list of VMs
        XUICache.Host.listVMs(function(object_paths) {
            var wait = new XUtils.AsyncWait(function() {
                // Need to signal when VMs are loaded in case none were :)
                XUtils.publish(XenConstants.TopicTypes.UI_VMS_LOADED);
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            }, error);
            dojo.forEach(object_paths, function(vm_path) {
                loadVMIntoUi(vm_path, wait.addCallback(), wait.error);
            });
            wait.finish();
        }, error);
    };
    var onAddNDVM = function(vm) {
        XUtils.publish(XenConstants.TopicTypes.UI_NDVM_CREATED);
    };
    var loadNDVM = function(ndvm_path, success, error) {
        var ndvm = new XenClient.UI.NDVMModel(ndvm_path);
        ndvm.include_networks = true;
        XUICache.NDVMs[ndvm.ndvm_path] = ndvm;        
        ndvm.load(onAddNDVM.extend(success), error);
    };
    var loadNDVMs = function() {
        var error = function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        };

        // Get the list of NDVMs
        XUICache.Host.listNDVMs(function(object_paths) {
            var wait = new XUtils.AsyncWait(function() {
                XUtils.publish(XenConstants.TopicTypes.UI_NDVMS_LOADED);
            }, error);
            dojo.forEach(object_paths, function(ndvm_path) {
                if (ndvm_path) {
                    loadNDVM(ndvm_path, wait.addCallback(), wait.error);
                }
            });
            wait.finish();
        }, error);
    };
    var loadBattery = function(device_path, success, error) {
        var device = new XenClient.UI.PowerModel(device_path);
        device.load(function() {
            if(device.isBattery()) {
                var battery = new XenClient.UI.BatteryModel(device_path);
                XUICache.Batteries[battery.device_path] = battery;
                battery.load(success, error);
            } else if(success) {
                success();
            }
        }, error);
    };
    var loadBatteries = function() {
        var error = function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        };

        XUICache.Host.listPowerDevices(function(device_paths) {
            var wait = new XUtils.AsyncWait(function() {
                XUtils.publish(XenConstants.TopicTypes.UI_BATTERIES_LOADED);
            }, error);
            dojo.forEach(device_paths, function(device_path) {
                if (device_path) {
                    loadBattery(device_path, wait.addCallback(), wait.error);
                }
            });
            wait.finish();
        }, error);
    };
    var allVMPaths = function() {
        var all = [];
        for(var path in XUICache.VMs) {
            if(XUICache.VMs.hasOwnProperty(path)) {
                all.push(path);
            }
        }
        for(var path in XUICache.ServiceVMs) {
            if(XUICache.ServiceVMs.hasOwnProperty(path)) {
                all.push(path);
            }
        }
        return all;
    };
    var findVM = function(vm_path) {
        return XUICache.VMs[vm_path] ? XUICache.VMs[vm_path] : XUICache.ServiceVMs[vm_path];
    };
    var registerSignals = function(callback) {
        var wait = new XUtils.AsyncWait(callback);
        XUIDBus.signalRegister(
            [
                "com.citrix.xenclient.xenmgr",
                "com.citrix.xenclient.xenmgr.host",
                "com.citrix.xenclient.xenmgr.guestreq",
                "com.citrix.xenclient.input",
                "com.citrix.xenclient.usbdaemon",
                "com.citrix.xenclient.updatemgr",
                "com.citrix.xenclient.status_tool",
                "com.citrix.xenclient.networkdaemon.notify",
                "com.citrix.xenclient.networkdomain.notify",
                "org.freedesktop.UPower.Device"
            ],
            function (interface, member, object, params) {
                var path, vm;
                switch(interface) {
                    case "org.freedesktop.UPower.Device":
                        switch(member) {
                            case "Changed":
                                var device = XUICache.Batteries[object];
                                if (device) {
                                    device.refresh();
                                }
                                break;
                        }
                        break;                    
                    case "com.citrix.xenclient.networkdaemon.notify":
                        switch(member) {
                            case "network_added":
                            case "network_removed":
                                XUICache.Host.refresh();
                                break;
                            case "network_state_changed":
                                var network_path = params[0].toString();
                                var state = params[1].toString();
                                path = params[2].toString();
                                vm = XUICache.NDVMs[path];
                                if (vm) {
                                    vm.refreshState(network_path, state);
                                }
                                break;
                        }
                        break;
                    case "com.citrix.xenclient.networkdomain.notify":
                        switch(member) {
                            case "backend_state_changed":
                                path = object; // Signal comes from actual object
                                switch(params[0]) {
                                    case XenConstants.Network_daemon.NDVM_STATUS.STARTED: {
                                        if (!XUICache.NDVMs[path]) {
                                            loadNDVM(path, null, function(error) {
                                                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                                            });
                                        }
                                        break;
                                    }
                                    case XenConstants.Network_daemon.NDVM_STATUS.STOPPED: {
                                        if (XUICache.NDVMs[path]) {
                                            // Remove the NDVM
                                            delete XUICache.NDVMs[path];
                                            XUtils.publish(XenConstants.TopicTypes.UI_NDVM_DELETED);
                                        }
                                        break;
                                    }
                                }
                                break;
                        }
                        break;
                    case "com.citrix.xenclient.xenmgr.host":
                        switch(member) {
                            case "state_changed":
                                XUICache.Host.setState(params[0].toString());
                                break;
                            case "license_changed":
                                XUICache.Host.refresh();
                                break;
                        }
                        break;
                    case "com.citrix.xenclient.xenmgr":
                        function deleteVM(path) {
                            if (XUICache.VMs[path]) {
                                // Remove the VM
                                delete XUICache.VMs[path];
                                XUtils.publish(XenConstants.TopicTypes.UI_VM_DELETED);
                            } else if(XUICache.ServiceVMs[path]) {
                                delete XUICache.ServiceVMs[path];
                                XUtils.publish(XenConstants.TopicTypes.UI_VM_DELETED);
                            }
                        }
                        function createVM(path) {
                            loadVMIntoUi(path, null, function(error) {
                                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                            });
                        }
                        switch(member) {
                            case "config_changed":
                            case "cd_assignment_changed":
                                XUICache.Host.refresh();
                                break;
                            case "vm_created":
                                path = XUtils.uuidToPath(params[0].toString());
                                if (!findVM(path)) {
                                    createVM(path);
                                }
                                break;
                            case "vm_deleted":
                                path = XUtils.uuidToPath(params[0].toString());
                                deleteVM(path);
                                break;
                            case "vm_state_changed":
                                path = XUtils.uuidToPath(params[0].toString());
                                vm = findVM(path);
                                if (vm) {
                                    vm.setState(params[2].toString(), params[3].toString());
                                }
                                break;
                            case "vm_transfer_changed":
                                path = params[1].toString();
                                vm = findVM(path);
                                if(vm) {
                                    vm.getTransferProgress();
                                }
                                break;
                            case "vm_config_changed":
                                var uuid = params[0].toString();
                                path = XUtils.uuidToPath(uuid);
                                vm = findVM(path);

                                if (vm) {
                                    var whatIsIt = [vm.isUserVM(), vm.isServiceVM()];
                                    vm.refresh(function(refreshedVm) {
                                        // is it still valid where it is?
                                        if(refreshedVm.isUserVM() != whatIsIt[0] || refreshedVm.isServiceVM() != whatIsIt[1]) {
                                            // easiest to delete and remove
                                            deleteVM(refreshedVm.vm_path);
                                            createVM(refreshedVm.vm_path);
                                        }
                                    }, function(error) {
                                        XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                                    });
                                } else {
                                    // The property changed may have been re-showing a previously hidden VM, try creating it
                                    createVM(path);
                                }

                                // Could have been an NDVM config change, refresh the NDVM too
                                path = XUtils.uuidToPath(uuid, "/ndvm/");
                                vm = XUICache.NDVMs[path];

                                if (vm) {
                                    vm.refresh(function() {}, function(error) {
                                        XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                                    });
                                }
                                break;
                            case "language_changed":
                                location.reload(true);
                                break;
                        }
                        break;
                    case "com.citrix.xenclient.input":
                        switch(member) {
                            case "auth_status":
                                if ((params[0] == "ok") || (params[0] == "user_cancel")) {
                                    dojo.forEach(allVMPaths(), function(path) {
                                        var vm = findVM(path);
                                        vm.refresh();
                                        vm.loadState();
                                    });
                                    XUICache.Host.refresh();
                                    XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
                                }
                                break;
                            case "secure_mode":
                                if (params[0] == 1) {
                                    XUtils.publish(XenConstants.TopicTypes.UI_HIDE_POPUP);
                                    XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
                                }
                                break;
                        }
                        break;
                    case "com.citrix.xenclient.usbdaemon":
                        switch(member) {
                            case "devices_changed":
                            case "device_info_changed":
                                XUICache.Host.refresh();
                                dojo.forEach(allVMPaths(), function(path) {
                                    findVM(path).refreshUsb((params && params[0]) ? params[0] : undefined);
                                });
                                break;
                        }
                        break;
                    case "com.citrix.xenclient.updatemgr":
                        switch(member) {
                            case "update_state_change":
                                var updateState = params[0].toString();
                                if (updateState == XenConstants.UpdateStates.FAILED) {
                                    XUICache.Update.refresh(function() {
                                        XUICache.messageBox.showError(XUICache.Update.getError());
                                    });
                                } else {
                                    XUICache.Update.setState(updateState);
                                }
                                break;
                            case "update_download_progress":
                                XUICache.Update.setTransferState(params[0], params[1]);
                                break;
                        }
                        break;
                }
            },
            wait.addCallback()
        );
        wait.finish();
    };
    return {
        VMs: {},
        NDVMs: {},
        ServiceVMs: {},
        Batteries: {},
        Host: new XenClient.UI.HostModel(),
        Update: new XenClient.UI.UpdateModel(),
        messageBox: null,
        alerts: null,
        keyboard: null,
        init: function(finish) {
            var wait = new XUtils.AsyncWait(finish);
            XUICache.Host.load(wait.addCallback());
            XUICache.Update.load(wait.addCallback());
            loadVMs();
            loadNDVMs();
            loadBatteries();
            registerSignals(wait.addCallback());
            wait.finish();
        },
        createVM: function(template, name, description, imagePath, diskSize, encrypt, encryptMessage, success, failure) {
            XUICache.Host.createVMWithUI(template, name, description, imagePath, function(vm_path) {
                XUICache.Host.createVhd(diskSize, function(vhd_path) {
                    loadVMModel(vm_path, function(vm) {
                        vm.createDisk(vhd_path, encrypt, encryptMessage, true, function() {
                            success(vm);
                        }, failure);
                    }, failure);
                }, failure);
            }, failure);
        },
        runningVMCount : function() {
            var count = 0;
            for (var path in XUICache.VMs) {
                var vm = XUICache.VMs[path];
                if (!vm.tools_installed && vm.isActive()) {
                    count++;
                }
            }
            return count;
        },
        getVM: function(path) {
            return findVM(path);
        },
        getVmPaths: function() {
            return allVMPaths();
        },
        onAddVM: function(func) {
            onAddVM = onAddVM.extend(func);
        },
        onAddNDVM: function(func) {
            onAddNDVM = onAddNDVM.extend(func);
        },
        // public function for creating and loading a VMModel. This does not add it to the UI,
        // since that is only required when the UI is loading or when it receives a VM_CREATED signal.
        loadVMModel: function(vm_path, success, failure) {
            loadVMModel(vm_path, success, failure);
        },
        getNativeVM: function() {
            for(var vm in XUICache.VMs) {
                if(XUICache.VMs.hasOwnProperty(vm) && XUICache.VMs[vm].native_experience) {
                    return XUICache.VMs[vm];
                }
            }
            return null;
        },
        getVMCount: function(includeICA) {
            var i = 0;
            for(var vm in XUICache.VMs) {
                if(XUICache.VMs.hasOwnProperty(vm) && (includeICA || XUICache.VMs[vm].hosting_type != XenConstants.VMTypes.ICA)) {
                    i++;
                }
            }
            return i;
        },
        getServiceVMCount: function() {
            var i = 0;
            for(var vm in XUICache.ServiceVMs) {
                i++;
            }
            return i;
        }
    };
})();

var XUICache = XenClient.UI.Cache;