/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/modelEdit/module-helper', 'utils/modelEdit/message-helper',
  'oj-c/form-layout', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, ModuleHelper, MessageHelper) {
  function AttributesSection(args) {
    const META_SECTION = args.metaSection;
    const ATTRIBUTE_MAP = args.attributeMap;
    const FOLDER_INFO = args.folderInfo;

    let attributes = META_SECTION.attributes || [];
    if(META_SECTION['addRemainingAttributes']) {
      const remainingAttributes = FOLDER_INFO.remainingAttributes;
      attributes = [...attributes, ...remainingAttributes];
    }

    this.title = MessageHelper.getLabel(META_SECTION);

    this.attributesConfig = ModuleHelper.createAttributeSetConfig(attributes, ATTRIBUTE_MAP);
  }

  return AttributesSection;
});
