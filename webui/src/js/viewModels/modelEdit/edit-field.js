/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/dialog-helper','ojs/ojarraydataprovider',
  'utils/modelEdit/model-edit-helper', 'utils/wkt-logger',
  'oj-c/button', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, ko, i18n, DialogHelper, ArrayDataProvider,
  ModelEditHelper, WktLogger) {
  function EditField(args) {
    const field = args.field;
    const labelPrefix = args.labelPrefix;

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

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`${labelPrefix}-${labelId}`, payload);
    };

    this.fieldLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-field-${labelId}`, payload);
    };

    this.attributeLabel = field => {
      const key = `${labelPrefix}-attribute-${field.key}-label`;
      const label = i18n.t(key);
      return (label === key) ? getReadableName(field.attribute) : label;
    };

    this.attributeHelp = field => {
      let key = `${labelPrefix}-attribute-${field.key}-help`;
      let help = i18n.t(key);
      if(help === key) {
        key = `${labelPrefix}-attribute-generic-help`;
        help = i18n.t(key, {name: getReadableName(field.key)});
      }
      return help;
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
      const options = { fieldInfo: field, labelPrefix: labelPrefix };
      DialogHelper.openDialog('modelEdit/edit-field-dialog', options);
    };

    function getReadableName(name) {
      let result = name.charAt(0);

      // skip the first letter
      for (let i = 1; i < name.length; i++) {
        const current = name.charAt(i);
        const previous = name.charAt(i - 1);
        const next = (i < name.length - 1) ? name.charAt(i + 1) : null;

        if (isUpperCase(current)) {
          if(isUpperCase(previous)) {  // check for S in 'MTU Size'
            if(next && !isUpperCase(next)) {
              result += ' ';
            }
          } else {
            result += ' ';
          }
        }
        result += current;
      }

      return result;
    }

    function isUpperCase(char) {
      return char === char.toUpperCase();
    }
  }

  return EditField;
});
