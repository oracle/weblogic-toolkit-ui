/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An helper for WDT archive operations.
 * Returns a singleton.
 */

define(['knockout', 'models/wkt-project', 'utils/wkt-logger'],
  function (ko, project, wktLogger) {
    function WdtArchiveHelper() {

      this.project = project;

      // return available archive entry types and names
      this.getEntryTypes = async () => {
        return window.api.ipc.invoke('get-archive-entry-types');
      };

      this.chooseArchiveEntryFile = async (archiveEntryTypeName, fileType, fileExtensions, fileName) => {
        return window.api.ipc.invoke('choose-archive-entry-file', archiveEntryTypeName, fileType,
          fileExtensions, fileName);
      };

      this.buildAddToArchiveOptions = (archiveEntryTypeName, archiveEntry, filePath, fileType, otherArgs) => {
        const options = {
          type: archiveEntryTypeName
        };

        switch (archiveEntry.subtype) {
          case 'file':
          case 'dir':
            options.fileType = archiveEntry.subtype;
            options.fileName = filePath;
            break;

          case 'either':
            options.fileType = fileType;
            options.fileName = filePath;
            break;

          case 'emptyDir':
            options.emptyDirName = otherArgs.emptyDirName;
            break;
        }

        if (archiveEntry.segregatedName) {
          options.segregatedName = otherArgs.segregationName;
        }

        if (archiveEntryTypeName === 'custom' && !!otherArgs.customPath) {
          options.customPath = otherArgs.customPath;
        }

        return options;
      };

      this.addToArchive = async (archiveEntryTypeName, options) => {
        const result = await window.api.ipc.invoke('add-archive-entry', archiveEntryTypeName, options);
        wktLogger.debug('add-to-archive IPC call returned: %s', result);
        // no archivePath means selection was cancelled, no need to notify or continue
        if (!!result.archivePath) {
          this._addArchiveUpdate(result.filePath, result.archiveUpdatePath);
          this._addToArchiveModel(result.archivePath, options.fileType || 'emptyDir', result.childPaths);
        }
        return result ? result.archiveUpdatePath : result;
      };

      this.removeFromArchive = (archivePath, deleteEmptyParents = false) => {
        if (archivePath) {
          this._removeFromArchiveModel(archivePath, this.project.wdtModel.archiveRoots, deleteEmptyParents);
          this._removeArchiveUpdate(archivePath);
        }
      };

      // add an archive update that will be applied to the file on the next save.
      this._addArchiveUpdate = (filePath, archivePath) => {
        this.project.wdtModel.addArchiveUpdate('add', archivePath, filePath);
      };

      this._removeArchiveUpdate = (archivePath) => {
        this.project.wdtModel.addArchiveUpdate('remove', archivePath);
      };

      // add the archive entry to the model, so it will be displayed in the tree.
      this._addToArchiveModel = (archivePath, leafEntryFileType, leafChildPaths) => {
        const childList = this.project.wdtModel.archiveRoots;
        const pathNames = archivePath.split('/');
        const leafIsDir = leafEntryFileType !== 'file';
        this._addToArchiveFolder(pathNames, 0, childList, leafIsDir, leafChildPaths);
      };

      // add the path member to the specified entry list in the archive model tree.
      // if already present, recurse to the next path member and list if needed.
      // if not present, add the path member and recurse with an empty list if needed.
      this._addToArchiveFolder = (pathNames, memberIndex, entryList, leafIsDir, leafChildPaths) => {
        const thisMember = pathNames[memberIndex];

        let matchEntry = false;
        for (let entry of entryList()) {
          if(entry['title'] === thisMember) {
            matchEntry = entry;
            break;
          }
        }

        const isLeaf = memberIndex === pathNames.length - 1;
        let children = null;

        if(matchEntry) {
          // entry exists in tree
          children = matchEntry['children'];
        } else {
          // idPath is a unique key for the tree element, and the path used for subsequent archive operations
          let idPath = pathNames.slice(0, memberIndex + 1).join('/');

          // this path member is a directory if it is not the leaf, or the leaf is a directory type
          const isDir = !isLeaf || leafIsDir;

          // if this is a directory, append / to the path and add children list.
          // the children list will make it render as a folder, even if no children are added.
          if (isDir) {
            idPath = idPath + '/';
            children = ko.observableArray();
          }
          entryList.push({id: idPath, title: thisMember, children: children});

          if(isLeaf) {
            this._addLeafChildPaths(idPath, leafChildPaths);
          }
        }

        if(!isLeaf) {
          // add the next name in the path to the children list
          this._addToArchiveFolder(pathNames, memberIndex + 1, children, leafIsDir, leafChildPaths);
        }
      };

      // if the new entry is a directory, the result may include its
      // child files and folders, so add those to the tree.
      // they don't need archive update entries for save.
      this._addLeafChildPaths = (parentPath, leafChildPaths) => {
        if(leafChildPaths) {
          for (const leafPath of leafChildPaths) {
            let fullPath = parentPath + leafPath;
            let leafIsDir = false;
            if(fullPath.endsWith('/')) {
              fullPath = fullPath.slice(0, -1);
              leafIsDir = true;
            }
            const pathNames = fullPath.split('/');
            const childList = project.wdtModel.archiveRoots;
            this._addToArchiveFolder(pathNames, 0, childList, leafIsDir, null);
          }
        }
      };

      this._removeFromArchiveModel = (archivePath, nodesObservable, deleteEmptyParents) => {
        for (const node of nodesObservable()) {
          wktLogger.debug('node id = %s, deleteEmptyParents = %s', node.id, deleteEmptyParents);
          if (node.id === archivePath) {
            wktLogger.debug('removing matching node %s', node.id);
            this._removeNodeFromNodesObservable(nodesObservable, node);
            return true;
          }

          if (node.children) {
            const result = this._removeFromArchiveModel(archivePath, node.children, deleteEmptyParents);
            wktLogger.debug('nested call from node %s returned %s', node.id, result);
            if (deleteEmptyParents && result && node.children().length === 0) {
              wktLogger.debug('removing node %s from parent children list', node.id);
              this._removeNodeFromNodesObservable(nodesObservable, node);
            }
            return result;
          }
        }
        return false;
      };

      this._removeNodeFromNodesObservable = (nodesObservable, node) => {
        nodesObservable.remove(node);

        // this shouldn't be required, but resolves tree view problems with emptied lists
        nodesObservable.sort();
      };
    }

    return new WdtArchiveHelper();
  }
);
