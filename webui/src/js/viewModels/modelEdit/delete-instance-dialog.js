/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'models/wkt-project', 'utils/modelEdit/message-helper', 'utils/view-helper',
  'oj-c/button', 'ojs/ojdialog'],
function(accUtils, ko, project, MessageHelper, ViewHelper) {

  function DeleteInstanceDialogModel(args) {
    const DIALOG_SELECTOR = '#deleteInstanceDialog';

    const MODEL_PATH = args.modelPath;

    const INSTANCE_NAME = MODEL_PATH[MODEL_PATH.length - 1];

    this.instanceName = ko.observable(INSTANCE_NAME);
    this.title = MessageHelper.getDeleteInstanceTitle(MODEL_PATH);

    this.connected = () => {
      accUtils.announce('Delete instance dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.okInput = () => {
      this.dialogContainer.close();

      const result = {
        doDelete: true
      };

      args.setValue(result);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue({});
    };
  }

  return DeleteInstanceDialogModel;
});
