// USB model
Namespace("XenClient.UI");

    /*
        USB States
        -1: Error (usually device no longer present/not found)
        0: Nothing (i.e. not assigned to anything and not blocked), Not in use.
        1: Assigned to another VM (not running)
        2: Assigned to another VM and in use (running)
        3: Blocked to this VM by policy
        4: In use by this VM ('always' unchecked)
        5: In use by this VM and sticky ('always' checked)
        6: Sticky for this VM but not currently in use (e.g. ejected) ('always' checked)
        7: Platform device (only keyboards). Not connectable.
        8: HiD in use by dom0. Labeled "Currently in use by XenClient" in connect list, but still assignable.
        9: HiD "always" assigned to another VM, which is currently turned off. Label in connect list TDB, with warning icon.
        10: External CD drive in use by dom0. Labeled "Currently in use by XenClient" in connect list, but still assignable.
        11: External CD drive "always" assigned to another VM, which is currently turned off. Label in connect list TDB, with warning icon.

        Note that states 8 and 10 are currently identical, as are states 9 and 11.
    */

XenClient.UI.UsbModel = function(dev_id, name, state, assigned_uuid) {

    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.dev_id = dev_id;
    this.name = name || "";
    this.state = state;
    this.assigned_uuid = assigned_uuid || "";

    this.isPlatformDevice = function() {
        return [7, 8, 10].contains(self.state);
    };

    this.assignedToCurrentVM = function() {
        return [4, 5, 6].contains(self.state);
    };

    this.assignedToOtherVM = function() {
        return [1, 2, 9, 11].contains(self.state);
    };

    this.availableToCurrentVM = function() {
        return ![-1, 4, 5, 6].contains(self.state);
    };

    this.cannotAssign = function() {
        return [3, 7].contains(self.state);
    };

    this.getSticky = function() {
        return (self.state == 5 || self.state == 6);
    };

    this.getStatus = function() {
        var vmName = "";
        if (self.assignedToOtherVM() && self.assigned_uuid != "") {
            var path = XUtils.uuidToPath(self.assigned_uuid);
            var vm = XUICache.getVM(path);
            if (vm) {
                vmName = vm.name;
            }
        }
        return [self.state, vmName];
    };
};