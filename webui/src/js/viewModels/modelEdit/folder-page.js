/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, ModelEditHelper, MessageHelper, AliasHelper, ModuleElementUtils) {
  function FolderPageViewModel(args) {
    const MODEL_PATH = args.modelPath;

    this.i18n = i18n;

    this.connected = () => {
      accUtils.announce('Folder Page loaded.', 'assertive');
    };

    this.folderHeaderModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-header',
      params: {
        modelPath: MODEL_PATH,
      }
    });

    this.folderContentModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-content',
      params: {
        modelPath: MODEL_PATH,
      }
    });
  }

  return FolderPageViewModel;
});
