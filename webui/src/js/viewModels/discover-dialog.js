/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider', 'models/wkt-project',
  'utils/wdt-discoverer', 'utils/wkt-logger', 'ojs/ojknockout', 'oj-c/input-text', 'oj-c/input-password', 'ojs/ojlabel',
  'oj-c/button', 'ojs/ojdialog', 'oj-c/form-layout', 'oj-c/select-single', 'ojs/ojvalidationgroup', 'ojs/ojswitch',
  'oj-c/radioset', 'oj-c/checkboxset', 'oj-c/checkbox', 'oj-c/input-password'],
function(accUtils, ko, i18n, viewHelper, ArrayDataProvider, project, wdtDiscoverer) {
  function DiscoverDialogModel(config) {
    const DIALOG_SELECTOR = '#discoverDialog';

    let subscriptions = [];
    this.project = project;

    this.connected = () => {
      if (config['hide']) {
        return;
      }

      accUtils.announce('Discover dialog loaded.', 'assertive');

      subscriptions.push(this.domainType.subscribe((newValue) => {
        if (newValue === 'WLS' && this.securityFeatureTypes().length === 3) {
          this.securityFeatureTypes.pop();
        } else if (newValue !== 'WLS' && this.securityFeatureTypes().length === 2) {
          this.securityFeatureTypes.push({
            key: 'opss',
            label: this.labelMapper('discover-opss-wallet-label'),
            assistiveText: this.labelMapper('discover-opss-wallet-help')
          });
        }
      }));

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(`discover-dialog-${labelId}`, arg);
      }
      return i18n.t(`discover-dialog-${labelId}`);
    };

    this.anyLabelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(labelId, arg);
      }
      return i18n.t(labelId);
    };

    this.online = config['online'];

    const titleKey = this.online ? 'online-title' : 'title';
    this.title = this.labelMapper(titleKey);

    this.domainHome = ko.observable();
    this.domainType = ko.observable('WLS');
    this.adminUrl = ko.observable();
    this.adminUser = ko.observable();
    this.adminPassword = ko.observable();
    this.additionalProperties = ko.observable();

    this.sshHost = ko.observable();
    this.sshPort = ko.observable();
    this.sshUser = ko.observable();
    this.sshPassword = ko.observable();
    this.sshPrivateKey = ko.observable();
    this.sshPrivateKeyPassphrase = ko.observable();

    this.domainHomeHelp = ko.computed(() => {
      return this.labelMapper('domain-home-help');
    }, this);

    this.domainHomeLabel = ko.computed(() => {
      return this.labelMapper('domain-home-label');
    }, this);

    this.wdtDomainTypes = [
      {key: 'WLS', label: this.labelMapper('wls-domain-type-label')},
      {key: 'RestrictedJRF', label: this.labelMapper('restricted-jrf-domain-type-label')},
      {key: 'JRF', label: this.labelMapper('jrf-domain-type-label')},
      {key: 'OAM', label: this.labelMapper('oam-domain-type-label')},
      {key: 'OIG', label: this.labelMapper('oig-domain-type-label')}
    ];
    this.wdtDomainTypesDP = new ArrayDataProvider(this.wdtDomainTypes, {keyAttributes: 'key'});

    this.discoverTypes = [
      {value: 'local', label: this.labelMapper('discover-type-local-label')},
      {value: 'remote', label: this.labelMapper('discover-type-remote-label')},
      {value: 'ssh', label: this.labelMapper('discover-type-ssh-label')},
    ];
    this.discoverType = ko.observable('local');

    this.sshCredentialTypes = [
      {value: 'default', label: this.labelMapper('ssh-credential-type-default-label')},
      {value: 'privateKey', label: this.labelMapper('ssh-credential-type-private-key-label')},
      {value: 'password', label: this.labelMapper('ssh-credential-type-password-label')},
    ];
    this.sshCredentialType = ko.observable('default');

    this.useSsh = ko.computed(() => {
      return this.discoverType() === 'ssh';
    }, this);

    this.useSshPassword = ko.computed(() => {
      return this.sshCredentialType() === 'password';
    }, this);

    this.useSshPrivateKey = ko.computed(() => {
      return this.sshCredentialType() === 'privateKey';
    }, this);

    /***********************************************************************
     *                   Security-related features                         *
     ***********************************************************************/

    this.securityFeatureTypes = ko.observableArray([
      {
        key: 'passwords',
        label: this.labelMapper('discover-passwords-label'),
        assistiveText: this.labelMapper('discover-passwords-help')
      },
      {
        key: 'providers',
        label: this.labelMapper('discover-security-provider-data-label'),
        assistiveText: this.labelMapper('discover-security-provider-data-help')
      }
    ]);
    this.securityFeatureTypesDP = new ArrayDataProvider(this.securityFeatureTypes, {keyAttributes: 'key'});
    this.discoverSecurityFeatures = ko.observableArray();

    this.discoverPasswords = ko.computed(() => {
      let result = false;
      if (this.discoverSecurityFeatures()) {
        result = this.discoverSecurityFeatures().includes('passwords');
      }
      return result;
    }, this);

    this.discoverSecurityProviderData = ko.computed(() => {
      let result = false;
      if (this.discoverSecurityFeatures()) {
        result = this.discoverSecurityFeatures().includes('providers');
      }
      return result;
    }, this);

    this.discoverOPSSWallet = ko.computed(() => {
      let result = false;
      if (this.discoverSecurityFeatures()) {
        result = this.discoverSecurityFeatures().includes('opss');
      }
      return result;
    }, this);

    this.securityProviderTypes = [
      { key: 'DefaultAuthenticator', label: this.labelMapper('security-provider-type-default-authenticator-label')},
      { key: 'XACMLAuthorizer', label: this.labelMapper('security-provider-type-xacml-authorizer-label')},
      { key: 'XACMLRoleMapper', label: this.labelMapper('security-provider-type-xacml-role-mapper-label')},
      { key: 'DefaultCredentialMapper', label: this.labelMapper('security-provider-type-default-credential-mapper-label')},
    ];
    this.securityProviderTypesDP = new ArrayDataProvider(this.securityProviderTypes, {keyAttributes: 'key'});
    this.discoverSecurityProviderDataProviders = ko.observableArray([
      'DefaultAuthenticator', 'XACMLAuthorizer', 'XACMLRoleMapper', 'DefaultCredentialMapper'
    ]);

    this.getDiscoverSecurityProviderDataArgument = () => {
      let result;

      if (this.discoverSecurityProviderData()) {
        const providers = this.discoverSecurityProviderDataProviders() || [];
        if (providers.length === this.securityProviderTypes.length) {
          result = 'ALL';
        } else if (providers.length > 0) {
          result = this.discoverSecurityProviderDataProviders().join(',');
        }
      }
      return result;
    };

    this.discoverSecurityProviderDataProvidersRequiresEncryption = ko.computed(() => {
      let result = false;
      if (this.discoverSecurityProviderData()) {
        const providers = this.discoverSecurityProviderDataProviders() || [];
        result = providers.includes('DefaultAuthenticator') || providers.includes('DefaultCredentialMapper');
      }
      return result;
    }, this);

    this.showDiscoverOPSSWallet = ko.computed(() => {
      return this.domainType() !== 'WLS';
    }, this);
    this.opssWalletPassphrase = ko.observable();

    this.requiresWdtEncryptionPassphrase = ko.computed(() => {
      let result = false;
      if (this.discoverPasswords()) {
        result = true;
      } else if (this.showDiscoverOPSSWallet() && this.discoverOPSSWallet()) {
        result = true;
      } else if (this.discoverSecurityProviderDataProvidersRequiresEncryption()) {
        result = true;
      }
      return result;
    }, this);

    this.startDiscover = () => {
      let tracker = document.getElementById('tracker');
      if (tracker.valid === 'valid') {
        let discoverConfig = {
          javaHome: project.settings.javaHome.value,
          oracleHome: project.settings.oracleHome.value,
          domainHome: this.domainHome(),
          domainType: this.domainType(),
          additionalProperties: this.additionalProperties()
        };

        if (this.online) {
          discoverConfig['adminUrl'] = this.adminUrl();
          discoverConfig['adminUser'] = this.adminUser();
          discoverConfig['adminPass'] = this.adminPassword();
          discoverConfig['isRemote'] = this.discoverType() === 'remote';
          discoverConfig['additionalProperties'] = this.additionalProperties();
          if(this.useSsh()) {
            discoverConfig['sshHost'] = this.sshHost();
            discoverConfig['sshPort'] = this.sshPort();
            discoverConfig['sshUser'] = this.sshUser();
            if(this.useSshPassword()) {
              discoverConfig['sshPassword'] = this.sshPassword();
            } else if(this.useSshPrivateKey()) {
              discoverConfig['sshPrivateKey'] = this.sshPrivateKey();
              discoverConfig['sshPrivateKeyPassphrase'] = this.sshPrivateKeyPassphrase();
            }
          }

          discoverConfig['discoverPasswords'] = this.discoverPasswords();
          discoverConfig['discoverSecurityProviderData'] = this.discoverSecurityProviderData();
          discoverConfig['discoverSecurityProviderDataArgument'] = this.getDiscoverSecurityProviderDataArgument();
          discoverConfig['discoverOPSSWallet'] = this.discoverOPSSWallet();
          discoverConfig['discoverOPSSWalletPassphrase'] = this.opssWalletPassphrase();
          discoverConfig['discoverWdtPassphrase'] = project.wdtModel.wdtPassphrase.value;
        }

        this.dialogContainer.close();
        wdtDiscoverer.executeDiscover(discoverConfig, this.online).then();
      } else {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
      }
    };

    this.cancelDiscover = () => {
      this.dialogContainer.close();
    };

    this.chooseDomainHome = () => {
      window.api.ipc.invoke('choose-domain-home', project.settings.oracleHome.value)
        .then(directory => {
          if (directory) {
            this.domainHome(directory);
          }
        });
    };

    this.choosePrivateKey = () => {
      window.api.ipc.invoke('choose-private-key', this.sshPrivateKey())
        .then(file => {
          if (file) {
            this.sshPrivateKey(file);
          }
        });
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return DiscoverDialogModel;
});
