/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/wkt-logger', 'utils/dialog-helper', 'ojs/ojarraydataprovider',
  'ojs/ojmodule-element-utils', 'utils/modelEdit/meta-handlers', 'utils/modelEdit/meta-options',
  'utils/modelEdit/meta-validators', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/file-select-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/list-view', 'oj-c/input-password',
  'oj-c/select-single', 'oj-c/select-multiple', 'oj-c/text-area', 'ojs/ojselectcombobox'
],
function(accUtils, ko, WktLogger, DialogHelper, ArrayDataProvider, ModuleElementUtils, MetaHandlers,
  MetaOptions, MetaValidators, ModelEditHelper, MessageHelper, AliasHelper, FileSelectHelper ) {

  function AttributeEditor(args) {
    const ATTRIBUTE = args.attribute;
    const ATTRIBUTE_MAP = args.attributeMap;

    const MODEL_PATH = ATTRIBUTE.path;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const subscriptions = [];

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.attribute = ATTRIBUTE;
    this.observable = ATTRIBUTE.observable;
    this.editorType = ModelEditHelper.getEditorType(ATTRIBUTE);

    // this.menuIconClass = 'oj-ux-ico-edit-box';
    // this.menuIconClass = 'oj-ux-ico-three-boxes-vertical';
    this.menuIconClass = 'wkt-ico-three-circles-vertical';

    // override the defaults of "Off" / "On"
    this.switchTranslations = {
      'switchOff': 'false',
      'switchOn': 'true'
    };

    this.labelMapper = (labelId, payload) => {
      return MessageHelper.t(`attribute-editor-${labelId}`, payload);
    };

    this.attributeLabel = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);

    this.attributeHelp = MessageHelper.getAttributeHelp(ATTRIBUTE, ALIAS_PATH);

    this.isTextEditorType = () => {
      return ['string', 'integer', 'double', 'long'].includes(this.editorType);
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

    this.disabled = MetaHandlers.getDisabledHandler(ATTRIBUTE, ATTRIBUTE_MAP);
    this.extraClass = ko.computed(() => this.disabled() ? 'wkt-model-edit-table-disabled' : null);

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
        return !ModelEditHelper.isVariableDefined(this.variableName());
      }
    });

    this.fromLabel = ko.computed(() => {
      if(this.variableName()) {
        const isDefined = ModelEditHelper.isVariableDefined(this.variableName());
        const messageKey = isDefined ? 'from-variable' : 'missing-variable';
        return this.labelMapper(messageKey, {variable: this.variableName()});
      } else if(this.secretName()) {
        return this.labelMapper('from-secret', {secret: this.secretName()});
      }
    });

    let options = ATTRIBUTE.options || [];
    const optionsMethod = ATTRIBUTE.optionsMethod;
    if(optionsMethod) {
      options = MetaOptions[optionsMethod](ATTRIBUTE, ATTRIBUTE_MAP, subscriptions);
    }
    ModelEditHelper.updateOptionLabels(options);
    this.optionsProvider = new ArrayDataProvider(options, { keyAttributes: 'value' });

    this.validators = ModelEditHelper.getValidators(ATTRIBUTE);

    this.canChooseDirectory = FileSelectHelper.canChooseDirectory(ATTRIBUTE);
    this.canChooseFile = FileSelectHelper.canChooseFile(ATTRIBUTE);

    this.chooseFile = async() => {
      const selectedFile = await FileSelectHelper.chooseFile(ATTRIBUTE, ATTRIBUTE.observable());
      if(selectedFile) {  // null value indicates cancel
        this.getValueObservable()(selectedFile);
      }
    };

    this.chooseDirectory = async() => {
      const selectedDir = await FileSelectHelper.chooseDirectory(ATTRIBUTE, ATTRIBUTE.observable());
      if(selectedDir) {  // null value indicates cancel
        this.getValueObservable()(selectedDir);
      }
    };

    this.showOptions = () => {
      const options = { attribute: ATTRIBUTE, modelPath: MODEL_PATH };
      DialogHelper.openDialog('modelEdit/attribute-editor-dialog', options);
    };

    this.createModuleConfig = (viewName) => {
      return ModuleElementUtils.createConfig({
        name: viewName,
        params: {
          attribute: ATTRIBUTE,
          attributeMap: ATTRIBUTE_MAP,
          modelPath: MODEL_PATH,
          readOnlyObservable: this.readOnly
        }
      });
    };
  }

  return AttributeEditor;
});
