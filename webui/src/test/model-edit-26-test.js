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

function loadMetadata() {
  const directory = path.join(__dirname, '../js/utils/modelEdit/metadata');
  const dependencies = {};
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.json'))) {
    dependencies['text!./' + file] = fs.readFileSync(path.join(directory, file), 'utf8');
  }
  return loadModule('utils/modelEdit/metadata/all-metadata.js', dependencies);
}

describe('26.1 model editing', () => {
  const metadata = loadMetadata();
  const metaHelper = loadModule('utils/modelEdit/meta-helper.js', {
    'utils/modelEdit/metadata/all-metadata': metadata
  });
  const messages = { t: key => key };
  const validators = loadModule('utils/modelEdit/meta-validators.js', {
    knockout: ko, 'utils/modelEdit/message-helper': messages
  });
  const project = { wdtModel: { modelContent: ko.observable('{}'), modelContentChanged: ko.observable() } };
  const modelHelper = loadModule('utils/modelEdit/model-edit-helper.js', {
    knockout: ko,
    'js-yaml': yaml,
    'models/wkt-project': project,
    'utils/wkt-logger': { error: message => { throw new Error(message); } },
    'utils/modelEdit/alias-helper': { aliasDataLoaded: () => false },
    'utils/modelEdit/meta-validators': validators,
    'utils/wdt-archive-helper': { getEntryTypes: async() => ({}) }
  });

  it('accepts Trace and Debug in the domain Log file severity selector', () => {
    const details = metaHelper.getAttributeDetails(['Log'], 'LogFileSeverity');
    const options = details.options.map(option => option.value);
    expect(options).to.include('Trace');
    expect(options).to.include('Debug');
    expect(modelHelper.getEditorType({ type: 'string', ...details })).to.equal('select');
    expect(modelHelper.getObservableValue({ type: 'string', ...details }, 'Trace')).to.equal('Trace');
  });

  it('offers every supported certificate subject policy, including the configured-host default', () => {
    const details = metaHelper.getAttributeDetails(['SecurityConfiguration', 'CertificateManagement'], 'SubjectNamePolicy');
    expect(details.options.map(option => option.value)).to.deep.equal([
      'CONFIGURED_ONLY', 'CONFIGURED_PLUS_HOST', 'CONFIGURED_PLUS_ANY'
    ]);
    expect(modelHelper.getEditorType({ type: 'string', ...details })).to.equal('select');
  });

  it('normalizes Node Manager boolean property text for its true/false choices', () => {
    const details = metaHelper.getAttributeDetails(['NMProperties'], 'KeystoreFileWatchingEnabled');
    const attribute = { type: 'string', ...details };
    expect(modelHelper.getObservableValue(attribute, 'TRUE')).to.equal('true');
    expect(modelHelper.getObservableValue(attribute, false)).to.equal('false');
  });

  it('rejects out-of-range HTTP/2 header counts while accepting the documented bounds', () => {
    const details = metaHelper.getAttributeDetails(['WebAppContainer', 'Http2Config'], 'MaxHeaderCount');
    const [validator] = modelHelper.getValidators({ type: 'integer', ...details });
    expect(() => validator.validate('0')).to.throw();
    expect(() => validator.validate('32768')).to.throw();
    expect(() => validator.validate('1')).not.to.throw();
    expect(() => validator.validate('32767')).not.to.throw();
  });

  it('validates Certificate Check Time using the WLS format while allowing the setting to be unset', () => {
    const details = metaHelper.getAttributeDetails(['SecurityConfiguration', 'CertificateManagement'], 'CertificateCheckTime');
    const [validator] = modelHelper.getValidators({ type: 'string', ...details });
    for (const value of [null, undefined, '0:00', '00:00', '9:30', '09:30', '23:59']) {
      expect(() => validator.validate(value), String(value)).not.to.throw();
    }
    for (const value of ['', ' ', '9:5', '09:5', '24:00', '23:60', '-1:00', '9:30 ',
      ' 9:30', '9:30\n', '9:30\r\n', '09:30:00', '9.30', 930]) {
      expect(() => validator.validate(value), String(value)).to.throw('invalid-time-of-day-error');
    }
  });

  it('preserves credential editing and masked summaries for existing encrypted JDBC properties', () => {
    const aliasPath = ['JDBCSystemResource', 'JdbcResource', 'JDBCDriverParams', 'Properties'];
    const sections = metaHelper.getSections(aliasPath);
    const section = sections.find(entry => entry.type === 'custom');
    expect(section.view).to.equal('modelEdit/property-section');
    expect(section.attributes).to.include('EncryptedValueEncrypted');
    expect(modelHelper.getEditorType({ type: 'password' })).to.equal('credential');

    const methods = loadModule('utils/modelEdit/meta-methods.js', {
      'utils/modelEdit/model-edit-helper': {
        getValue: (modelPath, attribute) => attribute === 'EncryptedValueEncrypted' ? 'sample-value' : null,
        getDerivedValue: value => value
      }
    });
    expect(methods.propertyValue('value', [])).to.deep.equal({ value: 'sample-value', isCredential: true });
    const encryptedProperty = metaHelper.getMetadata(['SecurityConfiguration', 'CredentialSet', 'EncryptedProperty']);
    expect(encryptedProperty.summaryAttributes).to.have.property('EncryptedValueEncrypted');
    expect(encryptedProperty.sections[0].attributes).to.include('EncryptedValueEncrypted');
  });
});
