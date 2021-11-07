/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const i18n = require('./i18next.config');
const { getLogger } = require('./wktLogging');
const errorUtils = require('./errorUtils');
const { sendToWindow } = require('./windowUtils');
const osUtils = require('./osUtils');

let _isDevMode;
let _downloadWindow;
let _installType;

function initializeAutoUpdater(logger, isDevMode) {
  _isDevMode = isDevMode;
  autoUpdater.logger = logger;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
}

function registerAutoUpdateListeners() {
  autoUpdater.on('download-progress', progressObj => {
    if(_downloadWindow) {
      sendToWindow(_downloadWindow, 'app-download-progress', progressObj.percent);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    autoUpdater.logger.info('Download complete, install type: ' + _installType);
    // quit and install in this handler so MacOS updater can process the event first
    if(_installType === 'now') {
      autoUpdater.quitAndInstall();
    }
  });
}

// returns a Promise that may resolve to information about a new app update.
// if app is in dev mode, the Promise resolves to null without any check.
// if the application is current with the latest version, or an error occurs, the Promise resolves to null.
// if notifyOnFailures is true, dialogs are displayed when no result is provided.
async function getUpdateInformation(notifyOnFailures) {
  if (!_isDevMode) {
    try {
      const checkResult = await autoUpdater.checkForUpdates();
      const releaseName = checkResult.updateInfo.releaseName;
      const updateAvailable = Object.prototype.hasOwnProperty.call(checkResult, 'downloadPromise');
      if (updateAvailable) {
        return {
          releaseName,
          releaseNotes: checkResult.updateInfo.releaseNotes
        };
      } else if (notifyOnFailures) {
        dialog.showMessageBox({
          title: i18n.t('auto-updater-update-not-available-title'),
          message: i18n.t('auto-updater-update-not-available-message', {version: releaseName}),
          type: 'info',
          buttons: [i18n.t('button-ok')],
          defaultId: 0,
          cancelId: 0
        }).then();
      }
    } catch(error) {
      const errorMessage = errorUtils.getErrorMessage(error);
      getLogger().error('Application auto-updater failed: %s', errorMessage);
      if (error.stack) {
        getLogger().error(error.stack.toString());
      }
      if (notifyOnFailures) {
        dialog.showErrorBox(i18n.t('auto-updater-error-title'),
          i18n.t('auto-updater-error-message', { error: errorMessage }));
      }
    }
  } else if (notifyOnFailures) {
    // Only show the prompt if the user used the menu to trigger checkForUpdates()
    // If triggered on startup, no need to display...
    //
    dialog.showErrorBox(i18n.t('auto-updater-disabled-dev-mode-title'),
      i18n.t('auto-updater-disabled-dev-mode-message'));
  }

  return null;
}

// check for updates and send information to the renderer if an update is available.
function checkForUpdates(focusedWindow, notifyOnFailures) {
  getUpdateInformation(notifyOnFailures).then(updateResult => {
    if (updateResult) {
      sendToWindow(focusedWindow, 'app-update-available', updateResult);
    }
  });
}

async function installUpdates(window, installType) {
  try {
    _installType = installType;
    _downloadWindow = window;
    await autoUpdater.downloadUpdate();
    _downloadWindow = null;
  } catch (error) {
    _downloadWindow = null;

    getLogger().error('Application auto-updater failed: %s', errorUtils.getErrorMessage(error));
    if (error.stack) {
      getLogger().error(error.stack.toString());
    }

    dialog.showErrorBox(i18n.t('auto-updater-error-title'),
      i18n.t('auto-updater-error-message', { error: error }));
  }
}

module.exports = {
  checkForUpdates,
  getUpdateInformation,
  initializeAutoUpdater,
  installUpdates,
  registerAutoUpdateListeners
};
