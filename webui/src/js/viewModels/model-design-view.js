/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'utils/i18n', 'knockout', 'models/wkt-project', 'utils/url-catalog', 'utils/view-helper',
  'utils/wkt-logger', 'wrc-frontend/integration/viewModels/utils', 'wdt-model-designer/loader',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout'],
function(accUtils, i18n, ko, project, urlCatalog, viewHelper, wktLogger, ViewModelUtils) {
  function ModelDesignViewModel() {

    let subscriptions = [];
    this.project = project;
    this.i18n = i18n;
    this.designer = undefined;
    this.dataProvider = {};
    this.disableStartButton = ko.observable(false);
    this.wrcBackendTriggerChange = false;

    this.connected = () => {
      accUtils.announce('Model design view loaded.', 'assertive');
      this.designer = document.getElementById('WdtModelDesigner');

      subscriptions.push(this.project.wdtModel.internal.wlRemoteConsolePort.subscribe((newValue) => {
        wktLogger.debug('Model Design View got event for Remote Console backend port change to %s', newValue);
        this.showWdtModelDesigner(newValue, this.designer);
      }, this));

      subscriptions.push(this.project.wdtModel.modelContent.subscribe(() => {
        wktLogger.debug('Model Design View got event for Model contents changed');

        if (this.designer) {
          if (this.wrcBackendTriggerChange) {
            this.wrcBackendTriggerChange = false;
          } else {
            this.createRemoteConsoleProvider(this.designer, true);
          }
        }
      }, this));

      // The subscription won't trigger if the backend port has already been set so handle it here.
      //
      const port = this.project.wdtModel.internal.wlRemoteConsolePort();
      if (typeof port !== 'undefined') {
        wktLogger.debug('direct connected: port=%s', port);

        if (this.designer) {
          viewHelper.componentReady(this.designer).then(() => {
            this.showWdtModelDesigner(port, this.designer);
            this.designer.addEventListener('archiveUpdated', this.archiveUpdated);
          });
        }
      }

      viewHelper.addEventListenerToRootElement('searchModel', this.handleSearchModelEvent);
    };

    this.disconnected = function() {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });

      if (this.designer) {
        wktLogger.debug('disconnected() dataProvider = %s', JSON.stringify(this.dataProvider));
        this.designer.deactivateProvider(this.dataProvider);
        this.designer.removeEventListener('archiveUpdated', this.archiveUpdated);
      }

      viewHelper.removeEventListenerFromRootElement('searchModel', this.handleSearchModelEvent);
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-${labelId}`, payload);
    };

    this.isLinux = () => {
      return window.api.process.isLinux();
    };

    this.showWdtModelDesigner = (backendPort, wdtModelDesigner) => {
      wktLogger.info('showWdtModelDesigner using backendPort %s', backendPort);
      if (!backendPort) {
        if (wdtModelDesigner) {
          wdtModelDesigner.visible = false;
        }
        return;
      }

      if (!wdtModelDesigner) {
        return;
      }

      // We cannot use <oj-bind-if> to control the visibility of
      // the <wdt-model-designer> JET composite, because it prevents
      // JET from fully baking a JET composite. Being "half-baked"
      // means that the JET composite exists, but custom methods
      // on it are not callable, because of the <oj-bind-if>. So,
      // the wdt-model-designer JET composite has a visible property
      // that controls its visibility. The default value for that
      // property is false.
      //
      wdtModelDesigner.visible = this.showRemoteConsoleComponent();
      wdtModelDesigner.setBackendUrlPort(backendPort);

      // ResizeObserver needs to be set on the parent element
      // of the <wdt-model-designer> tag.
      //
      const parentElement = wdtModelDesigner.parentElement;
      new ResizeObserver(() => {
        wdtModelDesigner.resize();
      }).observe(parentElement);

      this.createRemoteConsoleProvider(wdtModelDesigner);
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
        const modelTemplates = this.designer.getProperty('modelTemplate');
        providerOptions.fileContents = modelTemplates.domain;
      }

      // A name is needed to create a WDT Model File provider.
      //
      providerOptions['name'] = this.project.wdtModel.getDefaultModelFile();

        // Set model properties provider option
        providerOptions['modelProperties'] = [...this.project.wdtModel.getModelPropertiesObject().observable()];

        // Set model archive provider option
        providerOptions['modelArchive'] = this.project.wdtModel.archiveRoots;

      return providerOptions;
    };

    this.createRemoteConsoleProvider = (wdtModelDesigner, resetExistingDataProvider = false) => {
      if (!wdtModelDesigner) {
        return;
      }

      if (resetExistingDataProvider) {
        wdtModelDesigner.deactivateProvider(this.dataProvider);
      }

      const providerOptions = this.getRemoteConsoleProviderOptions();
      try {
        wdtModelDesigner.createProvider(providerOptions);
      } catch (err) {
        ViewModelUtils.failureResponseDefaultHandling(err);
      }
    };

    // Triggered when WDT Model File provider has been activated with the WRC backend.
    //
    this.providerActivated = (event) => {
      this.dataProvider = event.detail.value;
      wktLogger.debug('Received providerActivated event with dataProvider = %s', JSON.stringify(this.dataProvider));
      this.designer.selectLastVisitedSlice();
    };

    // Triggered when changes have been downloaded from the WRC backend, for the active WDT Model File provider.
    //
    this.changesAutoDownloaded = (event) => {
      wktLogger.debug('Received changesAutoDownloaded event with modelContent = %s', event.detail.value);
      this.wrcBackendTriggerChange = true;
      this.project.wdtModel.modelContent(event.detail.value);
      if (event.detail.properties) this.project.wdtModel.getModelPropertiesObject().observable(event.detail.properties);
    };

    this.archiveUpdated = (event) => {
      const options = event.detail.options;
      wktLogger.debug('Received archiveUpdated event with options = %s', JSON.stringify(event.detail.options));
      switch (options.operation) {
        case 'add':
          this.project.wdtModel.addArchiveUpdate(options.operation, options.archivePath, options.filePath);
          break;
        case 'remove':
          this.project.wdtModel.addArchiveUpdate(options.operation, options.path);
          break;
      }
    };

    // Triggered when WDT Model File provider has been deactivated with the WRC backend.
    //
    this.providerDeactivated = (event) => {
      const result = event.detail.value;
      wktLogger.debug('Received providerDeactivated event with dataProvider = %s', JSON.stringify(result));
      delete result.data;
      this.dataProvider = {state: 'disconnected'};
    };

    // Triggered when WDT Model Designer has lost its connection to the WRC backend.
    //
    this.connectionLostRefused  = (event) => {
      wktLogger.debug('Received connectionLostRefused event with backendUrl = %s', event.detail.value);
      if (this.designer) {
        this.designer.visible = false;
      }
      // Technically, this should not be needed since the electron side should be pushing this port
      // change to the window when the backend process exits, but it doesn't hurt anything.
      //
      this.project.wdtModel.internal.wlRemoteConsolePort(undefined);
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

    this.handleSearchModelEvent = (event) => {
      const searchModelText = event.detail.value;
      wktLogger.debug('model-design-view received searchModel event: %s', searchModelText);

      // Once the WRC change is available, call the method to pass the search text and return.
      //
      this.designer.search(searchModelText);
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelDesignViewModel;
});
