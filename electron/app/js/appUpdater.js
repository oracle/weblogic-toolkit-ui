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

let _isDevMode;
let _downloadWindow;

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
}

function checkForUpdates(focusedWindow, fromMenu) {
  if (!_isDevMode) {
    autoUpdater.checkForUpdates()
      .then(checkResult => {
        const updateAvailable = Object.prototype.hasOwnProperty.call(checkResult, 'downloadPromise');
        const releaseName = checkResult.updateInfo.releaseName;
        const releaseNotes = checkResult.updateInfo.releaseNotes;

        if (updateAvailable) {
          const updateInfo = { releaseName, releaseNotes };
          sendToWindow(focusedWindow, 'app-update-available', updateInfo);

        } else if (fromMenu) {
          dialog.showMessageBox({
            title: i18n.t('auto-updater-update-not-available-title'),
            message: i18n.t('auto-updater-update-not-available-message', {version: releaseName}),
            type: 'info',
            buttons: [i18n.t('button-ok')],
            defaultId: 0,
            cancelId: 0
          }).then();
        }
      })
      .catch(error => {
        const errorMessage = errorUtils.getErrorMessage(error);
        getLogger().error('Application auto-updater failed: %s', errorMessage);
        if (error.stack) {
          getLogger().error(error.stack.toString());
        }
        if (fromMenu) {
          dialog.showErrorBox(i18n.t('auto-updater-error-title'),
            i18n.t('auto-updater-error-message', { error: errorMessage }));
        }
      });

  } else if (fromMenu) {
    // Only show the prompt if the user used the menu to trigger checkForUpdates()
    // If triggered on startup, no need to display...
    //
    dialog.showErrorBox(i18n.t('auto-updater-disabled-dev-mode-title'),
      i18n.t('auto-updater-disabled-dev-mode-message'));
  }
}

async function installUpdates(window, installType) {
  try {
    _downloadWindow = window;
    await autoUpdater.downloadUpdate();
    _downloadWindow = null;

    if(installType === 'now') {
      autoUpdater.quitAndInstall();
    }
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
  initializeAutoUpdater,
  installUpdates,
  registerAutoUpdateListeners
};
