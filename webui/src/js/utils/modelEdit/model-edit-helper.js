/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'js-yaml', 'models/wkt-project', 'utils/common-utilities',
  'utils/wkt-logger', 'utils/modelEdit/alias-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/meta-validators',
  'ojs/ojmodule-element-utils'],
function (ko, jsYaml, project, utils,
  WktLogger, AliasHelper, MetaHelper, MessageHelper, MetaValidators, ModuleElementUtils) {

  function ModelEditHelper() {
    // parse, write, and maintain the model object structure.
    // provide convenience methods.

    const ROOT_ORDER = ['domainInfo', 'topology', 'resources', 'appDeployments', 'kubernetes'];
    const FALSE_VALUES= ['false', '0'];

    // types that UI has editors for, not all alias types
    const EDITOR_TYPES = ['boolean', 'combo', 'comboMulti', 'credential', 'dict', 'double',
      'integer', 'list', 'long', 'select', 'selectMulti', 'string', 'textArea'];

    const LIST_EDITOR_TYPES = ['comboMulti', 'list', 'selectMulti'];

    const VALIDATOR_REGEX = /^(\w*)(?:\((.*)\))?$/;

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

    // add an empty folder and return the folder
    this.addFolder = (modelPath, key, tempModel) => {
      const editModel = tempModel || this.getCurrentModel();
      const folder = findOrCreatePath(editModel, modelPath);
      const newFolder = {};
      folder[key] = newFolder;
      if(!tempModel) {
        this.writeModel();
      }
      return newFolder;
    };

    // delete the specified folder or attribute
    this.deleteModelElement = (modelPath, key, tempModel) => {
      const modelFolder = this.getFolder(modelPath, tempModel);
      delete modelFolder[key];
      this.deleteIfEmpty(modelPath, tempModel);
      if(!tempModel) {
        this.writeModel();
      }
    };

    // rename the specified folder
    this.renameInstance = (modelPath, newName, tempModel) => {
      const editModel = tempModel || this.getCurrentModel();
      const parentPath = modelPath.slice(0, -1);
      const oldName = modelPath.slice(-1);
      const instanceContent = this.getFolder(modelPath, editModel);
      this.deleteModelElement(parentPath, oldName, editModel);
      const instanceFolder = this.addFolder(parentPath, newName, editModel);
      Object.assign(instanceFolder, instanceContent);

      this.folderWasRenamed(modelPath, newName);

      if(!tempModel) {
        this.writeModel();
      }
    };

    this.getFolder = (path, tempModel) => {
      const editModel = tempModel || this.getCurrentModel();
      return this.getChildFolder(editModel, path);
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

    // return the model's type folder name (for security providers)
    this.getTypeFolderName = providerPath => {
      const parentFolder = this.getFolder(providerPath);
      const folderNames = Object.keys(parentFolder);
      return folderNames.length ? folderNames[0] : null;
    };

    // check if type name is in the aliases (for security providers)
    this.isKnownTypeName = (modelPath, typeName) => {
      const typeNames = AliasHelper.getFolderNames(modelPath);
      return typeNames.includes(typeName);
    };

    this.deleteIfEmpty = (modelPath, tempModel) => {
      if(!AliasHelper.isNamedPath(modelPath)) {
        const folder = this.getFolder(modelPath, tempModel);
        if (Object.keys(folder).length === 0) {
          const folderKey = modelPath[modelPath.length - 1];
          const parentPath = modelPath.slice(0, -1);
          const parentFolder = this.getFolder(parentPath, tempModel);
          delete parentFolder[folderKey];

          if (parentPath.length > 0) {
            this.deleteIfEmpty(parentPath, tempModel);
          }
        }
      }
    };

    this.findOrCreatePath = (modelPath, tempModel) => {
      const editModel = tempModel || this.getCurrentModel();
      return findOrCreatePath(editModel, modelPath);
    };

    this.moveFolder = (folderName, modelPath, moveUp) => {
      const parentFolder = this.getFolder(modelPath);
      const originalFolders = {...parentFolder};
      const folderNames = Object.keys(parentFolder);
      const index = folderNames.indexOf(folderName);

      const newIndex = moveUp ? (index - 1) : (index + 1);
      folderNames.splice(index, 1);  // remove from old location
      folderNames.splice(newIndex, 0, folderName);

      for (const key in parentFolder) {  // remove all entries from parent folder
        delete parentFolder[key];
      }

      for (const eachName of folderNames) {  // add entries to parent folder in order
        parentFolder[eachName] = originalFolders[eachName];
      }

      this.writeModel();
    };

    this.getModelCopy = () => {
      return structuredClone(this.modelObject());
    };

    this.replaceModel = newModel=> {
      this.modelObject(newModel);
      this.writeModel();
    };

    this.getDomainName = () => {
      const domainName = this.getValue(['topology'], 'Name');
      return domainName || 'base_domain';
    };

    this.folderWasRenamed = (modelPath, newName) => {
      // TODO: check for areas to change this name.
      // for example, a Server entry would need to be renamed wherever targets are used.
      console.log(`Element ${modelPath} was renamed to ${newName}`);
    };

    // *************************************************
    // create attribute configurations for display/edit
    // *************************************************

    /*
      attribute keys:
        name (model name)
        key (i18n)
        path (model path)
        type (WLST type)
        observable (read/written to model)

        added by view models:
        options (for enumerated)
        validators (for controls)
     */

    this.createAttributeMap = (modelPath, subscriptions) => {
      const attributeMap = {};

      this.updateAttributeMap(attributeMap, modelPath, subscriptions);

      return attributeMap;
    };

    this.updateAttributeMap = (attributeMap, modelPath, subscriptions) => {
      const aliasAttributesMap = AliasHelper.getAttributesMap(modelPath);
      for (const [attributeName, valueMap] of Object.entries(aliasAttributesMap)) {
        if(attributeName in attributeMap) {  // attribute may be in merged folder and parent
          continue;
        }

        const attribute = {
          name: attributeName,
          path: modelPath,
          type: valueMap['wlstType'],
          observable: ko.observable()
        };

        const aliasPath = AliasHelper.getAliasPath(modelPath);
        const details = MetaHelper.getAttributeDetails(aliasPath, attributeName);

        // translate labels and set keys for any option lists
        const options = details.options || [];
        this.updateOptionLabels(options);

        Object.assign(attribute, details);

        const observableValue = this.getAttributeObservableValue(attribute);
        attribute.observable(observableValue);

        subscriptions.push(attribute.observable.subscribe(newValue => {
          if(newValue === null) {
            this.deleteModelElement(attribute.path, attribute.name);
          } else {
            const editModel = this.getCurrentModel();
            const folder = findOrCreatePath(editModel, attribute.path);
            folder[attribute.name] = getModelValue(newValue, attribute);
          }
          this.writeModel();
        }));

        attributeMap[attributeName] = attribute;
      }
    };

    // translate options that only have option key
    this.updateOptionLabels = options => {
      options = ko.isObservable(options) ? options() : options;
      for (const option of options) {
        option.label = MessageHelper.getLabel(option);
      }
    };

    this.getRemainingNames = (nameMap, knownNames) => {
      const remainingNames = [];
      Object.keys(nameMap).forEach(key => {
        if(!knownNames.includes(key)) {
          remainingNames.push(key);
        }
      });
      remainingNames.sort((a, b) => {
        return getCompareName(a).localeCompare(getCompareName(b));
      });
      return remainingNames;
    };

    function getCompareName(text) {
      const lastSlash = text.lastIndexOf('/');
      text = lastSlash === -1 ? text : text.substring(lastSlash + 1);
      return text.toLowerCase();
    }

    this.getAttributeObservableValue = attribute => {
      const modelValue = this.getValue(attribute.path, attribute.name);
      return this.getObservableValue(attribute, modelValue);
    };

    this.getObservableValue = (attribute, modelValue) => {
      if(modelValue == null) {
        return modelValue;
      }

      const editorType = getEditorType(attribute);

      // convert model type to observable type
      if(editorType === 'boolean') {
        // YAML 1.2 only allows false, but WDT allows 'false', '0', 0 (0 is false for JS).
        // leave the value alone otherwise, it may be a token.
        const testValue = isString(modelValue) ? modelValue.toLowerCase() : modelValue;
        return (FALSE_VALUES.includes(testValue)) ? false : modelValue;
      }

      if(LIST_EDITOR_TYPES.includes(editorType) && !Array.isArray(modelValue)) {
        const textValue = modelValue.toString();
        const elements = textValue.split(',');
        modelValue = elements.map(item => item.toString().trim());
        // continue for selectMulti check
      }

      if(attribute.optionsMatch) {
        switch(attribute.optionsMatch) {
          case 'lower':
            modelValue = modelValue.toString().toLowerCase();
            break;
          case 'upper':
            modelValue = modelValue.toString().toUpperCase();
            break;
          default:
            WktLogger.error(`Unknown optionsMatch value ${attribute.optionsMatch} for attribute ${attribute.name}`);
        }
      }

      // Jet oj-c-select-multiple uses Set
      // if(editorType === 'selectMulti') {
      //   modelValue = new Set(modelValue);
      // }

      return modelValue;
    };

    // *****************************************
    // create module configurations for display
    // *****************************************

    // create a module configuration for a single attribute
    this.createAttributeEditorConfig = (modelPath, key, attributeMap) => {
      const attribute = attributeMap[key];
      if(!attribute) {
        WktLogger.error(`Attribute ${key} not found, available: ${Object.keys(attributeMap)}`);
        return ModuleElementUtils.createConfig({ name: 'empty-view' });
      }

      return ModuleElementUtils.createConfig({
        name: 'modelEdit/attribute-editor',
        params: {
          attribute,
          modelPath,
          attributeMap  // may be disabled by values of other attributes
        }
      });
    };

    // create a module config for collapsible page section
    this.createCollapsibleSectionConfig = (modelPath, metaSection, attributeMap, folderInfo) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/collapsible-section',
        params: {
          metaSection,
          modelPath,
          attributeMap,
          folderInfo
        }
      });
    };

    this.createInstancesSectionConfig = (modelPath, metaSection) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/instances-section',
        params: {
          modelPath,
          metaSection
        }
      });
    };

    // create sections config for folder-content, collapsible, or tab
    this.createSectionsConfig = (modelPath, metaSections, folderInfo, attributeMap, isTopSections) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/section-set',
        params: {
          modelPath,
          metaSections,
          folderInfo,
          attributeMap,
          isTopSections
        }
      });
    };

    this.createFolderLinkSectionConfig = modelPath => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/folder-link-section',
        params: {
          modelPath
        }
      });
    };

    this.createFolderSectionConfig = (modelPath, metaSection) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/folder-section',
        params: {
          modelPath,
          metaSection
        }
      });
    };

    this.createFolderContentConfig = modelPath => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/folder-content',
        params: {
          modelPath
        }
      });
    };

    this.createAttributeSetConfig = (modelPath, attributes, attributeMap) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/attribute-set',
        params: {
          modelPath,
          attributes,
          attributeMap
        }
      });
    };

    this.createAttributesSectionConfig = (modelPath, metaSection, attributeMap, folderInfo) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/attributes-section',
        params: {
          modelPath,
          metaSection,
          attributeMap,
          folderInfo
        }
      });
    };

    this.createInstancesTableConfig = modelPath => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/instances-table',
        params: {
          modelPath
        }
      });
    };

    this.createTabsConfig = (modelPath, tabs, folderInfo, attributeMap, isTopSections) => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/tabs-section',
        params: {
          modelPath,
          tabs,
          folderInfo,
          attributeMap,
          isTopSections
        }
      });
    };

    this.createEmptyConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'empty-view'
      });
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
    this.getSecretName = value => {
      value = this.getCheckToken(value);
      if(isString(value)) {
        // prepareModel and discover targets may do this
        const domainName = this.getDomainName();
        value = value.replace('@@ENV:DOMAIN_UID@@', utils.toLegalK8sName(domainName));

        const result = value.match(/^@@SECRET:([\w.:-]+)@@$/);
        if(result && (result.length > 1)) {
          return result[1];
        }
      }
      return null;
    };

    // get the variable name for tokens like @@PROP:<token>@@
    this.getVariableName = value => {
      value = this.getCheckToken(value);
      if(isString(value)) {
        const result = value.match(/^@@PROP:([\w.-]+)@@$/);
        if(result && (result.length > 1)) {
          return result[1];
        }
      }
      return null;
    };

    this.getVariableValue = variableName => {
      return this.variableMap()[variableName];
    };

    this.isVariableDefined = variableName => {
      return variableName in this.variableMap();
    };

    this.getVariableToken = variableName => {
      return `@@PROP:${variableName}@@`;
    };

    // the first element of a Set or array may be the token
    this.getCheckToken = value => {
      if(value instanceof Set) {  // Jet oj-c-select-multiple uses Set, change to array
        value = [...value];
      }
      if(Array.isArray(value) && (value.length === 1)) {
        value = value[0];
      }
      return value;
    };

    this.getEditorType = getEditorType;

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

    // refine attribute value for use in the model
    function getModelValue(value, attribute) {
      const editorType = getEditorType(attribute);

      // for type "long", we may need to leave as a string for the model.
      // YAML won't accept BigInt type.
      if ((editorType === 'long') && isString(value)) {
        const longValue = MetaValidators.getLongValue(value);
        if(longValue != null && longValue >= Number.MIN_SAFE_INTEGER && longValue <= Number.MAX_SAFE_INTEGER) {
          return Number(longValue);
        }
      }

      if ((editorType === 'integer') && isString(value)) {
        const integerValue = MetaValidators.getIntegerValue(value);
        if(integerValue != null) {
          return integerValue;
        }
      }

      if ((editorType === 'double') && isString(value)) {
        const doubleValue = MetaValidators.getDoubleValue(value);
        if(doubleValue != null) {
          return doubleValue;
        }
      }

      // Jet oj-c-select-multiple uses Set, change to array
      if (value instanceof Set) {
        return [...value];
      }

      return value;
    }

    function isString(value) {
      return typeof value === 'string' || value instanceof String;
    }

    this.getValidators = attribute => {
      const editorType = this.getEditorType(attribute);
      const validators = [];

      // if validators assigned to attribute, skip any default validation
      if(attribute.validators) {
        attribute.validators.forEach(validator => {
          const result = validator.match(VALIDATOR_REGEX);
          if(!result) {
            WktLogger.error(`Unable to parse validator method ${validator} for attribute ${attribute.name}`);
            return;
          }

          const method = result[1];
          const argsText = result[2];
          const args = argsText ? argsText.split(',') : [];
          validators.push(MetaValidators[method](args, this.getEditorType(attribute)));
        });

      } else if(editorType === 'integer') {
        validators.push(MetaValidators.defaultInteger());

      } else if(editorType === 'long') {
        validators.push(MetaValidators.defaultLong());

      } else if(editorType === 'double') {
        validators.push(MetaValidators.defaultDouble());
      }

      return validators;
    };

    function getEditorType(attribute) {
      let editorType = attribute.type;

      // some alias attributes have wlst_type like ${offline:online},
      // in this case use the first value
      const result = editorType.match(/^\$\{(.*):(.*)}$/);
      if(result && (result.length > 1)) {
        editorType = result[1];
      }

      if('password' === editorType) {
        editorType = 'credential';
      }

      if('java.lang.Boolean' === editorType) {
        editorType = 'boolean';
      }

      if('properties' === editorType) {
        editorType = 'dict';
      }

      if(('jarray' === editorType) || editorType.startsWith('delimited_string')) {
        editorType = 'list';
      }

      if(('options' in attribute) || ('optionsMethod' in attribute)) {
        editorType = 'select';
      }

      const typeOverride = attribute['editorType'];
      if(typeOverride) {
        editorType = typeOverride;
      }

      if(!EDITOR_TYPES.includes(editorType)) {
        WktLogger.error(`Unrecognized type '${editorType}' for attribute ${attribute.name}`);
      }

      return editorType;
    }
  }

  return new ModelEditHelper();
}
);
