/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['models/wkt-project', 'accUtils', 'utils/common-utilities', 'knockout', 'utils/i18n', 'utils/screen-utils',
  'ojs/ojbufferingdataprovider', 'ojs/ojarraydataprovider', 'ojs/ojconverter-number', 'utils/dialog-helper',
  'utils/view-helper', 'utils/wkt-logger', 'ojs/ojmessaging', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton',
  'ojs/ojformlayout', 'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojlistview', 'ojs/ojtable', 'ojs/ojswitch',
  'ojs/ojinputnumber', 'ojs/ojradioset'],
function (project, accUtils, utils, ko, i18n, screenUtils, BufferingDataProvider, ArrayDataProvider,
  ojConverterNumber, dialogHelper, viewHelper) {
  function VerrazzanoInstallDesignViewModel() {

    this.connected = () => {
      accUtils.announce('Verrazzano Install  Design View page loaded.', 'assertive');
    };

    this.disconnected = () => { };

    this.labelMapper = (labelId, payload) => {
      if (labelId.startsWith('page-design-')) {
        return i18n.t(labelId);
      }
      return i18n.t(`v8o-install-design-${labelId}`, payload);
    };

    this.project = project;
    this.i18n = i18n;

    this.v8oProfileTypes = [
      { key: 'prod', label: i18n.t('v8o-install-page-profile-prod') },
      { key: 'dev', label: i18n.t('v8o-install-page-profile-dev') },
      // { key: 'managed-cluster', label: i18n.t('v8o-install-page-profile-dev') },
    ];
    this.v8oInstallProfiles = new ArrayDataProvider(this.v8oProfileTypes, {keyAttributes: 'key'});

    this.v8oVersions = ko.observableArray();
    this.v8oVersionTags = new ArrayDataProvider(this.v8oVersions, {keyAttributes: 'tag'});
    window.api.ipc.invoke('get-verrazzano-release-versions').then(versions => {
      console.log(`versions = ${JSON.stringify(versions)}`);
      this.v8oVersions.push(...versions);
    });
  }
  return VerrazzanoInstallDesignViewModel;
});
