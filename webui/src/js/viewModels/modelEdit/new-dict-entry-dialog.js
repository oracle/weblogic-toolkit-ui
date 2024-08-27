/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project',
  'utils/modelEdit/model-edit-helper', 'utils/common-utilities', 'utils/validation-helper', 'utils/view-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project,
  ModelEditHelper, utils, validationHelper, viewHelper) {

  function NewDictEntryDialogModel(args) {
    const DIALOG_SELECTOR = '#newDictEntryDialog';

    const field = args.field;
    const labelPrefix = args.labelPrefix;
    const observableItems = args.observableItems;

    this.i18n = i18n;

    this.entryName = ko.observable();
    this.entryValue = ko.observable();

    this.connected = () => {
      accUtils.announce('New dict entry dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.nameLabel = i18n.t('model-edit-dict-dialog-name-label');
    this.nameHelp = i18n.t('model-edit-dict-dialog-name-help');
    this.valueLabel = i18n.t('model-edit-dict-dialog-value-label');
    this.valueHelp = i18n.t('model-edit-dict-dialog-value-help');

    this.getTitle = ko.computed(() => {
      return this.i18n.t('model-edit-dict-dialog-add-label', {
        name: ModelEditHelper.getAttributeLabel(field, labelPrefix)
      });
    });

    this.nameValidators = [{
      validate: () => {
        // check with regex?
      }
    }];

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
        name: this.entryName(),
        value: this.entryValue()
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
  return NewDictEntryDialogModel;
});
