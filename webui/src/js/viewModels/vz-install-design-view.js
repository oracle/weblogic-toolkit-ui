/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

const MINIMUM_VERRAZZANO_VERSION = '1.3.0';

define(['models/wkt-project', 'accUtils', 'utils/common-utilities', 'knockout', 'utils/i18n', 'utils/screen-utils',
  'ojs/ojbufferingdataprovider', 'ojs/ojarraydataprovider', 'utils/vz-helper', 'utils/dialog-helper',
  'utils/view-helper', 'utils/wkt-logger', 'ojs/ojmessaging', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton',
  'ojs/ojformlayout', 'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojlistview', 'ojs/ojtable', 'ojs/ojswitch',
  'ojs/ojinputnumber', 'ojs/ojradioset'],
function (project, accUtils, utils, ko, i18n, screenUtils, BufferingDataProvider, ArrayDataProvider) {
  function VerrazzanoInstallDesignViewModel() {

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Verrazzano Install  Design View page loaded.', 'assertive');

      subscriptions.push(this.project.vzInstall.actualInstalledVersion.observable.subscribe(newTagValue => {
        this.computedArgoCDAvailabilityFromVersion(newTagValue);
      }));

      this.computedArgoCDAvailabilityFromVersion();
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

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
    window.api.ipc.invoke('get-verrazzano-release-versions', MINIMUM_VERRAZZANO_VERSION).then(versions => {
      // Sort in descending order by version number.
      //
      versions.sort((a, b) => window.api.utils.compareVersions(a.version, b.version)).reverse();
      this.vzVersions.push(...versions.map(versionObject => {
        const label = versionObject.version;
        return { ...versionObject, label };
      }));
    });

    this.isArgoCDAvailable = ko.observable(false);
    this.computedArgoCDAvailabilityFromVersion = (versionTag = undefined) => {
      const vzInstallVersionTag = versionTag ? versionTag : this.project.vzInstall.versionTag.observable();

      let result = false;  // for now, assume that Verrazzano 1.4.x and below are the most common.
      if (vzInstallVersionTag) {
        const vzInstallVersion = vzInstallVersionTag.slice(1);
        if (window.api.utils.compareVersions(vzInstallVersion, '1.5.0') >= 0) {
          result = true;
        }
      }
      if (this.isArgoCDAvailable() !== result) {
        this.isArgoCDAvailable(result);
      }
    };
  }
  return VerrazzanoInstallDesignViewModel;
});
