/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojinputtext', 'ojs/ojlabel',
  'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, viewHelper) {
  function TextInputDialogModel(args) {
    const DIALOG_ID = 'textInputDialog';

    this.connected = () => {
      accUtils.announce('Text input dialog loaded.', 'assertive');

      this.dialogContainer = document.getElementById(DIALOG_ID);

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.anyLabelMapper = (labelId, arg) => {
      return i18n.t(labelId, arg);
    };

    this.title = args.title;
    this.label = args.label;
    this.help = args.help;

    this.textValue = ko.observable(args.defaultValue);

    this.okInput = () => {
      let tracker = document.getElementById('textInputTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();
      const value = this.textValue().trim();
      args.setValue(value);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return TextInputDialogModel;
});
