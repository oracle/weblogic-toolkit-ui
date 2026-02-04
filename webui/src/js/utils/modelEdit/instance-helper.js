/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper', 'utils/modelEdit/meta-helper',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-methods', 'utils/dialog-helper',
  'utils/modelEdit/navigation-helper'],

function (MessageHelper, AliasHelper, MetaHelper, ModelEditHelper, MetaMethods, DialogHelper,
  NavigationHelper) {

  const DEFAULT_REALM_NAME = 'myrealm';

  function InstanceHelper() {
    const INSTANCE_NAME_REGEX= /^[\w.!-]+$/;  // TODO: refine this

    // modelPath should end with type name, like /topology/Server
    this.getNewInstanceName = (modelPath, model) => {
      const aliasPath = AliasHelper.getAliasPath(modelPath);
      const newNameHandler = MetaHelper.getNewFolderNameHandler(aliasPath);
      const newNameMethod = newNameHandler ? this[newNameHandler] : getInstanceName;

      let typeName = MessageHelper.getFolderTypeLabel(modelPath);
      if (typeName) {
        typeName = typeName.replace(/ /g, '').replace(/-/g, '');
      } else {
        typeName = modelPath[modelPath.length - 1];
      }
      const modelFolder = ModelEditHelper.getFolder(modelPath, model);
      const instanceKeys = Object.keys(modelFolder);
      let i = 1;
      let modelName = newNameMethod(typeName, i);
      while(instanceKeys.includes(modelName)) {
        i++;
        modelName = newNameMethod(typeName, i);
      }
      return modelName;
    };

    // modelPath should end with instance name, like /topology/Server/myServer
    this.getNameValidators = modelPath => {
      const originalName = modelPath.slice(-1);
      const parentPath = modelPath.slice(0, -1);
      const parentFolder = ModelEditHelper.getFolder(parentPath);
      const instanceNames = Object.keys(parentFolder);

      const nameValidators = [];
      nameValidators.push({
        // always check against peer instance names
        validate: value => {
          if((value !== originalName) && instanceNames.includes(value)) {
            const message = MessageHelper.t('instance-name-in-use-error');
            throw new Error(message);
          }
        }
      });

      // if validators specified in folder metadata, use those instead of additional default validations
      const aliasPath = AliasHelper.getAliasPath(modelPath);
      const metaValidators = MetaHelper.getNameValidators(aliasPath);

      if(metaValidators.length) {
        nameValidators.push(...metaValidators);

      } else {
        nameValidators.push({
          validate: value => {
            if (!INSTANCE_NAME_REGEX.test(value)) {
              const message = MessageHelper.t('instance-name-error');
              throw new Error(message);
            }
          }
        });
      }
      return nameValidators;
    };

    function getInstanceName(typeName, i) {
      return `${typeName}-${i}`;
    }

    this.addInstance = modelPath => {
      // if instances of this type already exist, prompt for a new name.
      // otherwise, prompt for a name and folder contents.

      const aliasPath = AliasHelper.getAliasPath(modelPath);
      const addHandler = MetaHelper.getAddHandler(aliasPath);
      const newFolderContentHandler = MetaHelper.getNewFolderContentHandler(aliasPath);
      if(addHandler) {
        MetaMethods[addHandler](modelPath);
        return;
      }

      const options = {
        modelPath: modelPath
      };
      DialogHelper.promptDialog('modelEdit/new-instance-dialog', options)
        .then(result => {
          const newName = result.instanceName;
          if (newName) {
            const content = newFolderContentHandler ? MetaMethods[newFolderContentHandler]() : undefined;
            ModelEditHelper.addFolder(modelPath, newName, content);

            const useTypeFolder = AliasHelper.usesTypeFolders(modelPath);
            if(useTypeFolder && result.providerType) {
              const instancePath = [...modelPath, newName];
              ModelEditHelper.addFolder(instancePath, result.providerType, content);
            }

            NavigationHelper.openNavigation(modelPath);  // open parent
          }
        });
    };

    // *************************
    // custom type name methods
    // *************************

    this.getRealmName = (typeName, i) => {
      return (i === 1) ? DEFAULT_REALM_NAME : getInstanceName(typeName, i);
    };
  }

  // return a singleton instance
  return new InstanceHelper();
});
