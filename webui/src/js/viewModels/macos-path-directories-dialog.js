/**
 * @license
 * Copyright (c) 2022, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider', 'ojs/ojknockout',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout' ],
function(accUtils, ko, i18n, ViewHelper, ArrayDataProvider) {
  function PathDirectoriesDialogModel(config) {
    const DIALOG_SELECTOR = '#wktMacosPathDirectoriesDialog';

    this.connected = () => {
      accUtils.announce('macOS Path Directories dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`macos-path-directories-dialog-${labelId}`, payload);
    };

    this.formatPathDirectoriesData = () => {
      if (!config || !config.pathDirectories) {
        return [];
      }

      const result = [];
      for (const pathDirectory of config.pathDirectories) {
        result.push({value: pathDirectory});
      }
      return result;
    };

    this.i18n = i18n;
    this.pathDirectories = this.formatPathDirectoriesData();
    this.pathDirectoriesDataProvider = new ArrayDataProvider(this.pathDirectories, {  keyAttributes: 'value' });

    this.pathDirectoriesColumnData = [
      {
        className: 'wkt-table-env-vars-cell',
        headerClassName: 'wkt-table-env-vars-header',
        headerText: this.labelMapper('name-header'),
        field: 'value',
        sortable: 'disable'
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
