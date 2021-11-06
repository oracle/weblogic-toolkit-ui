/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { app } = require('electron');
const path = require('path');
const osUtils = require('./osUtils');

// This code is executed early on in the application startup phase, before other core systems
// like logging are initialized.  Do not add other application module dependencies!
//
class WktMode {
  constructor(argv0) {
    this._devMode = argv0 !== undefined ? this.isDevelopmentMode(argv0) : undefined;
    this._extraFilesDirectory = undefined;
    this._extraResourcesDirectory = undefined;
  }

  isDevelopmentMode(argv0) {
    // Need to determine how the application is running.
    // For now, let's see if the executable has been
    // renamed or not.
    //
    const regex = /Electron(.exe)?$/i;
    if (this._devMode === undefined) {
      if (argv0) {
        this._devMode = regex.test(argv0);
      } else if (app) {
        this._devMode = regex.test(app.getPath('exe'));
      } else {
        throw new Error('electron app not yet initialized!');
      }
    }
    return this._devMode;
  }

  isExecutableMode(argv0) {
    return !this.isDevelopmentMode(argv0);
  }

  getExtraFilesDirectory(logger) {
    if (this._extraFilesDirectory) {
      return this._extraFilesDirectory;
    } else if (!app) {
      throw new Error('electron app not yet initialized!');
    }

    if (this.isDevelopmentMode()) {
      if (logger) {
        logger.info('Running app in development mode');
      }
      this._extraFilesDirectory = path.normalize(path.join(app.getAppPath(), '..'));
    } else {
      if (logger) {
        logger.info('Running app from executable');
      }
      const exeDir = path.dirname(app.getPath('exe'));
      if (osUtils.isMac()) {
        this._extraFilesDirectory = path.normalize(path.join(exeDir, '..'));
      } else {
        this._extraFilesDirectory = path.normalize(exeDir);
      }
    }
    if (logger) {
      logger.debug(`extraFilesDirectory = ${this._extraFilesDirectory}`);
    }
    return this._extraFilesDirectory;
  }

  getExtraResourcesDirectory(logger) {
    if (this._extraResourcesDirectory) {
      return this._extraResourcesDirectory;
    } else if (!app) {
      throw new Error('electron app not yet initialized!');
    }

    if (this.isDevelopmentMode()) {
      if (logger) {
        logger.info('Running app in development mode');
      }
      this._extraResourcesDirectory = path.normalize(path.join(app.getAppPath(), '..'));
    } else {
      if (logger) {
        logger.info('Running app from executable');
      }
      const exeDir = path.dirname(app.getPath('exe'));
      if (osUtils.isMac()) {
        this._extraResourcesDirectory = path.normalize(path.join(exeDir, '..', 'Resources'));
      } else {
        this._extraResourcesDirectory = path.normalize(path.join(exeDir, 'resources'));
      }
    }
    if (logger) {
      logger.debug(`extraResourcesDirectory = ${this._extraResourcesDirectory}`);
    }
    return this._extraResourcesDirectory;

  }
}

module.exports = WktMode;
