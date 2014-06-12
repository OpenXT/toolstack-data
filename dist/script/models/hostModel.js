// Host model, services and repository
Namespace("XenClient.UI");

XenClient.UI.HostModel = function() {
    
    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.publish_topic = "/ui/host";
    this.uuid = "host";
    this.name = "OpenXT";
    this.state = "idle";
    this.free_mem = 0;
    this.total_mem = 0;
    this.max_vm_memory = 0;
    this.free_storage = 0;
    this.total_storage = 0;
    this.system_amt_pt = false;
    this.build_number = "";
    this.build_branch = "";
    this.build_date_time = "";
    this.build_tools = "";
    this.build_version = "";
    this.ac_lid_close_action = "";
    this.battery_lid_close_action = "";
    this.touchpad_tap_click = "false";
    this.touchpad_scrolling = "false";
    this.touchpad_speed = 1;
    this.mouse_speed = 1;
    this.platform_user = "";
    this.platform_user_flags = 0;
    this.auth_on_boot = false;
    this.lock_timeout = 0;
    this.keyboard_layout = "";
    this.language = "";
    this.laptop = false;
    this.cpu_count = 0;
    this.max_vm_vcpus = 0;
    this.ui_ready = false;
    this.amt_capable = false;
    this.vendor = "";
    this.model = "";
    this.bios_revision = "";
    this.physical_cpu_model = "";
    this.physical_gpu_model = "",
    this.eth0_mac = "",
    this.eth0_model = "",
    this.wireless_mac = "",
    this.wireless_model = "",
    this.show_msg_on_vm_start = true; // message about ctrl+0
    this.show_msg_on_vm_start_tools_warning = true; // message about running more than 2 VMs without tools
    this.show_msg_on_no_disk = true; // message about running a VM with no virtual disks
    this.show_msg_measured_boot = true; // message about sealing device
    this.wallpaper = "";
    this.pointer_trail_timeout = 0;
    this.policy_create_vm = true; // Hide Install VM buttons
    this.policy_create_ica_vm = false; // Hide ICA button
    this.policy_delete_vm = true; // Hide all VM delete buttons
    this.policy_update = true; // Hide OTA URL stuffs
    this.policy_modify_settings = true; // Hide platform settings
    this.policy_modify_services = true; // Hide platform services button
    this.policy_modify_vm_advanced = true; // Hide all VM advanced tabs
    this.policy_screen_lock = true; // Disable setting screen lock details
    this.configure_reboot_save = false;
    this.safe_graphics = false;
    this.measured_boot_enabled = true;
    this.measured_boot_successful = false;
    this.drm_enabled = false;
    this.licensed = true;
    this.available_isos = [];
    this.available_gpus = [];
    this.available_cds = [];
    this.keyboard_layouts = [];
    this.available_capture_devices = [];
    this.available_playback_devices = [];
    this.capture_device = "";
    this.playback_device = "";
    this.switcher_enabled = true;
    this.keyboard_follows_mouse = true,
    this.switcher_resistance = 0;
    this.supported_languages = [];
    this.deferred_eula = "True";
    this.deferred_keyboard = "True";
    this.deferred_password = "True";
    this.deferred_language = "True";
    this.vm_templates = [];
    this.available_networks = {};
    this.idle_time_threshold = 0;
    this.plugins = [];
    this.available_vmimages = XenConstants.VMImages;
    this.available_serviceimages = [];
    this.available_wallpapers = XenConstants.Wallpapers;
    this.branding_badges = { length: 0 };
    this.usbDevices = {};
    this.audioControls = {};

    // Services
    var services = {
        manager:    new XenClient.DBus.XenmgrClient("com.citrix.xenclient.xenmgr", "/"),
        host:       new XenClient.DBus.XenmgrHostClient("com.citrix.xenclient.xenmgr", "/host"),
        input:      new XenClient.DBus.InputDaemonClient("com.citrix.xenclient.input", "/"),
        surfman:    new XenClient.DBus.SurfmanClient("com.citrix.xenclient.surfman", "/"),
        network:    new XenClient.DBus.NetworkDaemonClient("com.citrix.xenclient.networkdaemon", "/"),
        usb:        new XenClient.DBus.CtxusbDaemonClient("com.citrix.xenclient.usbdaemon", "/"),
        upower:     new XenClient.DBus.OrgFreedesktopUpowerClient("org.freedesktop.UPower", "/org/freedesktop/UPower")
    };

    // Interfaces
    var interfaces = {
        manager:    services.manager.com.citrix.xenclient.xenmgr,
        config:     services.manager.com.citrix.xenclient.xenmgr.config,
        ui:         services.manager.com.citrix.xenclient.xenmgr.config.ui,
        diag:       services.manager.com.citrix.xenclient.xenmgr.diag,
        host:       services.host.com.citrix.xenclient.xenmgr.host,
        power:      services.host.com.citrix.xenclient.xenmgr.powersettings,
        installer:  services.host.com.citrix.xenclient.xenmgr.installer,
        input:      services.input.com.citrix.xenclient.input,
        surfman:    services.surfman.com.citrix.xenclient.surfman,
        network:    services.network.com.citrix.xenclient.networkdaemon,
        upower:     services.upower.org.freedesktop.UPower,
        usb:        services.usb.com.citrix.xenclient.usbdaemon
    };

    // Mappings
    var readOnlyMap = [
        ["state",                               interfaces.host],
        ["free_mem",                            interfaces.host],
        ["total_mem",                           interfaces.host],
        ["free_storage",                        interfaces.host],
        ["total_storage",                       interfaces.host],
        ["system_amt_pt",                       interfaces.host],
        ["laptop",                              interfaces.host],
        ["cpu_count",                           interfaces.host],
        ["amt_capable",                         interfaces.host],
        ["vendor",                              interfaces.host],
        ["model",                               interfaces.host],
        ["bios_revision",                       interfaces.host],
        ["physical_cpu_model",                  interfaces.host],
        ["physical_gpu_model",                  interfaces.host],
        ["eth0_mac",                            interfaces.host],
        ["eth0_model",                          interfaces.host],
        ["wireless_mac",                        interfaces.host],
        ["wireless_model",                      interfaces.host],
        ["safe_graphics",                       interfaces.host],
        ["measured_boot_enabled",               interfaces.host],
        ["measured_boot_successful",            interfaces.host],
        ["licensed",                            interfaces.host,    "is-licensed"],
        ["build_number",                        interfaces.host,    "build-info",   "build"],
        ["build_branch",                        interfaces.host,    "build-info",   "branch"],
        ["build_date_time",                     interfaces.host,    "build-info",   "build_date_time"],
        ["build_tools",                         interfaces.host,    "build-info",   "tools"],
        ["build_version",                       interfaces.host,    "build-info",   "version"],
        ["policy_create_vm",                    interfaces.config,  "vm-creation-allowed"],
//        ["policy_create_ica_vm",                interfaces.config,  "connect-remote-desktop-allowed"],
        ["policy_delete_vm",                    interfaces.config,  "vm-deletion-allowed"],
        ["policy_update",                       interfaces.config,  "ota-upgrades-allowed"],
        ["configure_reboot_save",               interfaces.config,  "configurable-save-changes-across-reboots"],
        ["supported_languages",                 interfaces.ui],
        ["policy_modify_settings",              interfaces.ui,      "modify-settings"],
        ["policy_modify_services",              interfaces.ui,      "modify-services"],
        ["policy_modify_vm_advanced",           interfaces.ui,      "modify-advanced-vm-settings"],
        ["available_isos",                      interfaces.host.list_isos],
        ["available_gpus",                      interfaces.host.list_gpu_devices],
        ["available_cds",                       interfaces.host.list_cd_devices],
        ["available_capture_devices",           interfaces.host.list_capture_devices],
        ["available_playback_devices",          interfaces.host.list_playback_devices],
        ["keyboard_layouts",                    interfaces.input.get_kb_layouts],
        ["platform_user",                       interfaces.input.get_platform_user, 0],
        ["platform_user_flags",                 interfaces.input.get_platform_user, 1],
        ["deferred_eula",                       interfaces.installer.get_installstate, "deferred-accept-eula"],
        ["deferred_keyboard",                   interfaces.installer.get_installstate, "deferred-kb-layout"],
        ["deferred_password",                   interfaces.installer.get_installstate, "deferred-dom0-password"],
        ["deferred_language",                   interfaces.installer.get_installstate, "deferred-language"],
        ["vm_templates",                        interfaces.manager.list_ui_templates],
        ["available_networks",                  interfaces.network.list],
        ["plugins",                             interfaces.host.list_ui_plugins, XenConstants.Plugins.PLUGIN_DIR]
    ];

    var readWriteMap = [
        ["ui_ready",                            interfaces.host],
        ["capture_device",                      interfaces.host, "capture-pcm"],
        ["playback_device",                     interfaces.host, "playback-pcm"],
        ["show_msg_on_vm_start",                interfaces.ui],
        ["show_msg_on_vm_start_tools_warning",  interfaces.ui],
        ["show_msg_on_no_disk",                 interfaces.ui],
        ["wallpaper",                           interfaces.ui],
        ["pointer_trail_timeout",               interfaces.ui],
        ["show_msg_measured_boot",              interfaces.ui, "show-mboot-warning"],
        ["drm_enabled",                         interfaces.ui, "drm-graphics"],
        ["ac_lid_close_action",                 interfaces.power.get_ac_lid_close_action,       interfaces.power.set_ac_lid_close_action],
        ["battery_lid_close_action",            interfaces.power.get_battery_lid_close_action,  interfaces.power.set_battery_lid_close_action],
        ["auth_on_boot",                        interfaces.input.get_auth_on_boot,              interfaces.input.set_auth_on_boot],
        ["lock_timeout",                        interfaces.input.lock_timeout_get,              interfaces.input.lock_timeout_set],
        ["keyboard_layout",                     interfaces.input.get_current_kb_layout,         interfaces.input.set_current_kb_layout],
        ["touchpad_tap_click",                  interfaces.input.touchpad_get,                  interfaces.input.touchpad_set,                  "tap-to-click-enable"],
        ["touchpad_scrolling",                  interfaces.input.touchpad_get,                  interfaces.input.touchpad_set,                  "scrolling-enable"],
        ["touchpad_speed",                      interfaces.input.touchpad_get,                  interfaces.input.touchpad_set,                  "speed"],
        ["mouse_speed",                         interfaces.input.get_mouse_speed,               interfaces.input.set_mouse_speed],
        ["switcher_enabled",                    interfaces.ui],
        ["keyboard_follows_mouse",              interfaces.ui,  "switcher-keyboard-follows-mouse"],
        ["switcher_resistance",                 interfaces.ui],
        ["language",                            interfaces.ui],
        ["idle_time_threshold",                 interfaces.ui]
    ];

    var refreshIgnoreMap = [
        // State is controlled by signals
        "state",
        // All properties on interfaces.host are ignored so that GetAll is avoided for interfaces.host as it is sloooow
        "free_mem",
        "total_mem",
        "free_storage",
        "total_storage",
        "system_amt_pt",
        "laptop",
        "cpu_count",
        "amt_capable",
        "vendor",
        "model",
        "bios_revision",
        "physical_cpu_model",
        "physical_gpu_model",
        "eth0_mac",
        "eth0_model",
        "wireless_mac",
        "wireless_model",
        "safe_graphics",
        "ui_ready",
        // Other items not requiring refresh
        "available_gpus",
        "available_capture_devices",
        "available_playback_devices",
        "keyboard_layouts",
        "build_number",
        "build_branch",
        "build_date_time",
        "build_tools",
        "build_version"
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
        var wait = new XUtils.AsyncWait(function() {
            repository.load(function() {

                // Notice the extra loading things here only ever happen once during initial load
                self.max_vm_vcpus = self.cpu_count; // Math.min(self.cpu_count, XenConstants.VMLimits.VCPUS);
                self.max_vm_memory = self.total_mem; // Math.min(self.total_mem, XenConstants.VMLimits.MEMORY);

                self.load_pluginSubDirs();
                
                var count;
                var name;

                // Rename identical GPUs
                dojo.forEach(self.available_gpus, function(gpu_1) {
                    count = 0;
                    name = gpu_1.name;
                    dojo.forEach(self.available_gpus, function(gpu_2) {
                        if (gpu_1.addr != gpu_2.addr && name == gpu_2.name) {
                            if (count == 0) {
                                gpu_1.name = "{0} [{1}]".format(name, ++count);
                            }
                            gpu_2.name = "{0} [{1}]".format(name, ++count);
                        }
                    });
                });

                if(finish) {
                    finish(self);
                }
            });
        }, finish);

        self.refreshUsb(wait.addCallback());
        self.refreshAudio(wait.addCallback());
        wait.finish();
    };

    this.refresh = function(finish) {
        var wait = new XUtils.AsyncWait(function() {
            repository.refresh(function() {
                if(finish) {
                    finish(self);
                }
            });
        }, finish);

        self.refreshResources(wait.addCallback());
        self.refreshUsb(wait.addCallback());
        self.refreshAudio(wait.addCallback());
        wait.finish();
    };

    this.refreshResources = function(finish) {
        // Explicity refresh free_storage and free_mem from interfaces.host
        repository.refresh("free_storage", false, function() {
            repository.refresh("free_mem", false, function() {
                if (finish) {
                    finish();
                }
            });
        });
    };

    this.save = repository.save;
    this.setInstallState = interfaces.installer.progress_installstate;
    this.getEULA = interfaces.installer.get_eula;
    this.isServiceRunning = interfaces.host.is_service_running;
    this.getDate = interfaces.host.get_seconds_from_epoch;
    this.listVMs = interfaces.manager.list_vms;
    this.lock = interfaces.input.lock;
    this.authCollectPassword = interfaces.input.auth_collect_password;
    this.authGetContext = interfaces.input.auth_get_context;
    this.authSetContextFlags = interfaces.input.auth_set_context_flags;
    this.createVMWithUI = interfaces.manager.create_vm_with_ui;
    this.createVhd = interfaces.manager.create_vhd;
    this.increaseBrightness = interfaces.surfman.increase_brightness;
    this.decreaseBrightness = interfaces.surfman.decrease_brightness;
    this.listPowerDevices = interfaces.upower.EnumerateDevices;
    this.listNDVMs = interfaces.network.list_backends;
    this.showStatusReport = interfaces.diag.status_report_screen;
    this.createStatusReport = interfaces.diag.create_status_report;
    this.taasGetLegal = interfaces.diag.taas_authenticate_credentials;
    this.taasAgreeLegal = interfaces.diag.taas_agree_terms;
    this.taasUpload = interfaces.diag.taas_upload;
    this.assignCD = interfaces.host.assign_cd_device;
    this.ejectCD = interfaces.host.eject_cd_device;

    this.load_pluginSubDirs = function() {
        var finish = function() {
            self.publish("changed");
        };
        var getBadge = function(callback) {
            self.branding_badges.length = 0;
            interfaces.host.list_ui_plugins(XenConstants.Plugins.BRANDING_DIR, function(result) {
                dojo.forEach(result, function(item, i) {
                    var match = XenConstants.Plugins.BRANDING_BADGE_REGEXP.exec(item);
                    if(match != null) {
                        self.branding_badges[match[1]] = XenConstants.Plugins.PLUGIN_PATH + XenConstants.Plugins.BRANDING_DIR + "/" + item;
                        self.branding_badges.length++;
                    }
                    XenConstants.Plugins.BRANDING_BADGE_REGEXP.lastIndex = 0;
                }, this);
                callback();
            }, callback);
        };
        var listWallpaper = function(callback) {
            var paperArray = [];
            interfaces.host.list_ui_plugins(XenConstants.Plugins.WALLPAPER_DIR, function(result) {
                var path = XenConstants.Plugins.PLUGIN_PATH + XenConstants.Plugins.WALLPAPER_DIR + "/";
                dojo.forEach(result, function(paper, i) {
                    if (new RegExp("thumb.png$").test(paper)) {
                        paperArray.push(path + paper);
                    }
                }, this);
                self.available_wallpapers = XenConstants.Wallpapers.concat(paperArray.sort());
                callback();
            }, callback);
        };
        var listImages = function(callback) {
            var imageArray = [];
            interfaces.host.list_ui_plugins(XenConstants.Plugins.VMIMAGES_DIR, function(result) {
                var path = XenConstants.Plugins.PLUGIN_PATH + XenConstants.Plugins.VMIMAGES_DIR + "/";
                dojo.forEach(result, function(vmimage, i) {
                    if (new RegExp(".png$").test(vmimage)) {
                        imageArray.push(path + vmimage);
                    }
                }, this);
                self.available_vmimages = XenConstants.VMImages.concat(imageArray.sort());
                callback();
            }, callback);
        };
        var listServiceImages = function(callback) {
            var imageArray = [];
            interfaces.host.list_ui_plugins(XenConstants.Plugins.SERVICEIMAGES_DIR, function(result) {
                var path = XenConstants.Plugins.PLUGIN_PATH + XenConstants.Plugins.SERVICEIMAGES_DIR + "/";
                dojo.forEach(result, function(image, i) {
                    if (new RegExp(".png$").test(image)) {
                        imageArray.push(path + image);
                    }
                }, this);
                self.available_serviceimages = imageArray.sort();
                callback();
            }, callback);
        };

        var wait = new XUtils.AsyncWait(finish);

        listWallpaper(wait.addCallback());
        listImages(wait.addCallback());
        listServiceImages(wait.addCallback());
        getBadge(wait.addCallback());

        wait.finish();
    };

    // USB
    this.refreshUsb = function(callback) {
        var wait = new XenClient.Utils.AsyncWait(function() {
            self.publish(XenConstants.TopicTypes.MODEL_USB_CHANGED);
            if (callback) {
                callback();
            }
        });
        var updateDevice = function(dev_id) {
            var onSuccess = wait.addCallback(function(name, state, assigned_uuid) {
                if (state == -1) {
                    delete self.usbDevices[dev_id];
                }
                else {
                    self.usbDevices[dev_id] = new XenClient.UI.UsbModel(dev_id, name, state, assigned_uuid);
                }
            });
            interfaces.usb.get_device_info(dev_id, "", function(name, state, assigned_uuid) {
                // If the USB device is assigned to a VM, load with that context
                if (assigned_uuid != "") {
                    interfaces.usb.get_device_info(dev_id, assigned_uuid, onSuccess, wait.error);
                } else {
                    onSuccess.call(this, name, state, assigned_uuid);
                }
            }, wait.error);
        };

        interfaces.usb.list_devices(wait.addCallback(function(result) {
            if (result.length > 0) {
                self.usbDevices = {};
                for (var i = 0; i < result.length; i++) {
                    updateDevice(result[i]);
                }
            }
        }), wait.error);

        wait.finish();
    };

    // Audio
    this.refreshAudio = function(callback) {
        var wait = new XenClient.Utils.AsyncWait(callback);

        var addAudioCard = function(audioCard) {
            interfaces.host.list_sound_card_controls(audioCard.id, function(result) {
                for (var i = 0; i < result.length; i++) {
                    var control = result[i];
                    control.id = "{0}-{1}".format(audioCard.id, control.name).replace(/\s+/g, "_");
                    control.deviceid = audioCard.id;
                    control.devicename = audioCard.name;
                    self.audioControls[control.id] = control;
                }
            }, wait.error);
        };

        interfaces.host.list_sound_cards(wait.addCallback(function(result) {
            if (result.length > 0) {
                self.audioControls = {};
                for (var i = 0; i < result.length; i++) {
                    addAudioCard(result[i]);
                }
            }
        }), wait.error);

        wait.finish();
    };

    // wallpaper getter
    this.get_wallpaper = function() {
        if (!self.wallpaper || self.wallpaper == "" || !self.available_wallpapers.contains(self.wallpaper)) {
            return XenConstants.Defaults.WALLPAPER;
        }
        return self.wallpaper;
    };

    // pointer_trail_timeout getter
    this.get_pointer_trail_timeout = function() {
        return self.pointer_trail_timeout.toString();
    };

    // pointer_trail_timeout setter
    this.set_pointer_trail_timeout = function(timeout) {
        return parseInt(timeout);
    };

    // lock_timeout getter
    this.get_lock_timeout = function() {
        return self.lock_timeout / 60;
    };

    // lock_timeout setter
    this.set_lock_timeout = function(timeout) {
        return parseInt(timeout) * 60;
    };

    // gpuPlacement getter
    this.get_gpuPlacement = function() {
        var newData = [];
        dojo.forEach(self.available_gpus, function(item, i){
            newData[i] = {"uid": item.addr, "info": item.name, "position": item.placement};
        });
        return newData;
    };

    // gpuPlacement setter
    this.set_gpuPlacement = function(data) {
        dojo.forEach(data, function(item){
            interfaces.host.configure_gpu_placement(item.uid, parseInt(item.position));
            dojo.forEach(self.available_gpus, function(gpu){
                if (gpu.addr == item.uid) {
                    gpu.placement = item.position.toString();
                }
            });
        });
    };

    // switcher_resistance getter
    this.get_switcher_resistance = function() {
        return Math.floor(self.switcher_resistance / 5);
    };

    // switcher_resistance setter
    this.set_switcher_resistance = function(resistance){
        return resistance * 5;
    };

    // cdromDevices getter
    this.get_cdromDevices = function() {
        var devices = [];
        dojo.forEach(self.available_cds, function(item, i){
            // XC-10237 - USB CD-ROM drives cannot be made sticky
            var canMakeSticky = (item["usb-id"] == "");
            devices[i] = { "id": item.id, "name": item.name, "vm": item.vm, sticky: item["vm-sticky"], canMakeSticky: canMakeSticky };
        });
        return devices;
    };

    // cdromDevices setter
    this.set_cdromDevices = function(devices) {
        dojo.forEach(devices, function(device) {
            var sticky = (device.sticky.length > 0 && device.sticky[0] === true);
            dojo.some(self.available_cds, function(item){
                if (item.id == device.id) {
                    if (device.vm != item.vm || sticky != item["vm-sticky"]) {
                        self.assignCD(device.id, sticky, device.vm);
                        item["vm-sticky"] = sticky;
                        item.vm = device.vm;
                    }
                    return true;
                }
                return false;
            });
        });        
    };

    // audioControls setter
    this.set_audioControls = function(controls) {

        dojo.forEach(Object.keys(controls), function(control) {
            var newValue = controls[control].value;
            var oldControl = self.audioControls[control];
            var oldValue = oldControl.value;

            if (oldControl.type == "EN") {
                var values = oldValue.split("' '");
                oldValue = values.shift().substr(9);
            }

            if (newValue != oldValue) {

                if (oldControl.type == "EN") {
                    var values = oldControl.value.split("' '");
                    values[0] = "current:'{0}".format(newValue);
                    oldControl.value = values.join("' '");
                } else {
                    oldControl.value = newValue;
                }

                interfaces.host.set_sound_card_control(oldControl.deviceid, oldControl.name, newValue);
            }
        });
    };

    function deviceIsCD(usb) {
        return dojo.some(self.available_cds, function(item) {
            if (item["usb-id"] && item["usb-id"] == usb.dev_id) {
                return true;
            }
        });
    };

    // usbDevices getter
    this.get_usbDevices = function() {
        var devices = [];
        for (var id in self.usbDevices) {
            var usb = self.usbDevices[id];
            if (!usb.isPlatformDevice() && !usb.cannotAssign() && !deviceIsCD(usb)) {
                devices.push(usb);
            }
        }
        return devices;
    };

    // usbDevices setter
    this.set_usbDevices = function(devices) {
        dojo.forEach(devices, function(device) {
            var usb = self.usbDevices[device.dev_id];
            var sticky = (device.getSticky.length > 0 && device.getSticky[0] === true);
            // Assignment
            if (usb.assigned_uuid != device.assigned_uuid) {
                if (device.assigned_uuid == "") {
                    interfaces.usb.unassign_device(device.dev_id);
                } else {
                    interfaces.usb.assign_device(device.dev_id, device.assigned_uuid);
                }
            }
            // Sticky
            if (usb.getSticky() != sticky) {
                interfaces.usb.set_sticky(device.dev_id, sticky ? 1 : 0);
            }
            // Name
            if (usb.name != device.name) {
                interfaces.usb.name_device(device.dev_id, device.name);
            }
        });
    };

    this.getPlatformDevices = function() {
        var devices = [];
        for (var id in self.usbDevices) {
            var usb = self.usbDevices[id];
            if (usb.isPlatformDevice() && !deviceIsCD(usb)) {
                devices.push(usb);
            }
        }
        return devices;
    };

    this.setState = function(state) {
        if (self.state != state) {
            self.state = state;
            self.publish(XenConstants.TopicTypes.MODEL_STATE_CHANGED);
        }
    };

    this.getTranslatedState = function(source) {
        var state = "";
        dojo.some(Object.keys(XenConstants.HostStates), function(key) {
            if (XenConstants.HostStates[key] == self.state) {
                state = source[key];
                return true;
            }
            return false;
        }, this);
        return state;
    };

    this.isDeferred = function() {
        return self.deferred_eula.bool()
            || self.deferred_keyboard.bool()
            || self.deferred_password.bool()
            || self.deferred_language.bool();
    };

    this.canPowerCycle = function() {
        if (XUICache.Update.state == XenConstants.UpdateStates.APPLYING) {
            return false;
        }
        return true;
    };

    this.canAddVM = function() {
        if (self.isDeferred()) {
            return false;
        }
        if (XUICache.Update.state == XenConstants.UpdateStates.APPLYING) {
            return false;
        }
        return self.policy_create_vm;
    };

    this.canAddICAVM = function() {
        if (!self.policy_create_ica_vm) {
            return false;
        }
        return self.canAddVM();
    };

    this.canModifyServices = function() {
        if (self.isDeferred()) {
            return false;
        }        
        return (self.policy_modify_services && XUICache.getServiceVMCount() > 0);
    };

    this.canModifySettings = function() {
        if (self.isDeferred()) {
            return false;
        }
        if (XUICache.Update.state == XenConstants.UpdateStates.APPLYING) {
            return false;
        }
        return self.policy_modify_settings;
    };

    this.canModifyDevices = function() {
        if (self.isDeferred()) {
            return false;
        }
        return self.canModifySettings();
    };

    this.shutdown = function() {
        interfaces.host.shutdown(undefined, fail);
    };

    this.reboot = function() {
        interfaces.host.reboot(undefined, fail);
    };

    this.hibernate = function() {
        interfaces.host.hibernate(undefined, fail);
    };

    this.sleep = function() {
        interfaces.host.sleep(undefined, fail);
    };

    this.getScreenRatio = function() {
        // work out closest ratio, 4 to 3 (1.33) or 16 to 9 (1.77) - use 1.55 as boundary between the 2.
        var box = dojo.window.getBox();
        return (box.w / box.h) < 1.55 ? "1024" : "1280";
    };

    this.getWallpaper = function() {
        var ratio = self.getScreenRatio();
        var image = "";
        switch (self.get_wallpaper()) {
            case "images/wallpaper/s1.png":
                image = "images/wallpaper/xc_wall_gears_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s2.png":
                image = "images/wallpaper/xc_wall_brushed_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s3.png":
                image = "images/wallpaper/xc_wall_marbledglass_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s4.png":
                image = "images/wallpaper/xc_wall_diamond_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s5.png":
                image = "images/wallpaper/xc_wall_waterdrops_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s6.png":
                image = "images/wallpaper/xc_wall_3Dwires_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s7.png":
                image = "images/wallpaper/xc_wall_circuit_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s8.png":
                image = "images/wallpaper/xc_wall_flare_{0}.png".format(ratio);
                break;
            case "images/wallpaper/s9.png":
                image = "images/wallpaper/xc_wall_light_{0}.png".format(ratio);
                break;
            default:
                image = self.wallpaper.replace(/thumb/gi, ratio);
                break;
        }
        return image;
    };

    function isPlatformUserRemote() {
        return (XUICache.Host.platform_user_flags & XenConstants.AuthFlags.REMOTE_USER);
    }

    this.getRemoteUser = function() {
        if (isPlatformUserRemote()) {
            return self.platform_user;
        }
        return "";
    };

    this.getBuild = function() {
        var buildDate = self.build_date_time;
        if (buildDate) {
            var buildDateArray = self.build_date_time.split(" ")[1].split("/");
            buildDate = new Date("20" + buildDateArray[2], parseInt(buildDateArray[0], 10) - 1, buildDateArray[1]);
        }
        return [self.build_number, buildDate];
    };

    this.hasMultipleGPUs = function() {
        return (self.available_gpus.length > 1);
    };

    this.getNetworks = function() {
        var networkList = [];        
        dojo.forEach(self.available_networks, function(network) {
            // Don't show unknown devices
            if (network.type == XenConstants.Network.NETWORK_TYPE.UNKNOWN) {
                return;
            }
            // Don't show devices without a backend, they aren't fully configured yet
            if (!network.backend_vm) {
                return;
            }
            var name = network.label || network.object;
            var type = network.type.toUpperCase();
            var deviceAvailable = (network.mac != "");
            var backend = network.backend_vm;
            var wireless = false;
            switch (network.type) {
                case XenConstants.Network.NETWORK_TYPE.WIRED: {
                    type = network.mode.toUpperCase();
                    break;
                }
                case XenConstants.Network.NETWORK_TYPE.WIFI:
                case XenConstants.Network.NETWORK_TYPE.MODEM: {
                    wireless = true;
                    break;
                }
            }
            networkList.push({path: network.object, name: name, type: type, backend: backend, wireless: wireless, deviceAvailable: deviceAvailable, description: [type, backend], device: [network.mac, network.driver]});
        });
        return networkList;
    };

    this.set_mouse_speed = function(value) {
        return parseInt(value);
    };

    this.get_idle_time_threshold = function() {
        return parseInt(self.idle_time_threshold) / 60;
    };

    this.set_idle_time_threshold = function(value) {
        return parseInt(value) * 60;
    };

    this.get_vm_mode = function() {
        return XUICache.getNativeVM() !== null ? "single" : "multiple";
    };

    this.set_vm_mode = function(value) {
        if(value == "multiple") {
            // need to make sure no VMs are set as native
            for(var vm in XUICache.VMs) {
                if(XUICache.VMs.hasOwnProperty(vm) && XUICache.VMs[vm].native_experience) {
                    XUICache.VMs[vm].save({native_experience: false});
                }
            }
        }
    };

    this.get_native_vm = function() {
        var vm = XUICache.getNativeVM();
        return vm == null ? "" : vm.vm_path;
    };

    this.set_native_vm = function(vmpath) {
        if(!XUICache.VMs[vmpath]) {return;}
        XUICache.VMs[vmpath].save({native_experience: true});
    };

    this.uiReady = function() {
        XUtils.publish(XenConstants.TopicTypes.UI_READY);
        self.save("ui_ready", true);
    };

    this.getVMTemplates = function() {
        return self.vm_templates.sort(function(a, b) {
            if (a.description > b.description) {
                return -1;
            }
            if (a.description < b.description) {
                return 1;
            }
            return 0;
        });
    };
};
