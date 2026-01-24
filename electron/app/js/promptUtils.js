/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const path = require('path');
const { BrowserWindow, ipcMain } = require('electron');

/* global __dirname */

async function getCredentialPassphrase(parentWindow) {
  const pageFile = path.join(__dirname, 'prompt', 'credential-passphrase.html');
  const preloadFile = path.join(__dirname, 'prompt', 'preload.js');

  const WIDTH = 550;
  const HEIGHT = 146; // renderer will send IPC to adjust this
  const MIN_HEIGHT = 120;  // needs to be smaller than content height

  return new Promise((resolve, reject) => {

    let promptWindow = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
      minWidth: WIDTH,
      minHeight: MIN_HEIGHT,
      resizable: true,
      minimizable: false,
      fullscreenable: false,
      maximizable: false,
      parent: parentWindow,
      skipTaskbar: true,
      alwaysOnTop: false,
      useContentSize: true,
      modal: Boolean(parentWindow),
      autoHideMenuBar: true,
      menuBarVisible: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        enableRemoteModule: false,
        webviewTag: false,
        preload: preloadFile
      },
    });

    // hide app menu for various platforms
    promptWindow.setMenu(null);
    promptWindow.removeMenu();
    promptWindow.setMenuBarVisibility(false);

    const getOptionsListener = event => {
      event.returnValue = JSON.stringify({});
    };

    const sizeListener = (event, value) => {
      event.returnValue = null;
      promptWindow.setContentSize(WIDTH, value);
      promptWindow.center();
    };

    const id = promptWindow.id.toString();

    const cleanup = () => {
      ipcMain.removeListener('prompt-get-options:' + id, getOptionsListener);
      ipcMain.removeListener('prompt-post-data:' + id, postDataListener);
      ipcMain.removeListener('prompt-error:' + id, errorListener);
      ipcMain.removeListener('prompt-size:' + id, sizeListener);

      if (promptWindow) {
        promptWindow.close();
        promptWindow = null;
      }
    };

    const postDataListener = (event, value) => {
      resolve(value);
      event.returnValue = null;
      cleanup();
    };

    const unresponsiveListener = () => {
      reject(new Error('Window was unresponsive'));
      cleanup();
    };

    const errorListener = (event, message) => {
      reject(new Error(message));
      event.returnValue = null;
      cleanup();
    };

    ipcMain.on('prompt-get-options:' + id, getOptionsListener);
    ipcMain.on('prompt-post-data:' + id, postDataListener);
    ipcMain.on('prompt-error:' + id, errorListener);
    ipcMain.on('prompt-size:' + id, sizeListener);
    promptWindow.on('unresponsive', unresponsiveListener);

    promptWindow.on('closed', () => {
      promptWindow = null;
      cleanup();
      resolve(null);
    });

    promptWindow.loadFile(pageFile,{hash: id});
  });
}

// a custom "About" dialog for Linux and Windows.
// the current electron version doesn't support the built-in dialog for Linux,
// and the windows version is lacks build version and other issues.
async function showAboutDialog(wktApp, parentWindow) {
  const pageFile = path.join(__dirname, 'prompt', 'about.html');
  const preloadFile = path.join(__dirname, 'prompt', 'preload.js');

  const WIDTH = 400;
  const HEIGHT = 186; // renderer will send IPC to adjust this
  const MIN_HEIGHT = 120;  // needs to be smaller than content height

  return new Promise((resolve, reject) => {
    let promptWindow = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
      minWidth: WIDTH,
      minHeight: MIN_HEIGHT,
      resizable: true,
      minimizable: false,
      fullscreenable: false,
      maximizable: false,
      parent: parentWindow,
      skipTaskbar: true,
      alwaysOnTop: false,
      useContentSize: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        enableRemoteModule: false,
        webviewTag: false,
        preload: preloadFile
      },
    });
    // hide app menu for Windows and Linux
    promptWindow.setMenuBarVisibility(false);

    const getOptionsListener = event => {
      event.returnValue = JSON.stringify({
        applicationName: wktApp.getApplicationName(),
        applicationVersion: wktApp.getApplicationVersion(),
        copyright: wktApp.getApplicationCopyright(),
        version: wktApp.getApplicationBuildVersion(),
        website: wktApp.getApplicationWebsite()
      });
    };

    const sizeListener = (event, value) => {
      event.returnValue = null;
      promptWindow.setContentSize(WIDTH, value);
      promptWindow.center();
    };

    const id = promptWindow.id.toString();

    const cleanup = () => {
      ipcMain.removeListener('prompt-get-options:' + id, getOptionsListener);
      ipcMain.removeListener('prompt-post-data:' + id, postDataListener);
      ipcMain.removeListener('prompt-error:' + id, errorListener);
      ipcMain.removeListener('prompt-size:' + id, sizeListener);

      if (promptWindow) {
        promptWindow.close();
        promptWindow = null;
      }
    };

    const postDataListener = (event, value) => {
      resolve(value);
      event.returnValue = null;
      cleanup();
    };

    const unresponsiveListener = () => {
      reject(new Error('Window was unresponsive'));
      cleanup();
    };

    const errorListener = (event, message) => {
      reject(new Error(message));
      event.returnValue = null;
      cleanup();
    };

    ipcMain.on('prompt-get-options:' + id, getOptionsListener);
    ipcMain.on('prompt-post-data:' + id, postDataListener);
    ipcMain.on('prompt-error:' + id, errorListener);
    ipcMain.on('prompt-size:' + id, sizeListener);
    promptWindow.on('unresponsive', unresponsiveListener);

    promptWindow.on('closed', () => {
      promptWindow = null;
      cleanup();
      resolve(null);
    });

    promptWindow.loadFile(pageFile,{hash: id}).then();
  });
}

module.exports = {
  getCredentialPassphrase,
  showAboutDialog
};
