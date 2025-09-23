/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper'
],
function(accUtils, ko, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper) {
  function FolderContentViewModel(args) {
    // Display the attribute groups, single folders, and multiple folders for a model path.
    // Customizations from MetaHelper are taken into account.
    // This is usually embedded in folder-page or folder-section.

    const MODEL_PATH = args.modelPath;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

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

    const metaSections = MetaHelper.getSections(ALIAS_PATH);
    const attributeMap = ModelEditHelper.createAttributeMap(MODEL_PATH, {}, this.subscriptions);

    // collect the configured metadata attribute names, and check for a content group with remainder=true

    let remainderContent = null;
    const knownAttributeNames = [];
    metaSections.forEach(metaSection => {
      const contents = metaSection['contents'] || [];
      contents.forEach(content => {
        const attributeNames = content['attributes'] || [];
        knownAttributeNames.push(...attributeNames);
        if(content['remainder']) {
          remainderContent = content;
        }
      });
    });

    const remainingNames = ModelEditHelper.getRemainingAttributeNames(attributeMap, knownAttributeNames);

    this.sections = [];
    metaSections.forEach(metaSection => {
      if(metaSection.type === 'inline') {
        const inlineConfig = ModelEditHelper.createInlineSectionConfig(MODEL_PATH, metaSection, attributeMap, remainingNames);
        this.sections.push({
          type: metaSection.type,
          moduleConfig: inlineConfig
        });
      }

      if(metaSection.type === 'collapsible') {
        const collapsibleConfig = ModelEditHelper.createCollapsibleSectionConfig(MODEL_PATH, metaSection, attributeMap, remainingNames);
        this.sections.push({
          type: metaSection.type,
          moduleConfig: collapsibleConfig
        });
      }
    });

    if(remainderContent == null && remainingNames.length) {
      console.log('REMAINDER NOT ACCOUNTED FOR: ' + MODEL_PATH);
      const remainderConfig = ModelEditHelper.createAttributeSetModuleConfig(MODEL_PATH, remainingNames, attributeMap);
      this.sections.push({
        type: 'remainder',
        moduleConfig: remainderConfig
      });
    }

    // TODO: these should ony apply to unused subfolders

    const folders = AliasHelper.getFolderNames(MODEL_PATH);
    folders.forEach(folderName => {
      const folderPath = [...MODEL_PATH, folderName];
      if(AliasHelper.isMultiplePath(folderPath)) {
        const multiConfig = ModelEditHelper.createInstancesSectionConfig(folderPath);
        this.sections.push({
          type: 'instanceTable',
          moduleConfig: multiConfig
        });
      }
    });

    // TODO: these shouldn't be inline links, maybe tabs?

    folders.forEach(folderName => {
      const folderPath = [...MODEL_PATH, folderName];
      if(!AliasHelper.isMultiplePath(folderPath)) {
        // const subfolderConfig = ModelEditHelper.createFolderSectionConfig(folderPath);
        const subfolderConfig = ModelEditHelper.createFolderLinkSectionConfig(folderPath);
        this.sections.push({
          type: 'subfolder',
          moduleConfig: subfolderConfig
        });
      }
    });
  }

  return FolderContentViewModel;
});
