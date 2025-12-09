/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/dialog-helper', 'utils/wkt-logger', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/alias-helper', 'utils/wdt-archive-helper', 'utils/modelEdit/message-helper'],
function (DialogHelper, WktLogger, ModelEditHelper, AliasHelper, ArchiveHelper, MessageHelper) {

  function FileSelectHelper() {
    // support selecting files for attributes

    // matching wdtArchive subtypes
    const DIR_TYPES = ['dir', 'either', 'emptyDir'];
    const FILE_TYPES = ['file', 'either'];

    this.canChooseDirectory = attribute => {
      return canChoose(DIR_TYPES, attribute);
    };

    this.canChooseFile = attribute => {
      return canChoose(FILE_TYPES, attribute);
    };

    function canChoose(matchTypes, attribute) {
      const archiveTypeKeys = attribute.archiveTypes || [];
      for(const archiveTypeKey of archiveTypeKeys) {
        const archiveType = ModelEditHelper.getArchiveType(archiveTypeKey) || {};
        if(matchTypes.includes(archiveType.subtype)) {
          return true;
        }
      }
      const fileOptions = attribute.fileOptions || [];
      for(const fileOption of fileOptions) {
        if(matchTypes.includes(fileOption.type)) {
          return true;
        }
      }
      // if no archive or file options found, allow file or dir
      return !archiveTypeKeys.length && !fileOptions.length;
    }

    this.chooseDirectory = async(attribute, currentValue) => {
      return choosePath(attribute, 'dir', currentValue);
    };

    this.chooseFile = async(attribute, currentValue) => {
      return choosePath(attribute, 'file', currentValue);
    };

    async function choosePath(attribute, matchType, currentValue) {
      const aliasPath = AliasHelper.getAliasPath(attribute.path);
      const attributeLabel = MessageHelper.getAttributeLabel(attribute, aliasPath);

      // build a list of select options based on archive and file options
      const selectOptions = [];

      // possibly multiple archive types (app, custom?)
      const archiveTypeKeys = attribute.archiveTypes || [];
      archiveTypeKeys.forEach(archiveTypeKey => {
        const archiveType = ModelEditHelper.getArchiveType(archiveTypeKey);
        if (!archiveType) {
          return;
        }

        const subtype = archiveType.subtype;
        const segregateName = getSegregateName(attribute);
        const segregateLabel = archiveType.segregatedLabel;
        const segregateHelp = archiveType.segregatedHelp;

        if('emptyDir' === subtype) {  // add two specific options
          // bypass file selection and add to archive
          selectOptions.push({
            type: 'emptyDir',
            labelKey: 'file-select-archive-empty-dir',
            archiveType: archiveTypeKey,
            segregateLabel,
            segregateHelp,
            segregateName
          });

          // simple file select with no archive option
          selectOptions.push({
            type: 'dir',
            labelKey: 'file-select-local-empty-dir',
            chooserName: attributeLabel
          });

        } else {  // add one option based on match type
          const fileMatch = matchType === 'file' && FILE_TYPES.includes(subtype);
          const dirMatch = matchType === 'dir' && DIR_TYPES.includes(subtype);
          const label = dirMatch ? archiveType.dirLabel : archiveType.fileLabel;

          if (dirMatch || fileMatch) {
            selectOptions.push({
              type: matchType,
              label,
              extensions: archiveType.extensions,
              archiveType: archiveTypeKey,
              segregateLabel,
              segregateHelp,
              segregateName
            });
          }
        }
      });

      // file options may be assigned in metadata
      const fileOptions = attribute.fileOptions || [];
      fileOptions.forEach(fileOption => {
        fileOption.chooserName = attributeLabel;
        selectOptions.push(fileOption);
      });

      // if archive or file options found, default is choose specified type
      if(!selectOptions.length) {
        selectOptions.push(
          { type: matchType, chooserName: attributeLabel }
        );
      }

      // ensure labels are assigned
      selectOptions.forEach(selectOption => {
        const selectType = selectOption.type;
        if(!['file', 'dir', 'emptyDir'].includes(selectType)) {
          WktLogger.error('Invalid selection type: ' + selectType);
        }
        const defaultLabel = MessageHelper.t('file-select-type-' + selectOption.type);
        selectOption.label = MessageHelper.getLabel(selectOption) || defaultLabel;
      });

      let selectOption;

      // prompt for select option if more than one type is present.
      if(selectOptions.length === 1) {
        selectOption = selectOptions[0];
      } else {
        const args = { attribute, selectOptions };
        selectOption = await DialogHelper.promptDialog('modelEdit/file-select-dialog', args);
      }

      if(!selectOption) {  // no return value indicates cancel
        return;
      }

      // IPC call to select file or directory based on selected option

      let addToArchive = false;
      let segregateName = selectOption.segregateName;
      let emptyDirName = null;
      let fileType = null;
      let fileChosen = null;

      if(selectOption.type === 'emptyDir') {
        addToArchive = true;
        emptyDirName = getEmptyDirName(attribute);

      } else {
        fileType = selectOption.type;
        fileChosen = await ArchiveHelper.chooseAttributeFile(selectOption, currentValue);
        if (!fileChosen) {  // no return value indicates cancel
          return;
        }

        // ask about archive if archive path present
        if (selectOption.archiveType) {
          if(attribute.archiveOnly) {
            addToArchive = true;
          } else {
            const args = {fileChosen, attribute, selectOption};
            const archiveResult = await DialogHelper.promptDialog('modelEdit/file-archive-dialog', args);
            if (!archiveResult) {  // cancel
              return;
            }
            addToArchive = archiveResult.addToArchive;
            segregateName = archiveResult.segregateName;
          }
        }
      }

      let attributePath = fileChosen;

      if(addToArchive) {
        const addOptions = {
          segregatedName: segregateName,
          emptyDirName,
          fileName: fileChosen,
          fileType
        };

        const addResult = await ArchiveHelper.addToArchive(selectOption.archiveType, addOptions);

        if(addResult) {
          attributePath = addResult;
        }
      }

      return attributePath;
    };

    // try to determine segregate mame
    function getSegregateName(attribute) {
      const segregateName = attribute.segregateName;
      if(segregateName) {
        return segregateName;
      }

      const segregateFolder = attribute.segregateFolder;
      if(segregateFolder) {
        const modelPath = attribute.path;
        const folderIndex = modelPath.indexOf(segregateFolder);
        return (folderIndex === -1) ? null : modelPath[folderIndex + 1];
      }

      return null;
    }

    // try to determine empty dir mame
    function getEmptyDirName(attribute) {
      const emptyDirName = attribute.emptyDirName;
      if(emptyDirName) {
        return emptyDirName;
      }

      const emptyDirFolder = attribute.emptyDirFolder;
      if(emptyDirFolder) {
        const modelPath = attribute.path;
        const folderIndex = modelPath.indexOf(emptyDirFolder);
        return (folderIndex === -1) ? null : modelPath[folderIndex + 1];
      }

      return null;
    }
  }

  return new FileSelectHelper();
});
