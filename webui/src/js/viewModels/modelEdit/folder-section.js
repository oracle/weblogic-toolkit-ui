/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/module-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper'
],
function(accUtils, ko, ModuleHelper, MetaHelper, MessageHelper, AliasHelper) {
  function FolderSectionViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const META_SECTION = args.metaSection;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.connected = () => {
      accUtils.announce('Folder Section loaded.', 'assertive');
    };

    this.title = MessageHelper.getLabel(META_SECTION) || MessageHelper.getFolderLabel(ALIAS_PATH);

    this.folderConfig = ModuleHelper.createFolderContentConfig(MODEL_PATH);
  }

  return FolderSectionViewModel;
});
