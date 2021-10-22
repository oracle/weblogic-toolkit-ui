/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { homepage, productName, version, copyright } = require('../../package.json');
const path = require('path');
const fsPromises = require('fs/promises');
const fsUtils = require('./fsUtils');

class WktApp {
  constructor(wktMode) {
    this._wktMode = wktMode;
    this._appName = this.getApplicationName();
    this._appVersion = this.getApplicationVersion();
    this._appBuildVersion = undefined;
    // Skip calculating the build version if the wktMode object was not passed in...
    if (wktMode !== undefined) {
      (async() => {
        this._appBuildVersion = await this._getWktuiBuildVersion(this._appVersion);
      })();
    }
    this._appCopyright = this.getApplicationCopyright();
    this._appWebSite = this.getApplicationWebsite();
  }

  getApplicationName() {
    if (!this._appName) {
      this._appName = productName || 'WebLogic Kubernetes Toolkit UI';
    }
    return this._appName;
  }

  getApplicationVersion() {
    if (!this._appVersion) {
      this._appVersion = version || 'Unknown';
    }
    return this._appVersion;
  }

  getApplicationBuildVersion() {
    // There is a race condition because the code that initializes this variable in the constructor is asynchronous.
    // Rather than throwing an error or returning an incorrect value, recalculate it here...
    //
    if (!this._appBuildVersion) {
      (async() => {
        this._appBuildVersion = await this._getWktuiBuildVersion(this._appVersion);
        return this._appBuildVersion;
      })();
    }
    return this._appBuildVersion;
  }

  getApplicationCopyright() {
    if (!this._appCopyright) {
      this._appCopyright = copyright || 'Unknown';
    }
    return this._appCopyright;
  }

  getApplicationWebsite() {
    if (!this._appWebSite) {
      this._appWebSite = homepage || 'https://oracle.com';
    }
    return this._appWebSite;
  }

  async _getWktuiBuildVersion(defaultVersion) {
    const versionFilePath = path.join(this._wktMode.getExtraFilesDirectory(), 'WKTUI_VERSION.txt');
    return new Promise((resolve, reject) => {
      fsUtils.exists(versionFilePath)
        .then(doesExist => {
          if (doesExist) {
            fsPromises.readFile(versionFilePath, 'utf8')
              .then(contents => {
                if (!contents || contents.startsWith('-')) {
                  // dev build so concatenate the app version with the qualifier from the file
                  resolve(`${defaultVersion}${contents.trim()}`);
                } else {
                  resolve(contents.trim());
                }
              })
              .catch(err => reject(`Failed to read version file ${versionFilePath}: ${err}`));
          } else {
            reject(`Version file ${versionFilePath} does not exist!`);
          }
        })
        .catch(err => reject(`Failed to determine if the version file ${versionFilePath} exists: ${err}`));
    });
  }
}

module.exports = WktApp;
