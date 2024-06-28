/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper',
  'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, i18n, ModelEditHelper) {
  function FieldSet(args) {
    this.i18n = i18n;

    this.fields = args.fields;
    this.labelMapper = args.labelMapper;
    this.att = args.att;
  }

  return FieldSet;
});
