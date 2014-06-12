// VM Disk model
Namespace("XenClient.UI");

XenClient.UI.VMDiskModel = function(disk_path) {

    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.disk_path = disk_path;
    this.publish_topic = disk_path;
    this.devtype = "";
    this.snapshot = "";
    this.name = disk_path.substr(disk_path.lastIndexOf("/") + 1);
    this.virtual_size_mb = 0;
    this.utilization_bytes = 0;
    this.encryption_key_set = false;
    this.snapshots = [];

    // Services
    var services = {
        disk:     new XenClient.DBus.VmDiskClient("com.citrix.xenclient.xenmgr", disk_path)
    };

    // Interfaces
    var interfaces = {
        disk:     services.disk.com.citrix.xenclient.vmdisk
    };

    // Mappings
    var readOnlyMap = [
        ["devtype",                             interfaces.disk],
        ["virtual_size_mb",                     interfaces.disk],
        ["utilization_bytes",                   interfaces.disk],
        ["encryption_key_set",                  interfaces.disk],
//        ["snapshots",                           interfaces.disk.list_snapshots],
    ];

    var readWriteMap = [
        ["snapshot",                            interfaces.disk]
    ];

    var refreshIgnoreMap = [
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

    this.load = repository.load;
    this.refresh = repository.refresh;
    this.save = repository.save;
    this.encrypt = interfaces.disk.generate_crypto_key;
    this.attach_vhd = interfaces.disk.attach_vhd;
    this.delete_ = interfaces.disk.delete_;
    this.takeSnapshot = interfaces.disk.take_snapshot;
    this.restoreSnapshot = interfaces.disk.restore_snapshot;

    this.get_size = function() {
        return XUtils.humanizeBytesForDiskStorage(self.virtual_size_mb * 1000 * 1000);
    };

    this.get_utilization = function() {
        return XUtils.humanizeBytesForDiskStorage(self.utilization_bytes);
    };

    this.getSnapshots = function() {
        var snapshots = [];
        for (var id in self.snapshots) {
            if (self.snapshots.hasOwnProperty(id)) {
                var snapshot = self.snapshots[id];
                snapshots.push(snapshot);
            }
        }

        return snapshots;
    };
};