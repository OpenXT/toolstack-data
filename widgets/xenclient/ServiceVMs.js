define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/ServiceVMs",
    "dojo/text!citrix/xenclient/templates/ServiceVMs.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    //Required in code
    "citrix/xenclient/VMDetails",
    "dojo/NodeList-traverse",
    // Required in template
    "citrix/common/Button",
    "citrix/common/Repeater"
],
function(dojo, declare, servicesNls, template, dialog, _boundContainerMixin, vmDetails) {
return declare("citrix.xenclient.ServiceVMs", [dialog, _boundContainerMixin], {

	templateString: template,
    widgetsInTemplate: true,
    _vmHandles: [],

    postMixInProperties: function() {
        dojo.mixin(this, servicesNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.startup();
        this.subscribe("com.citrix.xenclient.xenmgr", this._messageHandler);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this._createSubscriptions();
        this._bindDijit();
    },

    show: function() {
        this.inherited(arguments);
        // Refresh when opening dialog
        this._bindDijit();
    },

    _bindDijit: function() {
        this.inherited(arguments);
        var services = [];
        for(var service in XUICache.ServiceVMs) {
            services.push(XUICache.ServiceVMs[service]);
        }
        this.bind({serviceVMs: services});
    },

    _createSubscriptions: function() {
        dojo.forEach(this._vmHandles, function(handle) {
            dojo.unsubscribe(handle);
        });
        this._vmHandles = [];
        for(var service in XUICache.ServiceVMs) {
            this._vmHandles.push(dojo.subscribe(XUICache.ServiceVMs[service].publish_topic, dojo.hitch(this, this._messageHandler)));
        }
    },

    onEdit: function(event) {
        var path = new dojo.NodeList(event.target).parents("tr")[0].getAttribute("deviceId");
        var found = false;
        dojo.some(dijit.registry.findWidgets(document.body), function(widget) {
            // check to see if there is already a matching VMDetails open. If so, reuse that.
            if(widget.declaredClass == vmDetails.prototype.declaredClass && widget.path == path) {
                widget.show();
                found = true;
                return true;
            }
        });
        if(!found) {
            new vmDetails({path: path}).show();
        }
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                break;
            }
            case XenConstants.TopicTypes.UI_VM_CREATED:
            case XenConstants.TopicTypes.UI_VM_DELETED: {
                this._createSubscriptions();
                this._bindDijit();
                break;
            }
            case "vm_state_changed": {
                // For use when we want to know that a VM has changed state.
                // May just call _bindDijit anyway. Or perhaps it's time to make the service VMs their own widget.
                break;
            }
        }
    },

    uninitialize: function() {
        dojo.forEach(this._vmHandles, function(handle) {
            dojo.unsubscribe(handle);
        });
        this.inherited(arguments);
    }
});
});