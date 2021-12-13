/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'ojs/ojarraydataprovider', 'models/wkt-project',
  'utils/wdt-discoverer', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton',
  'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojselectsingle', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, ArrayDataProvider, project, wdtDiscoverer) {
  function DiscoverDialogModel(config) {

    this.connected = () => {
      if(config['hide']) {
        return;
      }

      accUtils.announce('Discover dialog loaded.', 'assertive');

      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $('#discoverDialog')[0].open();
      }, 1);
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

    this.wdtDomainTypes = [
      { key: 'WLS', label: this.labelMapper('wls-domain-type-label') },
      { key: 'RestrictedJRF', label: this.labelMapper('restricted-jrf-domain-type-label') },
      { key: 'JRF', label: this.labelMapper('jrf-domain-type-label') },
    ];
    this.wdtDomainTypesDP = new ArrayDataProvider(this.wdtDomainTypes, { keyAttributes: 'key' });

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
        }

        $('#discoverDialog')[0].close();
        wdtDiscoverer.executeDiscover(discoverConfig, this.online).then();
      } else {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
      }
    };

    this.cancelDiscover = () => {
      $('#discoverDialog')[0].close();
    };

    this.chooseDomainHome = () => {
      window.api.ipc.invoke('choose-domain-home', project.settings.oracleHome.value)
        .then(directory => {
          if (directory) {
            this.domainHome(directory);
          }
        });
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return DiscoverDialogModel;
});
