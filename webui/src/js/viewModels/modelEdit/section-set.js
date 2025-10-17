/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper'
],
function(accUtils, ko, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper) {
  function SectionSetViewModel(args) {
    // Display the sections for a model path.
    // Customizations from MetaHelper are taken into account.
    // This is usually embedded in folder-content or tabs-section tab.

    const MODEL_PATH = args.modelPath;
    const META_SECTIONS = args.metaSections;
    const ATTRIBUTE_MAP = args.attributeMap;
    const FOLDER_INFO = args.folderInfo;
    const IS_TOP_SECTIONS = args.isTopSections;

    const USES_TABS = FOLDER_INFO.usesTabs;
    const REMAINING_ATTRIBUTES = FOLDER_INFO.remainingAttributes;
    const REMAINING_ATTRIBUTES_ASSIGNED = FOLDER_INFO.remainingAttributesAssigned;
    const REMAINING_FOLDERS = FOLDER_INFO.remainingFolders;
    const REMAINING_FOLDERS_ASSIGNED = FOLDER_INFO.remainingFoldersAssigned;

    this.connected = () => {
      accUtils.announce('Folder Sections loaded.', 'assertive');
    };

    const tabs = [];

    this.sections = [];
    META_SECTIONS.forEach(section => {
      if(section.type === 'attributes') {
        if(hasAnyAttributes(section)) {
          const moduleConfig = ModelEditHelper.createAttributesSectionConfig(MODEL_PATH, section, ATTRIBUTE_MAP, FOLDER_INFO);
          this.sections.push({
            type: section.type,
            moduleConfig
          });
        }
      }

      else if(section.type === 'folder') {
        const folder = section.folder;  // TODO: allow nested and absolute folder paths?
        const folderPath = [...MODEL_PATH, folder];
        let moduleConfig;
        if(AliasHelper.isMultiplePath(folderPath)) {
          moduleConfig = ModelEditHelper.createInstancesSectionConfig(folderPath, section);
        } else {
          moduleConfig = ModelEditHelper.createFolderSectionConfig(folderPath, section);
        }
        this.sections.push({
          type: section.type,
          moduleConfig
        });
      }

      else if(section.type === 'collapsible') {
        const collapsibleConfig = ModelEditHelper.createCollapsibleSectionConfig(MODEL_PATH, section, ATTRIBUTE_MAP, FOLDER_INFO);
        this.sections.push({
          type: section.type,
          moduleConfig: collapsibleConfig
        });
      }

      else if(section.type === 'attributesCollapsible') {
        if(hasAnyAttributes(section)) {
          const fakeSection = {
            labelKey: section.labelKey,
            sections: [
              {
                type: 'attributes',
                attributes: section.attributes,
                addRemainingAttributes: section.addRemainingAttributes
              }
            ]
          };
          const collapsibleConfig = ModelEditHelper.createCollapsibleSectionConfig(MODEL_PATH, fakeSection, ATTRIBUTE_MAP, FOLDER_INFO);
          this.sections.push({
            type: section.type,
            moduleConfig: collapsibleConfig
          });
        }
      }

      else if(MetaHelper.isTabSection(section.type)) {
        // don't display yet, these will always be the in last section
        tabs.push(section);
      }

      else if(section.type !== 'hidden') {
        console.error('Unknown section type: ' + section.type + ' at ' + MODEL_PATH.join(' / '));
      }
    });

    // if top sections and not using tabs, display unassigned remaining attributes / folders

    if(IS_TOP_SECTIONS && !USES_TABS) {
      if (REMAINING_ATTRIBUTES.length && !REMAINING_ATTRIBUTES_ASSIGNED) {
        const remainderConfig = ModelEditHelper.createAttributeSetConfig(MODEL_PATH, REMAINING_ATTRIBUTES, ATTRIBUTE_MAP);
        this.sections.push({
          type: 'remainder',
          moduleConfig: remainderConfig
        });
      }

      // this probably means there was one sub-folder, and no tabs specified
      if (REMAINING_FOLDERS.length && !REMAINING_FOLDERS_ASSIGNED) {
        REMAINING_FOLDERS.forEach(folder => {
          const folderPath = [...MODEL_PATH, folder];

          let moduleConfig;
          if(AliasHelper.isMultiplePath(folderPath)) {
            moduleConfig = ModelEditHelper.createInstancesSectionConfig(folderPath, {});
          } else {
            moduleConfig = ModelEditHelper.createFolderSectionConfig(folderPath, {});
          }
          this.sections.push({
            type: 'folder',
            moduleConfig
          });
        });
      }
    }

    if(tabs.length || (IS_TOP_SECTIONS && USES_TABS)) {
      const tabsConfig = ModelEditHelper.createTabsConfig(MODEL_PATH, tabs, FOLDER_INFO, ATTRIBUTE_MAP, IS_TOP_SECTIONS);
      this.sections.push({
        type: 'tabs',
        moduleConfig: tabsConfig
      });
    }

    function hasAnyAttributes(metaSection) {
      let attributes = metaSection.attributes || [];
      if(metaSection['addRemainingAttributes']) {
        const remainingAttributes = FOLDER_INFO.remainingAttributes;
        attributes = [...attributes, ...remainingAttributes];
      }
      return attributes.length > 0;
    }
  }

  return SectionSetViewModel;
});
