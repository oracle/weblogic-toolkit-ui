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

      const ROOT_FOLDER_ALIAS_NAMES = {
        domainInfo: 'DomainInfo',
        topology: 'Topology',
        resources: 'Resources',
        appDeployments: 'Deployments',
      };

      const NO_ALIAS_KEYS = ['Resources', 'Deployments'];

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
            const rootFolderName = modelPath[0];
            const aliasName = ROOT_FOLDER_ALIAS_NAMES[rootFolderName];
            if(aliasName) {
              return [aliasName];
            }
            throw new Error('Bad top-level path: ' + modelPath);
          }

          let aliasPath = [];
          let nameNext = false;
          let first = true;
          modelPath.forEach(dir => {
            if(!first && !nameNext) {
              aliasPath.push(dir);
              const aliasNode = this.getAliasNode(aliasPath);
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
              const aliasNode = this.getAliasNode(aliasPath);
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
        if (this.isNamedPath(modelPath)) {
          return false;
        }
        return this.getAliasValue(modelPath, 'isMultiple');
      };

      this.getAttributesMap = modelPath => {
        return this.getAliasValue(modelPath, 'attributes');
      };

      this.getFolderNames = modelPath => {
        return this.getAliasValue(modelPath, 'folders');
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

      this.getAliasValue = (modelPath, key) => {
        const aliasPath = this.getAliasPath(modelPath);
        const aliasNode = this.getAliasNode(aliasPath);
        if(!aliasNode) {
          WktLogger.error(`getAliasValue: Alias folder path ${aliasNode} not found for path ${modelPath}`);
          return null;
        }
        return aliasNode[key];
      };

      this.getAliasNode = aliasPath => {
        const aliasKey = aliasPath.join('/');
        if(NO_ALIAS_KEYS.includes(aliasKey)) {
          return {attributes: {}, folders: []};
        }
        const aliasData = this.aliasData();
        return aliasData ? aliasData.paths[aliasKey] : null;
      };
    }

    // return a singleton instance
    return new AliasHelper();
  }
);
