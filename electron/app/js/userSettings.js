/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

const { getErrorMessage } = require('./errorUtils');
const CredentialEncryptor = require("./credentialEncryptor");

// eslint-disable-next-line no-unused-vars
const userSettableFieldNames = [
  'gitHubAuthToken',
  'webLogicRemoteConsoleHome',
  'proxy',
  'linux',
  'tools',
  'logging',
  'skipQuickstartAtStartup',
  'connectivityTestTimeoutMilliseconds'
];

const appPrivateFieldNames = [
  'uuid',
  'window',
  'developer'
];

let _userSettingsDirectory;
let _userSettingsFileName;

// This should be treated as a singleton JSON object shared across the entire application.
// However, this singleton gets swapped out at runtime if the user edits their settings
// so the application should NOT hold onto the settings file or its values across invocations.
//
// Here is an example with every possible field specified:
//
// {
//   "uuid": "The unique ID associated with the user's settings file"
//   "gitHubAuthToken": "The GitHub token for the user to allow GitHub API requests to be authenticated."
//   "webLogicRemoteConsoleHome": "The path to the WebLogic Remote Console installation",
//   "proxy": {
//     "httpsProxyUrl": "The proxy to use for the application's all https outbound communication",
//     "bypassProxyHosts: "The value to use to set the NO_PROXY environment variable for child processes"
//   },
//   "tools": {
//     "wktToolsExternalStagingDirectory": "When running the app using the AppImage, the directory where upgraded tools will be installed"
//   },
//   "linux": {
//     "disableHardwareAcceleration": true
//   },
//   "logging":{
//     "level": "the default global log level across all providers",
//     "file": {
//       "level": "the log level for the file transport",
//       "logDir": "the directory where to write the log files"
//     },
//     "console": {
//       "level": "the log level for the console transport"
//     }
//   },
//   "window": {
//     "size": {
//       "width": 1693,
//       "height": 856
//     }
//     "dividers": {
//       "modelMain": 0.68,
//       "modelRight": 0.48
//     },
//     "navCollapsed": true
//   },
//   "developer": {
//     "showNewModelEditorTab": "Whether to show the Model Edit Tab or not"
//   },
//   "skipQuickstartAtStartup": true,
//   "connectivityTestTimeoutMilliseconds": 10000
// }
//
let _userSettingsObject;

function getUserSettingsForRemote() {
  const settings = _getUserSettings();
  return JSON.stringify(_constructFilteredCopy(settings));
}

function applyUserSettingsFromRemote(remoteUserSettingsJson) {
  const { getLogger } = require('./wktLogging');
  const wktLogger = getLogger();

  let remoteUserSettingsObject = JSON.parse(remoteUserSettingsJson);
  verifyRemoteUserSettingsObject(remoteUserSettingsObject);
  const currentSettings = _getUserSettings();
  for (const privateField of appPrivateFieldNames) {
    wktLogger.debug(`privateField = ${privateField}`);
    if (Object.prototype.hasOwnProperty.call(currentSettings, privateField)) {
      wktLogger.debug(`adding private field ${privateField} to new user settings object`);
      remoteUserSettingsObject[privateField] = currentSettings[privateField];
    } else {
      wktLogger.debug(`currentSettings doesn't have private field ${privateField}`);
    }
  }

  if (wktLogger.isDebugEnabled()) {
    wktLogger.debug(`new user settings are: ${JSON.stringify(remoteUserSettingsObject)}`);
  }
  _userSettingsObject = remoteUserSettingsObject;
  saveUserSettings();
  wktLogger.debug('user settings saved...restart the application to pick up logger settings changes');
}

function getGithubAuthToken() {
  let result;
  const userSettingsObj = _getUserSettings();
  if ('gitHubAuthToken' in userSettingsObj) {
    result = userSettingsObj['gitHubAuthToken'];
  }
  return result;
}

function getWebLogicRemoteConsoleHome() {
  let wlRemoteConsoleHome;
  const userSettingsObj = _getUserSettings();
  if ('webLogicRemoteConsoleHome' in userSettingsObj) {
    wlRemoteConsoleHome = userSettingsObj['webLogicRemoteConsoleHome'];
  }
  return wlRemoteConsoleHome;
}

function setWebLogicRemoteConsoleHome(wlRemoteConsoleHome) {
  const settings = _getUserSettings();
  settings['webLogicRemoteConsoleHome'] = wlRemoteConsoleHome;
}

function getHttpsProxyUrl() {
  let httpsProxyUrl;
  const userSettingsObj = _getUserSettings();
  if ('proxy' in userSettingsObj  && 'httpsProxyUrl' in userSettingsObj['proxy']) {
    httpsProxyUrl = userSettingsObj['proxy']['httpsProxyUrl'];
  }
  return httpsProxyUrl;
}

function setHttpsProxyUrl(httpsProxyUrl) {
  const settings = _getUserSettings();

  if ('proxy' in settings) {
    settings['proxy']['httpsProxyUrl'] = httpsProxyUrl;
  } else {
    settings['proxy'] = {
      httpsProxyUrl: httpsProxyUrl
    };
  }
  _userSettingsObject = settings;
}

function getBypassProxyHosts() {
  let bypassProxyHosts;
  const userSettingsObj = _getUserSettings();
  if ('proxy' in userSettingsObj  && 'bypassProxyHosts' in userSettingsObj['proxy']) {
    bypassProxyHosts = userSettingsObj['proxy']['bypassProxyHosts'];
  }
  return bypassProxyHosts;
}

function setBypassProxyHosts(bypassProxyHosts) {
  const settings = _getUserSettings();

  if ('proxy' in settings) {
    settings['proxy']['bypassProxyHosts'] = bypassProxyHosts;
  } else {
    settings['proxy'] = {
      bypassProxyHosts: bypassProxyHosts
    };
  }
  _userSettingsObject = settings;
}

function getLinuxDisableHardwareAcceleration() {
  let result = false;
  const settings = _getUserSettings();
  if ('linux' in settings && 'disableHardwareAcceleration' in settings['linux']) {
    result = settings['linux']['disableHardwareAcceleration'];
  }
  return result;
}

function setLinuxDisableHardwareAcceleration(disableHardwareAcceleration) {
  const settings = _getUserSettings();

  if ('linux' in settings) {
    settings['linux']['disableHardwareAcceleration'] = disableHardwareAcceleration;
  } else {
    settings['linux'] = {
      disableHardwareAcceleration: disableHardwareAcceleration
    };
  }
}

function getWktToolsExternalStagingDirectory() {
  let wktToolsExternalStagingDirectory;
  const settings = _getUserSettings();
  if ('tools' in settings && 'wktToolsExternalStagingDirectory' in settings['tools']) {
    wktToolsExternalStagingDirectory = settings['tools']['wktToolsExternalStagingDirectory'];
  }
  return wktToolsExternalStagingDirectory;
}

function setWktToolsExternalStagingDirectory(wktToolsExternalStagingDirectory) {
  const settings = _getUserSettings();

  if ('tools' in settings) {
    settings['tools']['wktToolsExternalStagingDirectory'] = wktToolsExternalStagingDirectory;
  } else {
    settings['tools'] = {
      wktToolsExternalStagingDirectory: wktToolsExternalStagingDirectory
    };
  }
  _userSettingsObject = settings;
}

function getLoggingConfiguration() {
  const settings = _getUserSettings();

  if ('logging' in settings) {
    return settings['logging'];
  } else {
    // return am empty logging config
    return {};
  }
}

function getSkipQuickstartAtStartup() {
  const settings = _getUserSettings();
  if ('skipQuickstartAtStartup' in settings) {
    return settings['skipQuickstartAtStartup'];
  } else {
    // return false since the user has not said to not show the quickstart at startup yet
    return false;
  }
}

function setSkipQuickstartAtStartup(value) {
  const valueToSet = value === undefined ? true : !!value;
  const settings = _getUserSettings();
  settings['skipQuickstartAtStartup'] = valueToSet;
  _userSettingsObject = settings;
}


function getConnectivityTestTimeout() {
  const settings = _getUserSettings();
  if ('connectivityTestTimeoutMilliseconds' in settings) {
    return settings['connectivityTestTimeoutMilliseconds'];
  } else {
    return getDefaultConnectivityTestTimeout();
  }
}

function getDefaultConnectivityTestTimeout() {
  return 5000;
}

function setConnectivityTestTimeout(value) {
  const settings = _getUserSettings();
  if (value === undefined || value === null || Number(value) === getDefaultConnectivityTestTimeout()) {
    if ('connectivityTestTimeoutMilliseconds' in settings) {
      delete settings['connectivityTestTimeoutMilliseconds'];
    }
  } else {
    settings['connectivityTestTimeoutMilliseconds'] = Number(value);
  }
}

function setDividerLocation(name, percent) {
  const window = getOrCreateWindowSettings();
  let dividers = window['dividers'];
  if (!dividers) {
    dividers = window['dividers'] = {};
  }
  dividers[name] = parseFloat(percent.toFixed(2));
}

function getDividerLocations() {
  const window = getWindowSettings();
  let dividers = window['dividers'];
  return dividers ? dividers : {};
}

function setNavigationCollapsed(collapsed) {
  const window = getOrCreateWindowSettings();
  window['navCollapsed'] = Boolean(collapsed);
}

function getNavigationCollapsed() {
  const window = getWindowSettings();
  return Boolean(window['navCollapsed']);
}

function getWindowSize() {
  const settings = _getUserSettings();

  let windowSize;
  if ('window' in settings && 'size' in settings['window']) {
    windowSize = settings['window']['size'];
  }
  return windowSize;
}

function setWindowSize(windowSize) {
  const settings = _getUserSettings();

  if ('window' in settings) {
    settings['window']['size'] = windowSize;
  } else {
    settings['window'] = {
      size: windowSize
    };
  }
  _userSettingsObject = settings;
}

function getWindowSettings() {
  const settings = _getUserSettings();
  const window = settings['window'];
  return window ? window : {};
}

function getOrCreateWindowSettings() {
  const settings = _getUserSettings();
  let window = settings['window'];
  if (!window) {
    window = settings['window'] = {};
  }
  return window;
}

function getShowNewModelEditorTab() {
  const developer = getOrCreateDeveloperSettings();
  let showNewModelEditorTab = developer['showNewModelEditorTab'];
  if (showNewModelEditorTab === undefined) {
    showNewModelEditorTab = false;
  }
  return showNewModelEditorTab;
}

function getOrCreateDeveloperSettings() {
  const settings = _getUserSettings();
  let developer = settings['developer'];
  if (!developer) {
    developer = settings['developer'] = { 'showNewModelEditorTab': false};
  }
  return developer;
}

function getUserSettingsDirectory() {
  const i18n = require('./i18next.config');

  if (!_userSettingsDirectory) {
    if (app) {
      _userSettingsDirectory = app.getPath('userData');
    } else {
      throw new Error(i18n.t('user-settings-directory-not-initialized-error-message'));
    }
  }
  return _userSettingsDirectory;
}

function getUserSettingsFileName() {
  if (!_userSettingsFileName) {
    _userSettingsFileName  = path.join(getUserSettingsDirectory(), 'wktuiUserSettings.json');
  }
  return _userSettingsFileName;
}

function _getUserSettings() {
  const i18n = require('./i18next.config');

  if (_userSettingsObject) {
    return _userSettingsObject;
  }

  const userSettingsFileName = getUserSettingsFileName();
  let fileExists;
  try {
    fileExists = fs.existsSync(userSettingsFileName);
  } catch (err) {
    throw new Error(i18n.t('user-settings-file-exists-checked-failed-error-message',
      { userSettingsFile: userSettingsFileName, error: getErrorMessage(err) }));
  }

  if (fileExists) {
    let userSettingsFileContent;
    try {
      userSettingsFileContent = fs.readFileSync(userSettingsFileName, { encoding: 'utf8' });
    } catch (err) {
      throw new Error(`Failed to read file ${userSettingsFileName}: ${err}`);
    }

    if (userSettingsFileContent && userSettingsFileContent.length > 0) {
      try {
        const userSettingsObject = JSON.parse(userSettingsFileContent);
        if (! userSettingsObject['uuid']) {
          userSettingsObject['uuid'] = uuid.v4();
        }
        _userSettingsObject = _updateSettings(userSettingsObject);
        _decryptGitHubToken(_userSettingsObject);
      } catch (err) {
        throw new Error(`Failed to parse ${userSettingsFileName}: ${err}`);
      }
    } else {
      _userSettingsObject = { uuid: uuid.v4() };
    }
  } else {
    _userSettingsObject = { uuid: uuid.v4() };
  }

  return _userSettingsObject;
}

function verifyRemoteUserSettingsObject(remoteUserSettingsObject) {
  const i18n = require('./i18next.config');

  const illegalFields = [];
  for (const privateField of appPrivateFieldNames) {
    if (Object.prototype.hasOwnProperty.call(remoteUserSettingsObject, privateField)) {
      illegalFields.push(privateField);
    }
  }
  if (illegalFields.length > 0) {
    throw new Error(i18n.t('user-settings-illegal-fields-error-message', { fieldNames: illegalFields.join(', ') }));
  }
}

function saveUserSettings() {
  const i18n = require('./i18next.config');

  let encryptedGitHubAuthToken = false;
  if (!_userSettingsObject) {
    // nothing to save
    return;
  }

  if ('gitHubAuthToken' in _userSettingsObject) {
    // encrypt before converting to JSON string
    _encryptGitHubToken(_userSettingsObject);
    encryptedGitHubAuthToken = true;
  }
  const userSettingsJson = JSON.stringify(_userSettingsObject, null, 2);

  if (encryptedGitHubAuthToken) {
    // if previously encrypted, decrypt the filed in the object
    _decryptGitHubToken(_userSettingsObject);
  }

  const userSettingsDirectory = getUserSettingsDirectory();
  let dirExists;
  try {
    dirExists = fs.existsSync(userSettingsDirectory);
  } catch (err) {
    throw new Error(i18n.t('user-settings-check-directory-failed-error-message',
      { userSettingsDirectory: userSettingsDirectory, error: getErrorMessage(err) }));
  }

  if (!dirExists) {
    try {
      fs.mkdirSync(userSettingsDirectory, {
        recursive: true
      });
    } catch (err) {
      throw new Error(i18n.t('user-settings-make-directory-failed-error-message',
        { userSettingsDirectory: userSettingsDirectory, error: getErrorMessage(err) }));
    }
  }

  const userSettingsFileName = getUserSettingsFileName();
  try {
    fs.writeFileSync(userSettingsFileName, userSettingsJson, { encoding: 'utf8' });
  } catch (err) {
    throw new Error(i18n.t('user-settings-file-save-failed-error-message',
      { userSettingsFile: userSettingsFileName, error: getErrorMessage(err) }));
  }
}

function _constructFilteredCopy(settings) {
  const i18n = require('./i18next.config');

  let objCopy;
  try {
    objCopy = JSON.parse(JSON.stringify(settings));
  } catch (err) {
    throw new Error(i18n.t('user-settings-deep-copy-failed-error-message', { error: getErrorMessage(err) }));
  }

  for (const privateField of appPrivateFieldNames) {
    if (privateField in objCopy) {
      delete objCopy[privateField];
    }
  }

  return objCopy;
}

// This function is in place to take an existing user settings file and
// update its structure to the currently used structure.
//
function _updateSettings(settings) {
  if (settings['dividers']) {
    if (!settings['window']) {
      settings['window'] = {};
    }
    settings['window']['dividers'] = {};
    Object.assign(settings['window']['dividers'], settings['dividers']);
    delete settings['dividers'];
  }
  return settings;
}

function _decryptGitHubToken(userSettingsObject) {
  const token = userSettingsObject['uuid'];
  if ('gitHubAuthToken' in userSettingsObject) {
    const cipherText = userSettingsObject['gitHubAuthToken'];
    userSettingsObject['gitHubAuthToken'] = new CredentialEncryptor(token).getDecryptedText(cipherText);
  }
}

function _encryptGitHubToken(userSettingsObject) {
  const token = userSettingsObject['uuid'];
  if ('gitHubAuthToken' in userSettingsObject) {
    const clearText = userSettingsObject['gitHubAuthToken'];
    userSettingsObject['gitHubAuthToken'] = new CredentialEncryptor(token).getEncryptedText(clearText);
  }
}

module.exports = {
  applyUserSettingsFromRemote,
  getDividerLocations,
  getHttpsProxyUrl,
  getNavigationCollapsed,
  setDividerLocation,
  setHttpsProxyUrl,
  setNavigationCollapsed,
  getSkipQuickstartAtStartup,
  setSkipQuickstartAtStartup,
  getConnectivityTestTimeout,
  getDefaultConnectivityTestTimeout,
  setConnectivityTestTimeout,
  getBypassProxyHosts,
  setBypassProxyHosts,
  getWindowSize,
  setWindowSize,
  getLoggingConfiguration,
  getUserSettingsForRemote,
  saveUserSettings,
  getWebLogicRemoteConsoleHome,
  setWebLogicRemoteConsoleHome,
  getShowNewModelEditorTab,
  getWktToolsExternalStagingDirectory,
  setWktToolsExternalStagingDirectory,
  getLinuxDisableHardwareAcceleration,
  setLinuxDisableHardwareAcceleration,
  getGithubAuthToken
};
