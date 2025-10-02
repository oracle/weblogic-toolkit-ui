/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/wkt-logger'],
  function (ko, WktLogger) {
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
          // special cases for top-level folders
          if (modelPath.length === 1) {
            if (modelPath[0] === 'domainInfo') {
              return ['DomainInfo'];
            }
            if (modelPath[0] === 'topology') {
              return ['Topology'];
            }
            throw new Error('Bad top-level path: ' + modelPath);
          }

          let aliasPath = [];
          let nameNext = false;
          let first = true;
          modelPath.forEach(dir => {
            if(!first && !nameNext) {
              aliasPath.push(dir);
              const aliasNode = aliasData.paths[aliasPath.join('/')];
              if (!aliasNode) {
                WktLogger.error(`getAliasPath: Alias folder path ${dir} not found for path ${modelPath}`);
              }
              nameNext = aliasNode['isMultiple'];
            } else {
              nameNext = false;
            }
            first = false;
          });
          return aliasPath;
        }
        throw new Error('Alias data not loaded');
      };

      // named path: topology/Server/myServer
      // not named path: topology/Server/myServer/SSL
      this.isNamedPath = modelPath => {
        const aliasData = this.aliasData();
        if(aliasData) {
          // is parent path multiple?
          const parentPath = modelPath.slice(0, -1);

          let aliasPath = [];
          let nameNext = false;
          let first = true;
          parentPath.forEach(dir => {
            if(!first && !nameNext) {
              aliasPath.push(dir);
              const aliasNode = aliasData.paths[aliasPath.join('/')];
              if (!aliasNode) {
                WktLogger.error(`isNamedPath: Alias folder path ${dir} not found for path ${modelPath}`);
              }
              nameNext = aliasNode['isMultiple'];
            } else {
              nameNext = false;
            }
            first = false;
          });
          return nameNext;
        }
        return true;  // by default, to avoid deletion
      };

      // multiple path: topology/Server
      // not multiple paths: topology/Server/myServer, topology/Server/myServer/SSL,
      this.isMultiplePath = modelPath => {
        const aliasData = this.aliasData();
        if(aliasData) {
          if (this.isNamedPath(modelPath)) {
            return false;
          }
          const aliasPath = this.getAliasPath(modelPath);
          const aliasNode = aliasData.paths[aliasPath.join('/')];
          if(!aliasNode) {
            WktLogger.error(`isMultiplePath: Alias folder path ${aliasNode} not found for path ${modelPath}`);
            return false;
          }
          return aliasNode['isMultiple'];
        }
        return false;
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

      this.getFolderNames = modelPath => {
        const aliasData = this.aliasData();
        if(aliasData) {
          const aliasPath = this.getAliasPath(modelPath);
          const node = aliasData.paths[aliasPath.join('/')];
          return node['folders'];
        }
        return null;
      };

      // currently map to empty values, alias data structure for folders will probably change
      this.getFolderMap = modelPath => {
        const foldersMap = {};
        const folderNames = this.getFolderNames(modelPath) || [];
        folderNames.forEach(folderName => {
          foldersMap[folderName] = {};
        });
        return foldersMap;
      };
    }

    // return a singleton instance
    return new AliasHelper();
  }
);
