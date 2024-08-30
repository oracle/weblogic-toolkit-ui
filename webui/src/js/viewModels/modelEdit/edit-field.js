/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/dialog-helper','ojs/ojarraydataprovider',
  'ojs/ojmodule-element-utils', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/list-view', 'oj-c/input-password'
],
function(accUtils, ko, i18n, DialogHelper, ArrayDataProvider,
  ModuleElementUtils, ModelEditHelper, MessageHelper, AliasHelper) {

  function EditField(args) {
    const MODEL_PATH = args.modelPath;
    const field = args.field;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.i18n = i18n;
    this.field = field;
    this.observable = args.field.observable;
    this.disabled = field.hasOwnProperty('disabled') ? field.disabled : false;
    this.displayType = ModelEditHelper.getDisplayType(field);

    // this.menuIconClass = 'oj-ux-ico-edit-box';
    // this.menuIconClass = 'oj-ux-ico-three-boxes-vertical';
    this.menuIconClass = 'wkt-ico-three-circles-vertical';

    // override the defaults of "Off" / "On"
    this.switchTranslations = {
      'switchOff': 'false',
      'switchOn': 'true'
    };

    this.fieldLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-field-${labelId}`, payload);
    };

    this.attributeLabel = field => {
      return MessageHelper.getAttributeFieldLabel(field, ALIAS_PATH);
    };

    this.attributeHelp = field => {
      return MessageHelper.getAttributeHelp(field, ALIAS_PATH);
    };

    this.variableName = ko.computed(() => {
      return ModelEditHelper.getVariableName(field.observable());
    });

    this.secretName = ko.computed(() => {
      return ModelEditHelper.getSecretName(field.observable());
    });

    this.tokenValue = ko.computed(() => {
      const tokenValue = ModelEditHelper.getVariableValue(this.variableName());
      return ModelEditHelper.getObservableValue(field, tokenValue);
    });

    this.usesToken = ko.computed(() => {
      return this.variableName() || this.secretName();
    });

    this.getValueObservable = ko.computed(() => {
      // if a token is used, show the token value in a read-only control
      if(this.usesToken()) {
        return this.tokenValue;
      }
      return field.observable;
    });

    this.readOnly = ko.computed(() => {
      return this.usesToken();
    });

    this.tokenError = ko.computed(() => {
      if(this.variableName()) {
        return !ModelEditHelper.getVariableValue(this.variableName());
      }
    });

    this.fromLabel = ko.computed(() => {
      if(this.variableName()) {
        const value = ModelEditHelper.getVariableValue(this.variableName());
        const messageKey = value ? 'from-variable' : 'missing-variable';
        return this.fieldLabelMapper(messageKey, {variable: this.variableName()});
      } else if(this.secretName()) {
        return this.fieldLabelMapper('from-secret', {secret: this.secretName()});
      }
    });

    this.optionsProvider = null;
    if(field.options) {
      this.optionsProvider = new ArrayDataProvider(field.options, {keyAttributes: 'key'});
    }

    this.validators = [];
    // if validators assigned to field, skip any default validation
    if(field.validators) {
      field.validators.forEach(validator => {
        this.validators.push(validator);
      });
    } else if(field.type === 'integer') {
      this.validators.push(ModelEditHelper.integerValidator);
    }

    this.showOptions = () => {
      const options = { fieldInfo: field, modelPath: MODEL_PATH };
      DialogHelper.openDialog('modelEdit/edit-field-dialog', options);
    };

    this.createModuleConfig = (viewName) => {
      return ModuleElementUtils.createConfig({
        name: viewName,
        params: {
          field: field,
          modelPath: MODEL_PATH
        }
      });
    };
  }

  return EditField;
});
