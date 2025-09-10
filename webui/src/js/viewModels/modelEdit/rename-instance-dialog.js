/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/modelEdit/instance-helper',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/validation-helper', 'utils/view-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project,
  InstanceHelper, ModelEditHelper, MessageHelper, AliasHelper, validationHelper, viewHelper) {

  function RenameInstanceDialogModel(args) {
    const DIALOG_SELECTOR = '#renameInstanceDialog';

    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const INSTANCE_NAME = MODEL_PATH[MODEL_PATH.length - 1];

    this.i18n = i18n;
    this.instanceName = ko.observable(INSTANCE_NAME);
    this.title = MessageHelper.getRenameInstanceMessage(MODEL_PATH);
    this.nameLabel = MessageHelper.getInstanceNameLabel(ALIAS_PATH);
    this.helpLabel = MessageHelper.getInstanceNameHelp(ALIAS_PATH);

    this.connected = () => {
      accUtils.announce('Rename instance dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.nameValidators = InstanceHelper.getNameValidators(MODEL_PATH);

    this.okInput = () => {
      let tracker = document.getElementById('modelRenameEntryTracker');

      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      const result = {
        instanceName: this.instanceName()
      };

      args.setValue(result);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue({});
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return RenameInstanceDialogModel;
});
