/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/observable-properties', 'utils/i18n', 'ojs/ojarraydataprovider',
  'models/wkt-project', 'utils/validation-helper', 'utils/wkt-logger', 'ojs/ojknockout', 'ojs/ojinputtext',
  'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojswitch', 'ojs/ojselectsingle',
  'ojs/ojvalidationgroup', 'ojs/ojinputnumber', 'ojs/ojknockout'],
function(accUtils, ko, utils, i18n, ArrayDataProvider, project, validationHelper, wktLogger) {
  function UserSettingsDialogModel(payload) {

    this.connected = () => {
      accUtils.announce('Discover dialog loaded.', 'assertive');
      this.loadUserSettings();
    };

    this.i18n = i18n;

    this.labelMapper = (labelId) => {
      return i18n.t(`user-settings-dialog-${labelId}`);
    };

    this.isLinux = () => {
      return window.api.process.isLinux();
    };

    this.isLinuxAppImage = () => {
      const result = window.api.process.isLinuxAppImage();
      wktLogger.info(`isLinuxAppImage() returned ${result}`);
      return result;
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

    this.getProxyUrlValidators = () => validationHelper.getProxyUrlValidators();
    this.proxyUrl = ko.observable();
    this.bypassProxyHosts = ko.observable();
    this.gitHubAuthToken = ko.observable();
    this.wktToolsExternalStagingDirectory = ko.observable();
    this.consoleLogLevel = ko.observable(payload.defaults.level);
    this.fileLogLevel = ko.observable(payload.defaults.level);
    this.fileLogDir = ko.observable(payload.defaults.logDir);
    this.connectivityTestTimeoutSeconds = ko.observable(payload.defaults.connectivityTestTimeoutMilliseconds / 1000);
    this.internalConnectivityTestTimeoutMilliseconds = ko.observable(payload.defaults.connectivityTestTimeoutMilliseconds);
    this.skipQuickstart = ko.observable(false);
    this.disableLinuxHardwareAcceleration = ko.observable(false);
    this.wlRemoteConsoleHome = ko.observable();

    this.loadUserSettings = () => {
      if ('proxy' in this.userSettings) {
        if ('httpsProxyUrl' in this.userSettings.proxy) {
          this.proxyUrl(this.userSettings.proxy.httpsProxyUrl);
        }
        if ('bypassProxyHosts' in this.userSettings.proxy) {
          this.bypassProxyHosts(this.userSettings.proxy.bypassProxyHosts);
        }
      }

      if ('gitHubAuthToken' in this.userSettings) {
        this.gitHubAuthToken(this.userSettings.gitHubAuthToken);
      }

      if ('linux' in this.userSettings) {
        if ('disableLinuxHardwareAcceleration' in this.userSettings.linux) {
          this.disableLinuxHardwareAcceleration(this.userSettings.linux.disableLinuxHardwareAcceleration);
        }
      }

      if ('tools' in this.userSettings) {
        if ('wktToolsExternalStagingDirectory' in this.userSettings.tools) {
          this.wktToolsExternalStagingDirectory(this.userSettings.tools.wktToolsExternalStagingDirectory);
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

      if ('connectivityTestTimeoutMilliseconds' in this.userSettings) {
        let timeoutSecs = this.userSettings.connectivityTestTimeoutMilliseconds / 1000;
        if (timeoutSecs < 1) {
          timeoutSecs = 1;
        }
        this.connectivityTestTimeoutSeconds(timeoutSecs);
      }

      if ('skipQuickstartAtStartup' in this.userSettings) {
        this.skipQuickstart(this.userSettings.skipQuickstartAtStartup);
      }

      if ('webLogicRemoteConsoleHome' in this.userSettings) {
        this.wlRemoteConsoleHome(this.userSettings.webLogicRemoteConsoleHome);
      }
    };

    this.chooseExternalToolsStagingDirectory = async () => {
      this.wktToolsExternalStagingDirectory(await window.api.ipc.invoke('get-external-tools-staging-directory-location',
        this.wktToolsExternalStagingDirectory()));
    };

    this.chooseLogFileDir = async () => {
      this.fileLogDir(await window.api.ipc.invoke('get-log-file-directory-location'));
    };

    this.chooseWebLogicRemoteConsoleHomeDirectory = async () => {
      const rcHome = await window.api.ipc.invoke('get-wrc-home-directory');
      if (rcHome) {
        this.wlRemoteConsoleHome(rcHome);
      }
    };

    this.chooseWebLogicRemoteConsoleAppImage = async () => {
      const rcHome = await window.api.ipc.invoke('get-wrc-app-image');
      if (rcHome) {
        this.wlRemoteConsoleHome(rcHome);
      }
    };

    this.getWebLogicRemoteConsoleHomeHelp = () => {
      let helpKey;
      if (window.api.process.isMac()) {
        helpKey = 'wrc-home-macos-help';
      } else if (window.api.process.isWindows()) {
        helpKey = 'wrc-home-windows-help';
      } else {
        helpKey = 'wrc-home-linux-help';
      }
      return this.labelMapper(helpKey);
    };

    this.storeUserSettings = () => {
      project.setHttpsProxyUrl(this.proxyUrl());
      project.setBypassProxyHosts(this.bypassProxyHosts());
      this._storeSetting('gitHubAuthToken', this.gitHubAuthToken);
      this._storeSetting('tools.wktToolsExternalStagingDirectory', this.wktToolsExternalStagingDirectory);
      this._storeSetting('linux.disableLinuxHardwareAcceleration', this.disableLinuxHardwareAcceleration);
      this._storeSetting('proxy.httpsProxyUrl', this.proxyUrl);
      this._storeSetting('proxy.bypassProxyHosts', this.bypassProxyHosts);
      this._storeSetting('logging.file.level', this.fileLogLevel, payload.defaults.level);
      this._storeSetting('logging.file.logDir', this.fileLogDir, payload.defaults.level);
      this._storeSetting('logging.console.level', this.consoleLogLevel, payload.defaults.level);
      if (this.connectivityTestTimeoutSeconds() >= 0) {
        this.internalConnectivityTestTimeoutMilliseconds(this.connectivityTestTimeoutSeconds() * 1000);
        this._storeSetting('connectivityTestTimeoutMilliseconds',
          this.internalConnectivityTestTimeoutMilliseconds, payload.defaults.connectivityTestTimeoutMilliseconds);
      }
      this._storeSetting('skipQuickstartAtStartup', this.skipQuickstart, false);
      this._storeSetting('webLogicRemoteConsoleHome', this.wlRemoteConsoleHome);
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
