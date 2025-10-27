/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/navigation-helper', 'utils/dialog-helper',
  'oj-c/button'
],
function(accUtils, AliasHelper, MessageHelper, ModelEditHelper, NavigationHelper, DialogHelper) {
  function FolderHeaderViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.connected = () => {
      accUtils.announce('Folder Header loaded.', 'assertive');
    };

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    let breadcrumbPath = null;
    if(MODEL_PATH.length > 1) {
      breadcrumbPath = MODEL_PATH.slice(0, -1);
    }

    this.crumbs = [];
    if(breadcrumbPath && breadcrumbPath.length) {
      let currentPath = [];
      breadcrumbPath.forEach(modelElement => {
        currentPath.push(modelElement);
        let link = null;
        let label;
        if(AliasHelper.isNamedPath(currentPath)) {
          label = modelElement;
          link = [...currentPath];  // shallow copy
        } else {
          const aliasPath = AliasHelper.getAliasPath(currentPath);
          if(!aliasPath) {
            label = MessageHelper.getFolderNameLabel(currentPath[currentPath.length - 1]);
          } else {
            label = MessageHelper.getFolderLabel(aliasPath);
            link = [...currentPath];  // shallow copy
          }
        }

        this.crumbs.push({
          label,
          link
        });
      });
    }

    this.title = 'No model path';
    if(AliasHelper.isNamedPath(MODEL_PATH)) {
      this.title = MODEL_PATH[MODEL_PATH.length - 1];
    } else {
      this.title = MessageHelper.getFolderLabel(ALIAS_PATH);
    }

    this.navigateTo = (dummy, event) => {
      const crumb = event.data;
      NavigationHelper.navigateToElement(crumb.link);
    };

    this.showEditButtons = () => {
      return AliasHelper.isNamedPath(MODEL_PATH);
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

    this.deleteInstance = () => {
      const options = {
        modelPath: MODEL_PATH
      };
      DialogHelper.promptDialog('modelEdit/delete-instance-dialog', options).then(result => {
        if (result) {
          const doDelete = result.doDelete;
          if (doDelete) {
            const typePath = MODEL_PATH.slice(0, -1);
            const name = MODEL_PATH[MODEL_PATH.length - 1];
            ModelEditHelper.deleteModelElement(typePath, name);

            NavigationHelper.navigateToElement(typePath);
          }
        }
      });
    };
  }

  return FolderHeaderViewModel;
});
