/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object representing a persisted project.
 *
 * Returns a singleton.
 */
define(['knockout', 'models/wdt-model-definition', 'models/image-definition', 'models/kubectl-definition',
  'models/k8s-domain-definition', 'models/wko-definition', 'models/project-settings-definition',
  'models/ingress-definition', 'utils/wkt-logger'],
function (ko, wdtConstructor, imageConstructor, kubectlConstructor, domainConstructor, wkoConstructor,
  settingsConstructor, ingressConstructor, wktLogger) {
  function WktProject() {
    let projectFileName = null;

    this.getProjectFileName = () => projectFileName;

    this.setProjectFileName = (newProjectFileName) => {
      projectFileName = newProjectFileName;
    };

    this.name = null;
    this.getProjectName = () => this.name;

    this.setProjectName = (projectName) => {
      this.name = projectName;
      // the file prefix is used for default naming of model files.
      this.wdtModel.setProjectFilePrefix(projectName);
    };

    this.uuid = null;
    this.getProjectUuid = () => this.uuid;

    this.setProjectUuid = (projectUuid) => {
      this.uuid = projectUuid;
    };

    // In order for the synchronous script generators to work properly, we
    // need to resolve these asynchronous calls ahead of time.
    //
    this.httpsProxyUrl = ko.observable();
    window.api.ipc.invoke('get-https-proxy-url').then(url => {
      wktLogger.debug('HTTPS Proxy URL resolved to %s', url ? url : 'not set');
      this.httpsProxyUrl(url);
    });
    this.getHttpsProxyUrl = () => this.httpsProxyUrl();
    this.setHttpsProxyUrl = (value) => this.httpsProxyUrl(value);

    this.bypassProxyHosts = ko.observable();
    window.api.ipc.invoke('get-bypass-proxy-hosts').then(hosts => {
      wktLogger.debug('Bypass Proxy Hosts resolved to %s', hosts ? hosts : 'not set');
      this.bypassProxyHosts(hosts);
    });
    this.getBypassProxyHosts = () => this.bypassProxyHosts();
    this.setBypassProxyHosts = (value) => this.bypassProxyHosts(value);

    this.imageToolScript = ko.observable();
    window.api.ipc.invoke('get-image-tool-shell-script-location').then(script => {
      wktLogger.debug('WebLogic Image Tool script resolved to %s', script ? script : 'not set');
      this.imageToolScript(script);
    });
    this.getImageToolScript = () => this.imageToolScript();

    // notify views when a new project is loaded
    this.postOpen = ko.observable();
    this.postOpen.extend({ notify: 'always' });

    // simple fields on configuration pages.

    this.settings = settingsConstructor('settings');
    this.wdtModel = wdtConstructor('model');
    this.image = imageConstructor('image', this.wdtModel);
    this.ingress = ingressConstructor('ingress');
    this.kubectl = kubectlConstructor('kubectl');
    this.k8sDomain = domainConstructor('k8sDomain', this.wdtModel, this.image.domainHomePath, this.image.targetDomainType);
    this.wko = wkoConstructor('wko');
    this.pages = [this.wdtModel, this.image, this.kubectl, this.k8sDomain, this.wko, this.settings, this.ingress];

    this.setFromJson = (wktProjectJson, modelContentsJson) => {
      if (wktProjectJson.domainInfo) {
        this.domainInfo = wktProjectJson.domainInfo;
      } else {
        delete this.domainInfo;
      }
      this.setProjectName(wktProjectJson.name);
      this.setProjectUuid(wktProjectJson.uuid);
      this.pages.forEach(page => page.readFrom(wktProjectJson));
      this.wdtModel.setModelContents(modelContentsJson);
      this.k8sDomain.loadPropertyOverrideValues(wktProjectJson);
      this.postOpen(true);
    };

    // prepare model provides the default usernames extracted from the original model
    this.updateDefaultSecretUsernames = secretContentsJson => {
      function getDefaultUsername(keys) {
        return keys.filter(k => k.key === 'username').map(k => k.defaultValue).pop();
      }

      function toSecretEntry(secret) {
        const result = {};
        result[secret.name] = getDefaultUsername(secret.keys);
        return result;
      }

      if (!this.domainInfo) {
        this.domainInfo = {};
      }

      if (secretContentsJson && secretContentsJson.secrets)
        this.domainInfo.defaultSecretUsernames = secretContentsJson.secrets.map(toSecretEntry);
      else
        this.domainInfo.defaultSecretUsernames = [];
    };

    this.updateClusterData = clusterJson => {

      if (!this.domainInfo) {
        this.domainInfo = {};
      }

      this.domainInfo.clusters = clusterJson.clusters;
    };

    this.getProjectContents = () => {
      let projectContents = {
        name: this.name,
        uuid: this.uuid
      };
      this.pages.forEach(page => page.writeTo(projectContents));
      if (this.domainInfo) projectContents.domainInfo = this.domainInfo;
      return projectContents;
    };

    // return true if the project has unsaved changes.
    this.isDirty = () => {
      return this.pages.some(p => p.isChanged());
    };

    // mark all changes saved.
    this.setNotDirty = () => {
      this.pages.forEach(p => p.setNotChanged());
    };
  }

  // Return a singleton instance
  return new WktProject();
});
