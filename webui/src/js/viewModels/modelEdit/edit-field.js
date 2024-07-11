/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n',
  'oj-c/button', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, i18n) {
  function EditField(args) {
    this.i18n = i18n;

    this.field = args.field;
    this.observable = args.observable;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`${args.labelPrefix}-${labelId}`, payload);
    };

    this.fieldLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-field-${labelId}`, payload);
    };

    this.showMenu = (field) => {
      console.log('show menu for ' + field.key);
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

      if(['string', 'credential'].includes(field.type)) {
        return 'string';
      }

      return 'unknown';
    };
  }

  return EditField;
});
