/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const { dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const i18n = require('./i18next.config');
const { getLogger } = require('./wktLogging');
const { getCheckForAppUpdatesMenuItem } = require('./wktWindow');
const errorUtils = require('./errorUtils');

let _appUpdater;

function initializeAutoUpdater(logger) {
  autoUpdater.logger = logger;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
}

function registerAutoUpdateListeners() {
  autoUpdater.on('error', (error) => {
    getLogger().error('Application auto-updater failed: %s', errorUtils.getErrorMessage(error));
    if (error.stack) {
      getLogger().error(error.stack.toString());
    }
    enableCheckForAppUpdatesMenuItem();
    dialog.showErrorBox(i18n.t('auto-updater-error-title'),
      i18n.t('auto-updater-error-message', { error: error }));
  });

  autoUpdater.on('update-available', (updateInfo) => {
    dialog.showMessageBox({
      title: i18n.t('auto-updater-update-available-title'),
      message: i18n.t('auto-updater-update-available-question',{ version: updateInfo.version }),
      type: 'question',
      buttons: [ i18n.t('button-no'), i18n.t('button-yes') ],
      defaultId: 1,
      cancelId: 0
    }).then(dialogResponse => {
      if (dialogResponse.response === 1) {
        autoUpdater.downloadUpdate().then();
      } else {
        enableCheckForAppUpdatesMenuItem();
      }
    });
  });

  autoUpdater.on('update-not-available', (updateInfo) => {
    dialog.showMessageBox({
      title: i18n.t('auto-updater-update-not-available-title'),
      message: i18n.t('auto-updater-update-not-available-message', updateInfo.version),
      type: 'info',
      buttons: [ i18n.t('button-ok') ],
      defaultId: 0,
      cancelId: 0
    }).then(() => {
      enableCheckForAppUpdatesMenuItem();
    });
  });

  autoUpdater.on('download-progress', progressObj => {
    getLogger().debug('download-progress = %s', JSON.stringify(progressObj, null, 2));
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      title: i18n.t('auto-updater-install-title'),
      message: i18n.t('auto-updater-install-question', updateInfo.version),
      type: 'question',
      buttons: [ i18n.t('button-update-on-exit'), i18n.t('button-update-now') ],
      defaultId: 1,
      cancelId: 0
    }).then(dialogResponse => {
      if (dialogResponse.response === 1) {
        autoUpdater.quitAndInstall();
      } else {
        enableCheckForAppUpdatesMenuItem();
      }
    });
  });
}

function checkForUpdates(menuItem, focusedWindow, event) {
  disableCheckForAppUpdatesMenuItem(menuItem);
  autoUpdater.checkForUpdates().then();
}

function enableCheckForAppUpdatesMenuItem() {
  if (_appUpdater) {
    _appUpdater.enabled = true;
    _appUpdater = null;
  }
}

function disableCheckForAppUpdatesMenuItem(menuItem) {
  if (!menuItem) {
    menuItem = getCheckForAppUpdatesMenuItem();
  }
  if (menuItem) {
    _appUpdater = menuItem;
    _appUpdater.enabled = false;
  }
}

module.exports = {
  checkForUpdates,
  initializeAutoUpdater,
  registerAutoUpdateListeners
}