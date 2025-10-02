/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper',
  'ojs/ojarraydataprovider',
  'oj-c/tab-bar'
],
function(accUtils, ko, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper, ArrayDataProvider) {
  function TabsSectionViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const TABS = args.tabs;
    const ATTRIBUTE_MAP = args.attributeMap;
    const FOLDER_INFO = args.folderInfo;
    const IS_TOP_SECTIONS = args.isTopSections;

    const REMAINING_ATTRIBUTES = FOLDER_INFO.remainingAttributes;
    const REMAINING_ATTRIBUTES_ASSIGNED = FOLDER_INFO.remainingAttributesAssigned;
    const REMAINING_FOLDERS = FOLDER_INFO.remainingFolders;
    const REMAINING_FOLDERS_ASSIGNED = FOLDER_INFO.remainingFoldersAssigned;

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Inline section loaded.', 'assertive');
      subscriptions.push(this.selectedTab.subscribe(selectedTab => {
        this.selectTab(selectedTab);
      }));
    };

    this.disconnected = () => {
      subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    this.tabs = TABS;

    let lastId = 0;
    const tabsArray = [];
    const tabsMap = [];

    // might need a first tab for remaining attributes
    if(IS_TOP_SECTIONS && !REMAINING_ATTRIBUTES_ASSIGNED && REMAINING_ATTRIBUTES.length) {
      const itemKey = 'tab-' + lastId++;
      const tabType = 'attributes';
      const attributes = REMAINING_ATTRIBUTES;
      const label = MessageHelper.t('attributes-tab-label');

      const tabEntry = {
        itemKey,
        label,
        tabType,
        attributes
      };
      tabsArray.push(tabEntry);
      tabsMap[itemKey] = tabEntry;
    }

    // add declared tabs
    TABS.forEach(tab => {
      const itemKey = 'tab-' + lastId++;
      const tabEntry = {
        itemKey
      };

      if(tab.type === 'folderTab') {
        const folderName = tab.folder;  // TODO: allow absolute paths?
        const folderPath = [...MODEL_PATH, folderName];
        const aliasPath = AliasHelper.getAliasPath(folderPath);
        tabEntry.label = MessageHelper.getFolderLabel(aliasPath);
        tabEntry.tabType = AliasHelper.isMultiplePath(folderPath) ? 'multiFolder' : 'singleFolder';
        tabEntry.folderPath = folderPath;

      } else if(tab.type === 'attributesTab') {
        const tabLabelKey = tab.label ? tab.label : 'attributes-tab-label';
        tabEntry.label = MessageHelper.t(tabLabelKey);
        tabEntry.tabType = 'attributes';
        tabEntry.attributes = tab.attributes;
        tabEntry.addRemainingAttributes = tab.addRemainingAttributes;

      } else {
        const tabLabelKey = tab.label ? tab.label : 'no-tab-label';
        tabEntry.label = MessageHelper.t(tabLabelKey);
        tabEntry.tabType = 'sections';
        tabEntry.sections = tab['sections'] || [];
      }

      tabsArray.push(tabEntry);
      tabsMap[itemKey] = tabEntry;
    });

    // add remaining folders as tabs
    if(IS_TOP_SECTIONS && !REMAINING_FOLDERS_ASSIGNED && REMAINING_FOLDERS.length) {
      REMAINING_FOLDERS.forEach(folderName => {
        const itemKey = 'tab-' + lastId++;

        const folderPath = [...MODEL_PATH, folderName];
        const aliasPath = AliasHelper.getAliasPath(folderPath);
        const tabType = AliasHelper.isMultiplePath(folderPath) ? 'multiFolder' : 'singleFolder';
        const label = MessageHelper.getFolderLabel(aliasPath);

        const tabEntry = {
          itemKey,
          label,
          tabType,
          folderPath
        };
        tabsArray.push(tabEntry);
        tabsMap[itemKey] = tabEntry;
      });
    }

    const firstTabKey = tabsArray.length ? tabsArray[0].itemKey : null;
    this.selectedTab = ko.observable(firstTabKey);

    this.tabsData = new ArrayDataProvider(tabsArray, { keyAttributes: 'itemKey' });

    this.tabModuleConfig = ko.observable(ModelEditHelper.createEmptyConfig());

    this.selectTab = tabId => {
      const selectedTab = tabsMap[tabId];
      const tabType = selectedTab.tabType;

      let tabConfig;
      if(tabType === 'singleFolder') {
        const folderPath = selectedTab.folderPath;
        tabConfig = ModelEditHelper.createFolderContentConfig(folderPath);

      } else if(tabType === 'multiFolder') {
        const folderPath = selectedTab.folderPath;
        tabConfig = ModelEditHelper.createInstancesSectionConfig(folderPath);

      } else if(tabType === 'attributes') {
        const fakeSection = {
          attributes: selectedTab.attributes,
          addRemainingAttributes: selectedTab.addRemainingAttributes
        };
        tabConfig = ModelEditHelper.createAttributesSectionConfig(MODEL_PATH, fakeSection, ATTRIBUTE_MAP, FOLDER_INFO);

      } else {
        const sections = selectedTab.sections || [];
        tabConfig = ModelEditHelper.createSectionsConfig(MODEL_PATH, sections, FOLDER_INFO, ATTRIBUTE_MAP, false);
      }

      this.tabModuleConfig(tabConfig);
    };

    if(firstTabKey != null) {
      this.selectTab(firstTabKey);
    }
  }

  return TabsSectionViewModel;
});
