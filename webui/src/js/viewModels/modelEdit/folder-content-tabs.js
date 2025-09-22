/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper', 'utils/common-utilities', 'ojs/ojarraydataprovider', 'ojs/ojmodule-element-utils'
],
function(accUtils, ko, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper, utils, ArrayDataProvider,
  ModuleElementUtils) {

  function FolderContentTabsViewModel(args) {
    // Display the attribute groups and folders for a model path as tabs in a single row.
    // Customizations from MetaHelper are taken into account.
    // This is usually embedded in folder-page or folder-dialog.

    const MODEL_PATH = args.modelPath;
    const TEMP_MODEL = args.model;

    this.subscriptions = [];

    this.connected = () => {
      accUtils.announce('Folder Content Tabs loaded.', 'assertive');
      this.subscriptions = [];
    };

    this.disconnected = () => {
      this.subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId) => {
      return MessageHelper.t(labelId);
    };

    this.tabs = ko.observableArray();

    const aliasAttributesMap = AliasHelper.getAttributesMap(MODEL_PATH);
    const hasAttributes = !!Object.keys(aliasAttributesMap).length;

    this.attributeGroupsModuleConfig = ModelEditHelper.createAttributeGroupsConfig(MODEL_PATH, TEMP_MODEL);

    if(hasAttributes) {
      this.tabs.push({
        id: utils.getShortUuid(),
        name: this.labelMapper('attributes-label'),
        modulePath: 'modelEdit/attribute-groups',
        moduleParams: {
          modelPath: MODEL_PATH,
          model: TEMP_MODEL
        }
      });
    }

    const folders = AliasHelper.getFolderNames(MODEL_PATH);
    folders.forEach(folderName => {
      const folderPath = [...MODEL_PATH, folderName];
      const aliasPath = AliasHelper.getAliasPath(folderPath);

      let modulePath;
      let moduleParams;

      if(AliasHelper.isMultiplePath(folderPath)) {
        modulePath = 'modelEdit/instances-table';
        moduleParams = {
          modelPath: folderPath,
          model: TEMP_MODEL
        };
      } else {
        modulePath = 'modelEdit/folder-content-tabs';
        moduleParams = {
          modelPath: folderPath,
          model: TEMP_MODEL
        };
      }

      this.tabs.push({
        id: utils.getShortUuid(),
        name: MessageHelper.getFolderLabel(aliasPath),
        modulePath: modulePath,
        moduleParams: moduleParams
      });
    });

    this.updateSelectedTab = () => {
      const selectedKey = this.selectedTab();
      if(selectedKey) {
        this.tabsData.fetchByKeys({keys: [selectedKey]})
          .then(result => {
            const keyResult = result.results.get(selectedKey);
            if (keyResult) {
              const entry = keyResult.data;
              console.log(JSON.stringify(entry));
              this.selectedModuleConfig(ModuleElementUtils.createConfig({
                name: entry.modulePath,
                params: entry.moduleParams
              }));
            } else {
              console.log('NONE');
            }
          });
      } else {
        console.log('NONE');
      }
    };

    const initialTab = this.tabs().length ? this.tabs()[0] : null;

    this.selectedTab = ko.observable(initialTab ? initialTab.id : null);
    this.selectedModuleConfig = ko.observable(ModuleElementUtils.createConfig({
      name: initialTab ? initialTab.modulePath : 'empty-view',
      params: initialTab ? initialTab.moduleParams : {}
    }));

    this.subscriptions.push(this.selectedTab.subscribe(value => {
      console.log('selected: ' + value);
      this.updateSelectedTab();
    }));

    this.showTabs = ko.computed(() => {
      const attributesOnly = hasAttributes && (this.tabs().length === 1);

      console.log('a only: ' + attributesOnly + ' / ' + hasAttributes + ' ' + this.tabs().length);

      return this.tabs().length && !attributesOnly;
    });

    this.tabsData = new ArrayDataProvider(this.tabs, {keyAttributes: 'id'});
  }

  return FolderContentTabsViewModel;
});
