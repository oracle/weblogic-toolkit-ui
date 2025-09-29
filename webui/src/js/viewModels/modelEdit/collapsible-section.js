/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'oj-c/collapsible'
],
function(accUtils, ko, ModelEditHelper, MessageHelper) {
  function CollapsibleSectionViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const META_SECTION = args.metaSection;
    const ATTRIBUTE_MAP = args.attributeMap;
    const FOLDER_INFO = args.folderInfo;

    const TITLE = META_SECTION.title;

    this.connected = () => {
      accUtils.announce('Collapsible section loaded.', 'assertive');
    };

    this.collapsibleLabel = TITLE ? MessageHelper.t(TITLE) : null;

    const sections = META_SECTION['sections'] || [];
    this.sectionsModuleConfig = ModelEditHelper.createSectionsConfig(
      MODEL_PATH, sections, FOLDER_INFO, ATTRIBUTE_MAP, false);
  }

  return CollapsibleSectionViewModel;
});
