/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper', 'utils/view-helper',
  'oj-c/radioset', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, MessageHelper, AliasHelper, viewHelper) {

  function FileSelectDialog(args) {
    const ATTRIBUTE = args.attribute;
    const SELECT_OPTIONS = args.selectOptions;

    const MODEL_PATH = ATTRIBUTE.path;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const DIALOG_SELECTOR = '#fileSelectDialog';

    this.connected = () => {
      accUtils.announce('File select dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.labelMapper = (labelId, arg) => {
      return MessageHelper.t('file-select-' + labelId, arg);
    };

    const attributeLabel = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);
    this.title = this.labelMapper('title', { attribute: attributeLabel });

    this.selectOptions = [];
    SELECT_OPTIONS.forEach(fileSelectOption => {
      let label = fileSelectOption.label;
      if(fileSelectOption.selectEmptyDir) {  // special label for local empty dir
        label = this.t('file-select-local-empty-dir');
      }

      this.selectOptions.push({
        value: fileSelectOption,
        label
      });
    });

    this.selectOption = ko.observable(SELECT_OPTIONS[0]);

    this.okInput = () => {
      let tracker = document.getElementById('modelEditFileSelectTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      args.setValue(this.selectOption());
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue(null);
    };
  }

  return FileSelectDialog;
});
