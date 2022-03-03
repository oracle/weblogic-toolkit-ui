/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */

define(['accUtils', 'utils/i18n', 'knockout', 'models/wkt-project', 'utils/url-catalog', 'utils/wkt-logger', 'wrc-frontend/core/parsers/yaml', 'wrc-frontend/integration/viewModels/utils',
        'wdt-model-designer/loader', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout'],
  function(accUtils, i18n, ko, project, urlCatalog, wktLogger, YamlParser, ViewModelUtils) {
    function ModelDesignViewModel() {
      const self = this;

      this.project = project;
      this.designer;
      this.dataProvider = {};

      this.connected = function () {
        accUtils.announce('Model design view loaded.', 'assertive');
        // Set up a change subscription on wlRemoteConsolePort observable,
        // which will primarily be used in the "WRC Not Installed Yet" and
        // "WRC Process Was Killed or Died" use cases.
        this.wlRemoteConsolePortSubscription = project.wdtModel.internal.wlRemoteConsolePort.subscribe((newValue) => {
          wktLogger.debug('connected: newValue=%s', newValue); 
          showWdtModelDesigner(newValue);
        });
        // Get WRC backend port, asynchronously
        window.api.ipc.invoke('get-wrc-port')
          .then(backendPort => {
            if (backendPort !== project.wdtModel.internal.wlRemoteConsolePort()) {
              // Trigger the change subscription
              project.wdtModel.internal.wlRemoteConsolePort(backendPort);
            } else {
              // Call showWdtModelDesigner directly
              showWdtModelDesigner(backendPort);
            }
          })
          .catch(err => {
            ViewModelUtils.failureResponseDefaultHandling(err);
          });
      };

      this.disconnected = function() {
        self.wlRemoteConsolePortSubscription.dispose();
        if (self.designer) {
          self.designer.deactivateProvider(self.dataProvider);
        }
      };

      function showWdtModelDesigner(backendPort) {
        wktLogger.info('showWdtModelDesigner: backendPort=%s', backendPort); 
        if (!backendPort) {
          return;
        }
        // Lookup designer in the DOM, because we mainly need to
        // interact with it programmatically.
        self.designer = document.getElementById('WdtModelDesigner');
        // We cannot use <oj-bind-if> to control the visibility of
        // the <wdt-model-designer> JET composite, because it prevents
        // JET from fully baking a JET composite. Being "half-baked"
        // means that the JET composite exists, but custom methods
        // on it are not callable, because of the <oj-bind-if>. So,
        // the wdt-model-designer JET composite has a visible property
        // that controls it's visibility. The default value for that 
        // property is false.
        self.designer.visible = self.showRemoteConsoleComponent();
        // Tell designer the port, so it can construct the backend
        // URL it's internal module(s) uses when making REST calls
        // to the WRC backend.
        self.designer.setBackendUrlPort(backendPort);
        // ResizeObserver needs to be set on the parent element
        // of the <wdt-model-designer> tag.
        const parentElement = self.designer.parentElement;
        new ResizeObserver(() => {
          self.designer.resize();
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
        // provider session, in the WRC backend.
        const providerOptions = {
          fileContents: project.wdtModel.modelContent()
        };

        // A string representation of the model contents is required, 
        // in order to create a WDT Model File provider.

        if (!providerOptions.fileContents || providerOptions.fileContents === '') {
          // There is nothing assigned to the modelContext observable, 
          // so we need to use the designer's modelTemplate property
          // to populate the fileContents variable.
          const modelTemplates = self.designer.getProperty('modelTemplate');
          // The demo just uses the "sparse" model template.
          providerOptions.fileContents = modelTemplates.sparse;
        }

        // A name is needed to create a WDT Model File provider. It looks like 
        // project.wdtModel.getDefaultModelFile() returns 'models/model.yaml', 
        // for UC-1 and US-2. Otherwise, it looks like it returns the following 
        // concatenated string:
        //
        //    <project-name>-models/model.yaml
        //
        // We'll use that call to get the name, for now. 
        providerOptions['name'] = project.wdtModel.getDefaultModelFile();
        // The WRC JET Pack includes a YamlParser and JsonParser module. For the 
        // demo, fileContents is YAML, so the YamlParser module is used.
        YamlParser.parse(providerOptions.fileContents)
          .then(data => {
            // Use promise fulfillment value for second argument of the
            // designer's createProvider() method. The newly created
            // (and activated) provider, needs to be captured in your
            // event listener for the "providerActivated" custom event.
            self.designer.createProvider(providerOptions.name, data);
          })
          .catch(err => {
            ViewModelUtils.failureResponseDefaultHandling(err);
          });
      }

      /**
      * @param {CustomEvent} event - Triggered when WDT Model File provider has been activated with the WRC backend.
      */
      this.providerActivated = (event) => {
        self.dataProvider = event.detail.value;
        self.designer.selectLastVisitedSlice();
      };

      /**
      * @param {CustomEvent} event - Triggered when changes have been downloaded from the WRC backend, for the active WDT Model File provider.
      */
      this.changesAutoDownloaded = (event) => {
        project.wdtModel.modelContent(event.detail.value);
      };

      /**
      * @param {CustomEvent} event - Triggered when WDT Model File provider has been deactivated with the WRC backend.
      */
      this.providerDeactivated = (event) => {
        const result = event.detail.value;
        delete result.data;
        self.dataProvider = {state: 'disconnected'};
      };

      /**
      * @param {CustomEvent} event - Triggered when WDT Model Designer has lost it's connection to the WRC backend.
      */
      this.connectionLostRefused  = (event) => {
        wktLogger.debug('connectionLostRefused: backendUrl=%s', event.detail.value);
        if (self.designer) self.designer.visible = false;
        project.wdtModel.internal.wlRemoteConsolePort(undefined);
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
        // Set cursor to BUSY and let self.designer
        // set it back to default
        document.querySelector('oj-button#start-wrc-button span').style.cursor = 'wait';
        return window.api.ipc.invoke('wrc-set-home-and-start', rcHome)
          .then(() => {
            return window.api.ipc.invoke('get-wrc-port');
          })
          .then(backendPort => {
            if (self.designer) self.designer.setBackendUrlPort(backendPort);
            // Trigger the change subscription
            project.wdtModel.internal.wlRemoteConsolePort(backendPort);
          });
      };
    }

    /*
    * Returns a constructor for the ViewModel.
    */
    return ModelDesignViewModel;
  }
);
