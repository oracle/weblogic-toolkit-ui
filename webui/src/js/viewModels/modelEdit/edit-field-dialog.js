/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/observable-properties', 'ojs/ojconverter-number',
  'utils/modelEdit/model-edit-helper', 'utils/validation-helper', 'utils/view-helper',
  'ojs/ojinputtext', 'ojs/ojlabel', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojformlayout', 'oj-c/radioset',
  'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, ArrayDataProvider,
  BufferingDataProvider, props, ojConverterNumber,
  ModelEditHelper, validationHelper, viewHelper) {
  function EditFieldDialogModel(args) {
    const DIALOG_SELECTOR = '#editFieldDialog';

    this.i18n = i18n;

    const fieldInfo = args.fieldInfo;
    const labelPrefix = args.labelPrefix;

    const existingToken = ModelEditHelper.getTokenName(fieldInfo.observable());
    const existingValue = existingToken ? ModelEditHelper.getTokenValue(existingToken) : fieldInfo.observable();

    this.connected = () => {
      accUtils.announce('Edit field dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, arg) => {
      return i18n.t(`model-edit-field-dialog-${labelId}`, arg);
    };

    this.getTitle = ko.computed(() => {
      const fieldLabel = i18n.t(`${labelPrefix}-attribute-${fieldInfo.key}-label`);
      return this.labelMapper('title', {fieldLabel: fieldLabel})
    });

    const existingOption = existingToken ? 'variable' : 'edit';

    this.editOption = ko.observable(existingOption);
    this.editOptions = [
      { value: 'edit', label: this.labelMapper('option-edit') },
      { value: 'remove', label: this.labelMapper('option-remove') },
      { value: 'variable', label: this.labelMapper('option-variable') },
      { value: 'newVariable', label: this.labelMapper('option-newVariable') }
    ];

    this.variableOptionSelected = ko.computed(() => {
      return this.editOption() === 'variable';
    });

    this.newVariableOptionSelected = ko.computed(() => {
      return this.editOption() === 'newVariable';
    });

    this.isVariableOption = (option) => {
      return option.value === 'variable';
    };

    this.isNewVariableOption = (option) => {
      return option.value === 'newVariable';
    };

    this.newTokenName = ko.observable();
    this.tokenName = ko.observable(existingToken);
    this.tokenValue = ko.observable(existingValue);

    this.allTokens = [];
    for (const [key, value] of Object.entries(ModelEditHelper.getTokenMap())) {
      this.allTokens.push({
        key: key,
        label: key + ' (' + value + ')'
      });
    }
    this.tokensProvider = new ArrayDataProvider(this.allTokens, {keyAttributes: 'key'});

    this.tokenNameValidator = {
      validate: (value) => {
        // needs some validation
      }
    };

    this.valueValidator = {
      validate: (value) => {
        // needs some validation
      }
    };

    this.okInput = () => {
      let tracker = document.getElementById('modelEditFieldTracker');

      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      switch(this.editOption()) {
        case 'remove':
          fieldInfo.observable(null);
          ModelEditHelper.deleteElement(fieldInfo.path, fieldInfo.attribute);
          break;
        case 'variable':
          fieldInfo.observable(ModelEditHelper.getModelTokenText(this.tokenName()));
          break;
        case 'newVariable':
          project.wdtModel.setProperty(this.newTokenName(), this.tokenValue());
          ModelEditHelper.updateTokenMap();
          fieldInfo.observable(ModelEditHelper.getModelTokenText(this.newTokenName()));
          break;
        default:  // use the existing value, we may be de-tokenizing
          fieldInfo.observable(existingValue);
          break;
      }

      this.dialogContainer.close();

      const result = {
        option: this.editOption(),
        token: this.tokenName(),
        value: this.tokenValue()
      };

      args.setValue(result);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return EditFieldDialogModel;
});
