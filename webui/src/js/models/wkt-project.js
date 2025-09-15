/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
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
  'models/ingress-definition', 'utils/common-utilities', 'utils/i18n', 'utils/wkt-logger'],
function (ko, wdtConstructor, imageConstructor, kubectlConstructor, domainConstructor, wkoConstructor,
  settingsConstructor, ingressConstructor, utils, i18n, wktLogger) {
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
      if (!url) {
        url = 'not set';
      }
      wktLogger.debug('HTTPS Proxy URL resolved to %s', url);
      this.httpsProxyUrl(url);
    });
    this.getHttpsProxyUrl = () => this.httpsProxyUrl();
    this.setHttpsProxyUrl = (value) => this.httpsProxyUrl(value);

    this.bypassProxyHosts = ko.observable();
    window.api.ipc.invoke('get-bypass-proxy-hosts').then(hosts => {
      if (!hosts) {
        hosts = 'not set';
      }
      wktLogger.debug('Bypass Proxy Hosts resolved to %s', hosts);
      this.bypassProxyHosts(hosts);
    });
    this.getBypassProxyHosts = () => this.bypassProxyHosts();
    this.setBypassProxyHosts = (value) => this.bypassProxyHosts(value);

    this.imageToolScript = ko.observable();
    window.api.ipc.invoke('get-image-tool-shell-script-location').then(script => {
      if (!script) {
        script = 'not set';
      }
      wktLogger.debug('WebLogic Image Tool script resolved to %s', script);
      this.imageToolScript(script);
    });
    this.getImageToolScript = () => this.imageToolScript();

    // notify views when a new project is loaded
    this.postOpen = ko.observable();
    this.postOpen.extend({ notify: 'always' });

    // simple fields on configuration pages.

    this.settings = settingsConstructor('settings');
    this.wdtModel = wdtConstructor('model');
    this.wko = wkoConstructor('wko');
    this.image = imageConstructor('image', this.wdtModel, this.settings, this.wko);
    this.ingress = ingressConstructor('ingress');
    this.kubectl = kubectlConstructor('kubectl');
    this.k8sDomain = domainConstructor('k8sDomain', this.wdtModel, this.image);
    this.pages = [
      this.wdtModel,
      this.image,
      this.kubectl,
      this.k8sDomain,
      this.wko,
      this.settings,
      this.ingress,
    ];

    this.convertOldProjectFormat = (wktProjectJson) => {
      // Version 1.1.0 moved extraPathDirectories from kubectl to settings...
      //
      if ('kubectl' in wktProjectJson && 'extraPathDirectories' in wktProjectJson.kubectl) {
        if (!wktProjectJson.settings) {
          wktProjectJson.settings = {};
          wktProjectJson.settings.extraPathDirectories = [];
        } else if (!wktProjectJson.settings.extraPathDirectories) {
          wktProjectJson.settings.extraPathDirectories = [];
        }

        for (const oldExtraPathDirectory of wktProjectJson.kubectl.extraPathDirectories) {
          const value = oldExtraPathDirectory.value;
          const uid = utils.getShortUuid();
          wktProjectJson.settings.extraPathDirectories.push({
            uid: uid,
            value: value
          });
        }
        delete wktProjectJson.kubectl.extraPathDirectories;
      }

      // Version 1.1.1 changes domain clusters to be persisted by UID instead of name
      // to allow us to support adding new clusters on the domain page for the
      // Domain in PV use case...
      //
      if ('k8sDomain' in wktProjectJson && 'clusters' in wktProjectJson.k8sDomain) {
        const currentClusters = wktProjectJson.k8sDomain.clusters;
        const newClusters = {};
        for (const clusterName in currentClusters) {
          const cluster = currentClusters[clusterName];
          // This is tricky because the only way to tell if the cluster is in
          // the old format is if there is no name field...
          //
          if (cluster.name) {
            break;
          }
          cluster.name = clusterName;
          const uid = utils.getShortUuid();
          newClusters[uid] = cluster;
        }
        if (Object.keys(newClusters).length > 0) {
          wktProjectJson.k8sDomain.clusters = newClusters;
        }
      }

      // Version 1.6 changes domain secrets to allow any keys.
      // Prior versions allowed only username and password.
      // If username or password attributes are present, convert them to objects in the keys map.
      //
      if ('k8sDomain' in wktProjectJson && 'secrets' in wktProjectJson.k8sDomain) {
        const secrets = wktProjectJson.k8sDomain.secrets;
        for(const secretUid in secrets) {
          const secret = secrets[secretUid];
          if (!secret.hasOwnProperty('keys')) {
            const keyMap = {};
            ['username', 'password'].forEach(attribute_key => {
              if(secret.hasOwnProperty(attribute_key)) {
                const keyUid = utils.getShortUuid();
                keyMap[keyUid] = {key: attribute_key, value: secret[attribute_key]};
                delete secret[attribute_key];
              }
            });
            secret['keys'] = keyMap;
          }
        }
      }

      // Version 1.7.1 changes the operator image default from populated to empty.  If the
      // project value is the same as what the default currently is, remove it from the project.
      //
      if ('wko' in wktProjectJson && 'image' in wktProjectJson.wko) {
        const currentImageValue = wktProjectJson.wko.image;
        const defaultImageValue =
            `ghcr.io/oracle/weblogic-kubernetes-operator:${window.api.ipc.invoke('get-latest-wko-version-number')}`;

        if (currentImageValue === defaultImageValue) {
          delete wktProjectJson.wko.image;
        }
      }

      // Version 2.0 removes support for Verrazzano so remove all Verrazzano-specific state from the project.
      let foundVerrazzanoInProject = false;
      if ('settings' in wktProjectJson && wktProjectJson.settings.wdtTargetType === 'vz') {
        foundVerrazzanoInProject = true;
        wktProjectJson.settings.wdtTargetType = 'wko';
      }
      if ('kubectl' in wktProjectJson && 'vzManagedClusters' in wktProjectJson.kubectl) {
        foundVerrazzanoInProject = true;
        delete wktProjectJson.kubectl.vzManagedClusters;
      }
      if ('vzInstall' in wktProjectJson) {
        foundVerrazzanoInProject = true;
        delete wktProjectJson.vzInstall;
      }
      if ('vzApplication' in wktProjectJson) {
        foundVerrazzanoInProject = true;
        delete wktProjectJson.vzApplication;
      }
      if (foundVerrazzanoInProject) {
        wktLogger.warn(i18n.t('wkt-project-verrazzano-removal-warning'));
      }

      // Version 2.0 removed support for domain in image (DII) so convert DII to MII.
      let foundDiiInProject = false;
      if ('settings' in wktProjectJson && wktProjectJson.settings.targetDomainLocation === 'dii') {
        foundDiiInProject = true;
        wktProjectJson.settings.targetDomainLocation = 'mii';
      }
      if (foundDiiInProject) {
        wktLogger.warn(i18n.t('wkt-project-dii-removal-warning'));
      }

      // Version 2.0 removed support for the native, keytar-based credential store.  The code that
      // handles the conversion is in the electron credential loading code since all credential loading
      // is handled on the electron side so by the time we get here, it is too late.
      //
    };

    this.setFromJson = (wktProjectJson, modelContentsJson) => {
      if (wktProjectJson.domainInfo) {
        this.domainInfo = wktProjectJson.domainInfo;
      } else {
        delete this.domainInfo;
      }
      this.setProjectName(wktProjectJson.name);
      this.setProjectUuid(wktProjectJson.uuid);

      // Update the project structure prior to loading...
      this.convertOldProjectFormat(wktProjectJson);

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

    // synchronize some attributes with electron window to disable/hide menu items on change
    this.synchronizeWithWindow = (attribute_key, observable) => {
      window.api.ipc.send('set-window-attribute', attribute_key, observable());
      observable.subscribe(value => {
        window.api.ipc.send('set-window-attribute', attribute_key, value);
      });
    };

    this.synchronizeWithWindow('domainLocation', this.settings.targetDomainLocation.observable);
    this.synchronizeWithWindow('targetType', this.settings.wdtTargetType.observable);
    this.synchronizeWithWindow('isCreatingPrimaryImage', this.image.createPrimaryImage.observable);

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
