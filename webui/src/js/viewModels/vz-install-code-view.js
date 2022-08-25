/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'models/wkt-project', 'utils/i18n', 'ojs/ojarraydataprovider', 'utils/wkt-logger',
  'ojs/ojinputtext', 'ojs/ojnavigationlist', 'ojs/ojswitcher', 'ojs/ojknockout'],
function (accUtils, ko, project, i18n, ArrayDataProvider, wktLogger) {
  function DomainCodeViewModel () {
    this.project = project;

    // let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Image code view loaded.', 'assertive');
    };

    // this.disconnected = () => {
    //   subscriptions.forEach((subscription) => {
    //     subscription.dispose();
    //   });
    // };

    this.project = project;

    this.labelMapper = (labelId) => {
      return i18n.t(`domain-code-${labelId}`);
    };
  }

  return DomainCodeViewModel;
});
