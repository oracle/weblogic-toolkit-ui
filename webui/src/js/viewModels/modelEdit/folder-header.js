/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/navigation-helper', 'utils/dialog-helper',
  'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, AliasHelper, MessageHelper, ModelEditHelper, NavigationHelper, DialogHelper) {
  function FolderHeaderViewModel(args) {
    const MODEL_PATH = args.modelPath;

    this.i18n = i18n;

    this.connected = () => {
      accUtils.announce('Folder Header loaded.', 'assertive');
    };

    this.getTitle = () => {
      if(MODEL_PATH) {
        return MessageHelper.getPageTitle(MODEL_PATH);
      }
      return 'No model path';
    };

    this.isMultiple = AliasHelper.isNamedPath(MODEL_PATH);

    this.renameLabel = i18n.t('model-edit-rename-label');

    this.renameInstance = () => {
      const options = {
        modelPath: MODEL_PATH
      };
      DialogHelper.promptDialog('modelEdit/rename-instance-dialog', options).then(result => {
        if (result) {
          const newName = result.instanceName;
          if (newName) {
            ModelEditHelper.renameInstance(MODEL_PATH, newName);

            const parentPath = MODEL_PATH.slice(0, -1);
            NavigationHelper.openNavigation(parentPath);
            NavigationHelper.navigateToElement(parentPath, newName);
          }
        }
      });
    };
  }

  return FolderHeaderViewModel;
});
