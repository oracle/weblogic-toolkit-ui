/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { app, BrowserWindow, dialog, Menu, shell } = require('electron');
const path = require('path');

const i18n = require('./i18next.config');
const userSettings = require('./userSettings');
const { sendToWindow } = require('./windowUtils');
const wdtDiscovery = require('./wdtDiscovery');
const wktTools = require('./wktTools');
const osUtils = require('./osUtils');
const { getLogger, getDefaultLogDirectory } = require('./wktLogging');
const { showAboutDialog } = require('./promptUtils');
const { checkForUpdates } = require('./appUpdater');

const appDir = path.normalize(path.join(__dirname, '..'));

let _wktMode;
let _wktApp;
let _isJetDevMode;
// const openFiles = new Map();

const windowStatus = {};

/* global __dirname */
function initialize(isJetDevMode, wktApp, wktMode) {
  _isJetDevMode = isJetDevMode;
  _wktApp = wktApp;
  _wktMode = wktMode;
}

class WktAppMenu {
  constructor(hasOpenDialog, targetType) {
    // hasOpenDialog: the focused window has a dialog displayed
    // targetType: the target type for the window, such as 'wko', 'vz'

    this._isJetDevMode = _isJetDevMode;
    this._wktApp = _wktApp;
    this._hasOpenDialog = hasOpenDialog;
    this._isWkoTarget = targetType === 'wko';
    this.appMenuTemplate = this._generateAppMenuTemplate();
  }

  _generateAppMenuTemplate() {
    const project = require('./project');
    const appMenuTemplate = [
      {
        id: 'file',
        label: `&${i18n.t('menu-file')}`,
        role: 'fileMenu',
        submenu: [
          {
            id: 'newProject',
            label: i18n.t('menu-file-newProject'),
            enabled: !this._hasOpenDialog,
            async click(item, focusedWindow) {
              if (focusedWindow) {
                return project.createNewProject(focusedWindow).then();
              }

              const newWindow = await createWindow();
              newWindow.on('show', () => {
                project.createNewProject(newWindow).then();
              });
            }
          },
          {
            id: 'openProject',
            label: i18n.t('menu-file-openProject'),
            enabled: !this._hasOpenDialog,
            async click(item, focusedWindow) {
              if (focusedWindow) {
                return project.openProject(focusedWindow).then();
              }

              const newWindow = await createWindow();
              newWindow.on('show', () => {
                project.openProject(newWindow).then();
              });
            }
          },
          {
            id: 'closeProject',
            label: i18n.t('menu-file-closeProject'),
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (focusedWindow) {
                project.startCloseProject(focusedWindow);
              }
            }
          },
          {
            type: 'separator'
          },
          {
            id: 'addModel',
            label: i18n.t('menu-file-addModel'),
            enabled: !this._hasOpenDialog,
            submenu: [
              {
                id: 'addModelFile',
                label: i18n.t('menu-file-addModel-addModelFile'),
                enabled: !this._hasOpenDialog,
                click(item, focusedWindow) {
                  if (focusedWindow) {
                    sendToWindow(focusedWindow,'start-add-model-file');
                  }
                }
              },
              {
                id: 'addVariableFile',
                label: i18n.t('menu-file-addModel-addVariableFile'),
                enabled: !this._hasOpenDialog,
                click(item, focusedWindow) {
                  if (focusedWindow) {
                    sendToWindow(focusedWindow,'start-add-variable-file');
                  }
                }
              },
              {
                id: 'addArchiveFile',
                label: i18n.t('menu-file-addModel-addArchiveFile'),
                enabled: !this._hasOpenDialog,
                click(item, focusedWindow) {
                  if (focusedWindow) {
                    sendToWindow(focusedWindow,'start-add-archive-file');
                  }
                }
              },
              {
                id: 'discoverModelOffline',
                label: i18n.t('menu-file-addModel-discoverModelOffline'),
                enabled: !this._hasOpenDialog,
                click(item, focusedWindow) {
                  if (focusedWindow) {
                    wdtDiscovery.startOfflineDiscover(focusedWindow);
                  }
                }
              },
              {
                id: 'discoverModelOnline',
                label: i18n.t('menu-file-addModel-discoverModelOnline'),
                enabled: !this._hasOpenDialog,
                click(item, focusedWindow) {
                  if (focusedWindow) {
                    wdtDiscovery.startOnlineDiscover(focusedWindow);
                  }
                }
              }
            ]
          },
          {
            type: 'separator'
          },
          {
            id: 'saveAll',
            label: i18n.t('menu-file-saveAll'),
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-file-saveAll-errorTitle'),
                  i18n.t('menu-file-saveAll-errorContent')
                );
              }
              project.startSaveProject(focusedWindow);
            }
          }
        ]
      },
      {
        id: 'edit',
        label: `&${i18n.t('menu-edit')}`,
        role: 'editMenu',
        submenu: [
          {
            id: 'undo',
            enabled: !this._hasOpenDialog,
            label: i18n.t('menu-edit-undo'),
            accelerator: 'CommandOrControl+Z',
            role: 'undo'
          },
          {
            id: 'redo',
            enabled: !this._hasOpenDialog,
            label: i18n.t('menu-edit-redo'),
            accelerator: 'Shift+CommandOrControl+Z',
            role: 'undo'
          },
          {
            type: 'separator'
          },
          {
            id: 'cut',
            enabled: !this._hasOpenDialog,
            label: i18n.t('menu-edit-cut'),
            accelerator: 'CommandOrControl+X',
            role: 'cut'
          },
          {
            id: 'copy',
            enabled: !this._hasOpenDialog,
            label: i18n.t('menu-edit-copy'),
            accelerator: 'CommandOrControl+C',
            role: 'copy'
          },
          {
            id: 'paste',
            enabled: !this._hasOpenDialog,
            label: i18n.t('menu-edit-paste'),
            accelerator: 'CommandOrControl+V',
            role: 'paste'
          },
          {
            id: 'selectAll',
            enabled: !this._hasOpenDialog,
            label: i18n.t('menu-edit-selectAll'),
            accelerator: 'CommandOrControl+A',
            role: 'selectall'
          }
        ]
      },
      {
        id: 'go',
        label: `&${i18n.t('menu-go')}`,
        submenu: [
          {
            id: 'prepareModel',
            label: i18n.t('menu-go-prep-model-for-k8s'),
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-prepare-model-error-title'),
                  i18n.t('menu-go-prepare-model-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-prepare-model');
            }
          },
          {
            id: 'createImage',
            label: i18n.t('menu-go-create-image'),
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-create-image-error-title'),
                  i18n.t('menu-go-create-image-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-create-image');
            }
          },
          {
            id: 'pushImage',
            label: i18n.t('menu-go-push-image'),
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-push-image-error-title'),
                  i18n.t('menu-go-push-image-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-push-image');
            }
          },
          {
            id: 'createAuxImage',
            label: i18n.t('menu-go-create-aux-image'),
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-create-aux-image-error-title'),
                  i18n.t('menu-go-create-aux-image-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-create-aux-image');
            }
          },
          {
            id: 'pushAuxImage',
            label: i18n.t('menu-go-push-aux-image'),
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-push-aux-image-error-title'),
                  i18n.t('menu-go-push-aux-image-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-push-aux-image');
            }
          },
          {
            id: 'verifyConnectivity',
            label: i18n.t('menu-go-kubectl-verify-connectivity'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-kubectl-verify-connectivity-error-title'),
                  i18n.t('menu-go-kubectl-verify-connectivity-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-k8s-verify-connection');
            }
          },
          {
            id: 'installOperator',
            label: i18n.t('menu-go-install-operator'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-install-operator-error-title'),
                  i18n.t('menu-go-install-operator-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-wko-install');
            }
          },
          {
            id: 'updateOperator',
            label: i18n.t('menu-go-update-operator'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-update-operator-error-title'),
                  i18n.t('menu-go-update-operator-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-wko-update');
            }
          },
          {
            id: 'uninstallOperator',
            label: i18n.t('menu-go-uninstall-operator'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-uninstall-operator-error-title'),
                  i18n.t('menu-go-uninstall-operator-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-wko-uninstall');
            }
          },
          {
            id: 'deployDomain',
            label: i18n.t('menu-go-deploy-domain'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-deploy-domain-error-title'),
                  i18n.t('menu-go-deploy-domain-error-message')
                );
              }
              sendToWindow(focusedWindow, 'start-k8s-domain-deploy');
            }
          },
          {
            id: 'domainStatus',
            label: i18n.t('menu-go-domain-status'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-domain-status-title'),
                  i18n.t('menu-go-domain=status-error-message')
                );
              }
              sendToWindow(focusedWindow, 'get-wko-domain-status');
            }
          },
          {
            id: 'undeployDomain',
            label: i18n.t('menu-go-undeploy-domain'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-undeploy-domain-error-title'),
                  i18n.t('menu-go-undeploy-domain-error-message')
                );
              }
              sendToWindow(focusedWindow, 'start-k8s-domain-undeploy');
            }
          },
          {
            id: 'installIngress',
            label: i18n.t('menu-go-install-ingress'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-install-ingress-error-title'),
                  i18n.t('menu-go-install-ingress-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-ingress-install');
            }
          },
          {
            id: 'addRoutesIngress',
            label: i18n.t('menu-go-add-routes-ingress'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-add-routes-error-title'),
                  i18n.t('menu-go-add-routes-error-message')
                );
              }
              sendToWindow(focusedWindow,'add-ingress-routes');
            }
          },
          {
            id: 'uninstallIngress',
            label: i18n.t('menu-go-uninstall-ingress'),
            visible: this._isWkoTarget,
            enabled: !this._hasOpenDialog,
            click(item, focusedWindow) {
              if (!focusedWindow) {
                return dialog.showErrorBox(
                  i18n.t('menu-go-uninstall-ingress-error-title'),
                  i18n.t('menu-go-uninstall-ingress-error-message')
                );
              }
              sendToWindow(focusedWindow,'start-ingress-uninstall');
            }
          }
        ]
      },
      {
        id: 'window',
        label: `&${i18n.t('menu-window')}`,
        role: 'window',
        submenu: [
          {
            id: 'minimize',
            label: i18n.t('menu-window-minimize'),
            accelerator: 'CommandOrControl+M',
            enabled: !this._hasOpenDialog,
            role: 'minimize'
          },
          {
            id: 'close',
            label: i18n.t('menu-window-close'),
            accelerator: 'CommandOrControl+W',
            enabled: !this._hasOpenDialog,
            role: 'close'
          }
        ]
      },
      {
        id: 'help',
        label: `&${i18n.t('menu-help')}`,
        role: 'help',
        submenu: [
          {
            id: 'checkForAppUpdates',
            label: i18n.t('menu-help-checkForAppUpdates'),
            enabled: !this._hasOpenDialog,
            async click(item, focusedWindow) {
              if (focusedWindow) {
                return checkForUpdates(focusedWindow, true);
              }

              const newWindow = await createWindow();
              newWindow.on('show', () => {
                checkForUpdates(focusedWindow, true);
              });
            }
          },
          {
            id: 'checkForToolUpdates',
            label: i18n.t('menu-help-checkForToolUpdates'),
            enabled: !this._hasOpenDialog,
            async click(item, focusedWindow) {
              if (focusedWindow) {
                return wktTools.checkForUpdates(focusedWindow).then();
              }

              const newWindow = await createWindow();
              newWindow.on('show', () => {
                wktTools.checkForUpdates(newWindow).then();
              });
            }
          },
          {
            id: 'showQuickstart',
            label: i18n.t('menu-help-showQuickstart'),
            enabled: !this._hasOpenDialog,
            async click(item, focusedWindow) {
              if (focusedWindow) {
                return sendToWindow(focusedWindow, 'show-quickstart');
              }

              const newWindow = await createWindow();
              newWindow.on('show', () => {
                sendToWindow(focusedWindow, 'show-quickstart');
              });
            }
          },
          {
            id: 'visitWebsite',
            label: i18n.t('menu-help-visitWebsite'),
            enabled: !this._hasOpenDialog,
            click() {
              shell.openExternal('https://oracle.github.io/weblogic-toolkit-ui/').then();
            }
          },
          {
            id: 'toggleDevTools',
            label: i18n.t('menu-help-toggleDevTools'),
            enabled: !this._hasOpenDialog,
            click (item, focusedWindow) {
              if (focusedWindow) {
                focusedWindow.webContents.toggleDevTools();
              }
            }
          }
        ]
      }
    ];

    if (osUtils.isMac()) {
      appMenuTemplate.unshift({
        id: 'appMenu',
        label: this._wktApp.getApplicationName(),
        role: 'appMenu',
        submenu: [
          {
            id: 'about',
            label: `${i18n.t('menu-app-about', { appName: this._wktApp.getApplicationName() })}`,
            enabled: !this._hasOpenDialog,
            role: 'about'
          },
          {
            type: 'separator'
          },
          {
            id: 'preferences',
            label: i18n.t('menu-app-preferences'),
            enabled: !this._hasOpenDialog,
            async click(item, focusedWindow) {
              if (focusedWindow) {
                const remoteUserSettings = userSettings.getUserSettingsForRemote();
                const payload = {
                  userSettingsJson: remoteUserSettings,
                  defaults: {
                    logDir: getDefaultLogDirectory(_wktMode),
                    level: 'info'
                  },
                  isDevMode: _wktMode.isDevelopmentMode(),
                };
                return sendToWindow(focusedWindow, 'edit-user-settings', payload);
              }

              const newWindow = await createWindow();
              newWindow.on('show', () => {
                sendToWindow(newWindow, 'edit-user-settings', userSettings.getUserSettingsForRemote());
              });
            }
          },
          {
            type: 'separator'
          },
          {
            id: 'services',
            label: i18n.t('menu-app-services'),
            enabled: !this._hasOpenDialog,
            role: 'services',
          },
          {
            type: 'separator'
          },
          {
            id: 'hide',
            label: `${i18n.t('menu-app-hide', { appName: this._wktApp.getApplicationName() })}`,
            accelerator: 'Command+H',
            enabled: !this._hasOpenDialog,
            role: 'hide'
          },
          {
            id: 'hideOthers',
            label: i18n.t('menu-app-hideOthers'),
            accelerator: 'Command+Alt+H',
            enabled: !this._hasOpenDialog,
            role: 'hideothers'
          },
          {
            id: 'showAll',
            label: i18n.t('menu-app-showAll'),
            enabled: !this._hasOpenDialog,
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            id: 'exit',
            label: `${i18n.t('menu-app-quit', { appName: this._wktApp.getApplicationName() })}`,
            accelerator: 'Command+Q',
            async click() { await executeAppQuit(); }
          }
        ]
      });

      // The Open Recent menu only works on the Mac according to
      // https://www.electronjs.org/docs/tutorial/recent-documents#additional-information
      //
      const fileMenu = appMenuTemplate.find(item => item.id === 'file');
      if (fileMenu) {
        const openProjectIndex = fileMenu.submenu.findIndex(item => item.id === 'openProject');
        if (openProjectIndex !== -1) {
          const openRecentMenuItem = {
            id: 'openRecent',
            label: i18n.t('menu-file-openRecent'),
            enabled: !this._hasOpenDialog,
            role: 'recentDocuments',
            submenu: [
              {
                label: i18n.t('menu-file-openRecent-clearRecent'),
                role: 'clearRecentDocuments'
              }
            ]
          };
          // Insert immediately after the Open Project menu item.
          fileMenu.submenu.splice(openProjectIndex + 1, 0, openRecentMenuItem);
        }
      }

      const windowMenu = appMenuTemplate.find(item => item.id === 'window');
      if (windowMenu) {
        windowMenu.submenu.push(
          { type: 'separator' },
          {
            id: 'bringAllToFront',
            label: i18n.t('menu-window-bringAllToFront'),
            enabled: !this._hasOpenDialog,
            role: 'front'
          }
        );
      }
    } else {
      const fileMenu = appMenuTemplate.find(item => item.id === 'file');
      if (fileMenu) {
        fileMenu.submenu.push(
          { type: 'separator' },
          {
            id: 'preferences',
            label: i18n.t('menu-app-preferences'),
            enabled: !this._hasOpenDialog,
            async click(item, focusedWindow) {
              if (focusedWindow) {
                const remoteUserSettings = userSettings.getUserSettingsForRemote();
                const payload = {
                  userSettingsJson: remoteUserSettings,
                  defaults: {
                    logDir: getDefaultLogDirectory(_wktMode),
                    level: 'info'
                  },
                  isDevMode: _wktMode.isDevelopmentMode(),
                };
                return sendToWindow(focusedWindow, 'edit-user-settings', payload);
              }

              const newWindow = await createWindow();
              newWindow.on('show', () => {
                sendToWindow(newWindow, 'edit-user-settings', userSettings.getUserSettingsForRemote());
              });
            }
          },
          { type: 'separator' },
          {
            id: 'exit',
            label: i18n.t('menu-file-exit'),
            accelerator: 'Alt+X',
            async click() { await executeAppQuit(); }          }
        );
      }

      // Use custom About dialog for non-MacOS platforms.
      // Built-in About menu not supported for Linux (in current version).
      // Built-in About menu for Windows lacks build version, has title and modal issues.
      const helpMenu = appMenuTemplate.find(item => item.id === 'help');
      if (helpMenu) {
        const wktApp = this._wktApp;
        helpMenu.submenu.push(
          { type: 'separator' },
          {
            id: 'about',
            label: i18n.t('menu-help-about'),
            accelerator: 'Alt+A',
            click(item, focusedWindow) {
              showAboutDialog(wktApp, focusedWindow);
            }
          }
        );
      }
    }

    app.setAboutPanelOptions({
      applicationName: this._wktApp.getApplicationName(),
      applicationVersion: this._wktApp.getApplicationVersion(),
      copyright: this._wktApp.getApplicationCopyright(),
      version: this._wktApp.getApplicationBuildVersion(),
      website: this._wktApp.getApplicationWebsite()
    });
    return appMenuTemplate;
  }
}

async function createWindow() {
  let x, y;

  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    const [currentWindowX, currentWindowY] = currentWindow.getPosition();
    x = currentWindowX + 10;
    y = currentWindowY + 10;
  }

  const windowSize = userSettings.getWindowSize();
  let width = 1024;
  let height = 768;
  if (windowSize) {
    width = windowSize['width'];
    height = windowSize['height'];
  }

  let newWindow = new BrowserWindow({
    x,
    y,
    show: false,
    width: width,
    height: height,
    'webPreferences': {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webviewTag: false,
      additionalArguments: _getAdditionalArguments(),
      preload: path.join(__dirname, 'ipcRendererPreload.js')
    }
  });

  const { getHttpsProxyUrl, getBypassProxyHosts } = require('./userSettings');
  const httpsProxyUrl = getHttpsProxyUrl();
  if (httpsProxyUrl) {
    const proxyBypassHosts = getBypassProxyHosts();
    await newWindow.webContents.session.setProxy({
      proxyRules: httpsProxyUrl,
      proxyBypassRules: proxyBypassHosts
    });
  }
  getLogger().debug('After proxy setup, https://static.oracle.com/ resolves to %s',
    await newWindow.webContents.session.resolveProxy('https://static.oracle.com/'));

  const thisWindowId = newWindow.id;
  windowStatus[thisWindowId] = {};
  newWindow.isReady = false;
  newWindow.skipDirtyCheck = false;

  _initializeWindow(newWindow);

  newWindow.on('focus', () => {
    createApplicationMenu(newWindow);
  });

  newWindow.on('resize', () => {
    const winSize = {
      width: newWindow.getSize()[0],
      height: newWindow.getSize()[1]
    };
    userSettings.setWindowSize(winSize);
  });

  newWindow.on('close', (event) => {
    getLogger().debug('Received window close event on Window ID %s', newWindow.id);
    if (!newWindow.skipDirtyCheck) {
      event.preventDefault();
      sendToWindow(newWindow, 'start-window-close');
    }
  });

  // eslint-disable-next-line no-unused-vars
  newWindow.on('closed', (event) => {
    getLogger().debug('Received window closed event');
    const { removeProjectWindowFromCache } = require('./project');
    removeProjectWindowFromCache(newWindow);
    delete windowStatus[thisWindowId];
    newWindow = null;
  });

  return newWindow;
}

function createNetworkWindow() {
  const width = _isJetDevMode ? 1000 : 640;
  const height = 480;
  const additionalArguments = _getAdditionalArguments();
  additionalArguments.push('--mainModule=network-page');

  let newWindow = new BrowserWindow({
    show: false,
    width: width,
    height: height,
    menuBarVisible: false,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webviewTag: false,
      additionalArguments: additionalArguments,
      preload: path.join(__dirname, 'ipcRendererPreload.js')
    }
  });

  newWindow.setMenu(null);
  newWindow.setMenuBarVisibility(false);

  const thisWindowId = newWindow.id;
  windowStatus[thisWindowId] = { noMenu: true };

  _initializeWindow(newWindow);

  newWindow.on('closed', () => {
    delete windowStatus[thisWindowId];
    newWindow = null;
  });
}

function _initializeWindow(newWindow) {
  if (_isJetDevMode) {
    newWindow.loadURL('http://localhost:8000/').then(() => newWindow.webContents.toggleDevTools());
  } else {
    newWindow.loadFile(path.join(appDir, 'web/index.html')).then();
  }

  newWindow.on('ready-to-show', () => {
    newWindow.setTitle(_wktApp.getApplicationName());
    newWindow.show();
  });
}

function setTitleFileName(currentWindow, projectFileName, isEdited) {
  let title = `${path.basename(projectFileName)} - ${_wktApp.getApplicationName()}`;
  if (isEdited) {
    title += ` (${i18n.t('title-edited')})`;
  }
  currentWindow.setTitle(title);
  currentWindow.setDocumentEdited(isEdited);
}

function getWindowStatus(window, key) {
  const config = windowStatus[window.id];
  return config ? config[key] : null;
}

function setWindowStatus(window, key, status) {
  const config = windowStatus[window.id];
  if(config) {
    config[key] = status;
  }
}

function setHasOpenDialog(window, value) {
  setWindowStatus(window, 'hasOpenDialog', value);
  if(window.isFocused()) {
    createApplicationMenu(window);
  }
}

function setTargetType(window, targetType) {
  setWindowStatus(window, 'targetType', targetType);
  if(window.isFocused()) {
    createApplicationMenu(window);
  }
}

async function chooseFromFileSystem(targetWindow, options, joinListChar) {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog(targetWindow, options)
      .then(openResponse => {
        if (!openResponse.canceled && openResponse.filePaths.length > 0) {
          if (openResponse.filePaths.length > 1) {
            let result = openResponse.filePaths;
            if (joinListChar) {
              result = result.join(joinListChar);
            }
            resolve(result);
          } else {
            resolve(openResponse.filePaths[0]);
          }
        } else {
          resolve();
        }
      })
      .catch(err => reject(new Error(err)));
  });
}

async function executeAppQuit() {
  const windows = BrowserWindow.getAllWindows();
  getLogger().debug('Quit called with %d window(s) open', windows.length);
  if (windows.length > 0) {
    for (const window of windows) {
      // Only send the start-app-quit message to full-fledged project windows.
      // Any other windows aren't listening for the start-app-quit message
      // and therefore, will never respond with window-app-close message.
      //
      if (Object.prototype.hasOwnProperty.call(window,'isReady')) {
        getLogger().debug('sending start-app-quit to window id %d', window.id);
        sendToWindow(window, 'start-app-quit');
      } else {
        getLogger().debug('skipping start-app-close message for window id %d', window.id);
        window.close();
      }
    }
  } else {
    // If Quit is called with no open windows, just quit.  This handles the case where,
    // on MacOS, the About Window is the last window open.  It is a special dialog window
    // that is not included in the BrowserWindow.getAllWindows()...
    //
    app.quit();
  }
}

// returns true if project has one window
function isSingleWindow() {
  return BrowserWindow.getAllWindows().length === 1;
}

// close the specified window
function closeWindow(window) {
  window.close();
}

// restore the window to a clean state.
// assume the web content has already been cleaned.
function clearWindow(window) {
  window.setTitle(_wktApp.getApplicationName());
}

async function showErrorMessage(currentWindow, title, message, messageType) {
  const type = messageType ? messageType : 'error';
  return dialog.showMessageBox(currentWindow, {
    title: title,
    message: message,
    type: type,
    buttons: [ i18n.t('button-ok') ],
    defaultId: 0,
    cancelId: 0
  }).then(() => {
    // HACK - On MacOS, the focus event isn't fired after this dialog is closed, so the menu isn't rebuilt.
    // The busy dialog (a browser popup) is sometimes slow in closing so it closes while this dialog is open,
    // resulting in the menus remaining disabled after this dialog is closed.
    // To work around the problem, regenerate the menu when this dialog closes.
    //
    if (osUtils.isMac()) {
      createApplicationMenu(currentWindow);
    }
  });
}

function createApplicationMenu(newWindow) {
  const noMenu = getWindowStatus(newWindow, 'noMenu');
  if(noMenu) {
    return Menu.setApplicationMenu(null);
  }

  const hasOpenDialog = getWindowStatus(newWindow, 'hasOpenDialog');
  const targetType = getWindowStatus(newWindow, 'targetType');
  const appMenuTemplate = new WktAppMenu(hasOpenDialog, targetType).appMenuTemplate;
  let menu = Menu.buildFromTemplate(appMenuTemplate);

  // blur the focused item in the renderer when a top-level menu item is opened.
  // if the focused item is a Jet control, this will cause its value to be set.
  for(let key in menu.items) {
    let item = menu.items[key];
    item.submenu.on('menu-will-show', () => {
      getLogger().debug('got menu-will-show event');
      sendToWindow(newWindow, 'blur-focused-item');
    });
  }

  return Menu.setApplicationMenu(menu);
}

async function promptUserForYesOrNoAnswer(targetWindow, title, message) {
  return new Promise(resolve => {
    dialog.showMessageBox(targetWindow, {
      title: title,
      message: message,
      type: 'question',
      buttons: [ i18n.t('button-no'), i18n.t('button-yes') ],
      defaultId: 1,
      cancelId: 0
    }).then(dialogResponse => {
      resolve(!!dialogResponse.response);
    });
  });
}

async function promptUserForYesNoOrCancelAnswer(targetWindow, title, question, details) {
  return new Promise(resolve => {
    dialog.showMessageBox(targetWindow, {
      title: title,
      message: question,
      detail: details,
      type: 'question',
      buttons: [ i18n.t('button-cancel'), i18n.t('button-no'), i18n.t('button-yes') ],
      defaultId: 1,
      cancelId: 0
    }).then(dialogResponse => {
      let response;
      switch (dialogResponse.response) {
        case 2:
          response = 'yes';
          break;

        case 1:
          response = 'no';
          break;

        case 0:
          response = 'cancel';
          break;
      }
      resolve(response);
    });
  });
}

async function promptUserForOkOrCancelAnswer(targetWindow, title, message) {
  return new Promise(resolve => {
    dialog.showMessageBox(targetWindow, {
      title: title,
      message: message,
      type: 'question',
      buttons: [ i18n.t('button-ok'), i18n.t('button-cancel') ],
      defaultId: 0,
      cancelId: 1
    }).then(dialogResponse => {
      resolve(!dialogResponse.response);
    });
  });
}

// Arguments added here should be passed to the browser's window.process.argv array.
function _getAdditionalArguments() {
  let extraArgs = [];

  if (_wktMode.isExecutableMode()) {
    extraArgs.push('--wktMode=exe');
  } else {
    extraArgs.push('--wktMode=dev');
  }

  if (extraArgs.length === 0) {
    extraArgs = undefined;
  }
  return extraArgs;
}

module.exports = {
  chooseFromFileSystem,
  clearWindow,
  closeWindow,
  createNetworkWindow,
  createWindow,
  initialize,
  isSingleWindow,
  setTitleFileName,
  setHasOpenDialog,
  setTargetType,
  showErrorMessage,
  promptUserForOkOrCancelAnswer,
  promptUserForYesOrNoAnswer,
  promptUserForYesNoOrCancelAnswer
};
