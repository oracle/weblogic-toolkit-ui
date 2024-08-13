/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project',
  'utils/modelEdit/model-edit-helper', 'utils/validation-helper', 'utils/view-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project,
  ModelEditHelper, validationHelper, viewHelper) {
  function NewElementDialogModel(args) {
    const DIALOG_SELECTOR = '#newElementDialog';
    const ELEMENT_NAME_REGEX= /^[\w.!-]+$/;

    const ELEMENT_TYPE_KEY = args.elementTypeKey;
    const ELEMENT_TYPE_VALIDATORS = args.nameValidators;

    this.i18n = i18n;
    this.elementTypeKey = ELEMENT_TYPE_KEY;
    this.elementName = ko.observable();

    this.connected = () => {
      accUtils.announce('New element dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, arg) => {
      return i18n.t(`model-edit-${ELEMENT_TYPE_KEY}-${labelId}`, arg);
    };

    this.newLabelMapper = (labelId, arg) => {
      // not element-specific
      return i18n.t(`model-edit-new-element-${labelId}`, arg);
    };

    this.getTitle = ko.computed(() => {
      return this.labelMapper('add-label')
    });

    this.nameValidators = [];

    // if validators passed in, use those instead of (some) default validations
    if(ELEMENT_TYPE_VALIDATORS) {
      this.nameValidators.push(...ELEMENT_TYPE_VALIDATORS)

    } else {
      this.nameValidators.push({
        validate: (value) => {
          if (!ELEMENT_NAME_REGEX.test(value)) {
            throw new Error(this.newLabelMapper('name-error'));
          }
        }
      });
    }

    this.nameValidators.push({
      // always check against peer elements
      validate: (value) => {
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
