/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/modelEdit/model-edit-helper',
  'oj-c/form-layout', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, ModelEditHelper) {
  function AttributeSet(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE_MAP = args.attributeMap;

    this.attributes = args.attributes;

    this.attributeConfig = attribute => {
      return ModelEditHelper.createAttributeModuleConfig(MODEL_PATH, attribute, ATTRIBUTE_MAP);
    };
  }

  return AttributeSet;
});
