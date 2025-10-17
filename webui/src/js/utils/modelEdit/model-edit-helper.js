/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'js-yaml', 'models/wkt-project', 'utils/common-utilities',
  'utils/wkt-logger', 'utils/modelEdit/alias-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'ojs/ojmodule-element-utils'],
function (ko, jsYaml, project, utils,
  WktLogger, AliasHelper, MetaHelper, MessageHelper, ModuleElementUtils) {

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

    this.createAttributeMap = (modelPath, attributeOverrides, subscriptions, tempModel) => {
      const attributeMap = {};

      const aliasAttributesMap = AliasHelper.getAttributesMap(modelPath);
      for (const [attributeName, valueMap] of Object.entries(aliasAttributesMap)) {
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
        for (const option of options) {
          if(!option.key) {
            option.key = option.value;
            option.label = MessageHelper.t(option.labelKey);
          }
        }

        Object.assign(attribute, details);

        const observableValue = this.getAttributeObservableValue(attribute);
        attribute.observable(observableValue);

        subscriptions.push(attribute.observable.subscribe(newValue => {
          if(newValue === null) {
            this.deleteModelElement(attribute.path, attribute.name, tempModel);
          } else {
            const editModel = tempModel || this.getCurrentModel();
            const folder = findOrCreatePath(editModel, attribute.path);
            folder[attribute.name] = getModelValue(newValue, attribute);
          }
          this.writeModel();
        }));

        attributeMap[attributeName] = attribute;
      }
      return attributeMap;
    };

    this.getRemainingNames = (nameMap, knownNames) => {
      const remainingNames = [];
      Object.keys(nameMap).forEach(key => {
        if(!knownNames.includes(key)) {
          remainingNames.push(key);
        }
      });
      remainingNames.sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
      return remainingNames;
    };

    this.getAttributeObservableValue = attribute => {
      const modelValue = this.getValue(attribute.path, attribute.name);
      return this.getObservableValue(attribute, modelValue);
    };

    this.getObservableValue = (attribute, modelValue) => {
      // convert model type to observable type
      if(attribute.type === 'boolean') {
        // YAML 1.2 only allows false, but WDT allows 'false', '0', 0 (0 is false for JS).
        // leave the value alone otherwise, it may be a token.
        const testValue = isString(modelValue) ? modelValue.toLowerCase() : modelValue;
        return (FALSE_VALUES.includes(testValue)) ? false : modelValue;
      }
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

    // *********************
    // attribute validators
    // *********************

    const INTEGER_REGEX = /^[0-9-]*$/;
    const MIN_PORT = 1;
    const MAX_PORT = 65535;

    this.integerValidator = {
      validate: value => {
        if(value) {
          if (!INTEGER_REGEX.test(value)) {
            throw new Error(MessageHelper.t('invalid-integer-error'));
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
          throw new Error(MessageHelper.t('invalid-range-error', {min, max}));
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

    // refine attribute value for use in the model
    function getModelValue(value, attribute) {
      if ((getDisplayType(attribute) === 'integer') && isString(value)) {
        const result = value.match(/^([0-9]+)$/);
        if(result && (result.length > 1)) {
          return parseInt(result[1], 10);
        }
      }
      return value;
    }

    function isString(value) {
      return typeof value === 'string' || value instanceof String;
    }

    function getDisplayType(attribute) {
      let attributeType = attribute.type;

      // some alias attributes have wlst_type like ${offline:online},
      // in this case use the first value
      const result = attributeType.match(/^\$\{(.*):(.*)}$/);
      if(result && (result.length > 1)) {
        attributeType = result[1];
      }

      if(attributeType === 'password') {
        return 'password';
      }

      if(attributeType === 'boolean') {
        return 'boolean';
      }

      if(['dict', 'properties'].includes(attributeType)) {
        return 'dict';
      }

      if(['list', 'jarray'].includes(attributeType) || attributeType.startsWith('delimited_string')) {
        return 'list';
      }

      if(attribute['options']) {
        return 'choice';
      }

      if(['integer', 'long'].includes(attributeType)) {
        return 'integer';
      }

      if(['string', 'credential'].includes(attributeType)) {
        return 'string';
      }

      WktLogger.error(`Unrecognized type '${attribute.type}' for attribute ${attribute.name}`);
      return 'unknown';
    }
  }

  return new ModelEditHelper();
}
);
