/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { app } = require('electron');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

const fsUtils = require('./fsUtils');
const { getErrorMessage } = require('./errorUtils');

// eslint-disable-next-line no-unused-vars
const userSettableFieldNames = [
  'proxy',
  'logging',
  'skipQuickstartAtStartup'
];

const appPrivateFieldNames = [
  'window'
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
//   "proxy": {
//     "httpsProxyUrl": "The proxy to use for the application's all https outbound communication",
//     "bypassProxyHosts: "The value to use to set the NO_PROXY environment variable for child processes"
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
//     }
//   }
// }
//
let _userSettingsObject;

function getUserSettingsForRemote() {
  const settings = _getUserSettings();
  return JSON.stringify(_constructFilteredCopy(settings));
}

async function applyUserSettingsFromRemote(remoteUserSettingsJson) {
  let remoteUserSettingsObject;
  try {
    remoteUserSettingsObject = JSON.parse(remoteUserSettingsJson);
    verifyRemoteUserSettingsObject(remoteUserSettingsObject);
  } catch (err) {
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    const currentSettings = _getUserSettings();
    const { getLogger } = require('./wktLogging');
    const logger = getLogger();
    for (const privateField of appPrivateFieldNames) {
      logger.debug(`privateField = ${privateField}`);
      if (Object.prototype.hasOwnProperty.call(currentSettings, privateField)) {
        logger.debug(`adding private field ${privateField} to new user settings object`);
        remoteUserSettingsObject[privateField] = currentSettings[privateField];
      } else {
        logger.debug(`currentSettings doesn't have private field ${privateField}`);
      }
    }
    logger.debug(`new user settings are: ${JSON.stringify(remoteUserSettingsObject)}`);
    _userSettingsObject = remoteUserSettingsObject;
    saveUserSettings().then(() => {
      logger.debug('user settings saved...restart the application to pick up logger settings changes');
      resolve();
    }).catch(err => reject(err));
  });
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

function setDividerLocation(name, percent) {
  const settings = _getUserSettings();

  let window = settings['window'];
  if (!window) {
    window = settings['window'] = {};
  }

  let dividers = window['dividers'];
  if (!dividers) {
    dividers = {};
  }
  dividers[name] = parseFloat(percent.toFixed(2));
}

function getDividerLocations() {
  const settings = _getUserSettings();

  let dividers;
  let window = settings['window'];
  if (window) {
    dividers = window['dividers'];
  }
  return dividers ? dividers : {};
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
        console.log('parsed userSettings object = %s', userSettingsObject);
        _userSettingsObject = _updateSettings(userSettingsObject);
      } catch (err) {
        throw new Error(`Failed to parse ${userSettingsFileName}: ${err}`);
      }
    } else {
      _userSettingsObject = { };
    }
  } else {
    _userSettingsObject = { };
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

async function saveUserSettings() {
  const i18n = require('./i18next.config');

  if (!_userSettingsObject) {
    // nothing to save
    return new Promise(resolve => resolve());
  }
  const userSettingsJson = JSON.stringify(_userSettingsObject, null, 2);

  return new Promise((resolve, reject) => {
    const userSettingsDirectory = getUserSettingsDirectory();
    const userSettingsFileName = getUserSettingsFileName();
    fsUtils.makeDirectoryIfNotExists(userSettingsDirectory)
      .then(() => {
        fsPromises.writeFile(userSettingsFileName, userSettingsJson, { encoding: 'utf8' })
          .then(() => resolve())
          .catch(err => reject(new Error(i18n.t('user-settings-file-save-failed-error-message',
            { userSettingsFile: userSettingsFileName, error: getErrorMessage(err) }))));
      })
      .catch(err => reject(new Error(i18n.t('user-settings-make-directory-failed-error-message',
        { userSettingsDirectory: userSettingsDirectory, error: getErrorMessage(err) }))));
  });
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

module.exports = {
  applyUserSettingsFromRemote,
  getDividerLocations,
  getHttpsProxyUrl,
  setDividerLocation,
  setHttpsProxyUrl,
  getSkipQuickstartAtStartup,
  setSkipQuickstartAtStartup,
  getBypassProxyHosts,
  setBypassProxyHosts,
  getWindowSize,
  setWindowSize,
  getLoggingConfiguration,
  getUserSettingsForRemote,
  saveUserSettings
};
