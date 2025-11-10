/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'models/wkt-project', 'utils/modelEdit/instance-helper',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/validation-helper', 'utils/view-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup', 'ojs/ojselectcombobox'],
function(accUtils, ko, project,
  InstanceHelper, ModelEditHelper, MessageHelper, AliasHelper, validationHelper, viewHelper) {

  function NewInstanceDialogModel(args) {
    const DIALOG_SELECTOR = '#newInstanceDialog';

    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const newInstanceName = InstanceHelper.getNewInstanceName(MODEL_PATH);
    const newInstancePath = [...MODEL_PATH, newInstanceName];

    const providerGroupLabel = MessageHelper.getFolderTypeLabel(MODEL_PATH);
    const typeFolderNames = AliasHelper.getFolderNames(MODEL_PATH);
    this.useTypeFolder = AliasHelper.usesTypeFolders(MODEL_PATH);

    this.providerTypeLabel = MessageHelper.getProviderTypeLabel(ALIAS_PATH, providerGroupLabel);
    this.providerTypeHelp = MessageHelper.getProviderTypeHelp(ALIAS_PATH, providerGroupLabel);
    this.providerType = ko.observable();
    this.providerTypeOptions = [];
    typeFolderNames.forEach(typeName => {
      const typePath = [...ALIAS_PATH, typeName];
      this.providerTypeOptions.push({
        value: typeName,
        label: MessageHelper.getFolderLabel(typePath)
      });
    });

    this.instanceName = ko.observable(newInstanceName);
    this.title = MessageHelper.getAddInstanceMessage(ALIAS_PATH);
    this.nameLabel = MessageHelper.getInstanceNameLabel(ALIAS_PATH);
    this.helpLabel = MessageHelper.getInstanceNameHelp(ALIAS_PATH);

    this.connected = () => {
      accUtils.announce('New instance dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.nameValidators = InstanceHelper.getNameValidators(newInstancePath);

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.okInput = () => {
      let tracker = document.getElementById('modelNewEntryTracker');

      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      const result = {
        instanceName: this.instanceName(),
        providerType: this.providerType()
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
  return NewInstanceDialogModel;
});
