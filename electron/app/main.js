/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');

const WktMode = require('./js/wktMode');
const WktApp = require('./js/wktApp');

// The i18n package is required here to ensure it is initialized before the logging system.
const i18n = require('./js/i18next.config');
const { initializeLoggingSystem, logRendererMessage } = require('./js/wktLogging');
const userSettings = require('./js/userSettings');
const { chooseFromFileSystem, createNetworkWindow, createWindow, initialize, setHasOpenDialog, setTargetType,
  showErrorMessage, promptUserForOkOrCancelAnswer, promptUserForYesOrNoAnswer, promptUserForYesNoOrCancelAnswer } =
  require('./js/wktWindow');
const project = require('./js/project');
const wktTools = require('./js/wktTools');
const wdtArchive = require('./js/wdtArchive');
const wdtDiscovery = require('./js/wdtDiscovery');
const javaUtils = require('./js/javaUtils');
const oracleHomeUtils = require('./js/oracleHomeUtils');
const domainHomeUtils = require('./js/domainHomeUtils');
const connectivityUtils = require('./js/connectivityUtils');
const fsUtils = require('./js/fsUtils');
const witInspect = require('./js/witInspect');
const witCache = require('./js/witCache');
const imageBuilderUtils = require('./js/imageBuilderUtils');
const witCreate = require('./js/witCreate');
const kubectlUtils = require('./js/kubectlUtils');
const helmUtils = require('./js/helmUtils');
const openSSLUtils = require('./js/openSSLUtils');
const osUtils = require('./js/osUtils');
const { initializeAutoUpdater, registerAutoUpdateListeners, installUpdates, getUpdateInformation } = require('./js/appUpdater');
const { startWebLogicRemoteConsoleBackend, getDefaultDirectoryForOpenDialog, setWebLogicRemoteConsoleHomeAndStart,
  getDefaultWebLogicRemoteConsoleHome, getWebLogicRemoteConsoleBackendPort
} = require('./js/wlRemoteConsoleUtils');

const { getHttpsProxyUrl, getBypassProxyHosts } = require('./js/userSettings');
const { sendToWindow } = require('./js/windowUtils');

const WKT_CONSOLE_STDOUT_CHANNEL = 'show-console-out-line';
const WKT_CONSOLE_STDERR_CHANNEL = 'show-console-err-line';

/* global process */
class Main {
  constructor(isJetDevMode) {
    this._isJetDevMode = isJetDevMode;
    this._wktMode = new WktMode(process.argv[0]);
    this._wktApp = new WktApp(this._wktMode);
    // the project file to be opened when the app is ready (command-line, double-click, etc.)
    this._initialProjectFile = null;
    this._tempDir = app.getPath('temp');
    this._logger = initializeLoggingSystem(this._wktMode, this._wktApp, this._tempDir);
    wktTools.initialize(this._wktMode);
    initialize(this._isJetDevMode, this._wktApp, this._wktMode);    // wktWindow.js
    this._startupDialogsShownAlready = false;
    this._appUpdatePromise = null;
    initializeAutoUpdater(this._logger, this._isJetDevMode);
    this._forceQuit = false;
  }

  runApp(argv) {
    // enforce a single instance of the application
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      // if this isn't the first instance, quit now.
      // the parameters were passed to the first instance with the requestSingleInstanceLock() call.
      // the first instance will receive these in the second-instance event (see below).
      const fileArg = this.getFileArgFromCommandLine(argv);
      if (fileArg) {
        this._logger.info('Opening file %s in the already running instance; this instance will exit.', fileArg);
      } else {
        this._logger.warn('Unable to get the instance lock so exiting.');
      }
      app.quit();
    } else {
      registerAutoUpdateListeners();
      this.registerAppListeners(argv);
      this.registerIpcListeners();
      this.registerIpcHandlers();
    }
  }

  registerAppListeners(argv) {
    // The open-file event is MacOS only.
    // This needs to be at the top level to catch OS requests to open the app with a file on MacOS.
    //
    app.on('open-file', (event, filePath) => {
      this._logger.debug('Received open-file event for %s', filePath);
      if (project.isWktProjectFile(filePath)) {
        const existingProjectWindow = project.getWindowForProject(filePath);
        if (existingProjectWindow) {
          project.showExistingProjectWindow(existingProjectWindow);

        } else if (!app.isReady()) {
          // when the app is started by double-clicking on a project file,
          // the open-file event fires before ready, so remember this file to open on ready.
          this._initialProjectFile = filePath;

        } else {
          // if the app is ready, open a new window for this project file
          createWindow(this._isJetDevMode, this._wktApp).then(win => {
            win.once('ready-to-show', () => {
              this.openProjectFileInWindow(win, filePath);
            });
          });
        }
      }
    });

    // if a second instance of the app attempted to start, that instance has quit,
    // and its parameters are received by this event.
    // use the command-line to open the requested project file, if present.
    app.on('second-instance', (event, commandLine) => {
      this._logger.debug('Received second-instance event: %s', JSON.stringify(commandLine));

      const filePath = this.getFileArgFromCommandLine(commandLine);
      if (filePath) {
        this._logger.info('File argument from second instance: %s', filePath);
        const existingProjectWindow = project.getWindowForProject(filePath);
        if (existingProjectWindow) {
          project.showExistingProjectWindow(existingProjectWindow);
          return;
        }

        createWindow(this._isJetDevMode, this._wktApp).then(win => {
          win.once('ready-to-show', () => {
            this.openProjectFileInWindow(win, filePath);
          });
        });
      }
    });

    app.on('ready', () => {
      this._logger.debug('Received ready event');
      this.checkSetup().then(setupOk => {
        if(setupOk) {
          // this may have been set in open-file event
          let filePath = this._initialProjectFile;

          // check the command line for project file
          if (!filePath) {
            filePath = this.getFileArgFromCommandLine(argv);
            if (filePath) {
              this._logger.debug('Found file argument on command-line: %s', filePath);
              const existingProjectWindow = project.getWindowForProject(filePath);
              if (existingProjectWindow) {
                project.showExistingProjectWindow(existingProjectWindow);
                return;
              }
            }
          }

          createWindow(this._isJetDevMode, this._wktApp).then(win => {
            startWebLogicRemoteConsoleBackend(win).then();

            if (filePath) {
              win.once('ready-to-show', () => {
                this.openProjectFileInWindow(win, filePath);
              });
            }
          });
        }
      });
    });

    app.on('activate', async (event, hasVisibleWindows) => {
      this._logger.debug('Received activate event when app is %s: hasVisibleWindows = %s',
        app.isReady() ? 'ready': 'not ready', hasVisibleWindows);
      // activate is also called to bring window to the front...
      if (app.isReady() && !hasVisibleWindows) {
        await createWindow(this._isJetDevMode);
      } else if (!app.isReady()) {
        this._logger.warn('activate called before app was ready');
      }
      // else bring window to front default behavior...
    });

    // eslint-disable-next-line no-unused-vars
    app.on('window-all-closed', (event) => {
      this._logger.debug('Received window-all-closed event');
      if (process.platform === 'darwin' && !this._forceQuit) {
        this._logger.debug('window-all-closed event does not have force quit flag set');
        return false;
      }
      app.quit();
    });

    app.on('before-quit', () => {
      this._logger.debug('Received before-quit event');
      this._forceQuit = true;
    });

    app.on('will-quit', () => {
      this._logger.debug('Received will-quit event');
      try {
        userSettings.saveUserSettings();
        this._logger.info('User Settings saved');
      } catch (err) {
        this._logger.error('User settings save failed: %s', err);
      }
    });
  }

  registerIpcListeners() {
    ipcMain.on('window-is-ready', (event) => {
      this._logger.debug('Received window-is-ready for window %d', event.sender.getOwnerBrowserWindow().id);
      const currentWindow = event.sender.getOwnerBrowserWindow();
      currentWindow.isReady = true;

      project.sendProjectOpened(currentWindow).then(async () => {
        if (!this._startupDialogsShownAlready) {
          const startupInformation = {
            skipQuickstart: userSettings.getSkipQuickstartAtStartup()
          };

          // This should never be null by the time it gets to this point but check anyway...
          if (this._appUpdatePromise) {
            this._appUpdatePromise.then(updateResult => {
              if (updateResult) {
                startupInformation.update = updateResult;
              }

              sendToWindow(currentWindow, 'show-startup-dialogs', startupInformation);
              const port = getWebLogicRemoteConsoleBackendPort();
              this._logger.debug('Sending Remote Console backend port %s to Window ID %s', port, currentWindow.id);
              sendToWindow(currentWindow, 'set-wrc-backend-port', port);
            });
          }

          this._startupDialogsShownAlready = true;
        } else {
          const port = getWebLogicRemoteConsoleBackendPort();
          this._logger.debug('Sending Remote Console backend port %s to Window ID %s', port, currentWindow.id);
          sendToWindow(currentWindow, 'set-wrc-backend-port', port);
        }
      });
    });

    ipcMain.on('open-project', async (event, projectFile, isDirty) => {
      try {
        const currentWindow = event.sender.getOwnerBrowserWindow();
        await project.openProjectFile(currentWindow, projectFile, isDirty);
      } catch (e) {
        this._logger.error(e);
      }
    });

    ipcMain.on('new-project', async (event, projectFile, isDirty) => {
      try {
        const currentWindow = event.sender.getOwnerBrowserWindow();
        await project.initializeNewProject(currentWindow, projectFile, isDirty);
      } catch (e) {
        this._logger.error(e);
      }
    });

    ipcMain.on('close-window', async (event) => {
      const currentWindow = event.sender.getOwnerBrowserWindow();
      currentWindow.skipDirtyCheck = true;
      currentWindow.close();
    });

    ipcMain.on('window-app-quit', async (event) => {
      const currentWindow = event.sender.getOwnerBrowserWindow();
      // Closing the window does not immediately remove it from the BrowserWindow.getAllWindows()
      // call so register a window listener on the 'closed' event to determine when all windows
      // have closed.
      //
      currentWindow.on('closed', () => {
        const numWindows = BrowserWindow.getAllWindows().length;
        this._logger.debug('Received window closed event, %s remaining window(s)', numWindows);
        if (numWindows === 0) {
          this._forceQuit = true;
          app.quit();
        }
      });

      currentWindow.skipDirtyCheck = true;
      await currentWindow.close();
    });

    // eslint-disable-next-line no-unused-vars
    ipcMain.on('skip-quickstart-at-startup', async (event) => {
      userSettings.setSkipQuickstartAtStartup(true);
    });

    ipcMain.on('set-has-open-dialog', (event, hasOpenDialogs) => {
      const window = event.sender.getOwnerBrowserWindow();
      return setHasOpenDialog(window, hasOpenDialogs);
    });

    ipcMain.on('set-divider-location', (event, name, percent) => {
      return userSettings.setDividerLocation(name, percent);
    });

    ipcMain.on('set-navigation-collapsed', (event, collapsed) => {
      return userSettings.setNavigationCollapsed(collapsed);
    });

    ipcMain.on('set-target-type', (event, targetType) => {
      const window = event.sender.getOwnerBrowserWindow();
      return setTargetType(window, targetType);
    });

    ipcMain.on('log-remote-message', (event, logLevel, logMessage, ...logArgs) => {
      const window = event.sender.getOwnerBrowserWindow();
      logRendererMessage(window.id, logLevel, logMessage, ...logArgs);
    });
  }

  registerIpcHandlers() {
    // eslint-disable-next-line no-unused-vars
    ipcMain.handle('get-https-proxy-url', (event) => {
      return getHttpsProxyUrl();
    });

    // eslint-disable-next-line no-unused-vars
    ipcMain.handle('get-bypass-proxy-hosts', (event) => {
      return getBypassProxyHosts();
    });

    ipcMain.handle('get-divider-locations', () => {
      return userSettings.getDividerLocations();
    });

    ipcMain.handle('get-navigation-collapsed', () => {
      return userSettings.getNavigationCollapsed();
    });

    ipcMain.handle('open-external-link', async (event, link) => {
      this.openExternalLink(link);
    });

    ipcMain.handle('is-dev-mode', () => {
      return this._wktMode.isDevelopmentMode();
    });

    ipcMain.handle('get-latest-wko-image-name', async () => {
      return wktTools.getLatestWkoImageName();
    });

    ipcMain.handle('get-image-tool-shell-script-location', () => {
      return wktTools.getImagetoolShellScript();
    });

    ipcMain.handle('get-jdk-installer-location', async (event) => {
      const title = i18n.t('dialog-getJdkInstaller');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        defaultPath: app.getPath('downloads'),
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent' ]
      });
    });

    ipcMain.handle('get-fmw-installer-location', async (event) => {
      const title = i18n.t('dialog-getOracleInstaller');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        defaultPath: app.getPath('downloads'),
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent' ]
      });
    });

    ipcMain.handle('get-wdt-installer-location', async (event) => {
      const title = i18n.t('dialog-getWdtInstaller');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        defaultPath: app.getPath('downloads'),
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent' ]
      });
    });

    ipcMain.handle('get-image-builder-exe', async (event, builderName) => {
      const title = i18n.t('dialog-image-builder-exe', { builderName: builderName });
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent' ]
      });
    });

    ipcMain.handle('get-kubectl-exe', async (event) => {
      const title = i18n.t('dialog-getKubectlExe');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent']
      });
    });

    ipcMain.handle('get-kube-config-files', async (event) => {
      const title = i18n.t('dialog-getKubeConfigFiles');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        defaultPath: path.join(app.getPath('home'), '.kube'),
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'multiSelections', 'dontAddToRecent' ]
      }, path.delimiter);
    });

    ipcMain.handle('get-helm-exe', async (event) => {
      const title = i18n.t('dialog-getHelmExe');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent']
      });
    });

    ipcMain.handle('get-openssl-exe', async (event) => {
      const title = i18n.t('dialog-getOpenSSLExe');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent']
      });
    });

    ipcMain.handle('get-additional-image-build-commands-file', async (event) => {
      const title = i18n.t('dialog-getAdditionalImageBuildCommandsFile');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent']
      });
    });

    ipcMain.handle('get-additional-image-build-files', async (event) => {
      const title = i18n.t('dialog-getAdditionalBuildFiles');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'multiSelections', 'dontAddToRecent']
      });
    });

    ipcMain.handle('choose-domain-home', async (event, oracleHome) => {
      const title = i18n.t('dialog-chooseDomainHome');
      this._logger.debug('Choosing domain home with oracle home %s', oracleHome);
      const defaultLocation = await oracleHomeUtils.findDomainsDefaultDirectory(oracleHome);
      this._logger.debug('Choosing domain home with default location %s', defaultLocation);

      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        defaultPath: defaultLocation,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openDirectory', 'dontAddToRecent']
      });
    });

    ipcMain.handle('choose-archive-file', async (event) => {
      return project.chooseArchiveFile(event.sender.getOwnerBrowserWindow());
    });

    ipcMain.handle('choose-archive-entry', async (event, itemType) => {
      return wdtArchive.chooseArchiveEntry(event.sender.getOwnerBrowserWindow(), itemType);
    });

    ipcMain.handle('get-archive-entry-types', async () => {
      return wdtArchive.getEntryTypes();
    });

    ipcMain.handle('choose-java-home', async (event, defaultPath) => {
      const title = i18n.t('dialog-chooseJavaHome');
      const defaultDir = await javaUtils.getSelectJavaHomeDefaultPath(defaultPath);
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        defaultPath: defaultDir ? defaultDir : '',
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openDirectory', 'dontAddToRecent']
      });
    });

    ipcMain.handle('choose-model-file', async (event) => {
      return project.chooseModelFile(event.sender.getOwnerBrowserWindow());
    });

    ipcMain.handle('choose-oracle-home', async (event, defaultPath) => {
      const title = i18n.t('dialog-chooseOracleHome');
      const defaultDir = await oracleHomeUtils.getSelectOracleHomeDefaultPath(defaultPath);
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        defaultPath: defaultDir ? defaultDir : '',
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openDirectory', 'dontAddToRecent']
      });
    });

    ipcMain.handle('choose-variable-file', async (event) => {
      return project.chooseVariableFile(event.sender.getOwnerBrowserWindow());
    });

    ipcMain.handle('choose-extra-path-directory', async (event) => {
      const title = i18n.t('dialog-chooseExtraPathDirectory');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openDirectory', 'dontAddToRecent']
      });
    });

    ipcMain.handle('get-java-home', async () => {
      return javaUtils.tryToComputeJavaHome();
    });

    ipcMain.handle('get-oracle-home', async () => {
      return oracleHomeUtils.tryToComputeOracleHome();
    });

    ipcMain.handle('get-log-file-directory-location', async (event) => {
      const title = i18n.t('dialog-chooseLogFileDirectory');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        createDirectory: true,
        promptToCreate: true,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openDirectory', 'dontAddToRecent']
      });
    });

    ipcMain.handle('save-user-settings', async (event, userSettingsObj) => {
      const currentWindow = event.sender.getOwnerBrowserWindow();
      try {
        userSettings.applyUserSettingsFromRemote(userSettingsObj);
        dialog.showMessageBox(currentWindow, {
          type: 'info',
          title: i18n.t('dialog-preference-save-success-title'),
          message: i18n.t('dialog-preference-save-success-message'),
          buttons: [
            i18n.t('button-ok')
          ],
          defaultId: 0,
          cancelId: 0
        }).then();
      } catch (err) {
        dialog.showMessageBox(currentWindow, {
          type: 'error',
          title: i18n.t('dialog-preference-save-error-title'),
          message: i18n.t('dialog-preference-save-error-message', { error: err }),
          buttons: [
            i18n.t('button-ok')
          ],
          defaultId: 0,
          cancelId: 0
        }).then();
      }
    });

    // eslint-disable-next-line no-unused-vars
    ipcMain.handle('get-url-catalog', async (event) => {
      const catalogJsonFile = path.join(this._wktMode.getExtraResourcesDirectory(this._logger), 'url-catalog.json');
      return new Promise((resolve, reject) => {
        fsUtils.exists(catalogJsonFile).then(doesExist => {
          if (!doesExist) {
            return reject(new Error(`URL catalog file ${catalogJsonFile} does not exist`));
          }

          try {
            const catalogObject = require(catalogJsonFile);
            resolve(JSON.stringify(catalogObject));
          } catch (err) {
            reject(new Error(`Failed to load and parse URL catalog file ${catalogJsonFile}: ${err}`));
          }
        });
      });
    });

    // eslint-disable-next-line no-unused-vars
    ipcMain.handle('get-wdt-domain-types', async (event) => {
      return wktTools.getWdtSupportedDomainTypes();
    });

    ipcMain.handle('get-image-contents',
      async (event, javaHome, imageTag, options) => {
        const myOptions = Object.assign({}, options);
        myOptions['javaHome'] = javaHome;

        return witInspect.inspectImage(imageTag, myOptions);
      });

    ipcMain.handle('confirm-project-file',async (event) => {
      return project.confirmProjectFile(event.sender.getOwnerBrowserWindow());
    });

    ipcMain.handle('choose-project-file',async (event) => {
      return project.chooseProjectFile(event.sender.getOwnerBrowserWindow());
    });

    ipcMain.handle('save-project',async (event, projectFile, projectContents,
      externalFileContents) => {
      return project.saveProject(event.sender.getOwnerBrowserWindow(), projectFile, projectContents, externalFileContents);
    });

    ipcMain.handle('close-project', async (event, keepWindow) => {
      return project.closeProject(event.sender.getOwnerBrowserWindow(), keepWindow);
    });

    ipcMain.handle('prompt-save-before-close',async (event) => {
      return project.promptSaveBeforeClose(event.sender.getOwnerBrowserWindow());
    });

    ipcMain.handle('export-archive-file', async (event, archivePath, projectFile) => {
      return project.exportArchiveFile(event.sender.getOwnerBrowserWindow(), archivePath, projectFile);
    });

    ipcMain.handle('run-offline-discover',async (event, discoverConfig) => {
      return wdtDiscovery.runOfflineDiscover(event.sender.getOwnerBrowserWindow(), discoverConfig);
    });

    ipcMain.handle('run-online-discover',async (event, discoverConfig) => {
      return wdtDiscovery.runOnlineDiscover(event.sender.getOwnerBrowserWindow(), discoverConfig);
    });

    ipcMain.handle('validate-java-home', async (event, javaHomeDirectory, errPrefix) => {
      return javaUtils.validateJavaHomeNoWindow(javaHomeDirectory, errPrefix);
    });

    ipcMain.handle('validate-oracle-home', async (event, oracleHomeDirectory, errPrefix) => {
      return oracleHomeUtils.validateOracleHomeNoWindow(oracleHomeDirectory, errPrefix);
    });

    ipcMain.handle('validate-domain-home', async (event, domainHome, errPrefix) => {
      return domainHomeUtils.validateDomainHome(domainHome, errPrefix);
    });

    ipcMain.handle('show-info-message', async (event, title, message) => {
      return showErrorMessage(event.sender.getOwnerBrowserWindow(), title, message, 'info');
    });

    ipcMain.handle('show-error-message', async (event, title, message) => {
      return showErrorMessage(event.sender.getOwnerBrowserWindow(), title, message);
    });

    ipcMain.handle('prepare-model', async (event, prepareConfig) => {
      const { prepareModel } = require('./js/wdtPrepareModel');
      return prepareModel(event.sender.getOwnerBrowserWindow(), WKT_CONSOLE_STDOUT_CHANNEL, WKT_CONSOLE_STDERR_CHANNEL, prepareConfig);
    });

    ipcMain.handle('validate-model', async (event, validateConfig) => {
      const { validateModel } = require('./js/wdtValidateModel');
      return validateModel(event.sender.getOwnerBrowserWindow(), WKT_CONSOLE_STDOUT_CHANNEL, WKT_CONSOLE_STDERR_CHANNEL, validateConfig);
    });

    ipcMain.handle('verify-files-exist', async (event, baseDirectory, ...files) => {
      this._logger.debug(...files);
      return fsUtils.verifyFilesExist(baseDirectory, ...files);
    });

    ipcMain.handle('verify-file-exists', async (event, file) => {
      return fsUtils.exists(file);
    });

    ipcMain.handle('yes-or-no-prompt', async (event, title, question) => {
      return promptUserForYesOrNoAnswer(event.sender.getOwnerBrowserWindow(), title, question);
    });

    ipcMain.handle('yes-no-or-cancel-prompt', async (event, title, question, details) => {
      return promptUserForYesNoOrCancelAnswer(event.sender.getOwnerBrowserWindow(), title, question, details);
    });

    ipcMain.handle('ok-or-cancel-prompt', async (event, title, question) => {
      return promptUserForOkOrCancelAnswer(event.sender.getOwnerBrowserWindow(), title, question);
    });

    ipcMain.handle('get-latest-wdt-installer', async (event) => {
      return this.getLatestWdtInstaller(event.sender.getOwnerBrowserWindow());
    });

    ipcMain.handle('wit-cache-installers', async (event, cacheConfig) => {
      return witCache.cacheInstallers(cacheConfig);
    });

    ipcMain.handle('do-image-registry-login', async (event, imageBuilderOptions, loginConfig) => {
      return imageBuilderUtils.doLogin(imageBuilderOptions, loginConfig);
    });

    ipcMain.handle('validate-image-builder-exe', async (event, imageBuilderExe) => {
      return imageBuilderUtils.validateImageBuilderExecutable(imageBuilderExe);
    });

    ipcMain.handle('wit-create-image', async (event, createConfig) => {
      return witCreate.createImage(event.sender.getOwnerBrowserWindow(), WKT_CONSOLE_STDOUT_CHANNEL,
        WKT_CONSOLE_STDOUT_CHANNEL, createConfig);
    });

    ipcMain.handle('wit-create-aux-image', async (event, createConfig) => {
      return witCreate.createAuxImage(event.sender.getOwnerBrowserWindow(), WKT_CONSOLE_STDOUT_CHANNEL,
        WKT_CONSOLE_STDOUT_CHANNEL, createConfig);
    });

    ipcMain.handle('validate-image-exists-locally', async (event, imageBuilderOptions, imageTag) => {
      return imageBuilderUtils.validateImageExistsLocally(imageBuilderOptions, imageTag);
    });

    ipcMain.handle('do-push-image', async (event, imageBuilderOptions, imageTag, options) => {
      return imageBuilderUtils.doPushImage(event.sender.getOwnerBrowserWindow(), WKT_CONSOLE_STDOUT_CHANNEL,
        WKT_CONSOLE_STDERR_CHANNEL, imageBuilderOptions, imageTag, options);
    });

    ipcMain.handle('kubectl-get-current-context', async (event, kubectlExe, kubectlOptions) => {
      return kubectlUtils.getCurrentContext(kubectlExe, kubectlOptions);
    });

    ipcMain.handle('kubectl-set-current-context', async (event, kubectlExe, context, kubectlOptions) => {
      return kubectlUtils.setCurrentContext(kubectlExe, context, kubectlOptions);
    });

    ipcMain.handle('validate-kubectl-exe', async (event, kubectlExe) => {
      return kubectlUtils.validateKubectlExe(kubectlExe);
    });

    ipcMain.handle('kubectl-verify-connection', async (event, kubectlExe, kubectlOptions) => {
      return kubectlUtils.verifyClusterConnectivity(kubectlExe, kubectlOptions);
    });

    ipcMain.handle('validate-helm-exe', async (event, helmExe) => {
      return helmUtils.validateHelmExe(helmExe);
    });

    ipcMain.handle('validate-k8s-namespaces-exist', async (event, kubectlExe, kubectlOptions, ...namespaces) => {
      return kubectlUtils.validateNamespacesExist(kubectlExe, kubectlOptions, ...namespaces);
    });

    ipcMain.handle('validate-wko-domain-exist', async (event, kubectlExe, kubectlOptions, domain, namespace) => {
      return kubectlUtils.validateDomainExist(kubectlExe, kubectlOptions, domain, namespace);
    });

    ipcMain.handle('is-wko-installed', async (event, kubectlExe, operatorName, operatorNamespace, kubectlOptions) => {
      return kubectlUtils.isOperatorAlreadyInstalled(kubectlExe, operatorName, operatorNamespace, kubectlOptions);
    });

    ipcMain.handle('k8s-create-namespace', async (event, kubectlExe, namespace, kubectlOptions) => {
      return kubectlUtils.createNamespaceIfNotExists(kubectlExe, namespace, kubectlOptions);
    });

    ipcMain.handle('k8s-create-namespaces', async (event, kubectlExe, kubectlOptions, ...namespaces) => {
      return kubectlUtils.createNamespacesIfNotExists(kubectlExe, kubectlOptions, ...namespaces);
    });

    ipcMain.handle('k8s-create-service-account', async (event, kubectlExe, namespace, serviceAccount, kubectlOptions) => {
      return kubectlUtils.createServiceAccountIfNotExists(kubectlExe, namespace, serviceAccount, kubectlOptions);
    });

    ipcMain.handle('k8s-create-pull-secret', async (event, kubectlExe, namespace, secret, secretData, kubectlOptions) => {
      return kubectlUtils.createOrReplacePullSecret(kubectlExe, namespace, secret, secretData, kubectlOptions);
    });

    ipcMain.handle('k8s-create-generic-secret', async (event, kubectlExe, namespace, secret, secretData, kubectlOptions) => {
      return kubectlUtils.createOrReplaceGenericSecret(kubectlExe, namespace, secret, secretData, kubectlOptions);
    });

    ipcMain.handle('k8s-create-tls-secret', async (event, kubectlExe, namespace, secret, key, cert, kubectlOptions) => {
      return kubectlUtils.createOrReplaceTLSSecret(kubectlExe, namespace, secret, key, cert, kubectlOptions);
    });

    ipcMain.handle('k8s-apply', async (event, kubectlExe, fileData, kubectlOptions) => {
      return kubectlUtils.apply(kubectlExe, fileData, kubectlOptions);
    });

    ipcMain.handle('k8s-label-namespace', async (event, kubectlExe, namespace, label, kubectlOptions) => {
      return kubectlUtils.createNamespaceLabelIfNotExists(kubectlExe, namespace, label, kubectlOptions);
    });

    ipcMain.handle('k8s-delete-object', async (event, kubectlExe, namespace, object, kind, kubectlOptions) => {
      this._logger.debug('k8s-delete-object called for %s %s %s', kind, object, namespace ? `from namespace ${namespace}` : '');
      return kubectlUtils.deleteObjectIfExists(kubectlExe, namespace, object, kind, kubectlOptions);
    });

    ipcMain.handle('helm-add-wko-chart', async (event, helmExe, helmOptions) => {
      return helmUtils.addOrUpdateWkoHelmChart(helmExe, helmOptions);
    });

    ipcMain.handle('helm-install-wko', async (event, helmExe, helmReleaseName, operatorNamespace, helmChartValues, helmOptions) => {
      return helmUtils.installWko(helmExe, helmReleaseName, operatorNamespace, helmChartValues, helmOptions);
    });

    ipcMain.handle('helm-uninstall-wko', async (event, helmExe, helmReleaseName, operatorNamespace, helmOptions) => {
      return helmUtils.uninstallWko(helmExe, helmReleaseName, operatorNamespace, helmOptions);
    });

    ipcMain.handle('helm-update-wko', async (event, helmExe, operatorName, operatorNamespace, helmChartValues, helmOptions) => {
      return helmUtils.updateWko(helmExe, operatorName, operatorNamespace, helmChartValues, helmOptions);
    });

    ipcMain.handle('helm-list-all-namespaces', async (event, helmExe, helmOptions) => {
      return helmUtils.helmListAllNamespaces(helmExe, helmOptions);
    });

    ipcMain.handle('helm-add-update-repo', async (event, helmExe, repoName, repoUrl, helmOptions) => {
      return helmUtils.addOrUpdateHelmChart(helmExe, repoName, repoUrl, helmOptions);
    });

    ipcMain.handle('helm-install-ingress-controller',
      async (event, helmExe, ingressControllerName, ingressChartName, ingressControllerNamespace, helmChartValues, helmOptions) => {
        return helmUtils.installIngressController(helmExe, ingressControllerName, ingressChartName, ingressControllerNamespace, helmChartValues, helmOptions);
      }
    );

    ipcMain.handle('helm-uninstall-ingress-controller', async (event, helmExe, ingressControllerName, ingressControllerNamespace, helmOptions) => {
      return helmUtils.uninstallIngressController(helmExe, ingressControllerName, ingressControllerNamespace, helmOptions);
    });

    ipcMain.handle('openssl-generate-certs', async (event, openSSLExe, keyOut, certOut, subject) => {
      return openSSLUtils.generateTLSFiles(openSSLExe, keyOut, certOut, subject);
    });

    ipcMain.handle('validate-openssl-exe', async (event, openSSLExe) => {
      return openSSLUtils.validateOpenSSLExe(openSSLExe);
    });

    ipcMain.handle('k8s-get-service-details', async (event, kubectlExe, ingressNamespace, serviceName, options) => {
      return kubectlUtils.getServiceDetails(kubectlExe, ingressNamespace, serviceName, options);
    });

    ipcMain.handle('k8s-get-ingresses', async (event, kubectlExe, namespace, serviceType, options) => {
      return kubectlUtils.getIngresses(kubectlExe, namespace, serviceType, options);
    });

    ipcMain.handle('k8s-get-k8s-config', async (event, kubectlExe, options) => {
      return kubectlUtils.getK8sConfigView(kubectlExe, options);
    });

    ipcMain.handle('k8s-get-k8s-cluster-info', async (event, kubectlExe, options) => {
      return kubectlUtils.getK8sClusterInfo(kubectlExe, options);
    });

    ipcMain.handle('k8s-get-wko-domain-status', async (event, kubectlExe, domainUID, domainNamespace, options) => {
      return kubectlUtils.getWkoDomainStatus(kubectlExe, domainUID, domainNamespace, options);
    });

    ipcMain.handle('k8s-get-operator-status', async (event, kubectlExe, operatorNamespace, options) => {
      return kubectlUtils.getOperatorStatus(kubectlExe, operatorNamespace, options);
    });

    ipcMain.handle('k8s-get-operator-log', async (event, kubectlExe, operatorNamespace, options) => {
      return kubectlUtils.getOperatorLogs(kubectlExe, operatorNamespace, options);
    });

    ipcMain.handle('k8s-get-operator-version-from-domain-config-map', async (event, kubectlExe, domainNamespace, options) => {
      return kubectlUtils.getOperatorVersionFromDomainConfigMap(kubectlExe, domainNamespace, options);
    });

    ipcMain.handle('get-tls-keyfile', async (event) => {
      const title = i18n.t('dialog-tls-keyfile', {});
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent' ]
      });
    });

    ipcMain.handle('get-tls-certfile', async (event) => {
      const title = i18n.t('dialog-tls-certfile', {});
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent' ]
      });
    });

    ipcMain.handle('get-network-settings', async () => {
      return {
        proxyUrl: getHttpsProxyUrl(),
        bypassHosts: getBypassProxyHosts(),
        timeout: userSettings.getConnectivityTestTimeout()
      };
    });

    ipcMain.handle('try-network-settings', async (event, settings) => {
      return connectivityUtils.testInternetConnectivity(settings['proxyUrl'], settings['timeout']);
    });

    ipcMain.handle('restart-network-settings', async (event, settings) => {
      userSettings.setHttpsProxyUrl(settings['proxyUrl']);
      userSettings.setBypassProxyHosts(settings['bypassHosts']);
      userSettings.setConnectivityTestTimeout(settings['timeout']);
      userSettings.saveUserSettings();
      app.relaunch();
      app.quit();
    });

    ipcMain.handle('install-app-update', async (event, installType) => {
      const window = event.sender.getOwnerBrowserWindow();
      return installUpdates(window, installType);
    });

    ipcMain.handle('exit-app', async () => {
      // called before any projects opened, no need for extra checks
      app.quit();
    });

    ipcMain.handle('get-wrc-home-directory', async (event) => {
      const title = i18n.t('dialog-getWebLogicRemoteConsoleHome');
      const properties = osUtils.isMac() ? [ 'openFile', 'dontAddToRecent' ] : [ 'openDirectory', 'dontAddToRecent' ];
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        defaultPath: getDefaultDirectoryForOpenDialog(),
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: properties
      });
    });

    ipcMain.handle('get-wrc-app-image', async (event) => {
      const title = i18n.t('dialog-getWebLogicRemoteConsoleAppImage');
      return chooseFromFileSystem(event.sender.getOwnerBrowserWindow(), {
        title: title,
        defaultPath: getDefaultDirectoryForOpenDialog(true),
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openFile', 'dontAddToRecent' ],
        filters: [
          { name: 'AppImage Files', extensions: ['AppImage'] }
        ]
      });
    });

    ipcMain.handle('wrc-set-home-and-start', async (event, wlRemoteConsoleHome) => {
      return setWebLogicRemoteConsoleHomeAndStart(event.sender.getOwnerBrowserWindow(), wlRemoteConsoleHome);
    });

    // eslint-disable-next-line no-unused-vars
    ipcMain.handle('wrc-get-home-default-value', async (event) => {
      return getDefaultWebLogicRemoteConsoleHome();
    });
  }

  async getLatestWdtInstaller(targetWindow) {
    return new Promise((resolve, reject) => {
      const title = i18n.t('dialog-getWdtInstallerDownloadDirectory');
      dialog.showOpenDialog(targetWindow,{
        title: title,
        defaultPath: app.getPath('downloads'),
        message: title,
        buttonLabel: i18n.t('button-select'),
        properties: [ 'openDirectory', 'dontAddToRecent', 'createDirectory', 'promptToCreate' ]
      }).then(openResponse => {
        if (!openResponse.canceled && openResponse.filePaths.length > 0) {
          wktTools.downloadLatestWdtInstaller(openResponse.filePaths[0]).then(installerData => resolve(installerData)).catch(err => reject(err));
        } else {
          resolve();
        }
      }).catch(err => reject(new Error(err)));
    });
  }

  // Verify that the network is available with user settings, show proxy setup if there are problems.
  //
  async checkSetup() {
    const { testConfiguredInternetConnectivity } = require('./js/connectivityUtils');
    const connected = await testConfiguredInternetConnectivity();
    if (!connected) {
      this._logger.debug('Not connected to Internet...creating network window');
      createNetworkWindow();
    } else {
      this._appUpdatePromise = getUpdateInformation(false);
    }
    return connected;
  }

  getFileArgFromCommandLine(argv) {
    let fileArg;
    if (this._wktMode.isExecutableMode() && argv.length > 1) {
      // app.requestSingleInstanceLock() may have inserted --xxx arguments
      const lastArg = argv[argv.length - 1];
      if (project.isWktProjectFile(lastArg)) {
        fileArg = lastArg;
      }
    }
    return fileArg;
  }

  openExternalLink(link) {
    if (link) {
      shell.openExternal(link).then().catch(err => this._logger.error(`Failed to open ${link} in external application: ${err}`));
    }
  }

  openProjectFileInWindow(win, filePath) {
    this._logger.debug(`preparing to open project file ${filePath}`);
    project._openProjectFile(win, filePath)
      .then(() => this._logger.debug(`open project for file ${filePath} returned`));
  }
}

const me = new Main(process.argv[3] === 'dev');
if (osUtils.isLinux()) {
  const httpsProxyUrl = getHttpsProxyUrl();
  if (httpsProxyUrl) {
    app.commandLine.appendSwitch('--proxy-server', httpsProxyUrl);
    const bypassProxyHosts = getBypassProxyHosts();
    if (bypassProxyHosts) {
      app.commandLine.appendSwitch('--proxy-bypass-list', bypassProxyHosts);
    }
  }
}
me.runApp(process.argv);

// DO NOT export anything from this file.
