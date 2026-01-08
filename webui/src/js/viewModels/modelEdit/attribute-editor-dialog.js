/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'models/wkt-project', 'utils/common-utilities', 'ojs/ojarraydataprovider',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/modelEdit/file-select-helper', 'utils/wdt-archive-helper', 'utils/view-helper',
  'ojs/ojinputtext', 'ojs/ojlabel', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojformlayout', 'oj-c/radioset',
  'ojs/ojvalidationgroup', 'oj-c/message-banner'],
function(accUtils, ko, project, utils, ArrayDataProvider, ModelEditHelper,
  MessageHelper, AliasHelper, FileSelectHelper, ArchiveHelper, ViewHelper) {

  function AttributeEditorDialog(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE = args.attribute;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const DIALOG_SELECTOR = '#attributeEditorDialog';
    const VARIABLE_NAME_REGEX= /^[\w.-]+$/;

    const existingSecret = ModelEditHelper.getSecretName(ATTRIBUTE.observable());
    const existingVariable = ModelEditHelper.getVariableName(ATTRIBUTE.observable());

    const errorMessages = ko.observableArray();
    this.errorMessageProvider = new ArrayDataProvider(errorMessages, { keyAttributes: 'uid' });

    let existingValue = ATTRIBUTE.observable();
    if(existingVariable) {
      existingValue = ModelEditHelper.getVariableValue(existingVariable);
    } else if(existingSecret) {
      existingValue = null;  // should we try to get this?
    }

    // Jet oj-c-select-multiple uses Set, convert to array
    if(existingValue && existingValue instanceof Set) {
      existingValue = [...existingValue];
    }

    // change list to comma-separated string to tokenize
    if(existingValue && Array.isArray(existingValue)) {
      existingValue = existingValue.join(',');
    }

    this.connected = () => {
      accUtils.announce('Attribute editor dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.labelMapper = (labelId, arg) => {
      return MessageHelper.t(`attribute-dialog-${labelId}`, arg);
    };

    this.getTitle = ko.computed(() => {
      const attributeLabel = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);
      return this.labelMapper('title', {attribute: attributeLabel});
    });

    const existingOption = existingVariable ? 'variable' : 'edit';
    const editorType = ModelEditHelper.getEditorType(ATTRIBUTE);

    this.editOption = ko.observable(existingOption);
    this.editOptions = [
      { value: 'edit', label: this.labelMapper('option-edit') },
      { value: 'remove', label: this.labelMapper('option-remove') }
    ];

    // dictionary attributes can't be tokenized
    if(editorType !== 'dict') {
      this.editOptions.push({ value: 'variable', label: this.labelMapper('option-variable') });
      this.editOptions.push({ value: 'newVariable', label: this.labelMapper('option-newVariable') });
    }

    // file select types with archive type can be added/removed from archive
    const archiveTypes = ATTRIBUTE.archiveTypes || [];
    const archiveTypeKey = archiveTypes.length ? archiveTypes[0] : null;
    const archiveType = archiveTypeKey ? ModelEditHelper.getArchiveType(archiveTypeKey) : {};
    const isEmptyDirType = archiveType.subtype === 'emptyDir';
    const isTokenized = existingVariable || existingSecret;
    if(editorType === 'fileSelect' && archiveTypeKey && !isTokenized && !isEmptyDirType && ATTRIBUTE.observable()) {
      const textValue = ATTRIBUTE.observable().toString();
      const isArchivePath = textValue.startsWith('wlsdeploy/') || textValue.startsWith('config/wlsdeploy/');
      if(isArchivePath) {
        this.editOptions.push({value: 'removeFromArchive', label: this.labelMapper('option-removeFromArchive')});
      } else {
        this.editOptions.push({value: 'addToArchive', label: this.labelMapper('option-addToArchive')});
      }
    }

    const archiveSegregateName = FileSelectHelper.getSegregateName(ATTRIBUTE);
    this.archiveSegregateName = ko.observable(archiveSegregateName);
    this.archiveSegregateLabel = archiveType.segregatedLabel;
    this.archiveSegregateHelp = archiveType.segregatedHelp;

    this.variableOptionSelected = ko.computed(() => {
      return this.editOption() === 'variable';
    });

    this.newVariableOptionSelected = ko.computed(() => {
      return this.editOption() === 'newVariable';
    });

    this.enterSegregateName = ko.computed(() => {
      return this.editOption() === 'addToArchive' && !archiveSegregateName;
    });

    this.hasErrorMessages = ko.computed(() => {
      return !!errorMessages().length;
    });

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
      validate: (/*value*/) => {
        // needs some validation
      }
    };

    this.addToArchive = async() => {
      const path = ATTRIBUTE.observable().toString();
      const exists = await window.api.modelEdit.exists(path);
      if(!exists) {
        this.addErrorMessage(this.labelMapper('archive-file-not-present', { path }));
        return;
      }

      const isDir = await window.api.modelEdit.isDirectory(path);
      const fileType = isDir ? 'dir' : 'file';
      const addOptions = {
        segregatedName: this.archiveSegregateName(),
        emptyDirName: null,
        fileName: path,
        fileType
      };

      const addResult = await ArchiveHelper.addToArchive(archiveTypeKey, addOptions);
      if(addResult) {
        ATTRIBUTE.observable(addResult);
      }
    };

    this.removeFromArchive = () => {
      const path = ATTRIBUTE.observable();
      const removed = ArchiveHelper.removeFromArchive(path, true);
      if(removed) {
        ATTRIBUTE.observable(null);
      } else {
        this.addErrorMessage(this.labelMapper('archive-path-not-present', { path }));
      }
    };

    this.addErrorMessage = message => {
      errorMessages.push({
        uid: utils.getShortUuid(),
        severity: 'error',
        summary: message,
        closeAffordance: 'off'
      });
    };

    this.okInput = async() => {
      errorMessages.removeAll();

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
        case 'removeFromArchive':
          this.removeFromArchive();
          break;
        case 'addToArchive':
          await this.addToArchive();
          break;
        default:  // use the existing value, we may be de-tokenizing
          ATTRIBUTE.observable(ModelEditHelper.getObservableValue(ATTRIBUTE, existingValue));
          break;
      }

      if(errorMessages().length) {
        return;
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
