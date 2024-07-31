/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/dialog-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, i18n, DialogHelper) {
  function EditField(args) {
    this.i18n = i18n;

    this.field = args.field;
    this.observable = args.observable;

    const labelPrefix = args.labelPrefix;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`${labelPrefix}-${labelId}`, payload);
    };

    this.fieldLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-field-${labelId}`, payload);
    };

    // this.menuIconClass = 'oj-ux-ico-edit-box';
    // this.menuIconClass = 'oj-ux-ico-three-boxes-vertical';
    this.menuIconClass = 'oj-ux-ico-three-circles-vertical';

    // return a method to show options dialog
    this.showOptions = (field) => {
      return () => {
        const options = { fieldInfo: field, labelPrefix: labelPrefix };
        DialogHelper.promptDialog('modelEdit/edit-field-dialog', options)
          .then(result => {
            if (result) {
              console.log('dialog result: ' + result);
            }
          });
      };
    };

    this.displayType = (field) => {
      if(field.type === 'password') {
        return 'password';
      }

      if(field.type === 'boolean') {
        return 'boolean';
      }

      if(field.type === 'dict') {
        return 'dict';
      }

      if(field.type === 'list') {
        return 'list';
      }

      if(field.type === 'integer') {
        return 'integer';
      }

      if(['string', 'credential'].includes(field.type)) {
        return 'string';
      }

      return 'unknown';
    };
  }

  return EditField;
});
