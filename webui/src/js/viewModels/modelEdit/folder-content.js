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
    const MODEL_PATH = args.modelPath;
    const TEMP_MODEL = args.model;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.i18n = i18n;
    this.subscriptions = [];

    this.connected = () => {
      accUtils.announce('Folder Content loaded.', 'assertive');

      // this has to be done on connect - when this module is in a dialog,
      // the same instance is connected/disconnected multiple times on open (?),
      this.subscriptions = [];
      this.initializeAttributes();
    };

    this.disconnected = () => {
      this.subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    this.attributeModuleConfigs = ko.observableArray();

    this.initializeAttributes = () => {
      let fieldMap = {};

      if (MODEL_PATH) {
        fieldMap = ModelEditHelper.createAliasFieldMap(MODEL_PATH, {}, this.subscriptions, TEMP_MODEL);

        const attributeGroups = MetaHelper.getAttributeGroups(ALIAS_PATH);

        this.attributeModuleConfigs.removeAll();

        // collect the known attribute names, and check for a group with remainder

        let remainderGroup = null;
        const knownAttributeNames = [];
        attributeGroups.forEach(group => {
          const attributesMap = group['members'] || {};
          const attributeNames = Object.keys(attributesMap);
          knownAttributeNames.push(...attributeNames);

          if (group['remainder']) {
            remainderGroup = group;
          }
        });

        const remainingNames = ModelEditHelper.getRemainingFieldNames(fieldMap, knownAttributeNames);

        // create a module config for each configured attribute group, inserting remaining attributes if specified

        let remainderConfig = null;
        attributeGroups.forEach(group => {
          const attributesMap = group['members'] || {};
          const attributeNames = Object.keys(attributesMap);
          if (group === remainderGroup) {
            attributeNames.push(...remainingNames);
          }

          if (attributeNames.length) {
            const moduleConfig = ModelEditHelper.createFieldSetModuleConfig(attributeNames, fieldMap, MODEL_PATH);
            this.attributeModuleConfigs.push(moduleConfig);
          }
        });

        // if there are remaining attributes and no remaining group specified, create a remaining group

        if (remainingNames.length && !remainderGroup) {
          remainderConfig = ModelEditHelper.createFieldSetModuleConfig(remainingNames, fieldMap, MODEL_PATH);
          this.attributeModuleConfigs.push(remainderConfig);
        }
      }
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
      return ModelEditHelper.createInstancesTableModuleConfig(folderInfo.modelPath, []);
    };
  }

  return FolderContentViewModel;
});
