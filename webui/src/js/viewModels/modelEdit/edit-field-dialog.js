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
    const VARIABLE_NAME_REGEX= /^[\w.-]+$/;

    const fieldInfo = args.fieldInfo;
    const labelPrefix = args.labelPrefix;
    const existingSecret = ModelEditHelper.getSecretName(fieldInfo.observable());
    const existingVariable = ModelEditHelper.getVariableName(fieldInfo.observable());

    let existingValue = fieldInfo.observable();
    if(existingVariable) {
      existingValue = ModelEditHelper.getVariableValue(existingVariable);
    } else if(existingSecret) {
      existingValue = null;  // should we try to get this?
    }

    this.i18n = i18n;

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
      return this.labelMapper('title', {fieldLabel: fieldLabel});
    });

    const existingOption = existingVariable ? 'variable' : 'edit';

    this.editOption = ko.observable(existingOption);
    this.editOptions = [
      { value: 'edit', label: this.labelMapper('option-edit') },
      { value: 'remove', label: this.labelMapper('option-remove') }
    ];

    // dictionary attributes can't be tokenized
    if(ModelEditHelper.getDisplayType(fieldInfo) !== 'dict') {
      this.editOptions.push({ value: 'variable', label: this.labelMapper('option-variable') });
      this.editOptions.push({ value: 'newVariable', label: this.labelMapper('option-newVariable') });
    }

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

    this.newVariableName = ko.observable();
    this.variableName = ko.observable(existingVariable);
    this.variableValue = ko.observable(existingValue);

    this.allVariables = [];
    for (const [key, value] of Object.entries(ModelEditHelper.getVariableMap())) {
      this.allVariables.push({
        key: key,
        label: key + ' (' + value + ')'
      });
    }
    this.variablesProvider = new ArrayDataProvider(this.allVariables, {keyAttributes: 'key'});

    this.variableNameValidator = {
      validate: (value) => {
        if(!VARIABLE_NAME_REGEX.test(value)) {
          throw new Error(this.labelMapper('variable-name-error'));
        }
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
          fieldInfo.observable(ModelEditHelper.getVariableToken(this.variableName()));
          break;
        case 'newVariable':
          project.wdtModel.setProperty(this.newVariableName(), this.variableValue());
          ModelEditHelper.updateVariableMap();
          fieldInfo.observable(ModelEditHelper.getVariableToken(this.newVariableName()));
          break;
        default:  // use the existing value, we may be de-tokenizing
          fieldInfo.observable(existingValue);
          break;
      }

      this.dialogContainer.close();
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return EditFieldDialogModel;
});
