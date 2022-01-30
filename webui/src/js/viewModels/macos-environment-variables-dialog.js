/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider',
  'ojs/ojlistdataproviderview', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog',
  'ojs/ojformlayout' ],
function(accUtils, ko, i18n, viewHelper, ArrayDataProvider, ListDataProviderView) {
  function PathDirectoriesDialogModel(config) {
    const DIALOG_SELECTOR = '#wktMacosEnvironmentVariablesDialog';

    this.connected = () => {
      accUtils.announce('macOS Environment Variables dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`macos-environment-variables-dialog-${labelId}`, payload);
    };

    this.formatEnvironmentVariablesData = () => {
      if (!config || !config.environmentVariables) {
        return [];
      }

      const result = [];
      for (const [name, value] of Object.entries(config.environmentVariables)) {
        result.push({
          name: name,
          value: value
        });
      }
      return result;
    };

    this.i18n = i18n;
    this.environmentVariables = this.formatEnvironmentVariablesData();
    this.environmentVariablesDataProvider =
      new ListDataProviderView(new ArrayDataProvider(this.environmentVariables, { keyAttributes: 'name' }),
        { sortCriteria: [{ attribute: 'name', direction: 'ascending' }]});

    this.environmentVariablesColumnData = [
      {
        'className': 'wkt-table-env-vars-cell',
        'headerClassName': 'wkt-table-env-vars-header',
        'headerText': this.labelMapper('name-header'),
        'field': 'name',
        'resizable': 'enabled',
        'weight': 30
      },
      {
        'className': 'wkt-table-env-vars-cell',
        'headerClassName': 'wkt-table-env-vars-header',
        'headerText': this.labelMapper('value-header'),
        'field': 'value',
        'resizable': 'enabled',
        'weight': 70
      }
    ];

    this.dismissDialog = () => {
      const dialog = this.dialogContainer;
      if (dialog) {
        dialog.close();
      }
    };
  }

  return PathDirectoriesDialogModel;
});
