/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

define(['models/wkt-project', 'models/wkt-console', 'utils/wdt-discoverer', 'utils/dialog-helper', 'utils/project-io',
  'utils/common-utilities', 'utils/wdt-preparer', 'utils/i18n', 'utils/wit-creator', 'utils/wit-aux-creator',
  'utils/image-pusher', 'utils/aux-image-pusher', 'utils/k8s-helper', 'utils/wko-installer', 'utils/wko-uninstaller',
  'utils/wko-updater', 'utils/k8s-domain-deployer', 'utils/k8s-domain-status-checker', 'utils/k8s-domain-undeployer',
  'utils/ingress-controller-installer', 'utils/ingress-routes-updater', 'utils/ingress-controller-uninstaller',
  'utils/app-updater', 'utils/wkt-logger'],
function(wktProject, wktConsole, wdtDiscoverer, dialogHelper, projectIO,
  utils, wdtModelPreparer, i18n, witImageCreator, witAuxImageCreator,
  imagePusher, auxImagePusher, k8sHelper, wkoInstaller,
  wkoUninstaller, wkoUpdater, k8sDomainDeployer, k8sDomainStatusChecker,
  k8sDomainUndeployer, ingressControllerInstaller, ingressRoutesUpdater,
  ingressControllerUninstaller, appUpdater, wktLogger) {

  async function displayCatchAllError(i18nPrefix, err) {
    return dialogHelper.displayCatchAllError(i18nPrefix, err);
  }

  // Register all listeners here.
  //
  window.api.ipc.receive('project-created', (file, contents) => {
    wktLogger.debug('project-created for file %s with contents: %s', this.file, JSON.stringify(contents));
    wktProject.setProjectFileName(file);
    wktProject.setFromJson(contents, { });
    wktProject.setNotDirty();
  });

  window.api.ipc.receive('project-opened', (file, projectContents, modelContents) => {
    // Don't log the project contents because it can contain clear text credentials...
    try {
      wktProject.setProjectFileName(file);
      wktProject.setFromJson(projectContents, modelContents);
      wktProject.setNotDirty();
    } catch (err) {
      wktLogger.error('project-opened failed: %s', err);
      displayCatchAllError('project-open', err).then();
    }
  });

  window.api.ipc.receive('start-save-project', () => {
    projectIO.saveProject(true).catch(err => {
      displayCatchAllError('save-all', err).then();
    });
  });

  window.api.ipc.receive('show-console-out-line', (line) => {
    wktConsole.addLine(line, 'out');
  });

  window.api.ipc.receive('show-console-err-line', (line) => {
    wktConsole.addLine(line, 'err');
  });

  window.api.ipc.receive('start-offline-discover', () => {
    wdtDiscoverer.startDiscoverDomain(false).catch(err => {
      displayCatchAllError('discover', err).then();
    });
  });

  window.api.ipc.receive('start-online-discover', () => {
    wdtDiscoverer.startDiscoverDomain(true).catch(err => {
      displayCatchAllError('discover', err).then();
    });
  });

  window.api.ipc.receive('start-close-project', () => {
    projectIO.closeProject(false).catch(err => {
      displayCatchAllError('close-project', err).then();
    });
  });

  window.api.ipc.receive('edit-user-settings', (payload) => {
    dialogHelper.openDialog('user-settings-dialog', payload);
  });

  window.api.ipc.receive('blur-focused-item', () => {
    document.activeElement.blur();
  });

  window.api.ipc.receive('start-prepare-model', async () => {
    wdtModelPreparer.startPrepareModel().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('wdt-preparer-prepare', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-create-image', async () => {
    witImageCreator.startCreateImage().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('wit-creator-create', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-create-aux-image', async () => {
    witAuxImageCreator.startCreateAuxImage().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('wit-creator-create-aux', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-push-aux-image', async () => {
    auxmagePusher.startPushImage().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('image-pusher-push-aux', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-k8s-verify-connection', async () => {
    k8sHelper.startVerifyClusterConnectivity().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('kubectl-helper-verify-connect', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-wko-install', async () => {
    wkoInstaller.startInstallOperator().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('wko-installer-install', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-wko-update', async () => {
    wkoUpdater.startUpdateOperator().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('wko-updater-update', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-wko-uninstall', async () => {
    wkoUninstaller.startUninstallOperator().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('wko-uninstaller-install', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-k8s-domain-deploy', async () => {
    k8sDomainDeployer.startDeployDomain().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('k8s-domain-deployer-deploy', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('get-wko-domain-status', async () => {
    k8sDomainStatusChecker.startCheckDomainStatus().then(() => {Promise.resolve();}).catch(err => {
      displayCatchAllError('k8s-domain-status-checker-get-status', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-k8s-domain-undeploy', async () => {
    k8sDomainUndeployer.startUndeployDomain().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('k8s-domain-undeployer-undeploy', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-add-model-file', async () => {
    projectIO.startAddModelFile().catch(err => {
      displayCatchAllError('add-model-file', err).then();
    });
  });

  window.api.ipc.receive('start-add-variable-file', async () => {
    projectIO.startAddVariableFile().catch(err => {
      displayCatchAllError('add-variable-file', err).then();
    });
  });

  window.api.ipc.receive('start-add-archive-file', async () => {
    projectIO.startAddArchiveFile().catch(err => {
      displayCatchAllError('add-archive-file', err).then();
    });
  });

  window.api.ipc.receive('start-ingress-install', async () => {
    ingressControllerInstaller.startInstallIngressController().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('ingress-installer-install', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-ingress-uninstall', async () => {
    ingressControllerUninstaller.startUninstallIngressController().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('ingress-uninstaller-uninstall', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('add-ingress-routes', async () => {
    ingressRoutesUpdater.startIngressRoutesUpdate().then(() => Promise.resolve()).catch(err => {
      displayCatchAllError('ingress-routes-updater-update-routes', err).then(() => Promise.resolve());
    });
  });

  window.api.ipc.receive('start-window-close', async () => {
    return doDirtyCheck('close-window');
  });

  window.api.ipc.receive('app-update-available', async (updateInfo) => {
    return appUpdater.updateApplication(updateInfo);
  });

  window.api.ipc.receive('app-download-progress', async (percent) => {
    appUpdater.updateProgress(percent);
  });

  window.api.ipc.receive('start-app-quit', async () => {
    return doDirtyCheck('window-app-quit');
  });

  window.api.ipc.receive('show-quickstart', async() => {
    dialogHelper.openDialog('quickstart-dialog');
  });

  window.api.ipc.receive('show-startup-dialogs', async(startupInformation) => {
    return appUpdater.showStartupDialogs(startupInformation);
  });

  async function doDirtyCheck(responseChannel) {
    return new Promise(resolve => {
      if (wktProject.isDirty()) {
        // keepWindow is true, will close from webui side (below)
        projectIO.closeProject(true).then(result => {
          if (result.closed) {
            window.api.ipc.send(responseChannel);
          }
          resolve();
        }).catch (err => {
          displayCatchAllError('close-window', err).then(resolve());
        });
      } else {
        window.api.ipc.send(responseChannel);
        resolve();
      }
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // Once all listeners are registered, send window-is-ready to:              //
  //     - notify electron know the window is ready to receive messages, and  //
  //     - trigger electron to send any buffered project-opened message.      //
  //////////////////////////////////////////////////////////////////////////////
  window.api.ipc.send('window-is-ready');
});
