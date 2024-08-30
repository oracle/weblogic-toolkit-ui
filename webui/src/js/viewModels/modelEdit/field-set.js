/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper',
  'oj-c/form-layout', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, i18n, ModelEditHelper) {
  function FieldSet(args) {
    const MODEL_PATH = args.modelPath;
    const fieldMap = args.fieldMap;

    this.fields = args.fields;

    this.fieldConfig = (field) => {
      return ModelEditHelper.createFieldModuleConfig(field, fieldMap, MODEL_PATH);
    };
  }

  return FieldSet;
});
