/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/wdt-archive-helper',
  'utils/dialog-helper', 'ojs/ojarraydataprovider', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojlabel',
  'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojselectsingle', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, archiveHelper, dialogHelper, ArrayDataProvider) {
  function AddToArchiveDialogModel() {

    this.connected = () => {
      accUtils.announce('Add to archive dialog loaded.', 'assertive');

      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $('#addToArchiveDialog')[0].open();
      }, 1);
    };

    this.labelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(`add-to-archive-dialog-${labelId}`, arg);
      }
      return i18n.t(`add-to-archive-dialog-${labelId}`);
    };

    this.anyLabelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(labelId, arg);
      }
      return i18n.t(labelId);
    };

    this.archiveEntryTypes = ko.observableArray();
    this.archiveEntryTypesProvider = new ArrayDataProvider(this.archiveEntryTypes, {keyAttributes: 'key'});
    this.entryTypesMap = null;

    archiveHelper.getEntryTypes().then(entryTypes => {
      this.entryTypesMap = entryTypes;
      for (const [key, value] of Object.entries(entryTypes)) {
        this.archiveEntryTypes.push({key: key, label: value.name});
        this.archiveEntryTypes.sort((a, b) => (a.label > b.label) ? 1 : -1);
      }
    });

    this.archiveEntryType = ko.observable();

    this.addToArchive = () => {
      let tracker = document.getElementById('tracker');
      if (tracker.valid === 'valid') {
        $('#addToArchiveDialog')[0].close();

        const entryType = this.entryTypesMap[this.archiveEntryType()];
        if(entryType.subtype === 'emptyDir') {
          const prefix = entryType.pathPrefix;

          let textInputConfig = {
            title: i18n.t('add-name-to-archive-dialog-title', {typeName: entryType.name}),
            label: i18n.t('add-name-to-archive-dialog-label', {typeName: entryType.name}),
            help: i18n.t('add-name-to-archive-dialog-help', {typeName: entryType.name})
          };
          dialogHelper.promptDialog('text-input-dialog', textInputConfig)
            .then(name => {
              // no name means input was cancelled, no need to notify or continue
              if(name) {
                this._addArchiveUpdate(null, prefix + name + '/');
                this._addToArchiveModel(prefix + name, entryType, null);
              }
            });

        } else {
          archiveHelper.chooseArchiveEntry(this.archiveEntryType())
            .then((result) => {
              // no filePath means selection was cancelled, no need to notify or continue
              if(result['filePath']) {
                this._addArchiveUpdate(result.filePath, result.archiveUpdatePath);
                this._addToArchiveModel(result.archivePath, entryType, result.childPaths);
              }
            })
            .catch((err) => {
              dialogHelper.displayCatchAllError('add-archive-entry', err).then();
            });
        }

      } else {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
      }
    };

    this.cancelAdd = () => {
      $('#addToArchiveDialog')[0].close();
    };

    // add an archive update that will be applied to the file on the next save.
    this._addArchiveUpdate = (filePath, archivePath) => {
      project.wdtModel.addArchiveUpdate('add', archivePath, filePath);
    };

    // add the archive entry to the model, so it will be displayed in the tree.
    this._addToArchiveModel = (archivePath, leafEntryType, leafChildPaths) => {
      const childList = project.wdtModel.archiveRoots;
      const pathNames = archivePath.split('/');
      const leafIsDir = ['dir', 'emptyDir'].includes(leafEntryType.subtype);
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
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return AddToArchiveDialogModel;
});
