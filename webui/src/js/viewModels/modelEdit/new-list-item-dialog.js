/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'models/wkt-project',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/modelEdit/file-select-helper', 'utils/common-utilities', 'utils/validation-helper', 'utils/view-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, project,
  ModelEditHelper, MessageHelper, AliasHelper, FileSelectHelper, utils, validationHelper, viewHelper) {
  function NewListItemDialogModel(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE = args.attribute;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const DIALOG_SELECTOR = '#newListItemDialog';

    const observableItems = args.observableItems;

    this.elementName = ko.observable();

    this.connected = () => {
      accUtils.announce('New list item dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.title = MessageHelper.getAddItemLabel(ATTRIBUTE, ALIAS_PATH, true);
    this.nameLabel = MessageHelper.getItemLabel(ATTRIBUTE, ALIAS_PATH);
    this.nameHelp = MessageHelper.getItemHelp(ATTRIBUTE, ALIAS_PATH);

    this.isFile = ATTRIBUTE.usesPath;
    this.fileLabel = MessageHelper.t('attribute-editor-select');

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.nameValidators = [{
      validate: () => {
        // check with regex?
      }
    }];

    this.selectFile = async() => {
      this.dialogContainer.close();

      const path = await FileSelectHelper.selectFile(ATTRIBUTE, null);

      if(path) {
        this.elementName(path);

        const itemToAdd = {
          uid: utils.getShortUuid(),
          name: this.elementName()
        };
        observableItems.push(itemToAdd);
      }

      const result = {
        changed: !!path
      };

      args.setValue(result);
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

      const itemToAdd = {
        uid: utils.getShortUuid(),
        name: this.elementName()
      };
      observableItems.push(itemToAdd);

      const result = {
        changed: true
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
  return NewListItemDialogModel;
});
