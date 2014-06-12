define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Information",
    "dojo/text!citrix/xenclient/templates/Information.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_CitrixTooltipMixin",
    //Required in code
    "citrix/xenclient/ReportWizard",
    // Required in template
    "citrix/common/TabContainer",
    "citrix/common/ContentPane",
    "citrix/common/Button",
    "citrix/common/BoundWidget"
],
function(dojo, declare, infoNls, template, dialog, _boundContainerMixin, _citrixTooltipMixin, reportWizard) {
return declare("citrix.xenclient.Information", [dialog, _boundContainerMixin, _citrixTooltipMixin], {

	templateString: template,
    widgetsInTemplate: true,

    constructor: function(args) {
        this.host = XUICache.Host;
    },

    postMixInProperties: function() {
        dojo.mixin(this, infoNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.startup();
        this._updateBranding();
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this.subscribe("com.citrix.xenclient.xenmgr", this._messageHandler);
        this._bindDijit();
    },

    show: function() {
        this.inherited(arguments);
        // Refresh when opening dialog
        this.host.refresh();
    },

    refreshResources: function() {
        this.host.refreshResources(dojo.hitch(this, function() {
            this.memoryNode.set("value", this.host.free_mem);
            this.storageNode.set("value", this.host.free_storage);
        }));
    },

    createReport: function() {
        new reportWizard().show();
    },

    _updateBranding: function() {
        XUtils.disableContextMenu(this.brandingNode.contentDocument);
        var blurbPath = XenConstants.Plugins.PLUGIN_PATH + XenConstants.Plugins.BRANDING_DIR + "/";

        function changeBasePath(document, attr) {
            var basePath = location.href;
            basePath = basePath.substr(0, basePath.lastIndexOf("/"));
            basePath += "/" + blurbPath;
            dojo.query("[" + attr + "]", document).forEach(function(path, i) {
                dojo.attr(path, attr, basePath + dojo.attr(path, attr));
            });
        }

        XUtils.pathExists(blurbPath + XenConstants.Plugins.BRANDING_BLURB, dojo.hitch(this, function(exists, html) {
            this._setDisplay(".branding", exists);
            if (exists) {
                html = XUtils.stripScript(html);
                this.brandingNode.contentDocument.body.innerHTML = html;
                changeBasePath(this.brandingNode.contentDocument.body, "src");
                changeBasePath(this.brandingNode.contentDocument.body, "href");
            }
        }));
    },

    _bindDijit: function() {
        this.bind(this.host);
        this.inherited(arguments);
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                break;
            }
            case "vm_state_changed": {
                if (this.open) {
                    this.refreshResources();
                }
                break;
            }
        }
    }
});
});