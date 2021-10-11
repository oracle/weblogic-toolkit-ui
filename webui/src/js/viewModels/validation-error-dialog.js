/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider', 'ojs/ojknockout',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout' ],
function(accUtils, ko, i18n, viewHelper) {
  function ValidationErrorDialogModel(config) {
    const DIALOG_SELECTOR = '#wktValidationErrorDialog';

    this.connected = () => {
      accUtils.announce('Validation Error dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`validation-error-dialog-${labelId}`, payload);
    };

    this.i18n = i18n;
    this.config = config;

    this.getTitle = () => {
      return this.config.title || this.labelMapper('default-title');
    };

    this.getMessage = () => {
      return this.config.message || '';
    };

    this.validationErrorFields = this.config.errorFields || [];

    this.dismissDialog = () => {
      const dialog = this.dialogContainer;
      if (dialog) {
        dialog.close();
      }
    };
  }

  return ValidationErrorDialogModel;
});
