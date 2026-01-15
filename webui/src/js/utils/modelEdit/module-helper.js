/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/wkt-logger',
  'ojs/ojmodule-element-utils'],
function (ko, WktLogger, ModuleElementUtils) {

  function ModuleHelper() {
    // create module configurations for display

    // create an editor configuration for a single attribute
    this.createAttributeEditorConfig = (key, attributeMap) => {
      const attribute = attributeMap[key];
      if (!attribute) {
        WktLogger.error(`Attribute ${key} not found, available: ${Object.keys(attributeMap)}`);
        return ModuleElementUtils.createConfig({name: 'empty-view'});
      }

      return ModuleElementUtils.createConfig({
        name: 'modelEdit/attribute-editor',
        params: {
          attribute,
          attributeMap  // may be disabled by values of other attributes
        }
      });
    };

    this.createSelectMultiEditorConfig = (attribute, observable, label, help, readonly, disabled, options) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/select-multi-editor',
        params: {
          attribute,
          observable,
          label,
          help,
          readonly,  // may be observable
          disabled,  // may be observable
          options    // may be observableArray
        }
      });
    };

    this.createListEditorConfig = (attribute, attributeMap, readOnly, disabled) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/list-attribute-editor',
        params: {
          attribute,
          attributeMap,
          readOnly,  // may be observable
          disabled   // may be observable
        }
      });
    };

    this.createDictEditorConfig = (attribute, attributeMap, readOnly, disabled) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/dict-attribute-editor',
        params: {
          attribute,
          attributeMap,
          readOnly,  // may be observable
          disabled   // may be observable
        }
      });
    };

    this.createAttributeSetConfig = (attributes, attributeMap) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/attribute-set',
        params: {
          attributes,
          attributeMap
        }
      });
    };

    this.createAttributesSectionConfig = (metaSection, attributeMap, folderInfo) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/attributes-section',
        params: {
          metaSection,
          attributeMap,
          folderInfo
        }
      });
    };

    // create a module config for collapsible page section
    this.createCollapsibleSectionConfig = (modelPath, metaSection, attributeMap, folderInfo) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/collapsible-section',
        params: {
          metaSection,
          modelPath,
          attributeMap,
          folderInfo
        }
      });
    };

    this.createInstancesSectionConfig = (modelPath, metaSection) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/instances-section',
        params: {
          modelPath,
          metaSection
        }
      });
    };

    // create sections config for folder-content, collapsible, or tab
    this.createSectionsConfig = (modelPath, metaSections, folderInfo, attributeMap, isTopSections) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/section-set',
        params: {
          modelPath,
          metaSections,
          folderInfo,
          attributeMap,
          isTopSections
        }
      });
    };

    this.createFolderSectionConfig = (modelPath, metaSection) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/folder-section',
        params: {
          modelPath,
          metaSection
        }
      });
    };

    this.createFolderContentConfig = modelPath => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/folder-content',
        params: {
          modelPath
        }
      });
    };

    this.createInstancesTableConfig = modelPath => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/instances-table',
        params: {
          modelPath
        }
      });
    };

    this.createCredentialCellConfig = value => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/credential-cell',
        params: {
          value
        }
      });
    };

    this.createTabsConfig = (modelPath, tabs, folderInfo, attributeMap, isTopSections) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/tabs-section',
        params: {
          modelPath,
          tabs,
          folderInfo,
          attributeMap,
          isTopSections
        }
      });
    };

    this.createEmptyConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'empty-view'
      });
    };
  }

  return new ModuleHelper();
}
);
