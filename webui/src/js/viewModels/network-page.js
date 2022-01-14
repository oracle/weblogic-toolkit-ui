/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project',
  'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojformlayout', 'ojs/ojinputnumber'],
function(accUtils, ko, i18n, project) {
  function NetworkPageViewModel() {

    this.connected = () => {
      accUtils.announce('Network page loaded.', 'assertive');

      window.api.ipc.invoke('get-network-settings')
        .then(settings => {
          this.proxyUrl(settings.proxyUrl);
          this.bypassProxyHosts(settings.bypassHosts);

          let timeoutSeconds = settings.timeout / 1000;
          if (timeoutSeconds < 1) {
            timeoutSeconds = 1;
          }
          this.requestTimeoutSeconds(timeoutSeconds);
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
    this.requestTimeoutSeconds = ko.observable(5);
    this.connectOk = ko.observable(false);
    this.tryMessage = ko.observable();

    this.topMessage = ko.computed(() => {
      const messageKey = this.connectOk() ? 'proceed' : 'warning';
      return this.labelMapper(messageKey);
    }, this);

    this.topClass = ko.computed(() => {
      return this.connectOk() ? 'wkt-proceed' : 'wkt-warning';
    }, this);

    this.tryConnect = () => {
      this.tryMessage(this.labelMapper('trying'));

      const settings = {
        proxyUrl: this.proxyUrl(),
        bypassHosts: this.bypassProxyHosts(),
        timeout: this.requestTimeoutSeconds() * 1000
      };

      window.api.ipc.invoke('try-network-settings', settings).then(success => {
        const messageKey = success ? 'try-success' : 'try-failure';
        this.tryMessage(this.labelMapper(messageKey));
        this.connectOk(success);
      });
    };

    this.restartApp = () => {
      const settings = {
        proxyUrl: this.proxyUrl(),
        bypassHosts: this.bypassProxyHosts(),
        timeout: this.requestTimeoutSeconds() * 1000
      };

      // this will restart the app with success or failure, so no need to close.
      window.api.ipc.invoke('restart-network-settings', settings).then();
    };

    this.exitApp = () => {
      window.api.ipc.invoke('exit-app').then();
    };
  }

  return NetworkPageViewModel;
});
