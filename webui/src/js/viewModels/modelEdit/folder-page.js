/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/modelEdit/meta-helper', 'ojs/ojmodule-element-utils'
],
function(accUtils, ModelEditHelper, MessageHelper, AliasHelper, MetaHelper, ModuleElementUtils) {
  function FolderPageViewModel(args) {
    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.connected = () => {
      accUtils.announce('Folder Page loaded.', 'assertive');
    };

    this.folderHeaderModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-header',
      params: {
        modelPath: MODEL_PATH,
      }
    });

    this.folderContentModuleConfig = ModelEditHelper.createFolderContentConfig(MODEL_PATH);
  }

  return FolderPageViewModel;
});
