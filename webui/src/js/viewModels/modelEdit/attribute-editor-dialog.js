/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/observable-properties', 'ojs/ojconverter-number',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/validation-helper', 'utils/view-helper',
  'ojs/ojinputtext', 'ojs/ojlabel', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojformlayout', 'oj-c/radioset',
  'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, ArrayDataProvider,
  BufferingDataProvider, props, ojConverterNumber,
  ModelEditHelper, MessageHelper, AliasHelper, validationHelper, viewHelper) {

  function AttributeEditorDialog(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE = args.attribute;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const DIALOG_SELECTOR = '#attributeEditorDialog';
    const VARIABLE_NAME_REGEX= /^[\w.-]+$/;

    const existingSecret = ModelEditHelper.getSecretName(ATTRIBUTE.observable());
    const existingVariable = ModelEditHelper.getVariableName(ATTRIBUTE.observable());

    let existingValue = ATTRIBUTE.observable();
    if(existingVariable) {
      existingValue = ModelEditHelper.getVariableValue(existingVariable);
    } else if(existingSecret) {
      existingValue = null;  // should we try to get this?
    }

    if(existingValue && Array.isArray(existingValue)) {
      // lists can be turned into variables
      existingValue = existingValue.join(',');
    }

    this.i18n = i18n;

    this.connected = () => {
      accUtils.announce('Attribute editor dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, arg) => {
      return i18n.t(`model-edit-attribute-dialog-${labelId}`, arg);
    };

    this.getTitle = ko.computed(() => {
      const attributeLabel = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);
      return this.labelMapper('title', {attributeLabel: attributeLabel});
    });

    const existingOption = existingVariable ? 'variable' : 'edit';

    this.editOption = ko.observable(existingOption);
    this.editOptions = [
      { value: 'edit', label: this.labelMapper('option-edit') },
      { value: 'remove', label: this.labelMapper('option-remove') }
    ];

    // dictionary attributes can't be tokenized
    if(ModelEditHelper.getDisplayType(ATTRIBUTE) !== 'dict') {
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
      let tracker = document.getElementById('modelEditAttributeTracker');

      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      switch(this.editOption()) {
        case 'remove':
          ATTRIBUTE.observable(null);
          ModelEditHelper.deleteModelElement(ATTRIBUTE.path, ATTRIBUTE.name);
          break;
        case 'variable':
          ATTRIBUTE.observable(ModelEditHelper.getVariableToken(this.variableName()));
          break;
        case 'newVariable':
          project.wdtModel.setProperty(this.newVariableName(), this.variableValue());
          ModelEditHelper.updateVariableMap();
          ATTRIBUTE.observable(ModelEditHelper.getVariableToken(this.newVariableName()));
          break;
        default:  // use the existing value, we may be de-tokenizing
          ATTRIBUTE.observable(existingValue);
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
  return AttributeEditorDialog;
});
