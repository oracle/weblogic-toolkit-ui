/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/validation-helper', 'utils/view-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project,
  ModelEditHelper, MessageHelper, AliasHelper, validationHelper, viewHelper) {
  function NewElementDialogModel(args) {
    const DIALOG_SELECTOR = '#newElementDialog';
    const ELEMENT_NAME_REGEX= /^[\w.!-]+$/;

    const MODEL_PATH = args.modelPath;
    const NAME_VALIDATORS = args.nameValidators;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.i18n = i18n;
    this.elementName = ko.observable();
    this.title = MessageHelper.getAddElementMessage(ALIAS_PATH);
    this.nameLabel = MessageHelper.getElementNameLabel(ALIAS_PATH);
    this.helpLabel = MessageHelper.getElementNameHelp(ALIAS_PATH);

    this.connected = () => {
      accUtils.announce('New element dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.nameValidators = [];

    // if validators passed in, use those instead of (some) default validations
    if(NAME_VALIDATORS) {
      this.nameValidators.push(...NAME_VALIDATORS);

    } else {
      this.nameValidators.push({
        validate: (value) => {
          if (!ELEMENT_NAME_REGEX.test(value)) {
            const message = i18n.t('model-edit-new-element-name-error');
            throw new Error(message);
          }
        }
      });
    }

    this.nameValidators.push({
      // always check against peer elements
      validate: () => {
        // TODO: test against existing names
      }
    });

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
        elementName: this.elementName()
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
  return NewElementDialogModel;
});
