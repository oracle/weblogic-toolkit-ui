/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/observable-properties', 'utils/i18n', 'ojs/ojarraydataprovider', 'models/wkt-project',
  'utils/wkt-logger', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout',
  'ojs/ojswitch', 'ojs/ojselectsingle', 'ojs/ojvalidationgroup'],
function(accUtils, ko, utils, i18n, ArrayDataProvider, project, wktLogger) {
  function UserSettingsDialogModel(payload) {

    this.connected = () => {
      accUtils.announce('Discover dialog loaded.', 'assertive');
      this.loadUserSettings();
    };

    this.i18n = i18n;

    this.labelMapper = (labelId) => {
      return i18n.t(`user-settings-dialog-${labelId}`);
    };

    this.userSettings = {};
    try {
      this.userSettings = JSON.parse(payload['userSettingsJson']);
    } catch (err) {
      wktLogger.error(`Failed to deserialize the user settings json: ${err}`);
    }

    this.logLevels = [
      { key: 'error', label: i18n.t('user-settings-dialog-log-level-error') },
      { key: 'warn', label: i18n.t('user-settings-dialog-log-level-warn') },
      { key: 'info', label: i18n.t('user-settings-dialog-log-level-info') },
      { key: 'debug', label: i18n.t('user-settings-dialog-log-level-debug') }
    ];
    this.logLevelsDP = new ArrayDataProvider(this.logLevels, {keyAttributes: 'key'});

    this.isDevMode = () => {
      return payload.isDevMode;
    };

    this.proxyUrl = ko.observable();
    this.bypassProxyHosts = ko.observable();
    this.consoleLogLevel = ko.observable(payload.defaults.level);
    this.fileLogLevel = ko.observable(payload.defaults.level);
    this.fileLogDir = ko.observable(payload.defaults.logDir);
    this.skipQuickstart = ko.observable(false);

    this.loadUserSettings = () => {
      if ('proxy' in this.userSettings) {
        if ('httpsProxyUrl' in this.userSettings.proxy) {
          this.proxyUrl(this.userSettings.proxy.httpsProxyUrl);
        }
        if ('bypassProxyHosts' in this.userSettings.proxy) {
          this.bypassProxyHosts(this.userSettings.proxy.bypassProxyHosts);
        }
      }

      if ('logging' in this.userSettings) {
        if ('file' in this.userSettings.logging) {
          if ('level' in this.userSettings.logging.file) {
            this.fileLogLevel(this.userSettings.logging.file.level);
          }
          if ('logDir' in this.userSettings.logging.file) {
            this.fileLogDir(this.userSettings.logging.file.logDir);
          }
        }
        if ('console' in this.userSettings.logging) {
          if ('level' in this.userSettings.logging.console) {
            this.consoleLogLevel(this.userSettings.logging.console.level);
          }
        }
      }

      if ('skipQuickstartAtStartup' in this.userSettings) {
        this.skipQuickstart(this.userSettings.skipQuickstartAtStartup);
      }
    };

    this.chooseLogFileDir = async () => {
      this.fileLogDir(await window.api.ipc.invoke('get-log-file-directory-location'));
    };

    this.storeUserSettings = () => {
      project.setHttpsProxyUrl(this.proxyUrl());
      project.setBypassProxyHosts(this.bypassProxyHosts());
      this._storeSetting('proxy.httpsProxyUrl', this.proxyUrl);
      this._storeSetting('proxy.bypassProxyHosts', this.bypassProxyHosts);
      this._storeSetting('logging.file.level', this.fileLogLevel, payload.defaults.level);
      this._storeSetting('logging.file.logDir', this.fileLogDir, payload.defaults.level);
      this._storeSetting('logging.console.level', this.consoleLogLevel, payload.defaults.level);
      this._storeSetting('skipQuickstartAtStartup', this.skipQuickstart, false);
    };

    this._storeSetting = (key, observable, defaultValue) => {
      const keyPath = key.split('.');
      if (defaultValue === undefined || defaultValue !== observable()) {

        let currentObj = this.userSettings;
        for (let i = 0; i < keyPath.length - 1; i++) {
          if (!(keyPath[i] in currentObj)) {
            currentObj[keyPath[i]] = {};
          }
          currentObj = currentObj[keyPath[i]];
        }
        currentObj[keyPath[keyPath.length - 1]] = observable();
      } else if (defaultValue === observable()) {
        let foundPath = true;
        let currentObj = this.userSettings;
        for (let i = 0; i < keyPath.length - 1; i++) {
          if (!(keyPath[i] in currentObj)) {
            foundPath = false;
            break;
          }
          currentObj = currentObj[keyPath[i]];
        }
        if (foundPath && keyPath[keyPath.length - 1] in currentObj) {
          delete currentObj[keyPath[keyPath.length - 1]];
        }
      }
    };

    this.saveSettings = async () => {
      $('#userSettingsDialog')[0].close();
      this.storeUserSettings();
      const userSettingsJson = JSON.stringify(this.userSettings);
      await window.api.ipc.invoke('save-user-settings', userSettingsJson).then();
    };

    this.cancelSettings = () => {
      $('#userSettingsDialog')[0].close();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return UserSettingsDialogModel;
});
