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
        let metadata = this.getMetadata(aliasPath);
        let attributeDetails = metadata['attributeDetails'] || {};
        if(attributeName in attributeDetails) {
          return attributeDetails[attributeName];
        }

        metadata = this.getMetadata(['any']);
        attributeDetails = metadata['attributeDetails'] || {};
        return attributeDetails[attributeName] || {};
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
