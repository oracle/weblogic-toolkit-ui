/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const uuid = require('uuid');

const k8sUtils = require('./k8sUtils');
const fsUtils = require('./fsUtils');
const WktApp = require('./wktApp');
const osUtils = require('./osUtils');
const i18n = require('./i18next.webui.config');

const wktApp = new WktApp();

const exeMode = osUtils.getArgv('--wktMode');
const language = osUtils.getArgv('--lang');
const mainModule = osUtils.getArgv('--mainModule');

i18n.changeLanguage(language).then();

contextBridge.exposeInMainWorld(
  'api',
  {
    ipc: {
      send: (channel, ...args) => {
        const validChannels = [
          'close-window',
          'open-project',
          'window-app-quit',
          'window-is-ready',
          'set-has-open-dialog',
          'set-divider-location',
          'set-target-type',
          'skip-quickstart-at-startup',
          'log-remote-message'
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, ...args);
        } else {
          throw new Error(`Renderer attempted to send to an invalid channel: ${channel}`);
        }
      },
      receive: (channel, func) => {
        const validChannels = [
          'edit-user-settings',
          'project-created',
          'project-opened',
          'project-saved',
          'start-add-model-file',
          'start-add-variable-file',
          'start-add-archive-file',
          'start-close-project',
          'start-save-project',
          'start-offline-discover',
          'start-online-discover',
          'show-console-out-line',
          'show-console-err-line',
          'show-quickstart',
          'show-startup-dialogs',
          'app-update-available',
          'blur-focused-item',
          'start-prepare-model',
          'start-create-image',
          'start-push-image',
          'start-k8s-verify-connection',
          'start-wko-install',
          'start-ingress-install',
          'add-ingress-routes',
          'app-download-progress',
          'start-k8s-domain-deploy',
          'get-wko-domain-status',
          'start-app-quit',
          'start-window-close'
        ];
        if (validChannels.includes(channel)) {
          // Strip off the event since it includes the sender
          ipcRenderer.on(channel, (event, ...args) => event.returnValue = func(...args));
        } else {
          throw new Error(`Renderer attempted to listen on an invalid channel: ${channel}`);
        }
      },
      invoke: async (channel, ...args) => {
        const validChannels = [
          'get-https-proxy-url',
          'get-bypass-proxy-hosts',
          'get-divider-locations',
          'get-additional-image-build-commands-file',
          'get-additional-image-build-files',
          'get-java-home',
          'get-oracle-home',
          'get-jdk-installer-location',
          'get-fmw-installer-location',
          'get-wdt-installer-location',
          'get-image-tool-shell-script-location',
          'get-helm-exe',
          'get-openssl-exe',
          'get-kubectl-exe',
          'get-image-builder-exe',
          'get-kube-config-files',
          'get-latest-wko-image-name',
          'get-archive-entry-types',
          'get-network-settings',
          'choose-archive-file',
          'choose-archive-entry',
          'choose-domain-home',
          'choose-java-home',
          'choose-model-file',
          'choose-oracle-home',
          'choose-variable-file',
          'choose-extra-path-directory',
          'restart-network-settings',
          'try-network-settings',
          'is-dev-mode',
          'open-external-link',
          'save-user-settings',
          'get-log-file-directory-location',
          'get-url-catalog',
          'get-wdt-domain-types',
          'get-image-contents',
          'confirm-project-file',
          'prompt-save-before-close',
          'close-project',
          'save-project',
          'exit-app',
          'run-offline-discover',
          'run-online-discover',
          'validate-domain-home',
          'validate-java-home',
          'validate-oracle-home',
          'show-error-message',
          'show-info-message',
          'prepare-model',
          'verify-files-exist',
          'verify-file-exists',
          'ok-or-cancel-prompt',
          'yes-or-no-prompt',
          'install-app-update',
          'get-latest-wdt-installer',
          'wit-cache-installers',
          'do-image-registry-login',
          'validate-image-builder-exe',
          'wit-create-image',
          'validate-image-exists-locally',
          'do-push-image',
          'kubectl-get-current-context',
          'kubectl-set-current-context',
          'validate-kubectl-exe',
          'kubectl-verify-connection',
          'validate-helm-exe',
          'is-wko-installed',
          'k8s-create-namespace',
          'k8s-create-namespaces',
          'k8s-create-service-account',
          'k8s-create-pull-secret',
          'k8s-create-generic-secret',
          'k8s-apply',
          'k8s-label-namespace',
          'k8s-get-service-details',
          'k8s-get-operator-version-from-dm',
          'k8s-get-k8s-config',
          'k8s-get-k8s-cluster-info',
          'k8s-get-wko-domain-status',
          'k8s-get-operator-status',
          'k8s-get-operator-log',
          'helm-add-wko-chart',
          'helm-install-wko',
          'helm-upgrade-wko',
          'get-ingress-tlskeyfile',
          'get-ingress-tlscertfile',
          'helm-list-all-namespaces',
          'helm-add-update-repo',
          'helm-install-ingress-controller',
          'validate-openssl-exe',
          'k8s-create-tls-secret',
          'get-tls-keyfile',
          'get-tls-certfile',
          'k8s-delete-object',
          'openssl-generate-certs',
          'validate-k8s-namespaces-exist',
          'validate-wko-domain-exist'
        ];
        return new Promise((resolve, reject) => {
          if (validChannels.includes(channel)) {
            ipcRenderer.invoke(channel, ...args)
              .then((...results) => resolve(...results))
              .catch(err => reject(`invoke on channel ${channel} failed: ${err}`));
          } else {
            reject(new Error(`Renderer attempted to send to an invalid channel: ${channel}`));
          }
        });
      }
    },
    path: {
      basename: (filePath, ext) => path.basename(filePath, ext),
      dirname: (filePath) => path.dirname(filePath),
      extname: (filePath) => path.extname(filePath),
      isAbsolute: (filePath) => path.isAbsolute(filePath),
      join: (...paths) => path.join(...paths),
      delimiter: path.delimiter,
      isValidFileName: (fileName) => fsUtils.isValidFileName(fileName)
    },
    'k8s': {
      getDockerFilePath: () => fsUtils.getExecutableFilePath('docker', exeMode),
      getPodmanFilePath: () => fsUtils.getExecutableFilePath('podman', exeMode),
      getKubeConfig: () => k8sUtils.getKubeConfig(),
      getKubectlFilePath: () => fsUtils.getExecutableFilePath('kubectl'),
      getHelmFilePath: () => fsUtils.getExecutableFilePath('helm', exeMode),
      getOpenSSLFilePath: () => fsUtils.getExecutableFilePath('openssl'),
      getRegistryAddressFromImageTag: (tag) => k8sUtils.getRegistryAddressFromImageTag(tag)
    },
    'process': {
      isWindows: () => osUtils.isWindows(),
      isMac: () => osUtils.isMac(),
      isLinux: () => osUtils.isLinux(),
      getApplicationName: () => wktApp.getApplicationName(),
      getArgv: (name) => osUtils.getArgv(name)
    },
    'i18n': {
      t: (keys, options) => {
        return i18n.t(keys, options);
      }
    },
    'utils': {
      generateUuid: () => uuid.v4(),
      mainModule: mainModule
    }
  }
);
