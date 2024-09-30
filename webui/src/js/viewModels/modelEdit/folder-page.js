/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper'
],
function(accUtils, i18n, ModelEditHelper, MessageHelper, AliasHelper) {
  function FolderPageViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const NAME = args.name;

    this.i18n = i18n;

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Folder Page loaded.', 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.getTitle = () => {
      if(MODEL_PATH) {
        return MessageHelper.getPageTitle(MODEL_PATH);
      }
      return NAME;
    };

    let fieldMap = {};
    this.attributesModuleConfig = null;
    this.folderMap = {};
    this.folders = [];

    if(MODEL_PATH) {
      fieldMap = ModelEditHelper.createAliasFieldMap(MODEL_PATH, {}, subscriptions);

      // TODO: may have multiple attribute sets, based on configuration

      // create a list of remaining fields
      const knownFieldNames = [];  // [...primaryFieldNames, ...excludeFieldNames];
      const remainingFieldNames = ModelEditHelper.getRemainingFieldNames(fieldMap, knownFieldNames);

      if(remainingFieldNames.length) {
        this.attributesModuleConfig = ModelEditHelper.createFieldSetModuleConfig(remainingFieldNames, fieldMap,
          MODEL_PATH);
      }

      this.fieldConfig = (field) => {
        return ModelEditHelper.createFieldModuleConfig(field, fieldMap, MODEL_PATH);
      };

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
        return ModelEditHelper.createElementTableModuleConfig(folderInfo.modelPath, []);
      };
    }
  }

  return FolderPageViewModel;
});
