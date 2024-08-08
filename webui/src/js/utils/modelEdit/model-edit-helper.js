/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/i18n', 'js-yaml', 'models/wkt-project', 'ojs/ojmodule-element-utils'],
  function (ko, i18n, jsYaml, project, ModuleElementUtils) {
    function ModelEditHelper() {
      // parse, write, and maintain the model object structure.
      // maintain and update the navigation state.
      // provide convenience methods.

      const ROOT_ORDER = ['domainInfo', 'topology', 'resources', 'appDeployments', 'kubernetes'];

      this.modelObject = ko.observable();
      this.variableMap = ko.observable({});

      this.navSelection = ko.observable();
      this.navExpanded = ko.observable();

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

      this.deleteElement = (elementsPath, key) => {
        const elementsFolder = this.getFolder(elementsPath);
        delete elementsFolder[key];
        this.writeModel();
      };

      this.getFolder = (path) => {
        return this.getChildFolder(this.getCurrentModel(), path);
      };

      this.getChildFolder = (parent, path) => {
        const names = path.split('/');
        let folder = parent;
        names.forEach(name => {
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

      // *********************************************
      // create field configurations for display/edit
      // *********************************************

      this.createFieldMap = (fields, subscriptions) => {
        const fieldMap = {};
        this.addFields(fields, fieldMap, subscriptions);
        return fieldMap;
      };

      this.addFields = (fields, fieldMap, subscriptions) => {
        fields.forEach((field) => {
          const observableValue = this.getFieldObservableValue(field);
          field.observable = ko.observable(observableValue);
          fieldMap[field.key] = field;

          subscriptions.push(field.observable.subscribe((newValue) => {
            const folder = findOrCreatePath(this.getCurrentModel(), field.path);
            folder[field.attribute] = getModelValue(newValue, field);
            this.writeModel();
          }));
        });
      };

      // create a field configuration for an edit-field module
      this.fieldConfig = (field, labelPrefix) => {
        if(!field) {
          return ModuleElementUtils.createConfig({ name: 'empty-view' });
        }

        return ModuleElementUtils.createConfig({
          name: 'modelEdit/edit-field',
          params: {
            field: field,
            observable: field.observable,
            labelPrefix: labelPrefix
          }
        });
      };

      this.createFieldModuleConfig = (key, fieldMap, labelPrefix) => {
        const field = fieldMap[key];
        return this.fieldConfig(field, labelPrefix);
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

      this.getFieldObservableValue = field => {
        const modelValue = this.getValue(field.path, field.attribute);
        return this.getObservableValue(field, modelValue);
      };

      this.getObservableValue = (field, modelValue) => {
        // convert model type to observable type
        if(field.type === 'boolean') {
          // YAML 1.2 only allows false, but WDT allows 'false', maybe others?
          return (modelValue === 'false') ? false : modelValue;
        }
        return modelValue;
      };

      // ************************************************
      // parse model tokens, maintain a map of variables
      // ************************************************

      this.updateVariableMap = () => {
        const newVariableMap = this.variableMap();
        const properties = project.wdtModel.getModelPropertiesObject().observable();
        properties.forEach(entry => {
          newVariableMap[entry.Name] = entry.Value;
        });

        this.variableMap(newVariableMap);
      }

      this.getVariableMap = () => {
        return this.variableMap();
      }

      // get the secret name for tokens like @@SECRET:<name>:<token>@@
      this.getSecretName = token => {
        if(typeof token === 'string' || token instanceof String) {
          const result = token.match(/^@@SECRET:([\w.:-]+)@@$/);
          if(result && (result.length > 1)) {
            return result[1];
          }
        }
        return null;
      }

      // get the variable name for tokens like @@PROP:<token>@@
      this.getVariableName = token => {
        if(typeof token === 'string' || token instanceof String) {
          const result = token.match(/^@@PROP:([\w.-]+)@@$/);
          if(result && (result.length > 1)) {
            return result[1];
          }
        }
        return null;
      }

      this.getVariableValue = variableName => {
        if(typeof variableName === 'string' || variableName instanceof String) {
          return this.variableMap()[variableName];
        }
        return null;
      }

      this.getVariableToken = variableName => {
        return `@@PROP:${variableName}@@`;
      }

      // **************************************
      // access the model edit navigation menu
      // **************************************

      this.navigateToElement = (elementKey, name) => {
        const navigationKey = elementKey + '-' + name;
        this.navSelection(navigationKey);
      };

      this.openNavigation = (key) => {
        const keySet = this.navExpanded();
        this.navExpanded(keySet.add([key]));
      };

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
          this.validateRange(value, MIN_PORT, MAX_PORT);
        }
      }

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
        const names = path.split('/');
        let folder = parent;
        let folderPath = '';
        names.forEach(name => {
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
            const aIndex = getRootIndex(a);
            const bIndex = getRootIndex(b);
            return aIndex - bIndex;
          };
        }

        // by default, no sorting, just add to the end
        return () => {
          return 0;
        };
      }

      function getRootIndex(key) {
        const index = ROOT_ORDER.indexOf(key);
        return (index === -1) ? 99 : index;
      }

      function getModelValue(value, _field) {
        // are there cases where the value from a control needs conversion (boolean)?;
        return value;
      }
    }

    return new ModelEditHelper();
  }
);
