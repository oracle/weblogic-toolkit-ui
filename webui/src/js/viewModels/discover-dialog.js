/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider', 'models/wkt-project',
  'utils/wdt-discoverer', 'ojs/ojknockout', 'oj-c/input-text', 'oj-c/input-password', 'ojs/ojlabel', 'oj-c/button',
  'ojs/ojdialog', 'oj-c/form-layout', 'oj-c/select-single', 'ojs/ojvalidationgroup', 'ojs/ojswitch', 'oj-c/radioset'],
function(accUtils, ko, i18n, viewHelper, ArrayDataProvider, project, wdtDiscoverer) {
  function DiscoverDialogModel(config) {
    const DIALOG_SELECTOR = '#discoverDialog';

    this.connected = () => {
      if(config['hide']) {
        return;
      }

      accUtils.announce('Discover dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
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
      { key: 'WLS', label: this.labelMapper('wls-domain-type-label') },
      { key: 'RestrictedJRF', label: this.labelMapper('restricted-jrf-domain-type-label') },
      { key: 'JRF', label: this.labelMapper('jrf-domain-type-label') },
    ];
    this.wdtDomainTypesDP = new ArrayDataProvider(this.wdtDomainTypes, { keyAttributes: 'key' });

    this.discoverTypes = [
      { value: 'local', label: this.labelMapper('discover-type-local-label') },
      { value: 'remote', label: this.labelMapper('discover-type-remote-label') },
      { value: 'ssh', label: this.labelMapper('discover-type-ssh-label') },
    ];
    this.discoverType = ko.observable('local');

    this.sshCredentialTypes = [
      { value: 'default', label: this.labelMapper('ssh-credential-type-default-label') },
      { value: 'privateKey', label: this.labelMapper('ssh-credential-type-private-key-label') },
      { value: 'password', label: this.labelMapper('ssh-credential-type-password-label') },
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

    this.startDiscover = () => {
      let tracker = document.getElementById('tracker');
      if (tracker.valid === 'valid') {
        // TODO - should we discover and overwrite assigned (external) files? maybe ask if assigned?
        let modelFile = project.wdtModel.getDefaultModelFile();
        let propertiesFile = project.wdtModel.getDefaultPropertiesFile();
        let archiveFile = project.wdtModel.getDefaultArchiveFile();

        let discoverConfig = {
          'javaHome': project.settings.javaHome.value,
          'oracleHome': project.settings.oracleHome.value,
          'domainHome': this.domainHome(),
          'domainType': this.domainType(),
          'projectFile': project.getProjectFileName(),
          'modelFile': modelFile,
          'propertiesFile': propertiesFile,
          'archiveFile': archiveFile
        };

        if (this.online) {
          discoverConfig['adminUrl'] = this.adminUrl();
          discoverConfig['adminUser'] = this.adminUser();
          discoverConfig['adminPass'] = this.adminPassword();
          discoverConfig['isRemote'] = this.discoverType() === 'remote';
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
