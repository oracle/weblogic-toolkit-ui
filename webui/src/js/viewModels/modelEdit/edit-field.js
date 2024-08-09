/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/dialog-helper','ojs/ojarraydataprovider',
  'utils/modelEdit/model-edit-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, ko, i18n, DialogHelper, ArrayDataProvider,
  ModelEditHelper) {
  function EditField(args) {
    const field = args.field;
    const labelPrefix = args.labelPrefix;

    this.i18n = i18n;
    this.field = field;
    this.observable = args.field.observable;
    this.disabled = field.hasOwnProperty('disabled') ? field.disabled : false;
    this.displayType = getDisplayType(field);

    // this.menuIconClass = 'oj-ux-ico-edit-box';
    // this.menuIconClass = 'oj-ux-ico-three-boxes-vertical';
    this.menuIconClass = 'wkt-ico-three-circles-vertical';

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`${labelPrefix}-${labelId}`, payload);
    };

    this.fieldLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-field-${labelId}`, payload);
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
    })

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

    this.fromLabel = ko.computed(() => {
      if(this.variableName()) {
        return this.fieldLabelMapper('from-variable', {variable: this.variableName()});
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
      DialogHelper.promptDialog('modelEdit/edit-field-dialog', options)
        .then(_result => {
          // nothing to do here?
        });
    };

    function getDisplayType(field) {
      if(field.type === 'password') {
        return 'password';
      }

      if(field.type === 'boolean') {
        return 'boolean';
      }

      if(field.type === 'choice') {
        return 'choice';
      }

      if(field.type === 'dict') {
        return 'dict';
      }

      if(field.type === 'list') {
        return 'list';
      }

      if(field.type === 'integer') {
        return 'integer';
      }

      if(['string', 'credential'].includes(field.type)) {
        return 'string';
      }

      return 'unknown';
    }
  }

  return EditField;
});
