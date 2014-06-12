define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Frame",
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    "dojo/text!citrix/xenclient/templates/Frame.html",
    // Mixins
    "dijit/layout/BorderContainer",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin",
    // Required in template
    "citrix/common/ContentPane",
    "citrix/common/Button"
],
function(dojo, declare, frameNls, alertsNls, template, borderContainer, _templated, _citrixWidgetMixin) {
return declare("citrix.xenclient.Frame", [borderContainer, _templated, _citrixWidgetMixin], {

    templateString: template,
    widgetsInTemplate: true,
    gutters: false,
    wallpaperNode: null,
    badgeNodes: [],
    waitTimeout: 30000,
    waitFadeDuration: 1000,
    _waitVisible: true,
    _waitTimer: null,
    _keyString: "",

    postMixInProperties: function() {
        dojo.mixin(this, frameNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this.subscribe("com.citrix.xenclient.updatemgr", this._messageHandler);
        this.connect(dojo.doc.body, "mousemove", this._onMouseMove);
        this.connect(dojo.doc, "keydown", this._onKeyDown);
        this.connect(dojo.doc, "keyup", this._onKeyUp);
        this.connect(dojo.doc, "onblur", this._onBlur);
    },

    layout: function() {
        this.inherited(arguments);
        this._updateWallpaper();
    },

    showWait: function(noFade) {
        this._waitTimer = setTimeout(dojo.hitch(this, this.hideWait, noFade), this.waitTimeout);

        if (this._waitVisible) {
            return;
        }

        this._waitVisible = true;
        // Fading out (and not in) leaves the opacity at 0!
        this.waitNode.style.opacity = 1;
        this._setDisplay(this.waitNode, true);
    },

    hideWait: function(noFade) {
        if (this._waitTimer) {
            clearTimeout(this._waitTimer);
            this._waitTimer = null;
        }

        if (!this._waitVisible) {
            return;
        }

        this._waitVisible = false;

        if (noFade) {
            this._setDisplay(this.waitNode, false);
        } else {
            dojo.fadeOut({
                node: this.waitNode,
                duration: this.waitFadeDuration,
                onEnd: dojo.hitch(this, function() {
                    this._setDisplay(this.waitNode, false);
                })
            }).play();
        }
    },

    showUpdate: function() {
        this._setDisplay(this.containerNode, false);
        this._setDisplay(this.updateNode, true);
    },

    hideUpdate: function() {
        this._setDisplay(this.containerNode, true);
        this._setDisplay(this.updateNode, false);
    },

    showNative: function() {
        this._setDisplay(this.containerNode, false);
        this._setDisplay(this.nativeNode, true);
    },

    hideNative: function() {
        this._setDisplay(this.containerNode, true);
        this._setDisplay(this.nativeNode, false);
    },

    cancelNative: function() {
        // want to switch back to the native vm.
        var vm = XUICache.getNativeVM();
        if(vm == null || !vm.isRunning()) {
            var msg = "Cannot switch to native VM. " + (vm == null ? "No native VM found." : "Native VM is not running.");
            xc_debug.log(msg);
        } else {
            vm.switchTo();
        }
    },

    _updateNative: function() {
        if(XUICache.getNativeVM() !== null) {
            this.showNative();
        }
    },

    _onMouseMove: function(e) {
        if (XUICache.Host.pointer_trail_timeout != 0) {
            var pointer = dojo.clone(this.pointerNode);
            dojo.removeAttr(pointer, "id");
            dojo.place(pointer, document.body);
            dojo.style(pointer, { top: e.pageY + 2 + "px", left: e.pageX + 2 + "px", display: "inline-block" });
            dojo.fadeOut({
                node: pointer,
                duration: XUICache.Host.pointer_trail_timeout,
                onEnd: function() {
                    dojo.destroy(pointer);
                }
            }).play();
        }
    },

    _onKeyDown: function(event) {
        if (event.keyCode == 16) {
            XUtils.publish(XenConstants.TopicTypes.UI_SHIFTKEY_DOWN);
        }
    },

    _onKeyUp: function(event) {
        if (event.keyCode == 16) {
            XUtils.publish(XenConstants.TopicTypes.UI_SHIFTKEY_UP);
        }
    },

    _onBlur: function(event) {
        XUtils.publish(XenConstants.TopicTypes.UI_SHIFTKEY_UP);
    },

    _setupChild: function(child){
        this.inherited(arguments);
        if (child.region == "center") {
            this.wallpaperNode = dojo.create("img", { className: "wallpaper" }, child.domNode, "first");
        }
    },

    _updateWallpaper: function() {
        if (this.wallpaperNode) {
            this.wallpaperNode.src = XUICache.Host.getWallpaper();
        }
        if(this.badgeNodes.length == 0 && this.wallpaperNode && XUICache.Host.branding_badges.length > 0) {
            for(var badge in XUICache.Host.branding_badges) {
                if(XUICache.Host.branding_badges.hasOwnProperty(badge) && badge != "length") {
                    this.badgeNodes.push[dojo.create("img", { className: "badge {0}".format(badge.toLowerCase()), src: XUICache.Host.branding_badges[badge] }, this.wallpaperNode.parentNode, 1)];
                }
            }
        }
    },

    _updateContainers: function() {
        var vmsExist = (Object.keys(XUICache.VMs).length > 0);
        this._setClass(".vms", "hiddenContainer", !vmsExist);
        this._setClass(".zeroVMs", "hiddenContainer", vmsExist);
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._updateWallpaper();
                break;
            }
            case XenConstants.TopicTypes.UI_VMS_LOADED: {
                this._updateContainers();
                this._updateNative();
                break;
            }
            case XenConstants.TopicTypes.UI_VM_CREATED:
            case XenConstants.TopicTypes.UI_VM_DELETED: {
                this._updateContainers();
                break;
            }
            case XenConstants.TopicTypes.UI_SHOW_WAIT: {
                this.showWait(message.data);
                break;
            }
            case XenConstants.TopicTypes.UI_HIDE_WAIT: {
                this.hideWait(message.data);
                break;
            }
            case "update_state_change": {
                // An update is being applied
                var state = message.data[0].toString();
                if (state == XenConstants.UpdateStates.APPLYING) {
                    this.showUpdate();
                } else if (state == XenConstants.UpdateStates.FAILED) {
                    this.hideUpdate();
                }
                break;
            }
        }
    }
});
});