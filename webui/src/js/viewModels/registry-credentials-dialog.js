/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojmodule-element-utils',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout' ],
function(accUtils, ko, i18n, ViewHelper, ModuleElementUtils) {
  function RegistryCredentialsDialogModel() {
    const DIALOG_SELECTOR = '#wktRegistryCredentialsDialog';

    this.connected = () => {
      accUtils.announce('Registry credentials dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`registry-credentials-dialog-${labelId}`, payload);
    };

    this.t = (labelId, payload) => {
      return i18n.t(labelId, payload);
    };

    this.getTitle = () => {
      return this.labelMapper('title');
    };

    this.registryCredentialsModule = ModuleElementUtils.createConfig({
      name: 'registry-credentials-table',
      params: {}
    });

    this.dismissDialog = () => {
      const dialog = this.dialogContainer;
      if (dialog) {
        dialog.close();
      }
    };
  }

  return RegistryCredentialsDialogModel;
});
