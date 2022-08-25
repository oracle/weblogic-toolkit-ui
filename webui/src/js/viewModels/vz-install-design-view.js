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
function (project, accUtils, utils, ko, i18n, screenUtils, BufferingDataProvider, ArrayDataProvider) {
  function VerrazzanoInstallDesignViewModel() {

    this.connected = () => {
      accUtils.announce('Verrazzano Install  Design View page loaded.', 'assertive');
    };

    this.disconnected = () => { };

    this.labelMapper = (labelId, payload) => {
      if (labelId.startsWith('page-design-')) {
        return i18n.t(labelId);
      }
      return i18n.t(`vz-install-design-${labelId}`, payload);
    };

    this.project = project;
    this.i18n = i18n;

    this.vzProfileTypes = [
      { key: 'prod', label: this.labelMapper('profile-prod') },
      { key: 'dev', label: this.labelMapper('profile-dev') },
      // { key: 'managed-cluster', label: this.labelMapper('profile-managed-cluster') },
    ];
    this.vzInstallProfiles = new ArrayDataProvider(this.vzProfileTypes, {keyAttributes: 'key'});

    this.vzVersions = ko.observableArray();
    this.vzVersionTags = new ArrayDataProvider(this.vzVersions, {keyAttributes: 'tag'});
    window.api.ipc.invoke('get-verrazzano-release-versions').then(versions => {
      this.vzVersions.push(...versions.map(versionObject => {
        const label = versionObject.version;
        return { ...versionObject, label };
      }));
    });
  }
  return VerrazzanoInstallDesignViewModel;
});
