/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'utils/i18n', 'knockout', 'models/wkt-project', 'utils/url-catalog', 'utils/wkt-logger',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout' ],
function(accUtils, i18n, ko, project, urlCatalog) {
  function ModelDesignViewModel() {

    this.connected = () => {
      accUtils.announce('Model design view loaded.', 'assertive');
      // Implement further logic if needed
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-${labelId}`, payload);
    };

    this.isLinux = () => {
      return window.api.process.isLinux();
    };

    this.project = project;
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
