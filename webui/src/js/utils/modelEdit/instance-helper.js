/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/i18n', 'utils/modelEdit/alias-helper', 'utils/modelEdit/meta-helper',
  'utils/modelEdit/model-edit-helper'],

function (i18n, AliasHelper, MetaHelper,
  ModelEditHelper) {

  function InstanceHelper() {
    const INSTANCE_NAME_REGEX= /^[\w.!-]+$/;  // TODO: refine this

    // modelPath should end with type name, like /topology/Server
    this.getNewInstanceName = (modelPath, model) => {
      const typeName = modelPath[modelPath.length - 1];
      const modelFolder = ModelEditHelper.getFolder(modelPath, model);
      const instanceKeys = Object.keys(modelFolder);
      let i = 1;
      let modelName = getInstanceName(typeName, i);
      while(instanceKeys.includes(modelName)) {
        i++;
        modelName = getInstanceName(typeName, i);
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
            const message = i18n.t('model-edit-instance-name-in-use-error');
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
              const message = i18n.t('model-edit-instance-name-error');
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
  }

  // return a singleton instance
  return new InstanceHelper();
});
