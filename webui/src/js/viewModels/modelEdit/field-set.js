/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper', 'ojs/ojmodule-element-utils',
  'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, i18n, ModelEditHelper, ModuleElementUtils) {
  function FieldSet(args) {
    this.i18n = i18n;

    this.fields = args.fields;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`${args.labelPrefix}-${labelId}`, payload);
    };

    this.fieldConfig = (field) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/edit-field',
        params: {
          field: field,
          observable: args.att[field.key],
          labelPrefix: args.labelPrefix
        }
      });
    };
  }

  return FieldSet;
});
