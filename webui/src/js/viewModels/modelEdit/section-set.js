/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/module-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper'
],
function(accUtils, ko, ModuleHelper, MetaHelper, MessageHelper, AliasHelper) {
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

    this.connected = () => {
      accUtils.announce('Folder Sections loaded.', 'assertive');
    };

    const tabs = [];

    this.sections = [];
    META_SECTIONS.forEach(section => {
      if(section.type === 'attributes') {
        if(hasAnyAttributes(section)) {
          const moduleConfig = ModuleHelper.createAttributesSectionConfig(section, ATTRIBUTE_MAP, FOLDER_INFO);
          this.sections.push({
            type: section.type,
            moduleConfig
          });
        }
      }

      else if(section.type === 'folder') {
        const folderName = section.folder;  // TODO: allow absolute folder paths?
        const folderNames = folderName.split('/');
        const folderPath = [...MODEL_PATH, folderNames];
        let moduleConfig;
        if(AliasHelper.isMultiplePath(folderPath)) {
          moduleConfig = ModuleHelper.createInstancesSectionConfig(folderPath, section);
        } else {
          moduleConfig = ModuleHelper.createFolderSectionConfig(folderPath, section);
        }
        this.sections.push({
          type: section.type,
          moduleConfig
        });
      }

      else if(section.type === 'collapsible') {
        const collapsibleConfig = ModuleHelper.createCollapsibleSectionConfig(MODEL_PATH, section, ATTRIBUTE_MAP, FOLDER_INFO);
        this.sections.push({
          type: section.type,
          moduleConfig: collapsibleConfig
        });
      }

      else if(section.type === 'attributesCollapsible') {
        if(hasAnyAttributes(section)) {
          const fakeSection = {
            label: section.label,
            labelKey: section.labelKey,
            sections: [
              {
                type: 'attributes',
                attributes: section.attributes,
                addRemainingAttributes: section.addRemainingAttributes
              }
            ]
          };
          const collapsibleConfig = ModuleHelper.createCollapsibleSectionConfig(MODEL_PATH, fakeSection, ATTRIBUTE_MAP, FOLDER_INFO);
          this.sections.push({
            type: section.type,
            moduleConfig: collapsibleConfig
          });
        }
      }

      else if(section.type === 'custom') {
        const customConfig = ModuleHelper.createCustomSectionConfig(MODEL_PATH, section, ATTRIBUTE_MAP, FOLDER_INFO);
        this.sections.push({
          type: section.type,
          moduleConfig: customConfig
        });
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
        const remainderConfig = ModuleHelper.createAttributeSetConfig(REMAINING_ATTRIBUTES, ATTRIBUTE_MAP);
        this.sections.push({
          type: 'remainder',
          moduleConfig: remainderConfig
        });
      }
    }

    if(tabs.length || (IS_TOP_SECTIONS && USES_TABS)) {
      const tabsConfig = ModuleHelper.createTabsConfig(MODEL_PATH, tabs, FOLDER_INFO, ATTRIBUTE_MAP, IS_TOP_SECTIONS);
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
