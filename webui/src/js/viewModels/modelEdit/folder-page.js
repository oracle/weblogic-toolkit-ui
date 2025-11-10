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

    let contentPath = MODEL_PATH;
    let typeName = null;
    let typeLabel = null;

    this.useTypeFolder = AliasHelper.usesTypeFolders(MODEL_PATH);

    // content path may be below model path, or undefined, for type folder case
    if(this.useTypeFolder) {
      contentPath = null;
      typeName = ModelEditHelper.getTypeFolderName(MODEL_PATH);
      typeLabel = typeName;
      if(typeName && ModelEditHelper.isKnownTypeName(MODEL_PATH, typeName)) {
        contentPath = [...MODEL_PATH, typeName];
        const aliasContentPath = AliasHelper.getAliasPath(contentPath);
        typeLabel = MessageHelper.getFolderLabel(aliasContentPath);
      }
    }

    this.connected = () => {
      accUtils.announce('Folder Page loaded.', 'assertive');
    };

    this.typeMessage = () => {
      if(typeLabel) {
        const key = contentPath ? 'knownProviderType' : 'unknownProviderType';
        return MessageHelper.t(key, { providerType: typeLabel });
      }
      return MessageHelper.t('noProviderType');
    };

    this.folderHeaderModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-header',
      params: {
        modelPath: MODEL_PATH,
      }
    });

    this.folderContentModuleConfig = contentPath ?
      ModelEditHelper.createFolderContentConfig(contentPath) :
      ModelEditHelper.createEmptyConfig(contentPath);
  }

  return FolderPageViewModel;
});
