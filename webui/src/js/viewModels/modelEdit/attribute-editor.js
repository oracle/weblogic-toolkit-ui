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

  function AttributeEditor(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE = args.attribute;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.i18n = i18n;
    this.attribute = ATTRIBUTE;
    this.observable = ATTRIBUTE.observable;
    this.disabled = ATTRIBUTE.hasOwnProperty('disabled') ? ATTRIBUTE.disabled : false;
    this.displayType = ModelEditHelper.getDisplayType(ATTRIBUTE);

    // this.menuIconClass = 'oj-ux-ico-edit-box';
    // this.menuIconClass = 'oj-ux-ico-three-boxes-vertical';
    this.menuIconClass = 'wkt-ico-three-circles-vertical';

    // override the defaults of "Off" / "On"
    this.switchTranslations = {
      'switchOff': 'false',
      'switchOn': 'true'
    };

    this.attributeLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-attribute-${labelId}`, payload);
    };

    this.attributeLabel = attribute => {
      return MessageHelper.getAttributeLabel(attribute, ALIAS_PATH);
    };

    this.attributeHelp = attribute => {
      return MessageHelper.getAttributeHelp(attribute, ALIAS_PATH);
    };

    this.variableName = ko.computed(() => {
      return ModelEditHelper.getVariableName(ATTRIBUTE.observable());
    });

    this.secretName = ko.computed(() => {
      return ModelEditHelper.getSecretName(ATTRIBUTE.observable());
    });

    this.tokenValue = ko.computed(() => {
      const tokenValue = ModelEditHelper.getVariableValue(this.variableName());
      return ModelEditHelper.getObservableValue(ATTRIBUTE, tokenValue);
    });

    this.usesToken = ko.computed(() => {
      return this.variableName() || this.secretName();
    });

    this.getValueObservable = ko.computed(() => {
      // if a token is used, show the token value in a read-only control
      if(this.usesToken()) {
        return this.tokenValue;
      }
      return ATTRIBUTE.observable;
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
        return this.attributeLabelMapper(messageKey, {variable: this.variableName()});
      } else if(this.secretName()) {
        return this.attributeLabelMapper('from-secret', {secret: this.secretName()});
      }
    });

    this.optionsProvider = null;
    if(ATTRIBUTE.options) {
      this.optionsProvider = new ArrayDataProvider(ATTRIBUTE.options, {keyAttributes: 'key'});
    }

    this.validators = [];
    // if validators assigned to attribute, skip any default validation
    if(ATTRIBUTE.validators) {
      ATTRIBUTE.validators.forEach(validator => {
        this.validators.push(validator);
      });
    } else if(ATTRIBUTE.type === 'integer') {
      this.validators.push(ModelEditHelper.integerValidator);
    }

    this.showOptions = () => {
      const options = { attribute: ATTRIBUTE, modelPath: MODEL_PATH };
      DialogHelper.openDialog('modelEdit/attribute-editor-dialog', options);
    };

    this.createModuleConfig = (viewName) => {
      return ModuleElementUtils.createConfig({
        name: viewName,
        params: {
          attribute: ATTRIBUTE,
          modelPath: MODEL_PATH
        }
      });
    };
  }

  return AttributeEditor;
});
