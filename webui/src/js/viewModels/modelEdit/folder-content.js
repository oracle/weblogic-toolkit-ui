/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper'
],
function(accUtils, ko, i18n, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper) {
  function FolderContentViewModel(args) {
    // Display the attribute groups, single folders, and multiple folders for a model path.
    // Customizations from MetaHelper are taken into account.
    // This is usually embedded in folder-page or folder-dialog.

    const MODEL_PATH = args.modelPath;
    const TEMP_MODEL = args.model;

    this.i18n = i18n;
    this.subscriptions = [];

    this.connected = () => {
      accUtils.announce('Folder Content loaded.', 'assertive');
      this.subscriptions = [];
    };

    this.disconnected = () => {
      this.subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    this.attributeGroupsModuleConfig = ModelEditHelper.createAttributeGroupsConfig(MODEL_PATH, TEMP_MODEL);

    this.singleFolders = [];
    this.multiFolders = [];

    const folders = AliasHelper.getFolderNames(MODEL_PATH);
    folders.forEach(folderName => {
      const folderPath = [...MODEL_PATH, folderName];
      const aliasPath = AliasHelper.getAliasPath(folderPath);
      const folderInfo = {
        title: MessageHelper.getFolderLabel(aliasPath),
        modelPath: folderPath
      };

      if(AliasHelper.isMultiplePath(folderPath)) {
        this.multiFolders.push(folderInfo);
      } else {
        this.singleFolders.push(folderInfo);
      }
    });

    this.tableModuleConfig = folderInfo => {
      return ModelEditHelper.createInstancesTableModuleConfig(folderInfo.modelPath, TEMP_MODEL);
    };
  }

  return FolderContentViewModel;
});
