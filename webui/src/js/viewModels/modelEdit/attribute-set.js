/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/modelEdit/module-helper',
  'oj-c/form-layout', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, ModuleHelper) {
  function AttributeSet(args) {
    const ATTRIBUTE_MAP = args.attributeMap;

    this.attributes = args.attributes;

    this.attributeConfig = attribute => {
      return ModuleHelper.createAttributeEditorConfig(attribute, ATTRIBUTE_MAP);
    };
  }

  return AttributeSet;
});
