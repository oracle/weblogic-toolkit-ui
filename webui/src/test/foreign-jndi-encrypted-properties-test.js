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
function loadModule(relativePath, dependencies) {
  let result;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js', relativePath), 'utf8'), {
    define(names, factory) { result = factory(...names.map(name => dependencies[name])); }
  });
  return result;
}

describe('Foreign JNDI encrypted properties', () => {
  const providerMetadata = JSON.parse(fs.readFileSync(path.join(__dirname,
    '../js/utils/modelEdit/metadata/ForeignJNDIProvider.json'), 'utf8'));
  const jmsMetadata = JSON.parse(fs.readFileSync(path.join(__dirname,
    '../js/utils/modelEdit/metadata/JMSSystemResource.json'), 'utf8'));
  const jmsPath = ['resources', 'JMSSystemResource', 'module', 'JmsResource', 'ForeignServer', 'foreign', 'JNDIProperty'];
  const jmsDetails = jmsMetadata['JMSSystemResource/JmsResource/ForeignServer/JNDIProperty'];
  const project = { wdtModel: { modelContent: ko.observable('{}'), modelContentChanged: ko.observable() } };
  const modelHelper = loadModule('utils/modelEdit/model-edit-helper.js', {
    knockout: ko,
    'js-yaml': yaml,
    'models/wkt-project': project,
    'utils/common-utilities': { toLegalK8sName: value => value },
    'utils/wkt-logger': { error: message => { throw new Error(message); } },
    'utils/modelEdit/alias-helper': { aliasDataLoaded: () => false },
    'utils/wdt-archive-helper': { getEntryTypes: async() => ({}) }
  });

  const messages = new Proxy({}, { get: (target, key) => () => key });
  class DataProvider {
    constructor(data) { this.data = data; }
  }
  const dependencies = {
    knockout: ko,
    'utils/modelEdit/model-edit-helper': modelHelper,
    'utils/modelEdit/message-helper': messages,
    'utils/modelEdit/alias-helper': { getAliasPath: () => ['ForeignJNDIProvider'] },
    'utils/modelEdit/meta-options': { getOptions: () => [] },
    'utils/modelEdit/meta-handlers': { getDisabledHandler: () => ko.observable(false) },
    'utils/modelEdit/file-select-helper': { canChooseDirectory: () => false, canChooseFile: () => false },
    'utils/common-utilities': { getShortUuid: () => 'test-id' },
    'utils/view-helper': {},
    'ojs/ojarraydataprovider': DataProvider,
    'ojs/ojbufferingdataprovider': DataProvider,
    'utils/modelEdit/module-helper': { createCredentialCellConfig: value => ({ value }) }
  };

  function providerAttribute(overrides = {}) {
    return {
      name: 'Properties',
      type: 'properties',
      path: ['topology', 'ForeignJNDIProvider', 'provider'],
      observable: ko.observable({}),
      ...providerMetadata.ForeignJNDIProvider.attributeDetails.Properties,
      ...overrides
    };
  }

  it('uses a password editor for the JMS Key suffix regardless of the instance name', () => {
    for (const name of ['password.encrypted', '.encrypted']) {
      modelHelper.addFolder(jmsPath, 'ordinary-instance', { Key: name });
      expect(modelHelper.getEditorType({
        type: 'string', path: [...jmsPath, 'ordinary-instance'], ...jmsDetails.attributeDetails.Value
      })).to.equal('credential');
    }
    for (const name of ['password', 'password.Encrypted', 'password.encrypted.extra', 'password_encrypted']) {
      modelHelper.addFolder(jmsPath, 'password.encrypted', { Key: name });
      expect(modelHelper.getEditorType({
        type: 'string', path: [...jmsPath, 'password.encrypted'], ...jmsDetails.attributeDetails.Value
      })).to.equal('string');
    }
    // A suffix on an unrelated bean or attribute does not change its editor.
    expect(modelHelper.getEditorType({ type: 'string', path: [...jmsPath, 'password.encrypted'] })).to.equal('string');
    expect(modelHelper.getEditorType({ type: 'password' })).to.equal('credential');
  });

  it('masks JMS summary values by Key and preserves credential tokens', () => {
    const methods = loadModule('utils/modelEdit/meta-methods.js', {
      'utils/modelEdit/model-edit-helper': modelHelper
    });
    const handler = jmsDetails.summaryAttributes.Value.valueHandler;
    for (const name of ['password.encrypted', 'ordinary']) {
      const modelPath = [...jmsPath, name];
      const key = name === 'ordinary' ? 'password.encrypted' : 'ordinary';
      modelHelper.addFolder(jmsPath, name, { Key: key, Value: '@@SECRET:domain:password@@' });
      const result = methods[handler]('Value', modelPath);
      expect(result.isCredential).to.equal(key.endsWith('.encrypted'));
      expect(modelHelper.getValue(modelPath, 'Value')).to.equal('@@SECRET:domain:password@@');
      expect(result.value).to.equal(modelHelper.getDerivedValue('@@SECRET:domain:password@@'));
    }
  });

  it('switches the JMS Value editor immediately when Key changes without losing the value', () => {
    const Editor = loadModule('viewModels/modelEdit/attribute-editor.js', dependencies);
    const key = { observable: ko.observable('ordinary') };
    const attribute = {
      name: 'Value', type: 'string', path: [...jmsPath, 'arbitrary-instance'],
      observable: ko.observable('unchanged-value'), ...jmsDetails.attributeDetails.Value
    };
    const editor = new Editor({ attribute, attributeMap: { Key: key, Value: attribute } });
    editor.connected();
    expect(editor.editorType()).to.equal('string');
    expect(editor.isTextEditorType()).to.equal(true);
    key.observable('password.encrypted');
    expect(editor.editorType()).to.equal('credential');
    expect(editor.isTextEditorType()).to.equal(false);
    key.observable('password.Encrypted');
    expect(editor.editorType()).to.equal('string');
    expect(attribute.observable()).to.equal('unchanged-value');
    editor.disconnected();
  });

  it('uses the WDT instance-name default only while Key is unset', () => {
    const methods = loadModule('utils/modelEdit/meta-methods.js', {
      'utils/modelEdit/model-edit-helper': modelHelper
    });
    const Editor = loadModule('viewModels/modelEdit/attribute-editor.js', dependencies);
    for (const name of ['password.encrypted', 'ordinary']) {
      const modelPath = [...jmsPath, name];
      modelHelper.addFolder(jmsPath, name, { Value: 'unchanged-value' });
      const key = { observable: ko.observable() };
      const attribute = {
        name: 'Value', type: 'string', path: modelPath,
        observable: ko.observable('unchanged-value'), ...jmsDetails.attributeDetails.Value
      };
      const editor = new Editor({ attribute, attributeMap: { Key: key, Value: attribute } });
      const isEncrypted = name.endsWith('.encrypted');
      expect(editor.editorType()).to.equal(isEncrypted ? 'credential' : 'string');
      expect(methods.foreignJndiPropertyValue('Value', modelPath).isCredential).to.equal(isEncrypted);
      key.observable(isEncrypted ? 'ordinary' : 'password.encrypted');
      expect(editor.editorType()).to.equal(isEncrypted ? 'string' : 'credential');
      key.observable(null);
      expect(editor.editorType()).to.equal(isEncrypted ? 'credential' : 'string');
      expect(attribute.observable()).to.equal('unchanged-value');
      editor.disconnected();
    }
  });

  it('switches a new provider property between text and password editors as its name changes', () => {
    const Dialog = loadModule('viewModels/modelEdit/new-dict-entry-dialog.js', dependencies);
    const dialog = new Dialog({ attribute: providerAttribute(), attributeMap: {} });
    dialog.entryValue('unchanged-value');
    const field = dialog.fields[1];
    expect(field.editorType()).to.equal('string');
    dialog.entryKey('password.encrypted');
    expect(field.editorType()).to.equal('credential');
    dialog.entryKey('password.Encrypted');
    expect(field.editorType()).to.equal('string');
    expect(dialog.entryValue()).to.equal('unchanged-value');
    dialog.disconnected();
  });

  it('leaves ordinary dictionary editors unchanged even when a key ends in .encrypted', () => {
    const Dialog = loadModule('viewModels/modelEdit/new-dict-entry-dialog.js', dependencies);
    const dialog = new Dialog({ attribute: providerAttribute({ encryptedPropertyValues: false }), attributeMap: {} });
    dialog.entryKey('password.encrypted');
    expect(dialog.fields[1].editorType()).to.equal('string');
    dialog.disconnected();
  });

  it('masks provider dictionary rows without changing their stored values', () => {
    const Editor = loadModule('viewModels/modelEdit/dict-attribute-editor.js', dependencies);
    const values = {
      'password.encrypted': '@@SECRET:domain:password@@',
      'ordinary': 'visible-value',
      'password.Encrypted': 'also-visible'
    };
    const attribute = providerAttribute({ observable: ko.observable(values) });
    const editor = new Editor({ attribute, attributeMap: {} });
    editor.connected();
    for (const row of editor.observableEntries()) {
      expect(Boolean(editor.isCredential(row))).to.equal(row.key === 'password.encrypted');
      expect(row.value).to.equal(values[row.key]);
    }
    expect(editor.credentialCellConfig(values['password.encrypted']).value).to.equal(values['password.encrypted']);
    editor.updateObservable();
    expect(attribute.observable()).to.deep.equal(values);
    editor.disconnected();
  });

  it('does not mask suffix-named entries in unrelated dictionaries', () => {
    const Editor = loadModule('viewModels/modelEdit/dict-attribute-editor.js', dependencies);
    const editor = new Editor({ attribute: providerAttribute({ encryptedPropertyValues: false }), attributeMap: {} });
    expect(Boolean(editor.isCredential({ key: 'password.encrypted' }))).to.equal(false);
  });
});
