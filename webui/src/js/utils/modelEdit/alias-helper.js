/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/i18n', 'utils/wkt-logger'],
  function (ko, i18n, WktLogger) {
    function AliasHelper() {
      // maintain configuration derived from WDT aliases

      this.aliasData = ko.observable();

      this.aliasDataLoaded = ko.computed(() => {
        return !!this.aliasData();
      });

      this.aliasDataError = ko.observable();

      // TODO: reload if new version of WDT is downloaded

      window.api.ipc.invoke('get-alias-info')
        .then(result => {
          this.aliasData(result);
          this.aliasDataError(null);
        })
        .catch(err => {
          WktLogger.error('Error loading alias data: ' + err);
          this.aliasData(null);
          this.aliasDataError(err);
        });

      // convert a model path to an alias path.
      // remove first element, and any name elements from path.
      // topology/Server/myServer/SSL => Server/SSL
      this.getAliasPath = modelPath => {
        const aliasData = this.aliasData();
        if(aliasData) {
          if (modelPath.length === 1) {
            if (modelPath[0] === 'domainInfo') {
              return ['DomainInfo'];
            }
            throw new Error('Bad single-element-path: ' + modelPath);
          }

          let aliasPath = [];
          let nameNext = false;
          let first = true;
          modelPath.forEach(dir => {
            if(!first && !nameNext) {
              aliasPath.push(dir);
              const node = aliasData.paths[aliasPath.join('/')];
              if(!node) {
                WktLogger.error(`Alias folder path ${dir} not found for path ${modelPath}`);
              }
              nameNext = node['isMultiple'];
            } else {
              nameNext = false;
            }
            first = false;
          });
          return aliasPath;
        }
        throw new Error('Alias data not loaded');
      };

      this.getAttributesMap = modelPath => {
        const aliasData = this.aliasData();
        if(aliasData) {
          const aliasPath = this.getAliasPath(modelPath);
          const node = aliasData.paths[aliasPath.join('/')];
          return node['attributes'];
        }
        return null;
      };
    }

    // return a singleton instance
    return new AliasHelper();
  }
);
