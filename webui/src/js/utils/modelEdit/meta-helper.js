/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/modeledit/metadata/all-metadata'],
  function (metadata) {
    function MetaHelper() {
      const TAB_TYPES = [
        'tab',
        'attributesTab',
        'folderTab'
      ];

      this.getMetadata = aliasPath => {
        const path = aliasPath.join('/');
        if(Object.keys(metadata).includes(path)) {
          return metadata[path];
        } else {
          return {};
        }
      };

      this.getAttributeDetails = (aliasPath, attributeName) => {
        // try at full alias path
        let metadata = this.getMetadata(aliasPath);
        let attributeDetails = metadata['attributeDetails'] || {};
        if(attributeName in attributeDetails) {
          return attributeDetails[attributeName];
        }

        // try at top alias path
        metadata = this.getMetadata(aliasPath.slice(0, 1));
        attributeDetails = metadata['attributeDetails'] || {};
        if(attributeName in attributeDetails) {
          return attributeDetails[attributeName];
        }

        // try at global level
        metadata = this.getMetadata(['any']);
        attributeDetails = metadata['attributeDetails'] || {};
        return attributeDetails[attributeName] || {};
      };

      // details about the Name attribute can be used for instance creation
      this.getNameDetails = aliasPath => {
        // try at full alias path only, these are not inherited or global
        let metadata = this.getMetadata(aliasPath);
        let attributeDetails = metadata['attributeDetails'] || {};
        return attributeDetails['Name'] || {};
      };

      this.getAttributeOptions = (aliasPath, attributeName) => {
        const attributeDetails = this.getAttributeDetails(aliasPath, attributeName);
        return attributeDetails['options'];
      };

      this.getSections = aliasPath => {
        const metadata = this.getMetadata(aliasPath);
        return metadata['sections'] || [];
      };

      this.getMergeFolder = aliasPath => {
        const metadata = this.getMetadata(aliasPath);
        return metadata['mergeFolder'];
      };

      this.canReorder = aliasPath => {
        const metadata = this.getMetadata(aliasPath);
        return metadata['canReorder'];
      };

      this.hasNoSelect = aliasPath => {
        const metadata = this.getMetadata(aliasPath);
        return metadata['noSelect'];
      };

      this.getNameValidators = aliasPath => {
        return [];  // TODO: implement this when needed
      };

      this.isTabSection = sectionType => {
        return TAB_TYPES.includes(sectionType);
      };
    }

    // return a singleton instance
    return new MetaHelper();
  }
);
