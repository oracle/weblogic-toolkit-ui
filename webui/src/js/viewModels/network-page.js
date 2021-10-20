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
      console.log('try connect');
    };

    this.exitApp = () => {
      console.log('exit app');
    };
  }

  return NetworkPageViewModel;
});
