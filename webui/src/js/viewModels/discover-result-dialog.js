/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper',
  'ojs/ojknockout', 'ojs/ojbutton', 'ojs/ojdialog'],
function(accUtils, ko, i18n, viewHelper) {
  function DiscoverResultDialogModel(config) {
    const DIALOG_SELECTOR = '#discoverResultDialog';

    this.connected = () => {
      accUtils.announce('Discover result dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(`discover-result-dialog-${labelId}`, arg);
      }
      return i18n.t(`discover-result-dialog-${labelId}`);
    };

    this.anyLabelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(labelId, arg);
      }
      return i18n.t(labelId);
    };

    // organize the archive entries by type
    const resultData = config.resultData;
    const missingArchiveEntries = resultData.missingArchiveEntries;
    const archiveTypeMap = {};
    for(const entry of missingArchiveEntries) {
      const archiveType = entry.type;
      archiveTypeMap[archiveType] = archiveTypeMap[archiveType] || [];
      archiveTypeMap[archiveType].push({ file: entry.sourceFile, path: entry.path });
    }

    // assemble the types into a list
    this.archiveTypes = [];
    for(const typeKey in archiveTypeMap) {
      const labelKey = 'archive-type-' + typeKey;
      const typeLabel = i18n.t(labelKey, typeKey);
      this.archiveTypes.push({ type: typeLabel, entries: archiveTypeMap[typeKey]});
    }

    // sort archive types by resolved type name
    this.archiveTypes.sort((a, b) => {
      return a.type.localeCompare(b.type);
    });

    this.closeDialog = () => {
      this.dialogContainer.close();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return DiscoverResultDialogModel;
});
