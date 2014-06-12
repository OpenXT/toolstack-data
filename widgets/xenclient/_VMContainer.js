define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/layout/_LayoutWidget",
    // Used in code
    "citrix/common/ItemFileReadStore"
],
function(dojo, declare, _layoutWidget, itemFileReadStore) {
return declare("citrix.xenclient._VMContainer", [_layoutWidget], {

    vmStore: null,

    constructor: function() {
        this.vms = {};
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this._createStore();
        this._sortChildren();
    },

    _deleteChildren: function() {
        dojo.forEach(Object.keys(this.vms), function(key) {
            if (typeof(XUICache.VMs[key]) === "undefined") {
                this.removeChild(this.vms[key]);
                this.vms[key].destroyRecursive();
                delete this.vms[key];
            }
        }, this);
    },

    _createStore: function() {
        var values = [];
        dojo.forEach(Object.keys(XUICache.VMs), function(key) {
            var vm = XUICache.VMs[key];
            if (vm.loaded) {
                var value = {vm_path: vm.vm_path, slot: vm.slot};
                values.push(value);
            }
        }, this);
        var data = {identifier: 'vm_path', items: values};
        this.vmStore = new itemFileReadStore({data: data});
    },

    _sortChildren: function() {
        this.vmStore.fetch({
            onComplete: dojo.hitch(this, this._gotVMs),
            sort: [{
                attribute: "slot"
            }]
        }, this);
    },

    _gotVMs: function(items, request) {
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.UI_VMSLOT_CHANGED: {
                this._createStore();
                this._sortChildren();
                break;
            }
            case XenConstants.TopicTypes.UI_VM_CREATED:
            case XenConstants.TopicTypes.UI_VM_DELETED: {
                this._deleteChildren();
                this._createStore();
                this._sortChildren();
                break;
            }
        }
    }
});
});