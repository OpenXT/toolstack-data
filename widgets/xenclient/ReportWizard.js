define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/ReportWizard",
    "dojo/text!citrix/xenclient/templates/ReportWizard.html",
    // Mixins
    "citrix/xenclient/_Wizard",
    // Required in template
    "citrix/common/WizardContainer",
    "citrix/common/WizardPage",
    "citrix/common/CheckBox",
    "citrix/common/ValidationTextBox",
    "citrix/common/ValidationTextarea",
    "citrix/common/ProgressBar",
    "citrix/common/WizardNavigator"
],
function(dojo, declare, reportWizardNls, template, _wizard) {
return declare("citrix.xenclient.ReportWizard", [_wizard], {

    templateString: template,

    wizardId: "ReportWizard",

    postMixInProperties: function() {
        dojo.mixin(this, reportWizardNls);

        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);

        this.generationPage.onStartFunction = dojo.hitch(this, this._onGenerationPageStart);
        this.generationPage.onNextFunction = dojo.hitch(this, this._onGenerationPageNext);
        this.finishPage.onStartFunction = dojo.hitch(this, this._onFinishPageStart);
    },

    startup: function() {
        this.inherited(arguments);

        this.navigationNode.set("finishLabel", this.CLOSE_ACTION);
        this._setDisplay(this.generatingReport, false);

        function statusToolProgress(info) {
            if(info && info.type == "progress" && info.data && info.data.length > 0 && this.progressNode.get("value") != info.data[0]) {
                this.progressNode.set("value", info.data[0]);
            }
        }

        this.subscribe("com.citrix.xenclient.status_tool", statusToolProgress);
    },

    onExecute: function() {
        XUICache.Host.showStatusReport(false);
        this.inherited(arguments);
    },

    onCancel: function() {
        XUICache.Host.showStatusReport(false);
        this.inherited(arguments);
    },

    _errors: function(error) {
        XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        this._setVisible(this.navigationNode, true);
        this._setDisplay(this.generatingReport, false);
        this.progressNode.set("value", 0);
        this.set("canCancel", true);
        this.set("canExecute", true);
    },

    _onGenerationPageStart: function() {
        this._setDisplay(this.generatingReport, false);
    },

    _onGenerationPageNext: function(finish) {
        var results = this.unbind();

        this._setDisplay(this.generatingReport, true);
        this._setVisible(this.navigationNode, false);
        this.set("canCancel", false);
        this.set("canExecute", false);

        function generate() {

            var screenshots = results.includeVMScreens.length > 0;
            var guest_info = results.includeVMs.length > 0;
            var summary = results.summary;
            var description = results.description;
            var repro_steps = results.steps;
            var ticket = results.number;

            function success(name) {
                var reportName = name.match("[^//]*$");
                this.reportName.innerHTML = this.REPORT_CREATED.format(reportName);
                this._setDisplay(this.generatingReport, false);
                this._setDisplay(this.navigationNode.cancelButton, false);
                this._setVisible(this.navigationNode, true);
                this.set("canExecute", true);
                this.set("canCancel", false);
                this.wizard.selectChild(this.finishPage);
            }

            XUICache.Host.createStatusReport(screenshots, guest_info, summary, description, repro_steps, ticket, dojo.hitch(this, success), dojo.hitch(this, this._errors));
        }

        generate.call(this);
    },

    _onFinishPageStart: function() {
        var startServer = false;
        this.serveReport.innerHTML = this.SERVE_REPORT.format("http://10.80.249.109:5000", "http://172.16.25.1:5000");
        this._setDisplay(this.stopServer, startServer);
        this._setDisplay(this.serveReport, startServer);
        this._setDisplay(this.reportFinish, !startServer);
    }
});
});