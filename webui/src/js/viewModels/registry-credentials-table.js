/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/common-utilities', 'utils/view-helper',
  'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojtable' ],
function(accUtils, ko, i18n, project, ArrayDataProvider,
  BufferingDataProvider, utils, viewHelper) {

  function RegistryCredentialsTableViewModel() {

    this.connected = () => {
      accUtils.announce('Registry credentials table loaded.', 'assertive');
    };

    this.project = project;

    this.labelMapper = (labelId) => {
      return i18n.t(`project-settings-${labelId}`);
    };

    this.containerImageRegistriesCredentialsColumnData = [
      {
        headerText: this.labelMapper('container-image-registries-credentials-name-heading'),
        sortProperty: 'name',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('container-image-registries-credentials-address-heading'),
        sortProperty: 'address',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('container-image-registries-credentials-email-heading'),
        sortProperty: 'email',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('container-image-registries-credentials-username-heading'),
        sortProperty: 'username',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('container-image-registries-credentials-password-heading'),
        sortable: 'disable',
        resizable: 'enabled'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
    ];

    this.credentialsObservable = this.project.settings.containerImageRegistriesCredentials.observable;

    this.containerImageRegistriesCredentialsDataProvider =
      new BufferingDataProvider(new ArrayDataProvider(this.credentialsObservable, { keyAttributes: 'uid' }));

    this.addCredential = () => {
      const names = [];
      this.credentialsObservable().forEach(item => {
        names.push(item.name);
      });

      let nextIndex = 0;
      while (names.indexOf(`new-registry-${nextIndex + 1}`) !== -1) {
        nextIndex++;
      }

      this.project.settings.containerImageRegistriesCredentials.addNewItem({
        uid: utils.getShortUuid(),
        name: `new-registry-${nextIndex + 1}`,
        address: '',
        email: '',
        username: '',
        password: '',
      });
    };

    this.deleteCredential = (event, context) => {
      this.credentialsObservable.remove(context.item.data);
    };
  }

  return RegistryCredentialsTableViewModel;
});
