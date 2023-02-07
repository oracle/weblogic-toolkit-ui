/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/dialog-helper', 'ojs/ojarraydataprovider',
  'utils/wkt-logger', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog',
  'ojs/ojformlayout', 'ojs/ojselectsingle', 'ojs/ojvalidationgroup', 'ojs/ojradioset'],
function(accUtils, ko, i18n, project, dialogHelper, ArrayDataProvider, wktLogger) {

  const jqueryDialogName = '#addToArchiveSelectionDialog';

  function AddToArchiveSelectionDialogModel() {

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Add to archive selection dialog loaded.', 'assertive');

      subscriptions.push(this.archiveEntryType.subscribe((newEntryKey) => {
        this.handleArchiveEntryTypeChange(newEntryKey);
      }));

      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $(jqueryDialogName)[0].open();
      }, 1);
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(`add-to-archive-selection-dialog-${labelId}`, arg);
      }
      return i18n.t(`add-to-archive-selection-dialog-${labelId}`);
    };

    this.anyLabelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(labelId, arg);
      }
      return i18n.t(labelId);
    };

    this.wktLogger = wktLogger;
    this.archiveEntryTypes = ko.observableArray();
    this.archiveEntryTypesProvider = new ArrayDataProvider(this.archiveEntryTypes, {keyAttributes: 'key'});
    this.entryTypesMap = null;

    window.api.ipc.invoke('get-archive-entry-types').then(entryTypes => {
      this.entryTypesMap = entryTypes;

      // Must initialize these here since the data retrieval is async...
      //
      this.initializeCustomPathLabelAndHelp();
      this.initializeCoherencePersistenceDirectoryType();

      for (const [key, value] of Object.entries(entryTypes)) {
        this.archiveEntryTypes.push({key: key, label: value.name, ...value});
        this.archiveEntryTypes.sort((a, b) => (a.label > b.label) ? 1 : -1);
      }
    });

    this.archiveEntryType = ko.observable();
    this.archiveEntry = ko.observable();
    this.archiveEntryTypeSubtype = ko.observable();
    this.fileOrDirectory = ko.observable('file');

    this.getFileOrDirectoryValue = () => {
      let type = this.archiveEntryTypeSubtype();
      if (type === 'either') {
        type = this.fileOrDirectory();
      } else if (type === 'emptyDir') {
        type = undefined;
      }
      return type;
    };

    this.fileNameSourcePath = ko.observable();
    this.fileNameSourceLabel = ko.computed(() => {
      const type = this.getFileOrDirectoryValue();
      if (!!type) {
        return this.archiveEntry()[`${type}Label`];
      }
      return undefined;
    }, this);
    this.fileNameSourceHelp = ko.computed(() => {
      const type = this.getFileOrDirectoryValue();
      if (!!type) {
        return this.archiveEntry()[`${type}Help`];
      }
      return undefined;
    }, this);

    this.segregationName = ko.observable();
    this.segregationLabel = ko.computed(() => {
      const entry = this.archiveEntry();
      if (!!entry) {
        return entry.segregatedLabel;
      }
      return undefined;
    }, this);
    this.segregationHelp = ko.computed(() => {
      const entry = this.archiveEntry();
      if (!!entry) {
        return entry.segregatedHelp;
      }
      return undefined;
    }, this);

    this.emptyDirValue = ko.observable();
    this.emptyDirLabel = ko.computed(() => {
      const entry = this.archiveEntry();
      if (!!entry) {
        return entry.emptyDirLabel;
      }
      return undefined;
    }, this);
    this.emptyDirHelp = ko.computed(() => {
      const entry = this.archiveEntry();
      if (!!entry) {
        return entry.emptyDirLabel;
      }
      return undefined;
    }, this);
    this.emptyDirIsSelect =
      ko.computed(() => this.archiveEntryType() === 'coherencePersistenceDirectory', this);

    this.customPathValue = ko.observable();
    this.customPathLabel = undefined;
    this.customPathHelp = undefined;

    this.coherencePersistenceDirectoryTypes = undefined;
    this.coherencePersistenceDirectoryTypesDP = undefined;

    this.fileDirectoryRadioButtonData = [
      { id: 'file', value: 'file', label: this.labelMapper('file-label')},
      { id: 'dir',  value: 'dir',  label: this.labelMapper('directory-label')}
    ];
    this.fileDirectoryRadioButtonsDP =
      new ArrayDataProvider(this.fileDirectoryRadioButtonData, { keyAttributes: 'id' });

    this.getEntryForType = (entryType) => {
      return this.entryTypesMap[entryType];
    };

    this.initializeCustomPathLabelAndHelp = () => {
      const customEntry = this.getEntryForType('custom');
      this.customPathLabel = ko.observable(customEntry.pathLabel);
      this.customPathHelp = ko.observable(customEntry.pathHelp);
    };

    this.initializeCoherencePersistenceDirectoryType = () => {
      const coherencePersistenceDirectoryEntry = this.getEntryForType('coherencePersistenceDirectory');
      this.coherencePersistenceDirectoryTypes = ko.observableArray(coherencePersistenceDirectoryEntry.subtypeChoices);
      this.coherencePersistenceDirectoryTypesDP =
        new ArrayDataProvider(this.coherencePersistenceDirectoryTypes, { keyAttributes: 'name' });
    };

    this.handleArchiveEntryTypeChange = (newEntryKey) => {
      const newEntry = this.getEntryForType(newEntryKey);
      this.archiveEntry(newEntry);
      this.archiveEntryTypeSubtype(newEntry.subtype);
      this.fileOrDirectory('file');
      this.fileNameSourcePath(undefined);
      this.segregationName(undefined);
      this.emptyDirValue(undefined);
      this.customPathValue(undefined);
    };

    this.showFileNameChooser = ko.computed(() => this.archiveEntryTypeSubtype() !== 'emptyDir', this);
    this.showFileOrDirectorySelector = ko.computed(() => this.archiveEntryTypeSubtype() === 'either', this);
    this.sourceFileNameIsFile = ko.computed(() => this.getFileOrDirectoryValue() === 'file', this);
    this.sourceFileNameIsDir = ko.computed(() => this.getFileOrDirectoryValue() === 'dir', this);
    this.showSegregatedNameField = ko.computed(() => {
      const entry = this.archiveEntry();
      if (!!entry) {
        return !!entry.segregatedLabel;
      }
      return false;
    }, this);
    this.showEmptyDirField = ko.computed(() => this.archiveEntryTypeSubtype() === 'emptyDir', this);
    this.showCustomPathField = ko.computed(() => this.archiveEntryType() === 'custom', this);

    this.segregatedNameValidator = {
      validate: (value) => {
        if (value && value.includes('/')) {
          throw new Error(this.labelMapper('name-no-forward-slashes'));
        }
      }
    };

    this.customPathValidator = {
      validate: (value) => {
        if (value && (value.startsWith('/') || value.endsWith('/'))) {
          throw new Error(this.labelMapper('path-no-leading-trailing-forward-slashes'));
        }
      }
    };

    this.chooseSourceLocation = async () => {
      const fileChosen = await window.api.ipc.invoke('choose-archive-entry-file', this.archiveEntryType(),
        this.getFileOrDirectoryValue(), this.archiveEntry().extensions, this.fileNameSourcePath());

      if (!!fileChosen) {
        this.fileNameSourcePath(fileChosen);
      }
    };

    this.addToArchive = async () => {
      let tracker = document.getElementById('tracker');

      if (tracker.valid === 'valid') {
        const options = {
          type: this.archiveEntryType()
        };

        switch (this.archiveEntryTypeSubtype()) {
          case 'file':
          case 'dir':
            options.fileType = this.archiveEntryTypeSubtype();
            options.fileName = this.fileNameSourcePath();
            break;

          case 'either':
            options.fileType = this.fileOrDirectory();
            options.fileName = this.fileNameSourcePath();
            break;

          case 'emptyDir':
            options.emptyDirName = this.emptyDirValue();
            break;
        }

        if (this.showSegregatedNameField()) {
          options.segregatedName = this.segregationName();
        }

        if (this.archiveEntryType() === 'custom' && !!this.customPathValue()) {
          options.customPath = this.customPathValue();
        }

        wktLogger.debug(`Calling add-archive-entry for entry type ${this.archiveEntryType()} with options: ${JSON.stringify(options)}`);
        window.api.ipc.invoke('add-archive-entry', this.archiveEntryType(), options).then(result => {
          // no archivePath means selection was cancelled, no need to notify or continue
          if (!!result.archivePath) {
            this._addArchiveUpdate(result.filePath, result.archiveUpdatePath);
            this._addToArchiveModel(result.archivePath, options.fileType || 'emptyDir', result.childPaths);
          }
          $(jqueryDialogName)[0].close();
        }).catch(err => {
          dialogHelper.displayCatchAllError('add-archive-entry', err).then();
        });
      } else {
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
      }
    };

    this.cancelAdd = () => {
      $(jqueryDialogName)[0].close();
    };

    // add an archive update that will be applied to the file on the next save.
    this._addArchiveUpdate = (filePath, archivePath) => {
      project.wdtModel.addArchiveUpdate('add', archivePath, filePath);
    };

    // add the archive entry to the model, so it will be displayed in the tree.
    this._addToArchiveModel = (archivePath, leafEntryFileType, leafChildPaths) => {
      const childList = project.wdtModel.archiveRoots;
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
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return AddToArchiveSelectionDialogModel;
});
