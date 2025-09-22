/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/navigation-helper', 'utils/dialog-helper',
  'ojs/ojmodule-element-utils', 'oj-c/labelled-link'
],
function(accUtils, AliasHelper, MessageHelper, ModelEditHelper, NavigationHelper, DialogHelper) {
  function FolderHeaderViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.isMultiple = AliasHelper.isNamedPath(MODEL_PATH);

    let parentPath = null;
    if(MODEL_PATH.length > 1) {
      const truncate = this.isMultiple ? 2 : 1;
      parentPath = MODEL_PATH.slice(0, 0 - truncate);
    }

    this.connected = () => {
      accUtils.announce('Folder Header loaded.', 'assertive');
    };

    this.getTitle = () => {
      if(MODEL_PATH) {
        return MessageHelper.getPageTitle(MODEL_PATH);
      }
      return 'No model path';
    };

    this.prefixText = null;

    if(parentPath && (parentPath.length > 1)) {  // don't show domainInfo, topology, etc. in prefix
      const prefixPath = ALIAS_PATH.slice(0, -1);
      this.prefixText = MessageHelper.getFolderLabel(prefixPath);
      if(AliasHelper.isNamedPath(parentPath)) {
        const name = parentPath[parentPath.length - 1];
        this.prefixText += ` \"${name}\"`;
      }
    }

    this.renameLabel = MessageHelper.t('rename-label');

    this.navigateToParent = () => {
      NavigationHelper.navigateToElement(parentPath);
    };

    this.renameInstance = () => {
      const options = {
        modelPath: MODEL_PATH
      };
      DialogHelper.promptDialog('modelEdit/rename-instance-dialog', options).then(result => {
        if (result) {
          const newName = result.instanceName;
          if (newName) {
            ModelEditHelper.renameInstance(MODEL_PATH, newName);

            const typePath = MODEL_PATH.slice(0, -1);
            NavigationHelper.navigateToElement(typePath, newName);
          }
        }
      });
    };
  }

  return FolderHeaderViewModel;
});
