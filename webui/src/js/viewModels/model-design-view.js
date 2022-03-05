/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'utils/i18n', 'knockout', 'models/wkt-project', 'utils/url-catalog', 'utils/wkt-logger',
  'wrc-frontend/core/parsers/yaml', 'wrc-frontend/integration/viewModels/utils','wdt-model-designer/loader',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout'],
function(accUtils, i18n, ko, project, urlCatalog, wktLogger, YamlParser, ViewModelUtils) {
  function ModelDesignViewModel() {

    let subscriptions = [];
    this.project = project;
    this.i18n = i18n;
    this.designer = undefined;
    this.dataProvider = {};
    this.disableStartButton = ko.observable(false);

    this.connected = () => {
      accUtils.announce('Model design view loaded.', 'assertive');
      subscriptions.push(this.project.wdtModel.internal.wlRemoteConsolePort.subscribe((newValue) => {
        wktLogger.debug('Model Design View got event for Remote Console backend port change to %s', newValue);
        this.showWdtModelDesigner(newValue, this);
      }, this));

      // eslint-disable-next-line no-unused-vars
      subscriptions.push(this.project.wdtModel.modelContent.subscribe((newValue) => {
        wktLogger.debug('Model Design View got event for Model contents changed');

        if (this.designer) {
          // FIXME - There doesn't seem to be a way to update the data of the data provider.
          //         Please fix this accordingly and delete this comment...
          //
        }
      }, this));

      // The subscription won't trigger if the backend port has already been set so handle it here.
      //
      const port = this.project.wdtModel.internal.wlRemoteConsolePort();
      if (typeof port !== 'undefined') {
        wktLogger.debug('direct connected: port=%s', port);

        // FIXME - There seems to be a race condition where the JET component does not seem to
        //         be fully loaded by the time we get to this point.  Working around it for now...
        //
        setTimeout( () => {
          this.showWdtModelDesigner(port);
        }, 1000);
      }
    };

    this.disconnected = function() {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });

      if (this.designer) {
        this.designer.deactivateProvider(self.dataProvider);
      }
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-${labelId}`, payload);
    };

    this.isLinux = () => {
      return window.api.process.isLinux();
    };

    this.showWdtModelDesigner = (backendPort) => {
      wktLogger.info('showWdtModelDesigner using backendPort %s', backendPort);
      if (!backendPort) {
        return;
      }

      self.designer = document.getElementById('WdtModelDesigner');

      // We cannot use <oj-bind-if> to control the visibility of
      // the <wdt-model-designer> JET composite, because it prevents
      // JET from fully baking a JET composite. Being "half-baked"
      // means that the JET composite exists, but custom methods
      // on it are not callable, because of the <oj-bind-if>. So,
      // the wdt-model-designer JET composite has a visible property
      // that controls it's visibility. The default value for that
      // property is false.
      //
      self.designer.visible = this.showRemoteConsoleComponent();
      self.designer.setBackendUrlPort(backendPort);

      // ResizeObserver needs to be set on the parent element
      // of the <wdt-model-designer> tag.
      //
      const parentElement = self.designer.parentElement;
      new ResizeObserver(() => {
        self.designer.resize();
      }).observe(parentElement);

      // TODO - Do we need to use the Remote Console parser or can we just use js-yaml?
      //
      const providerOptions = this.getRemoteConsoleProviderOptions();
      YamlParser.parse(providerOptions.fileContents).then(data => {
        self.designer.createProvider(providerOptions.name, data);
      }).catch(err => {
        ViewModelUtils.failureResponseDefaultHandling(err);
      });
    };

    // We need to support several use cases:
    //
    //  UC-1: User clicks "Design View" tab, but no WKT project has been loaded.
    //  UC-2: User clicks "Design View" tab with a WKT project loaded, but the model editor is empty.
    //  UC-3: User clicks "Design View" tab with a WKT project loaded, and the model editor is not empty.
    //
    // The project.wdtModel.modelContent knockout observable is used to determine the use case. The latest value
    // of that observable is used to create (and activate) WDT Model File provider session, in the WRC backend.
    //
    this.getRemoteConsoleProviderOptions = () => {
      const providerOptions = {
        fileContents: this.project.wdtModel.modelContent()
      };

      if (!providerOptions.fileContents) {
        const modelTemplates = self.designer.getProperty('modelTemplate');
        providerOptions.fileContents = modelTemplates.sparse;
      }

      // A name is needed to create a WDT Model File provider.
      //
      providerOptions['name'] = this.project.wdtModel.getDefaultModelFile();
      return providerOptions;
    };

    // Triggered when WDT Model File provider has been activated with the WRC backend.
    //
    this.providerActivated = (event) => {
      self.dataProvider = event.detail.value;
      self.designer.selectLastVisitedSlice();
    };

    // Triggered when changes have been downloaded from the WRC backend, for the active WDT Model File provider.
    //
    this.changesAutoDownloaded = (event) => {
      self.project.wdtModel.modelContent(event.detail.value);
    };

    // Triggered when WDT Model File provider has been deactivated with the WRC backend.
    //
    this.providerDeactivated = (event) => {
      const result = event.detail.value;
      delete result.data;
      self.dataProvider = {state: 'disconnected'};
    };

    // Triggered when WDT Model Designer has lost its connection to the WRC backend.
    //
    this.connectionLostRefused  = (event) => {
      wktLogger.debug('connectionLostRefused: backendUrl=%s', event.detail.value);
      if (self.designer) {
        self.designer.visible = false;
      }
      self.project.wdtModel.internal.wlRemoteConsolePort(undefined);
    };

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

    this.showRemoteConsoleComponent = () => {
      return !!project.wdtModel.internal.wlRemoteConsolePort();
    };

    this.chooseWebLogicRemoteConsoleAppImage = async () => {
      const rcHome = await window.api.ipc.invoke('get-wrc-app-image');
      if (rcHome) {
        this.project.wdtModel.internal.wlRemoteConsoleHome.observable(rcHome);
      }
    };

    this.startWebLogicRemoteConsole = async () => {
      const rcHome = this.project.wdtModel.internal.wlRemoteConsoleHome.observable();
      // Set cursor to BUSY and let the designer set it back to default.
      //
      document.querySelector('oj-button#start-wrc-button span').style.cursor = 'wait';
      return window.api.ipc.invoke('wrc-set-home-and-start', rcHome);
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelDesignViewModel;
});
