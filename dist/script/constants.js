Namespace("XenClient.Resource");

// Error Codes
XenClient.Resource.ToolstackCodes = {
    // Should match http://git/cgit.cgi/xenclient/manager.git/tree/xenmgr/XenMgr/Errors.hs
    NOT_ENOUGH_FREE_MEMORY          : 101, // Not enough free memory!
    VM_BAD_STATE                    : 102, // VM is in unexpected state!
    VM_UNEXPECTED_SHUTDOWN_REASON   : 103, // Shutdown reason didn't match the expected one
    VM_NOT_SHUTDOWN                 : 104, // VM didn't shutdown!
    VM_ALREADY_CREATED              : 105, // VM is already created!
    VT_MISSING                      : 106, // Hardware virtualization is switched off
    VM_TAP_MOUNT_FAILURE            : 107, // One of VM disks failed to mount

    HDX_AUTOSTART_MULTIPLE          : 200, // HDX and Autostart cannot be simultaneously activated on more than one VM.
    VM_HIBERNATE_FAILED             : 201, // Failed to hibernate VM
    VM_EDIT_DISABLED                : 202, // Editing of properties is disabled by this VM's active policy
    NO_SUCH_DEVICE                  : 203, // No such device
    VM_CANNOT_DELETE_RUNNING        : 204, // Cannot remove running VM
    VM_COUNT_HIGH                   : 205, // Too many VMS
    DISK_NOT_EXIST                  : 206, // No such disk
    INCORRECT_DISK_TYPE             : 207, // Incorrect disk type
    INCORRECT_DEVICE_TYPE           : 208, // Incorrect device type
    HDX_CHANGE_WHILE_RUNNING        : 209, // Cannot turn HDX on/off while the VM is running
    HDX_ENABLE_NO_TOOLS             : 210, // Cannot turn HDX on until XenClient PV addons are installed inside the guest
    HDX_NO_VTD                      : 211, // Cannot start VM with HDX because VT-d is turned off.
    DISK_DEVICE_EXISTS              : 212, // Failed to add a disk, device ID is duplicated
    TOOLS_REQUIRED                  : 213, // Performing this action requires PV addons installed inside VM
    PROPERTY_READ_ONLY              : 214, // Property is read-only
    PROPERTY_WRITE_ONLY             : 215, // Property is write-only
    NO_DIAGNOSTICS                  : 216, // Currently not gathering diagnostic information
    INCORRECT_DISK_HASH             : 217, // Disk SHA1 sum does not match the expected one!
    TOO_MANY_HDX                    : 218, // Cannot start VM - too many vms with HDX are already running
    VM_PASSTHRU_RUNNING             : 219, // Cannot start VM - another VM with AMT passthrough is already running
    POLICY_SUPPRESSED_ACTION        : 220, // Action suppressed by active policy settings
    VM_HIBERNATE_CHANGE             : 221, // Cannot change VM property while it is in hibernated state
    NIC_NOT_FOUND                   : 222, // No such NIC
    IO_ERROR                        : 223, // IO error: + msg
    VM_RESUME_FAILED                : 224, // Failed to resume vm from sleep
    OPERATION_SUPPRESSED_ACTION     : 225, // Cannot complete requested action because background operation is in progress
    VM_NO_RPC_AGENT                 : 226, // Guest VM is not configured to use rpc agent
    VM_SLEEP_TIMEOUT                : 227, // Timeout waiting for guest to enter sleep state
    VM_HIBERNATE_TIMEOUT            : 228, // Timeout waiting for guest to enter hibernated state
    VM_SHUTDOWN_TIMEOUT             : 229, // Timeout waiting for guest to enter shutdown state
    DEVICE_ATTACHED_ELSEWHERE       : 230, // Device '" ++ dev ++ "' is currently being passed through to another VM.
    ADAPTER_NOT_SECONDARY           : 231, // Graphics card cannot be passed through as secondary adapter
    NETWORK_NOT_RUNNNING            : 232, // Network backend domain is not running
    OEM_ACPI_RUNNING                : 233, // Cannot stat VM - another VM with oem acpi features is already running
    UNKNOWN_GPU                     : 234, // Unknown GPU " ++ show gpu
    VM_TXT_SLEEP_DISABLED           : 235, // Host sleep is disabled while in TXT measured launch
    UNSUPPORTED_LANGUAGE            : 236, // Unsupported language
    RULE_PARSE_ERROR                : 237, // Rule parse error
    ENCRYPTION_KEY_EXISTS           : 238, // Encryption key already exists
    VHD_ALREADY_ENCRYPTED           : 239, // VHD file already contains encryption key
    NETWORK_DAEMON_TIMEOUT          : 240, // Timeout waiting for network daemon to become ready
    FILE_DOES_NOT_EXIST             : 242, // Supplied file doesn't exist
    NETWORK_ISSUE                   : 243, // Network issue detected, please check your internet connection
    INVALID_CASE_ID                 : 244, // A generic error occurred, please check your case ID
    USER_UNAUTHORIZED               : 245, // User unauthorized, please check your MyCitrix credentials
    TERMS_NOT_AGREED                : 246  // User has not agreed to the latest version of the legal terms
};

XenClient.Resource.UpdateCodes = {
    // Should match http://git/cgit.cgi/xenclient/manager.git/tree/updatemgr/UpdateMgr/Error.hs
    UPDATE_INTERNAL_ERROR           : 301,
    UPDATE_DOWNLOAD_FAILED          : 302,
    UPDATE_DOWNLOAD_CANCELLED       : 303,
    UPDATE_MISSING_METADATA         : 304,
    UPDATE_MALFORMED_METADATA       : 305,
    UPDATE_UPDATE_NOT_APPLICABLE    : 306,
    UPDATE_ALREADY_RUNNING          : 307,
    UPDATE_VM_RUNNING               : 308,
    UPDATE_CORRUPT_FILE             : 309,
    UPDATE_UP_TO_DATE               : 310,
    UPDATE_FILE_NOT_FOUND           : 311,
    UPDATE_CANNOT_RESOLVE_HOST      : 312,
    UPDATE_CANNOT_CONNECT_HOST      : 313,
    UPDATE_SIGNATURE_FAILED         : 314,
    UPDATE_POLICY_DISABLED          : 315
};

XenClient.Resource.AuthFlags = {
    // Should match http://git/cgit.cgi/xenclient/input.git/tree/secure.h
    LOCK                    : 0x1,      // (1 << 0)
    CONFIRM_PW              : 0x2,      // (1 << 1)
    SET_LOCAL_PW            : 0x4,      // (1 << 2)
    REMOTE_USER             : 0x8,      // (1 << 3)
    CANNOT_CANCEL           : 0x10,     // (1 << 4)
    SET_ROOT_PW             : 0x20,     // (1 << 5)
    CHANGE_LOCAL_PW         : 0x40,     // (1 << 6)

    OFFLINE_TRANSFER                        : 0x20,     // (1 << 5) Transmitter is offline so remote auth wasn't attempted
    AUTH_FLAG_HTTP_ERROR                    : 0x40,     // (1 << 6) HTTP error code other than 200 or 401 was returned by Transmitter
    AUTH_FLAG_NETWORK_ERROR                 : 0x80,     // (1 << 7) Couldn't talk to the Transmitter despite network being up
    AUTH_FLAG_REMOTE_INTERNAL_ERROR         : 0x100,    // (1 << 8) Internal error in the Transmitter
    AUTH_FLAG_LOCAL_STARTED                 : 0x200,    // (1 << 9) Local authentication was started (set in conjunction with AUTH_IN_PROGRESS status)
    AUTH_FLAG_REMOTE_STARTED                : 0x400,    // (1 << 10) Remote authentication was started (set in conjunction with AUTH_IN_PROGRESS status)
    AUTH_FLAG_NOT_REGISTERED                : 0x800,    // (1 << 11) Not registered with Transmitter so couldn't to remote auth
    AUTH_FLAG_LOCAL_CREDENTIALS_MISSING     : 0x1000,   // (1 << 12) Local hash file was missing
    AUTH_FLAG_REMOTE_CREDENTIALS_MISSING    : 0x2000,   // (1 << 13) Remote hash file was missing
    AUTH_FLAG_NOT_LOGGED_IN                 : 0x4000,   // (1 << 14) User not logged in so can't do recovery
    AUTH_FLAG_USERID_MISMATCH               : 0x8000,   // (1 << 15) Can't do recovery because different user logged in
    REMOTE_PASSWORD_EXPIRED                 : 0x10000,  // (1 << 16) Remote user's password has expired
    REMOTE_ACCOUNT_LOCKED                   : 0x20000,  // (1 << 17) Remote user's account is locked
    REMOTE_ACCOUNT_DISABLED                 : 0x40000,  // (1 << 18) Remote user's account has been disabled
    SSL_CACERT_ERROR                        : 0x80000   // (1 << 19) Untrusted CA certificate
};

XenClient.Resource.HostStates = {
    HOST_IDLE           : "idle",
    HOST_SHUTTING_DOWN  : "shutdowning", // :)
    HOST_REBOOTING      : "rebooting",
    HOST_SLEEPING       : "sleeping",
    HOST_HIBERNATING    : "hibernating"
};

XenClient.Resource.UpdateVersionStates = {
    CAN_UPGRADE     : "can-upgrade",
    CANNOT_UPGRADE  : "cannot-upgrade",
    UP_TO_DATE      : "up-to-date"
};

XenClient.Resource.UpdateStates = {
    NONE                : "",
    DOWNLOADING_META    : "downloading-meta",
    DOWNLOADED_META     : "downloaded-meta",
    DOWNLOADING_FILES   : "downloading-files",
    DOWNLOADED_FILES    : "downloaded-files",
    APPLYING            : "applying",
    FAILED              : "failed",
    COMPLETE            : "done"
};

XenClient.Resource.VMTypes = {
    NORMAL  : "",
    ICA     : "ICA"
};

XenClient.Resource.VMStates = {
    // From XenVM
    VM_CREATING         : "creating",
    VM_STOPPED          : "stopped",
    VM_STOPPING         : "stopping",
    VM_REBOOTING        : "rebooting",
    VM_REBOOTED         : "rebooted",
    VM_PAUSED           : "paused",
    VM_SUSPENDING       : "suspending",
    VM_SUSPENDED        : "suspended",
    VM_RUNNING          : "running",
    VM_LOCKED           : "locked",
    // From ACPI state
    VM_ASLEEP           : "asleep"
};

XenClient.Resource.DiskSnapshotMode = {
    RESET               : "temporary",
    NONE                : "none"
};

XenClient.Resource.DiskType = {
    CDROM               : "cdrom",
    DISK                : "disk"
};

XenClient.Resource.BackendStates = {
    // The states that the device can be in WRT the backend.
    PRE_REGISTERED  : -1,
    NOT_REGISTERED  : 0,
    NOT_LOGGED_IN   : 1,
    LOGGED_IN       : 2
};

XenClient.Resource.BackupModes = {
    NONE        : "NONE",
    USER_DATA   : "USER_DATA",
    ALL_DATA    : "ALL_DATA"
};

//Images
XenClient.Resource.VMImages = [
    "images/vms/001_ComputerXP_h32bit_120.png",
    "images/vms/001_ComputerVista_h32bit_120.png",
    "images/vms/001_ComputerWin7_h32bit_120.png",
    "images/vms/Ubuntu_VM.png",
    "images/vms/Bus_VM.png",
    "images/vms/Home_VM.png",
    "images/vms/Lock_VM.png",
    "images/vms/Blue_VM.png",
    "images/vms/Green_VM.png",
    "images/vms/Metal_VM.png"
];

XenClient.Resource.Wallpapers = [
    "images/wallpaper/s1.png",
    "images/wallpaper/s2.png",
    "images/wallpaper/s3.png",
    "images/wallpaper/s4.png",
    "images/wallpaper/s5.png",
    "images/wallpaper/s6.png",
    "images/wallpaper/s7.png",
    "images/wallpaper/s8.png",
    "images/wallpaper/s9.png"
];

// Networking (http://projects.gnome.org/NetworkManager/developers/api/09/spec.html)
XenClient.Resource.NetworkDeviceStates = {
    UNKNOWN         : 0,    // The device is in an unknown state.
    UNMANAGED       : 10,   // The device is recognized but not managed by NetworkManager.
    UNAVAILABLE     : 20,   // The device cannot be used (carrier off, rfkill, etc).
    DISCONNECTED    : 30,   // The device is not connected.
    PREPARE         : 40,   // The device is preparing to connect.
    CONFIG          : 50,   // The device is being configured.
    NEED_AUTH       : 60,   // The device is awaiting secrets necessary to continue connection.
    IP_CONFIG       : 70,   // The IP settings of the device are being requested and configured.
    IP_CHECK        : 80,   // The device's IP connectivity ability is being determined.
    SECONDARIES     : 90,   // The device is waiting for secondary connections to be activated.
    ACTIVATED       : 100,  // The device is active.
    DEACTIVATING    : 110,  // The device's network connection is being torn down.
    FAILED          : 120   // The device is in a failure state following an attempt to activate it.
};

XenClient.Resource.NetworkDeviceModes = {
    UNKNOWN     : "0",  // Mode is unknown.
    ADHOC       : "1",  // Uncoordinated network without central infrastructure.
    INFRA       : "2"   // Coordinated network with one or more central controllers.
};

// Other
XenClient.Resource.Defaults = {
    WALLPAPER       : "images/wallpaper/s9.png",
    MAX_VMS         : 9,
    FISH            : true,
    TOOLS_WARNING   : true,
    KEYBOARD        : XUtils.parseQuery().keyboard,
    MESSAGE_LOGGING : XUtils.parseQuery().logmessage,
    MESSAGE_LIMIT   : 30,
    TOOLS_ISO       : "xc-tools.iso"
};

XenClient.Resource.TooltipDefaults = {
    showURL     : false,
    track       : false,
    position    : "bottom"
};

XenClient.Resource.Regex = {
    URL                     : "(http(s?)\\://)?(([a-zA-Z\\-\\.]+\\.[a-zA-Z]{2,3})|(([0-9]{1,3}\\.){3})[0-9]{1,3})(\\:[0-9]+)?(/\\S*)?",
    VM_NAME                 : "[^\\s<>&][^<>&]*",
    USB_NAME                : "[^\\s<>&][^<>&]*",
    VM_DESCRIPTION          : "([^\\s<>&][^<>&]*)?",
    VM_NAME_ASCII           : "[^\\s<>&\\u007F-\\uFFFF][^<>&\\u007F-\\uFFFF]*",
    VM_DESCRIPTION_ASCII    : "([^\\s<>&\\u007F-\\uFFFF][^<>&\\u007F-\\uFFFF]*)?"
};

XenClient.Resource.VMLimits = {
    VCPUS   : 2,
    MEMORY  : 8192
};

XenClient.Resource.Plugins = {
    PLUGIN_PATH             : "plugins/",
    PLUGIN_DIR              : "",
    WALLPAPER_DIR           : "wallpaper",
    VMIMAGES_DIR            : "vmimages",
    BRANDING_DIR            : "branding",
    BRANDING_LOGO           : "logo.png",
    BRANDING_BLURB          : "branding.html",
    BRANDING_BADGE_REGEXP   : /badge_(TL|TR|BL|BR).png/g,
    SERVICEIMAGES_DIR       : "serviceimages"
};

XenClient.Resource.TopicTypes = {
    // Model Data Topics
    MODEL_LOADED            : "loaded",
    MODEL_CHANGED           : "changed",
    MODEL_SAVED             : "saved",
    MODEL_PROPERTY_CHANGED  : "propertychanged",
    MODEL_FAILURE           : "failure",

    // Model Auxiliary Content Topics
    MODEL_STATE_CHANGED     : "statechanged",
    MODEL_TRANSFER_CHANGED  : "transferchanged",
    MODEL_USB_CHANGED       : "usbchanged",
    MODEL_NIC_CHANGED       : "nicchanged",
    MODEL_DISK_CHANGED      : "diskchanged",
    MODEL_DISK_USAGE_CHANGED: "diskusagechanged",

    // UI Topics
    UI_READY                : "uiready",
    UI_SHIFTKEY_DOWN        : "shiftdown",
    UI_SHIFTKEY_UP          : "shiftup",
    UI_SHOW_WAIT            : "showwait",
    UI_HIDE_WAIT            : "hidewait",
    UI_SHOW_POPUP           : "showpopup",
    UI_HIDE_POPUP           : "hidepopup",

    // UI VM Topics
    UI_VM_CREATED           : "vmcreated",
    UI_VM_DELETED           : "vmdeleted",
    UI_VMS_LOADED           : "vmsloaded",
    UI_VMSTATE_CHANGED      : "vmstatechanged",
    UI_VMSLOT_CHANGED       : "vmslotchanged",
    UI_VMNAME_CHANGED       : "vmnamechanged", 

    // UI NDVM Topics
    UI_NDVM_CREATED         : "ndvmcreated",
    UI_NDVM_DELETED         : "ndvmdeleted",
    UI_NDVMS_LOADED         : "ndvmsloaded",
    UI_NDVMNAME_CHANGED     : "ndvmnamechanged",

    // Battery Topics
    UI_BATTERIES_LOADED     : "batteriesloaded",
    BATTERY_CRITICAL        : "batterycritical"
};

XenClient.Resource.PCIClassIDs = [
//    "0x000", // Non-VGA unclassified device
//    "0x001", // VGA compatible unclassified device

//    "0x100", // SCSI storage controller
//    "0x101", // IDE interface
//    "0x102", // Floppy disk controller
//    "0x103", // IPI bus controller
//    "0x104", // RAID bus controller
//    "0x105", // ATA controller
//    "0x106", // SATA controller
//    "0x107", // Serial Attached SCSI controller
//    "0x108", // Non-Volatile memory controller
//    "0x180", // Mass storage controller

    "0x200", // Ethernet controller
//    "0x201", // Token ring network controller
//    "0x202", // FDDI network controller
//    "0x203", // ATM network controller
//    "0x204", // ISDN controller
//    "0x205", // WorldFip controller
//    "0x206", // PICMG controller
    "0x280", // Network controller

//    "0x300", // VGA compatible controller
//    "0x301", // XGA compatible controller
//    "0x302", // 3D controller
//    "0x380", // Display controller

    "0x400", // Multimedia video controller
    "0x401", // Multimedia audio controller
    "0x402", // Computer telephony device
    "0x403", // Audio device
    "0x480", // Multimedia controller

//    "0x500", // RAM memory
//    "0x501", // FLASH memory
//    "0x580", // Memory controller

//    "0x600", // Host bridge
//    "0x601", // ISA bridge
//    "0x602", // EISA bridge
//    "0x603", // MicroChannel bridge
//    "0x604", // PCI bridge
//    "0x605", // PCMCIA bridge
//    "0x606", // NuBus bridge
//    "0x607", // CardBus bridge
//    "0x608", // RACEway bridge
//    "0x609", // Semi-transparent PCI-to-PCI bridge
//    "0x60A", // InfiniBand to PCI host bridge
//    "0x680", // Bridge

    "0x700", // Serial controller
    "0x701", // Parallel controller
    "0x702", // Multiport serial controller
    "0x703", // Modem
    "0x704", // GPIB controller
    "0x705", // Smard Card controller
    "0x780", // Communication controller

//    "0x800", // PIC
//    "0x801", // DMA controller
//    "0x802", // Timer
//    "0x803", // RTC
//    "0x804", // PCI Hot-plug controller
//    "0x805", // SD Host controller
//    "0x806", // IOMMU
//    "0x880", // System peripheral

    "0x900", // Keyboard controller
    "0x901", // Digitizer Pen
    "0x902", // Mouse controller
    "0x903", // Scanner controller
    "0x904", // Gameport controller
    "0x980", // Input device controller

    "0xA00", // Generic Docking Station
    "0xA80", // Docking Station

//    "0xB00", // 386
//    "0xB01", // 486
//    "0xB02", // Pentium
//    "0xB03", //
//    "0xB04", //
//    "0xB10", // Alpha
//    "0xB20", // Power PC
//    "0xB30", // MIPS
//    "0xB40", // Co-processor

    "0xC00", // FireWire (IEEE 1394)
    "0xC01", // ACCESS Bus
    "0xC02", // SSA
    "0xC03", // USB controller
    "0xC04", // Fibre Channel
    "0xC05", // SMBus
    "0xC06", // InfiniBand
    "0xC07", // IPMI SMIC interface
    "0xC08", // SERCOS interface
    "0xC09", // CANBUS

    "0xD00", // IRDA controller
    "0xD01", // Consumer IR controller
    "0xD10", // RF controller
    "0xD11", // Bluetooth
    "0xD12", // Broadband
    "0xD20", // 802.1a controller
    "0xD21", // 802.1b controller
    "0xD80"  // Wireless controller

//    "0xE00", // I2O

//    "0xF01", // Satellite TV controller
//    "0xF02", // Satellite audio communication controller
//    "0xF03", // Satellite voice communication controller
//    "0xF04", // Satellite data communication controller

//    "0x1000", // Network and computing encryption device
//    "0x1010", // Entertainment encryption device
//    "0x1080", // Encryption controller

//    "0x1100", // DPIO module
//    "0x1101", // Performance counters
//    "0x1110", // Communication synchronizer
//    "0x1120", // Signal processing management
//    "0x1180", // Signal processing controller

//    "0xFF00"  // Unassigned
];

XenConstants = XenClient.Resource;
