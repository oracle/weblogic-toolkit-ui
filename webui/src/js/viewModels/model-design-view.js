/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
 define(['accUtils', 'utils/i18n', 'knockout', 'models/wkt-project', 'utils/url-catalog', 
 'ojs/ojcontext', 'wrc-frontend/core/parsers/yaml', 
 'wdt-model-builder/loader', 'utils/wkt-logger', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout'],
function(accUtils, i18n, ko, project, urlCatalog, Context, YamlParser) {
 function ModelDesignViewModel() {
   const self = this;

   this.project = project;
   this.builder = undefined;
   this.dataProvider = {};

   this.connected = function() {
     accUtils.announce('Model design view loaded.', 'assertive');
     // Implement further logic if needed
     const ele = document.querySelector('.wkt-model-edit-design'); 
     Context.getContext(ele).getBusyContext().whenReady()
       .then(() => {
         const urlPort = this.project.wdtModel.internal.wlRemoteConsolePort();
         if (typeof urlPort === 'undefined') {
           return;
         }
         // Wait until we're first inserted into the DOM, 
         // to create our module-scoped instance of the 
         // builder. We'll be using that to interact with 
         // the builder, programmatically.
         this.builder = document.getElementById('WdtModelBuilder');
         // The first priority is to set the port the
         // cbe-data-manager uses when making REST calls to
         // the backend.
         this.builder.setBackendUrlPort(urlPort);
         // ResizeIbservar needs to be set on the parent 
         // element of the <wdt-model-builder> tag.
         const parentElement = this.builder.parentElement;
         new ResizeObserver(() => {
           this.builder.resize();
         }).observe(parentElement);

         // We need to support several use cases:
         // 
         //  UC-1: User clicks "Design View" tab, but no WKT project
         //    has been loaded.
         //  UC-2: User clicks "Design View" tab with a WKT project
         //    loaded, but the editor (on the "Code View" tab)
         //    is empty.
         //  UC-3: User clicks "Design View" tab with a WKT project
         //    loaded, and the editor (on the "Code View" tab)
         //    is not empty.
         //
         // The project.wdtModel.modelContent knockout observable is
         // used to determine the use case. The latest value of that
         // observable is used to create (and activate) WDT Model File 
         // provider session, in the WRC-CBE.
         const providerOptions = {
           fileContents: project.wdtModel.modelContent()
         };

         // A string representation of the model contents is required, 
         // in order to create a WDT Model File provider.

         if (!providerOptions.fileContents || providerOptions.fileContents === '') {
           // There is nothing assigned to the modelContext observable, 
           // so we need to use the builder's modelTemplate property
           // to populate the fileContents variable.
           const modelTemplates = self.builder.getProperty('modelTemplate');
           // The demo just uses the "sparse" model template.
           providerOptions.fileContents = modelTemplates.sparse;
         }

         // A unique name for the string representation of the model
         // contents is required, in order to create a WDT Model File 
         // provider. It looks like project.wdtModel.getDefaultModelFile() 
         // returns 'models/model.yaml', for UC-1 and US-2. Otherwise, it 
         // looks like it returns the following concatenated string:
         //
         //    <project-name>-models/model.yaml
         //
         // Both are non-empty strings, which is really the only requirement.
         // The WRC-CBE doesn't care if the name is unique or not, because 
         // the name is not the key. The WRC-CFE enforces name uniqueness so 
         // prevent the end-user from thinking that the Kiosk has duplicates.
         // Net, net we get the name by making on a WKT-UI module, so the name
         // being used is completely up to the WKT-UI.
         providerOptions['name'] = project.wdtModel.getDefaultModelFile();

         // The WRC Frontend JET Pack includes a YamlParser and 
         // JsonParser module. For the demo, fileContents is YAML, 
         // so the YamlParser module is used.
         YamlParser.parse(providerOptions.fileContents)
           .then(data => {
             // Use promise fulfillment value for second argument
             // of the builder's createProvider() method. The newly
             // created (and activated) provider, needs to be captured
             // in your event listener for the "providerActivated" 
             // custom event.
             self.builder.createProvider(providerOptions.name, data);
           });
       });
   }.bind(this);

   this.disconnected = function() {
     if (typeof self.builder !== 'undefined') {
       self.builder.deactivateProvider(self.dataProvider);
     }
   }.bind(this);

   /**
   * @param {CustomEvent} event - Triggered when WDT Model File provider has been activated with the WRC-CBE.
   */
   this.providerActivated = (event) => {
     self.dataProvider = event.detail.value;
     self.builder.selectLastVisitedSlice();
   };

   /**
   * @param {CustomEvent} event - Triggered when changes have been downloaded from the WRC-CBE, for the active WDT Model File provider.
   */
   this.changesAutoDownloaded = (event) => {
     project.wdtModel.modelContent(event.detail.value);
   };

   /**
   * @param {CustomEvent} event - Triggered when WDT Model File provider has been deactivated with the WRC-CBE.
   */
   this.providerDeactivated = (event) => {
     const result = event.detail.value;
     delete result.data;
     self.dataProvider = {state: 'disconnected'};
   };

   this.labelMapper = (labelId, payload) => {
     return i18n.t(`model-design-${labelId}`, payload);
   };

   this.isLinux = () => {
     return window.api.process.isLinux();
   };

   this.i18n = i18n;

   this.disableStartButton = ko.observable(false);

   const wrcInitialText = this.labelMapper('wrc-install-description');
   const wrcInstallLocation = '<a href=' +
     urlCatalog.getUrl('model', 'weblogicRemoteConsoleLatestRelease') + '>' +
     this.labelMapper('wrc-link-text') + '</a>';
   const wrcInstallParagraph = this.labelMapper('wrc-install-location-prefix') + ' ' + wrcInstallLocation +
   ' ' + this.labelMapper('wrc-install-location-postfix');
   const wrcStartParagraph = this.labelMapper('wrc-start-description');
   this.wrcInstallInstructions = wrcInitialText + '</p><p>' + wrcInstallParagraph + '</p><p>' + wrcStartParagraph;

   this.showRemoteConsoleConfigForm = () => {
     return !project.wdtModel.internal.wlRemoteConsolePort();
   };

   this.showRemoteConsoleComponent = () => {
     return !!project.wdtModel.internal.wlRemoteConsolePort();
   };

   this.getWebLogicRemoteConsoleHomeHelpText = () => {
     let helpKey;
     if (window.api.process.isMac()) {
       helpKey = 'user-settings-dialog-wrc-home-macos-help';
     } else if (window.api.process.isWindows()) {
       helpKey = 'user-settings-dialog-wrc-home-windows-help';
     } else {
       helpKey = 'user-settings-dialog-wrc-home-linux-help';
     }
     return i18n.t(helpKey);
   };

   this.chooseWebLogicRemoteConsoleHomeDirectory = async () => {
     const rcHome = await window.api.ipc.invoke('get-wrc-home-directory');
     if (rcHome) {
       this.project.wdtModel.internal.wlRemoteConsoleHome.observable(rcHome);
     }
   };

   this.chooseWebLogicRemoteConsoleAppImage = async () => {
     const rcHome = await window.api.ipc.invoke('get-wrc-app-image');
     if (rcHome) {
       this.project.wdtModel.internal.wlRemoteConsoleHome.observable(rcHome);
     }
   };

   this.startWebLogicRemoteConsole = async () => {
     const rcHome = this.project.wdtModel.internal.wlRemoteConsoleHome.observable();
     // TODO - do we need a busy dialog?
     return window.api.ipc.invoke('wrc-set-home-and-start', rcHome);
   };
 }

 /*
  * Returns a constructor for the ViewModel.
  */
 return ModelDesignViewModel;
});
