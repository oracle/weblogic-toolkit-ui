/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/i18n', 'js-yaml', 'models/wkt-project', 'utils/common-utilities',
  'utils/wkt-logger', 'utils/modelEdit/alias-helper', 'ojs/ojmodule-element-utils'],
function (ko, i18n, jsYaml, project, utils,
  WktLogger, AliasHelper, ModuleElementUtils) {

  function ModelEditHelper() {
    // parse, write, and maintain the model object structure.
    // provide convenience methods.

    const ROOT_ORDER = ['domainInfo', 'topology', 'resources', 'appDeployments', 'kubernetes'];
    const FALSE_VALUES= ['false', '0'];

    this.modelObject = ko.observable();
    this.variableMap = ko.observable({});

    // **********************
    // read and update model
    // **********************

    this.parseModel = () => {
      const modelText = project.wdtModel.modelContent();
      const modelObject = jsYaml.load(modelText, {});
      this.modelObject(modelObject || {});
    };

    this.parseModel();
    project.wdtModel.modelContentChanged.subscribe(() => {
      this.parseModel();
    });

    this.getCurrentModel = () => {
      return this.modelObject();
    };

    // ideally, should only be called internally
    this.writeModel = () => {
      project.wdtModel.modelContent(jsYaml.dump(this.getCurrentModel(), {}));
    };

    this.addElement = (path, key) => {
      const folder = findOrCreatePath(this.getCurrentModel(), path);
      const newElement = {};
      folder[key] = newElement;
      this.writeModel();
      return newElement;
    };

    this.deleteElement = (modelPath, key) => {
      const modelFolder = this.getFolder(modelPath);
      delete modelFolder[key];
      this.deleteIfEmpty(modelPath);
      this.writeModel();
    };

    this.getFolder = (path) => {
      return this.getChildFolder(this.getCurrentModel(), path);
    };

    this.getChildFolder = (parent, path) => {
      let folder = parent;
      path.forEach(name => {
        if(folder.hasOwnProperty(name) && folder[name]) {
          folder = folder[name];
        } else {
          folder = {};
        }
      });
      return folder;
    };

    this.getValue = (path, attribute) => {
      const folder = this.getFolder(path);
      return folder[attribute];
    };

    this.deleteIfEmpty = modelPath => {
      if(!AliasHelper.isNamedPath(modelPath)) {
        const folder = this.getFolder(modelPath);
        if (Object.keys(folder).length === 0) {
          const folderKey = modelPath[modelPath.length - 1];
          const parentPath = modelPath.slice(0, -1);
          const parentFolder = this.getFolder(parentPath);
          delete parentFolder[folderKey];

          if (parentPath.length > 0) {
            this.deleteIfEmpty(parentPath);
          }
        }
      }
    };

    this.getDomainName = ()=> {
      const domainName = this.getValue(['topology'], 'Name');
      return domainName || 'base_domain';
    };

    // *********************************************
    // create field configurations for display/edit
    // *********************************************

    this.createAliasFieldMap = (modelPath, fieldOverrides, subscriptions) => {
      const fieldMap = {};

      const attributesMap = AliasHelper.getAttributesMap(modelPath);
      for (const [attributeName, valueMap] of Object.entries(attributesMap)) {
        // key is used for message lookup, not periods
        const key = attributeName.replaceAll('.', '_');

        const field = {
          attribute: attributeName,
          key: key,
          path: modelPath,
          type: valueMap['wlstType'],
          observable: ko.observable()
        };

        const overrides = fieldOverrides[attributeName];
        Object.assign(field, overrides);

        const observableValue = this.getFieldObservableValue(field);
        field.observable(observableValue);

        subscriptions.push(field.observable.subscribe(newValue => {
          if(newValue === null) {
            this.deleteElement(field.path, field.attribute);
          } else {
            const folder = findOrCreatePath(this.getCurrentModel(), field.path);
            folder[field.attribute] = getModelValue(newValue, field);
          }
          this.writeModel();
        }));

        fieldMap[attributeName] = field;
      }
      return fieldMap;
    };

    // create a field configuration for an edit-field module
    this.createFieldModuleConfig = (key, fieldMap, labelPrefix) => {
      const field = fieldMap[key];
      if(!field) {
        WktLogger.error(`Field ${key} not found, fields: ${Object.keys(fieldMap)}`);
        return ModuleElementUtils.createConfig({ name: 'empty-view' });
      }

      return ModuleElementUtils.createConfig({
        name: 'modelEdit/edit-field',
        params: {
          field: field,
          labelPrefix: labelPrefix
        }
      });
    };

    this.getAttributeLabel = (field, labelPrefix) => {
      const key = `${labelPrefix}-attribute-${field.key}-label`;
      const label = i18n.t(key);
      return (label === key) ? getReadableLabel(field.attribute) : label;
    };

    this.getAttributeHelp = (field, labelPrefix) => {
      let key = `${labelPrefix}-attribute-${field.key}-help`;
      let help = i18n.t(key);
      if(help === key) {
        key = `${labelPrefix}-attribute-generic-help`;
        help = i18n.t(key, {name: getReadableLabel(field.attribute)});
      }
      return help;
    };

    this.createFieldSetModuleConfig = (fields, fieldMap, labelPrefix) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/field-set',
        params: {
          fields: fields,
          labelPrefix: labelPrefix,
          fieldMap: fieldMap
        }
      });
    };

    this.getRemainingFieldNames = (fieldMap, knownFieldNames) => {
      const remainingNames = [];
      Object.keys(fieldMap).forEach(key => {
        if(!knownFieldNames.includes(key)) {
          remainingNames.push(key);
        }
      });
      remainingNames.sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
      return remainingNames;
    };

    this.getFieldObservableValue = field => {
      const modelValue = this.getValue(field.path, field.attribute);
      return this.getObservableValue(field, modelValue);
    };

    this.getObservableValue = (field, modelValue) => {
      // convert model type to observable type
      if(field.type === 'boolean') {
        // YAML 1.2 only allows false, but WDT allows 'false', '0', 0 (0 is false for JS).
        // leave the value alone otherwise, it may be a token.
        const testValue = isString(modelValue) ? modelValue.toLowerCase() : modelValue;
        return (FALSE_VALUES.includes(testValue)) ? false : modelValue;
      }
      return modelValue;
    };

    // ************************************************
    // parse model tokens, maintain a map of variables
    // ************************************************

    this.updateVariableMap = () => {
      const newVariableMap = {};
      const properties = project.wdtModel.getModelPropertiesObject().observable();
      properties.forEach(entry => {
        newVariableMap[entry.Name] = entry.Value;
      });

      this.variableMap(newVariableMap);
    };

    this.getVariableMap = () => {
      return this.variableMap();
    };

    this.getDerivedValue = value => {
      const variableName = this.getVariableName(value);
      if(variableName !== null) {
        return this.getVariableValue(variableName);
      }
      return value;
    };

    // get the secret name for tokens like @@SECRET:<name>:<token>@@
    this.getSecretName = token => {
      if(isString(token)) {
        // prepareModel and discover targets may do this
        const domainName = this.getDomainName();
        token = token.replace('@@ENV:DOMAIN_UID@@', utils.toLegalK8sName(domainName));

        const result = token.match(/^@@SECRET:([\w.:-]+)@@$/);
        if(result && (result.length > 1)) {
          return result[1];
        }
      }
      return null;
    };

    // get the variable name for tokens like @@PROP:<token>@@
    this.getVariableName = token => {
      if(isString(token)) {
        const result = token.match(/^@@PROP:([\w.-]+)@@$/);
        if(result && (result.length > 1)) {
          return result[1];
        }
      }
      return null;
    };

    this.getVariableValue = variableName => {
      return this.variableMap()[variableName];
    };

    this.getVariableToken = variableName => {
      return `@@PROP:${variableName}@@`;
    };

    this.getDisplayType = getDisplayType;

    // *****************
    // field validators
    // *****************

    const INTEGER_REGEX = /^[0-9-]*$/;
    const MIN_PORT = 1;
    const MAX_PORT = 65535;

    this.integerValidator = {
      validate: value => {
        if(value) {
          if (!INTEGER_REGEX.test(value)) {
            throw new Error(i18n.t('model-edit-field-invalid-integer'));
          }
        }
      }
    };

    this.portValidator = {
      validate: value => {
        this.integerValidator.validate(value);
        this.validateRange(value, MIN_PORT, MAX_PORT);
      }
    };

    this.validateRange = (value, min, max) => {
      if(value) {
        const port = parseInt(value, 10);
        if((port < min) || (port > max)) {
          throw new Error(i18n.t('model-edit-field-invalid-range', {min, max}));
        }
      }
    };

    // *******************
    // internal functions
    // *******************

    function findOrCreatePath(parent, path) {
      let folder = parent;
      let folderPath = '';
      path.forEach(name => {
        folder = findOrCreateFolder(folder, name, folderPath);
        folderPath += folderPath.length ? '/' : '';
        folderPath += name;
      });
      return folder;
    }

    function findOrCreateFolder(folder, name, folderPath) {
      if(!folder.hasOwnProperty(name) || !folder[name]) {
        addInOrder(folder, name, {}, folderPath);
      }
      return folder[name];
    }

    function addInOrder(folder, newKey, newValue, folderPath) {
      const copy = {...folder};

      folder[newKey] = newValue;  // add to the end

      const comparer = getComparer(folderPath);

      // move entries with greater keys to the end
      for(const key of Object.keys(copy)) {
        if(comparer(key, newKey) > 0) {
          const value = folder[key];
          delete folder[key];
          folder[key] = value;
        }
      }
    }

    function getComparer(folderPath) {
      // for root folder, maintain prescribed order
      if(folderPath === '') {
        return (a, b) => {
          const aIndex = getTopFolderIndex(a);
          const bIndex = getTopFolderIndex(b);
          return aIndex - bIndex;
        };
      }

      // by default, no sorting, just add to the end
      return () => {
        return 0;
      };
    }

    // return the index of top-level model folders for ordering
    function getTopFolderIndex(key) {
      const index = ROOT_ORDER.indexOf(key);
      return (index === -1) ? 99 : index;
    }

    // refine field value for use in the model
    function getModelValue(value, field) {
      if ((getDisplayType(field) === 'integer') && isString(value)) {
        const result = value.match(/^([0-9]+)$/);
        if(result && (result.length > 1)) {
          return parseInt(result[1], 10);
        }
      }
      return value;
    }

    function getReadableLabel(name) {
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
    };

    function isUpperCase(char) {
      return char === char.toUpperCase();
    }

    function isString(value) {
      return typeof value === 'string' || value instanceof String;
    }

    function getDisplayType(field) {
      let fieldType = field.type;

      // some alias attributes have wlst_type like ${offline:online},
      // in this case use the first value
      const result = fieldType.match(/^\$\{(.*):(.*)}$/);
      if(result && (result.length > 1)) {
        fieldType = result[1];
      }

      if(fieldType === 'password') {
        return 'password';
      }

      if(fieldType === 'boolean') {
        return 'boolean';
      }

      if(['dict', 'properties'].includes(fieldType)) {
        return 'dict';
      }

      if(['list', 'jarray'].includes(fieldType) || fieldType.startsWith('delimited_string')) {
        return 'list';
      }

      if(field['options']) {
        return 'choice';
      }

      if(['integer', 'long'].includes(fieldType)) {
        return 'integer';
      }

      if(['string', 'credential'].includes(fieldType)) {
        return 'string';
      }

      WktLogger.error(`Unrecognized field type '${field.type}' for field ${field.attribute}`);
      return 'unknown';
    }
  }

  return new ModelEditHelper();
}
);
