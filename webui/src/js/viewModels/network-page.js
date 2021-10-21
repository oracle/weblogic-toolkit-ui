/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project',
  'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojformlayout'],
function(accUtils, ko, i18n, project) {
  function NetworkPageViewModel() {

    this.connected = () => {
      accUtils.announce('Network page loaded.', 'assertive');

      window.api.ipc.invoke('get-network-settings')
        .then(settings => {
          this.proxyUrl(settings.proxyUrl);
          this.bypassProxyHosts(settings.bypassHosts);
        });
    };

    this.project = project;

    this.labelMapper = (labelId) => {
      return i18n.t(`network-page-${labelId}`);
    };

    this.settingsLabelMapper = (labelId) => {
      return i18n.t(`user-settings-dialog-${labelId}`);
    };

    this.proxyUrl = ko.observable();
    this.bypassProxyHosts = ko.observable();

    this.tryConnect = () => {
      const settings = {
        proxyUrl: this.proxyUrl(),
        bypassHosts: this.bypassProxyHosts()
      };

      // this will restart the app with success or failure, so no need to close.
      window.api.ipc.invoke('try-network-settings', settings).then();
    };

    this.exitApp = () => {
      window.api.ipc.invoke('exit-app').then();
    };
  }

  return NetworkPageViewModel;
});
