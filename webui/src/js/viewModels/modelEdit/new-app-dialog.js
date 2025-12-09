/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'models/wkt-project', 'utils/modelEdit/instance-helper',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/meta-helper',
  'utils/modelEdit/alias-helper', 'utils/view-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojswitch', 'ojs/ojvalidationgroup'],
function(accUtils, ko, project,
  InstanceHelper, ModelEditHelper, MessageHelper, MetaHelper, AliasHelper, ViewHelper) {

  function NewAppDialogModel(args) {
    const DIALOG_SELECTOR = '#newAppDialog';

    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const newInstanceName = InstanceHelper.getNewInstanceName(MODEL_PATH);
    const newInstancePath = [...MODEL_PATH, newInstanceName];

    this.title = MessageHelper.getAddInstanceMessage(ALIAS_PATH);
    this.nameLabel = MessageHelper.getInstanceNameLabel(ALIAS_PATH);
    this.helpLabel = MessageHelper.getInstanceNameHelp(ALIAS_PATH);

    this.appInstallDirLabel = MessageHelper.t('add-app-use-app-install-dir-label');
    this.appInstallDirHelp = MessageHelper.t('add-app-use-app-install-dir-help');

    this.connected = () => {
      accUtils.announce('New application dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.nameValidators = InstanceHelper.getNameValidators(newInstancePath);

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.instanceName = ko.observable(newInstanceName);
    this.useAppInstallDir = ko.observable(false);

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
        useAppInstallDir: this.useAppInstallDir()
      };

      args.setValue(result);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue({});
    };
  }

  return NewAppDialogModel;
});
