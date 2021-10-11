/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { app } = require('electron');
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
//   }
// }
//
let _userSettingsObject;

async function getUserSettingsForRemote() {
  return new Promise((resolve, reject) => {
    _getUserSettings().then(settings => {
      try {
        resolve(JSON.stringify(_constructFilteredCopy(settings)));
      } catch (err) {
        reject(err);
      }
    }).catch(err => reject(err));
  });
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
    _getUserSettings().then(currentSettings => {
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
    }).catch(err => reject(err));
  });
}

async function getHttpsProxyUrl() {
  return new Promise((resolve, reject) => {
    _getUserSettings().then(userSettingsObj => {
      if ('proxy' in userSettingsObj  && 'httpsProxyUrl' in userSettingsObj['proxy']) {
        const httpsProxyUrl = userSettingsObj['proxy']['httpsProxyUrl'];
        resolve(httpsProxyUrl);
      } else {
        resolve(null);
      }
    }).catch(err => reject(err));
  });
}

async function setHttpsProxyUrl(httpsProxyUrl) {
  return new Promise((resolve, reject) => {
    _getUserSettings().then(userSettingsObj => {
      if ('proxy' in userSettingsObj) {
        userSettingsObj['proxy']['httpsProxyUrl'] = httpsProxyUrl;
      } else {
        userSettingsObj['proxy'] = {
          httpsProxyUrl: httpsProxyUrl
        };
      }
      _userSettingsObject = userSettingsObj;
      resolve();
    }).catch(err => reject(err));
  });
}

async function getBypassProxyHosts() {
  return new Promise((resolve, reject) => {
    _getUserSettings().then(userSettingsObj => {
      if ('proxy' in userSettingsObj  && 'bypassProxyHosts' in userSettingsObj['proxy']) {
        const bypassProxyHosts = userSettingsObj['proxy']['bypassProxyHosts'];
        resolve(bypassProxyHosts);
      } else {
        resolve(null);
      }
    }).catch(err => reject(err));
  });
}

async function setBypassProxyHosts(bypassProxyHosts) {
  return new Promise((resolve, reject) => {
    _getUserSettings().then(userSettingsObj => {
      if ('proxy' in userSettingsObj) {
        userSettingsObj['proxy']['bypassProxyHosts'] = bypassProxyHosts;
      } else {
        userSettingsObj['proxy'] = {
          bypassProxyHosts: bypassProxyHosts
        };
      }
      _userSettingsObject = userSettingsObj;
      resolve();
    }).catch(err => reject(err));
  });
}

async function getLoggingConfiguration() {
  return new Promise((resolve) => {
    _getUserSettings().then(userSettingsObj => {
      if ('logging' in userSettingsObj) {
        resolve(userSettingsObj['logging']);
      } else {
        // return am empty logging config
        resolve({});
      }
    });
  });
}

async function getSkipQuickstartAtStartup() {
  return new Promise((resolve) => {
    _getUserSettings().then(userSettingsObj => {
      if ('skipQuickstartAtStartup' in userSettingsObj) {
        resolve(userSettingsObj['skipQuickstartAtStartup']);
      } else {
        // return false since the user has not said to not show the quickstart at startup yet
        resolve(false);
      }
    });
  });
}

async function setSkipQuickstartAtStartup(value) {
  const valueToSet = value === undefined ? true : !!value;
  return new Promise((resolve, reject) => {
    _getUserSettings().then(userSettingsObj => {
      userSettingsObj['skipQuickstartAtStartup'] = valueToSet;
      _userSettingsObject = userSettingsObj;
      resolve();
    }).catch(err => reject(err));
  });
}

async function setDividerLocation(name, percent) {
  _getUserSettings().then(userSettings => {
    let dividers = userSettings['dividers'];
    if(!dividers) {
      dividers = userSettings['dividers'] = {};
    }
    dividers[name] = parseFloat(percent.toFixed(2));
  });
}

async function getDividerLocations() {
  const userSettings = await _getUserSettings();
  let dividers = userSettings['dividers'];
  return dividers ? dividers : {};
}

async function getWindowSize() {
  return new Promise((resolve, reject) => {
    _getUserSettings().then(userSettingsObj => {
      if ('window' in userSettingsObj && 'size' in userSettingsObj['window']) {
        const windowSize = userSettingsObj['window']['size'];
        resolve(windowSize);
      } else {
        resolve();
      }
    }).catch(err => reject(err));
  });
}

async function setWindowSize(windowSize) {
  return new Promise((resolve, reject) => {
    _getUserSettings().then(userSettingsObj => {
      if ('window' in userSettingsObj) {
        userSettingsObj['window']['size'] = windowSize;
      } else {
        userSettingsObj['window'] = {
          size: windowSize
        };
      }
      _userSettingsObject = userSettingsObj;
      resolve();
    }).catch(err => reject(err));
  });
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

async function _getUserSettings() {
  const i18n = require('./i18next.config');

  if (_userSettingsObject) {
    return Promise.resolve(_userSettingsObject);
  }

  return new Promise((resolve, reject) => {
    const userSettingsFileName = getUserSettingsFileName();
    fsUtils.exists(userSettingsFileName)
      .then(doesExist => {
        if (doesExist) {
          fsPromises.readFile(userSettingsFileName, 'utf8')
            .then(fileContents => {
              if (fileContents && fileContents.length > 0) {
                try {
                  _userSettingsObject = JSON.parse(fileContents);
                } catch (err) {
                  reject(`Failed to parse ${userSettingsFileName}: ${err}`);
                }
              } else {
                _userSettingsObject = { };
              }
              resolve(_userSettingsObject);
            })
            .catch(err => reject(`Failed to read file ${userSettingsFileName}: ${err}`));
        } else {
          _userSettingsObject = { };
          resolve(_userSettingsObject);
        }
      })
      .catch(err => reject(i18n.t('user-settings-file-exists-checked-failed-error-message',
        { userSettingsFile: userSettingsFileName, error: getErrorMessage(err) })));
  });
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
