/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ko = require('knockout');
const yaml = require('js-yaml');
const { expect } = require('chai');
const { describe, it } = require('mocha');

/* global __dirname */
function loadModule(relativePath, dependencies, globals = {}) {
  let result;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js', relativePath), 'utf8'), {
    structuredClone,
    ...globals,
    define(names, factory) { result = factory(...names.map(name => dependencies[name])); }
  });
  return result;
}

function loadMetadata() {
  const directory = path.join(__dirname, '../js/utils/modelEdit/metadata');
  const dependencies = {};
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.json'))) {
    dependencies['text!./' + file] = fs.readFileSync(path.join(directory, file), 'utf8');
  }
  return loadModule('utils/modelEdit/metadata/all-metadata.js', dependencies);
}

// The model editor's extracted alias format, independent of any installed WDT.
function aliasNode(isMultiple, folders, types = {}) {
  return {
    isMultiple, folders: Object.freeze(folders),
    attributes: Object.fromEntries(Object.entries(types).map(([name, wlstType]) => [name, { wlstType }]))
  };
}

describe('NoSQL system resource editing', () => {
  const resourcePath = ['resources', 'NoSqlSystemResource', 'store'];
  const propertyPath = [...resourcePath, 'NoSqlResource', 'Properties', 'Property', 'credential'];
  const propertyAliasPath = ['NoSqlSystemResource', 'NoSqlResource', 'Properties', 'Property'];
  const aliases = { paths: {
    NoSqlSystemResource: aliasNode(true, ['NoSqlResource', 'SubDeployment'], {
      DeploymentOrder: 'integer', Notes: 'string', Target: 'delimited_string', SourcePath: 'string'
    }),
    'NoSqlSystemResource/NoSqlResource': aliasNode(false, ['Properties'], {
      ProviderName: 'string', DatabaseType: 'string', DefaultResource: 'boolean', JNDIName: 'string'
    }),
    'NoSqlSystemResource/NoSqlResource/Properties': aliasNode(false, ['Property']),
    'NoSqlSystemResource/NoSqlResource/Properties/Property': aliasNode(true, [], {
      Value: 'string', EncryptedValueEncrypted: 'password'
    }),
    'NoSqlSystemResource/SubDeployment': aliasNode(true, [])
  } };
  const logger = { warn() {}, error: message => { throw new Error(message); } };
  const aliasHelper = loadModule('utils/modelEdit/alias-helper.js', {
    knockout: ko, 'utils/wkt-logger': logger
  }, { window: { api: { ipc: { invoke: async() => aliases } } } });
  aliasHelper.aliasData(aliases);
  const metaHelper = loadModule('utils/modelEdit/meta-helper.js', {
    'utils/modelEdit/metadata/all-metadata': loadMetadata()
  });
  const messages = {
    getLabel: section => section.label || section.labelKey,
    getFolderLabel: parts => parts[parts.length - 1],
    getAttributeLabelFromName: name => name,
    getAttributeLabel: attribute => attribute.name,
    getAttributeHelp: attribute => attribute.name,
    t: key => key
  };
  const project = { wdtModel: { modelContent: ko.observable('{}'), modelContentChanged: ko.observable() } };
  const modelHelper = loadModule('utils/modelEdit/model-edit-helper.js', {
    knockout: ko, 'js-yaml': yaml, 'models/wkt-project': project,
    'utils/wkt-logger': logger, 'utils/modelEdit/alias-helper': aliasHelper,
    'utils/modelEdit/meta-helper': metaHelper, 'utils/modelEdit/message-helper': messages,
    'utils/wdt-archive-helper': { getEntryTypes: async() => ({}) }
  });

  it('navigates directly to provider properties without adding duplicate wrapper folders', () => {
    const resources = JSON.parse(fs.readFileSync(path.join(__dirname,
      '../js/utils/modelEdit/navigation/resources.json'), 'utf8'));
    resources.children = resources.children.filter(child => child.path === 'NoSqlSystemResource');
    expect(resources.children).to.have.length(1);
    const navigation = [resources];
    const warnings = [];
    const helper = loadModule('utils/modelEdit/navigation-helper.js', {
      knockout: ko,
      'utils/wkt-logger': { ...logger, warn: message => warnings.push(message) },
      'utils/modelEdit/navigation/all-navigation': navigation,
      'utils/modelEdit/model-edit-helper': { ...modelHelper, dataLoaded: ko.observable(false) },
      'utils/modelEdit/alias-helper': aliasHelper,
      'utils/modelEdit/meta-helper': metaHelper,
      'utils/modelEdit/message-helper': messages,
      'ojs/ojarraytreedataprovider': function() {}
    });
    modelHelper.addFolder(['resources', 'NoSqlSystemResource'], 'store');
    helper.updateNavigationData(navigation, [], true);
    helper.updateNavigationData(navigation, [], true);
    expect(warnings).to.deep.equal([]);
    helper.initializeNavList(navigation, []);
    helper.updateNavList(navigation);
    const resourceEntry = resources.children[0];
    const instance = resourceEntry.children()[0];
    expect(instance.children).to.have.length(1);
    expect(instance.children[0].modelPath).to.deep.equal(propertyPath.slice(0, -1));
    expect(aliasHelper.getAliasPath(instance.children[0].modelPath)).to.deep.equal(propertyAliasPath);
    expect(aliases.paths.NoSqlSystemResource.folders).to.deep.equal(['NoSqlResource', 'SubDeployment']);
  });

  it('removes the navigation entry when aliases do not include NoSQL', () => {
    const navigation = [{ path: 'resources', children: [{ path: 'NoSqlSystemResource' }] }];
    const helper = loadModule('utils/modelEdit/navigation-helper.js', {
      knockout: ko, 'utils/wkt-logger': { warn() {} },
      'utils/modelEdit/navigation/all-navigation': navigation,
      'utils/modelEdit/model-edit-helper': { dataLoaded: ko.observable(false) },
      'utils/modelEdit/alias-helper': { getAliasNode: () => null },
      'ojs/ojarraytreedataprovider': function() {}
    });
    helper.updateNavigationData(navigation, [], true);
    expect(navigation[0].children).to.have.length(0);
  });

  it('merges the descriptor controls onto the main page while writing the correct model paths', () => {
    let config;
    const Folder = loadModule('viewModels/modelEdit/folder-content.js', {
      'utils/modelEdit/model-edit-helper': modelHelper,
      'utils/modelEdit/meta-helper': metaHelper,
      'utils/modelEdit/alias-helper': aliasHelper,
      'utils/modelEdit/module-helper': {
        createSectionsConfig: (modelPath, sections, info, attributes) => {
          config = { modelPath, sections, info, attributes };
        }
      }
    });
    const folder = new Folder({ modelPath: resourcePath });
    expect(config.sections[0].attributes).to.include.members([
      'ProviderName', 'DatabaseType', 'DefaultResource', 'JNDIName', 'Target'
    ]);
    config.attributes.ProviderName.observable('oracle-nosql');
    config.attributes.DatabaseType.observable('DOCUMENT');
    config.attributes.DefaultResource.observable(true);
    config.attributes.Target.observable(['cluster']);
    expect(modelHelper.getValue([...resourcePath, 'NoSqlResource'], 'ProviderName')).to.equal('oracle-nosql');
    expect(modelHelper.getValue([...resourcePath, 'NoSqlResource'], 'DatabaseType')).to.equal('DOCUMENT');
    expect(modelHelper.getValue([...resourcePath, 'NoSqlResource'], 'DefaultResource')).to.equal(true);
    expect(modelHelper.getValue(resourcePath, 'Target')).to.deep.equal(['cluster']);
    expect(config.info.remainingAttributes).not.to.include('SourcePath');
    folder.disconnected();
  });

  it('offers the documented database types and provider', () => {
    const aliasPath = ['NoSqlSystemResource', 'NoSqlResource'];
    expect(metaHelper.getAttributeOptions(aliasPath, 'DatabaseType').map(option => option.value))
      .to.deep.equal(['DOCUMENT', 'KEY_VALUE', 'COLUMN', 'GRAPH']);
    expect(metaHelper.getAttributeOptions(aliasPath, 'ProviderName').map(option => option.value))
      .to.deep.equal(['oracle-nosql']);
  });

  it('reuses the property value selector and masks encrypted values in summaries', () => {
    const subscriptions = [];
    modelHelper.addFolder(propertyPath.slice(0, -1), 'credential', { EncryptedValueEncrypted: 'sensitive-value' });
    const attributeMap = modelHelper.createAttributeMap(propertyPath, subscriptions);
    const methods = loadModule('utils/modelEdit/meta-methods.js', {
      'utils/modelEdit/model-edit-helper': modelHelper,
      'utils/modelEdit/alias-helper': aliasHelper,
      'utils/modelEdit/message-helper': messages
    });
    const metadata = metaHelper.getMetadata(propertyAliasPath);
    expect(methods[metadata.summaryAttributes.value.valueHandler]('value', propertyPath))
      .to.deep.equal({ value: 'sensitive-value', isCredential: true });
    expect(modelHelper.getEditorType(attributeMap.EncryptedValueEncrypted)).to.equal('credential');
    const section = metadata.sections[0];
    expect(section.view).to.equal('modelEdit/property-section');
    const Section = loadModule('viewModels/modelEdit/property-section.js', {
      knockout: ko,
      'utils/modelEdit/model-edit-helper': modelHelper,
      'utils/modelEdit/alias-helper': aliasHelper,
      'utils/modelEdit/message-helper': messages,
      'utils/modelEdit/module-helper': { createAttributeEditorConfig() {} }
    });
    const editor = new Section({ metaSection: section, attributeMap, modelPath: propertyPath });
    editor.connected();
    expect(editor.selectedOption()).to.equal('EncryptedValueEncrypted');
    expect(editor.selectOptions.map(option => option.value)).to.deep.equal(['Value', 'EncryptedValueEncrypted']);
    editor.selectedOption('Value');
    attributeMap.Value.observable('plain-value');
    expect(modelHelper.getValue(propertyPath, 'EncryptedValueEncrypted')).to.equal(undefined);
    expect(methods[metadata.summaryAttributes.value.valueHandler]('value', propertyPath))
      .to.deep.equal({ value: 'plain-value', isCredential: false });
    editor.selectedOption('EncryptedValueEncrypted');
    expect(modelHelper.getValue(propertyPath, 'Value')).to.equal(undefined);
    editor.disconnected();
    subscriptions.forEach(subscription => subscription.dispose());
  });
});
