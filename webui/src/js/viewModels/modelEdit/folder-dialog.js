/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/modelEdit/message-helper',
  'ojs/ojmodule-element-utils', 'ojs/ojarraydataprovider', 'ojs/ojbufferingdataprovider',
  'utils/observable-properties', 'ojs/ojconverter-number', 'utils/validation-helper',
  'utils/view-helper', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog',
  'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, MessageHelper, ModuleElementUtils, ArrayDataProvider,
  BufferingDataProvider, props, ojConverterNumber, validationHelper, viewHelper) {
  function FolderDialogModel(args) {
    const DIALOG_SELECTOR = '#modelEditFolderDialog';
    const MODEL_PATH = args.modelPath;
    const IS_ADD = args.add;

    this.connected = () => {
      accUtils.announce('Folder edit dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, arg) => {
      return i18n.t(`domain-design-cluster-${labelId}`, arg);
    };

    this.getTitle = () => {
      return MessageHelper.getPageTitle(MODEL_PATH);
    };

    this.i18n = i18n;

    this.close = () => {
      let tracker = document.getElementById('domainTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      const result = {uid: 'XXX'};

      args.setValue(result);
    };

    this.folderContentModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-content',
      params: {
        modelPath: MODEL_PATH,
      }
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return FolderDialogModel;
});
