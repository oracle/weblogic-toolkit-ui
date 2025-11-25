/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/dialog-helper', 'utils/wkt-logger', 'utils/wdt-archive-helper',
  'utils/modelEdit/message-helper'],
function (DialogHelper, WktLogger, ArchiveHelper, MessageHelper) {

  function FileSelectHelper() {
    // support selecting files for attributes

    this.selectFile = async(attribute, currentValue) => {
      const archiveTypes = await ArchiveHelper.getEntryTypes();

      const selectOptions = [];

      // possibly multiple archive types (app, custom?)
      const archiveTypeKeys = attribute.archiveTypes || [];
      archiveTypeKeys.forEach(archiveTypeKey => {
        if (!archiveTypeKey in archiveTypes) {
          WktLogger.error('Invalid archive type: ' + archiveTypeKey);
        }

        // file dir either emptyDir

        const archiveType = archiveTypes[archiveTypeKey];
        const subtype = archiveType.subtype;

        if (['file', 'either'].includes(subtype)) {
          selectOptions.push({
            type: 'file',
            label: archiveType.fileLabel,
            extensions: archiveType.extensions,
            archiveType: archiveTypeKey,
            segregateLabel: archiveType.segregatedLabel,
            segregateHelp: archiveType.segregatedHelp
          });
        }

        if (['dir', 'either'].includes(subtype)) {
          selectOptions.push({
            type: 'dir',
            label: archiveType.dirLabel,
            archiveType: archiveTypeKey,
            segregateLabel: archiveType.segregatedLabel,
            segregateHelp: archiveType.segregatedHelp
          });
        }
      });

      // options may be assigned in metadata
      const fileOptions = attribute.fileOptions || [];
      selectOptions.push(...fileOptions);

      // if no options found, default is simple file or directory
      if(!selectOptions.length) {
        selectOptions.push(
          { type: 'file' },
          { type: 'dir' }
        );
      }

      // ensure labels are assigned
      selectOptions.forEach(selectOption => {
        const selectType = selectOption.type;
        if(!['file', 'dir'].includes(selectType)) {
          WktLogger.error('Invalid selection type: ' + selectType);
          return;  // cancel
        }

        const defaultLabel = MessageHelper.t('file-select-type-' + selectOption.type);
        selectOption.label = MessageHelper.getLabel(selectOption) || defaultLabel;
      });

      let selectOption;

      // prompt for select option if more than one type is present in metadata
      // const fileSelectOptions = attribute.fileSelectOptions || [];
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

      const fileChosen = await ArchiveHelper.chooseAttributeFile(selectOption, currentValue);
      if(!fileChosen) {  // no return value indicates cancel
        return;
      }

      // ask about archive if archive path present

      let attributePath = fileChosen;
      if(selectOption.archiveType) {
        const args = { fileChosen, attribute, selectOption };
        const archiveResult = await DialogHelper.promptDialog('modelEdit/file-archive-dialog', args);
        if(!archiveResult) {
          return;
        }

        if(archiveResult.addToArchive) {
          const addOptions = {
            segregatedName: archiveResult.segregateName,
            fileName: fileChosen,
            fileType: selectOption.type
          };

          const addResult = await ArchiveHelper.addToArchive(selectOption.archiveType, addOptions);

          // TODO: check exceptions?

          if(addResult) {
            attributePath = addResult;
          }
        }
      }

      return attributePath;
    };
  }

  return new FileSelectHelper();
});
