/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { homepage, productName, version, copyright } = require('../../package.json');
const path = require('path');
const fs = require('fs');
const errorUtils = require('./errorUtils');

class WktApp {
  constructor(wktMode) {
    this._wktMode = wktMode;
    this._appName = this.getApplicationName();
    this._appVersion = this.getApplicationVersion();
    this._appBuildVersion = undefined;
    // Skip calculating the build version if the wktMode object was not passed in...
    if (wktMode !== undefined) {
      this._appBuildVersion = this._getWktuiBuildVersion(this._appVersion);
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

  _getWktuiBuildVersion(defaultVersion) {
    const versionFilePath = path.join(this._wktMode.getExtraFilesDirectory(), 'WKTUI_VERSION.txt');

    let exists;
    try {
      exists = fs.existsSync(versionFilePath);
    } catch (err) {
      throw new Error(`Failed to determine if the version file ${versionFilePath} exists: ${errorUtils.getErrorMessage(err)}`);
    }
    if (!exists) {
      throw new Error(`Version file ${versionFilePath} does not exist!`);
    }

    let contents;
    try {
      contents = fs.readFileSync(versionFilePath, 'utf8');
    } catch (err) {
      throw new Error(`Failed to read version file ${versionFilePath}: ${errorUtils.getErrorMessage(err)}`);
    }

    let version;
    if (!contents) {
      version = defaultVersion;
    } else if (contents.startsWith('-')) {
      // dev build so concatenate the app version with the qualifier from the file
      version = `${defaultVersion}${contents.trim()}`;
    } else {
      return contents.trim();
    }
    return version;
  }
}

module.exports = WktApp;
