/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define([],
  function () {
    function MetaHelper() {
      let metadata = null;

      window.api.ipc.invoke('get-model-edit-metadata')
        .then(result => {
          metadata = result;
        });

      this.getMetadata = aliasPath => {
        const path = aliasPath.join('/');
        if(Object.keys(metadata).includes(path)) {
          return metadata[path];
        } else {
          return {};
        }
      };

      this.getAttributeGroups = aliasPath => {
        const metadata = this.getMetadata(aliasPath);
        return metadata['attributeGroups'] || [];
      };

      this.getNameValidators = aliasPath => {
        return [];  // TODO: implement this when needed
      };
    }

    // return a singleton instance
    return new MetaHelper();
  }
);
