/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const uuid = require('uuid');

const k8sUtils = require('./k8sUtils');
const fsUtils = require('./fsUtils');
const errorUtils = require('./errorUtils');
const WktApp = require('./wktApp');
const osUtils = require('./osUtils');
const i18n = require('./i18next.webui.config');
const { compareVersions, getMinorVersionCompatibilityVersionString } = require('./versionUtils');
const { wlRemoteConsoleFrontendVersion } = require('../webui.json');

const wktApp = new WktApp();

const exeMode = osUtils.getArgv('--wktMode');
const language = osUtils.getArgv('--lang');
const mainModule = osUtils.getArgv('--mainModule');
const wrcFrontendCompatibilityVersion = getMinorVersionCompatibilityVersionString(wlRemoteConsoleFrontendVersion);

i18n.changeLanguage(language).then();

contextBridge.exposeInMainWorld(
  'api',
  {
    ipc: {
      send: (channel, ...args) => {
        const validChannels = [
          'close-window',
          'download-file',
          'new-project',
          'open-project',
          'window-app-quit',
          'window-is-ready',
          'set-divider-location',
          'set-navigation-collapsed',
          'set-window-attribute',
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
          'set-wrc-backend-port',
          'start-add-model-file',
          'start-add-variable-file',
          'start-add-archive-file',
          'start-close-project',
          'start-save-project',
          'start-save-project-as',
          'start-offline-discover',
          'start-online-discover',
          'show-console-out-line',
          'show-console-err-line',
          'show-quickstart',
          'show-startup-dialogs',
          'app-update-available',
          'blur-focused-item',
          'start-new-project',
          'start-open-project',
          'start-prepare-model',
          'start-validate-model',
          'start-create-image',
          'start-create-aux-image',
          'start-push-image',
          'start-push-aux-image',
          'start-k8s-verify-connection',
          'start-wko-install',
          'start-wko-uninstall',
          'start-wko-update',
          'start-ingress-install',
          'start-ingress-uninstall',
          'start-update-ingress-routes',
          'app-download-progress',
          'start-k8s-domain-deploy',
          'start-k8s-domain-undeploy',
          'start-get-k8s-domain-status',
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
          'get-navigation-collapsed',
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
          'get-latest-wko-version-number',
          'get-wko-release-versions',
          'get-archive-entry-types',
          'wrc-get-archive-entry',
          'get-network-settings',
          'choose-archive-file',
          'choose-archive-entry-file',
          'add-archive-entry',
          'choose-domain-home',
          'choose-java-home',
          'choose-model-file',
          'choose-oracle-home',
          'choose-variable-file',
          'choose-extra-path-directory',
          'export-archive-file',
          'restart-network-settings',
          'try-network-settings',
          'is-dev-mode',
          'open-external-link',
          'save-user-settings',
          'get-log-file-directory-location',
          'get-url-catalog',
          'get-wdt-domain-types',
          'get-image-contents',
          'choose-project-file',
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
          'validate-model',
          'verify-files-exist',
          'verify-file-exists',
          'ok-or-cancel-prompt',
          'yes-or-no-prompt',
          'yes-no-or-cancel-prompt',
          'install-app-update',
          'get-latest-wdt-installer',
          'wit-cache-installers',
          'do-image-registry-login',
          'validate-image-builder-exe',
          'wit-create-image',
          'wit-create-aux-image',
          'validate-image-exists-locally',
          'do-push-image',
          'kubectl-get-current-context',
          'kubectl-set-current-context',
          'kubectl-get-contexts',
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
          'k8s-get-ingresses',
          'k8s-get-operator-version-from-domain-config-map',
          'k8s-get-operator-version',
          'k8s-get-k8s-config',
          'k8s-get-k8s-cluster-info',
          'k8s-get-wko-domain-status',
          'k8s-get-operator-status',
          'helm-add-wko-chart',
          'helm-install-wko',
          'helm-uninstall-wko',
          'helm-update-wko',
          'get-ingress-tlskeyfile',
          'get-ingress-tlscertfile',
          'helm-list-all-namespaces',
          'helm-add-update-repo',
          'helm-install-ingress-controller',
          'helm-uninstall-ingress-controller',
          'validate-openssl-exe',
          'k8s-create-tls-secret',
          'get-tls-keyfile',
          'get-tls-certfile',
          'k8s-delete-object',
          'openssl-generate-certs',
          'validate-k8s-namespaces-exist',
          'validate-wko-domain-exist',
          'get-wrc-home-directory',
          'get-wrc-app-image',
          'wrc-get-home-default-value',
          'wrc-set-home-and-start',
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
      joinAndConvertToUnixPath: (...paths) => path.join(...paths).replaceAll('\\', '/'),
      delimiter: path.delimiter,
      isValidFileName: (fileName) => fsUtils.isValidFileName(fileName),
      // These three functions are used by wrc-jet-pack
      exists: (filePath) => fsUtils.exists(filePath),
      isFile: (filePath) => fsUtils.isFile(filePath),
      isDirectory: (filePath) => fsUtils.isDirectory(filePath)
    },
    'k8s': {
      getDockerFilePath: () => fsUtils.getExecutableFilePath('docker', exeMode),
      getPodmanFilePath: () => fsUtils.getExecutableFilePath('podman', exeMode),
      getKubeConfig: () => k8sUtils.getKubeConfig(),
      getImageTagComponents: (imageTag) => k8sUtils.splitImageNameAndVersion(imageTag),
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
      getVersion: () => wktApp.getApplicationVersion(),
      getArgv: (name) => osUtils.getArgv(name),
      getPathDirectories: () => osUtils.getPathDirectories(),
      getEnvironmentVariables: () => osUtils.getEnvironmentVariables()
    },
    'i18n': {
      t: (keys, options) => {
        return i18n.t(keys, options);
      }
    },
    'utils': {
      generateUuid: () => uuid.v4(),
      compareVersions: (version, otherVersion) => compareVersions(version, otherVersion),
      getErrorMessage: (err) => errorUtils.getErrorMessage(err),
      mainModule: mainModule,
      wrcFrontendCompatibilityVersion: wrcFrontendCompatibilityVersion,
    }
  }
);
