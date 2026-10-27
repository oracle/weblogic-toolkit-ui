/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const ko = require('knockout');
const { pathToFileURL, fileURLToPath } = require('url');
const { expect } = require('chai');
const { after, before, describe, it } = require('mocha');

/* global __dirname */
const foreignServer = require('../js/utils/modelEdit/metadata/JMSSystemResource.json')
  ['JMSSystemResource/JmsResource/ForeignServer'];

function createDialog(value, overrides = {}) {
  const calls = [];
  const attribute = {
    ...foreignServer.attributeDetails.ConnectionURL,
    observable: ko.observable(value), path: [], ...overrides
  };
  const dependencies = {
    knockout: ko,
    'utils/common-utilities': { getShortUuid: () => 'test' },
    'utils/modelEdit/model-edit-helper': {
      getSecretName: () => null, getVariableName: () => null,
      getEditorType: () => 'fileSelect', getVariableMap: () => ({}),
      getArchiveType: () => ({ subtype: 'either' })
    },
    'utils/modelEdit/message-helper': { t: key => key, getAttributeLabel: () => 'Connection URL' },
    'utils/modelEdit/alias-helper': { getAliasPath: () => [] },
    'utils/modelEdit/file-select-helper': { getSegregateName: () => 'Foreign' },
    'utils/wdt-archive-helper': {
      addToArchive: async(type, options) => {
        calls.push({ type, options });
        return 'config/wlsdeploy/jms/foreignServer/Foreign/bindings';
      }
    },
    'utils/view-helper': {},
    'ojs/ojarraydataprovider': class { constructor(data) { this.data = data; } }
  };
  let Dialog;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,
    '../js/viewModels/modelEdit/attribute-editor-dialog.js'), 'utf8'), {
    define(names, factory) { Dialog = factory(...names.map(name => dependencies[name])); },
    window: { api: {
      path: { fromFileURL: fileURLToPath },
      modelEdit: {
        exists: async filename => { calls.push({ exists: filename }); return fs.existsSync(filename); },
        isDirectory: async filename => { calls.push({ isDirectory: filename }); return fs.statSync(filename).isDirectory(); }
      }
    } }
  });
  return { dialog: new Dialog({ attribute, attributeMap: {} }), attribute, calls };
}

describe('Attribute menu archive action', () => {
  let directory;
  let file;

  before(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wktui-archive-dialog-'));
    file = path.join(directory, 'binding file #1.properties');
    fs.writeFileSync(file, 'example=value\n');
  });

  after(() => fs.rmSync(directory, { recursive: true, force: true }));

  it('archives saved file URLs using the decoded native path', async() => {
    const { dialog, attribute, calls } = createDialog(pathToFileURL(file).href);
    expect(dialog.editOptions.map(option => option.value)).to.include('addToArchive');
    await dialog.addToArchive();
    expect(calls[0]).to.deep.equal({ exists: file });
    expect(calls[1]).to.deep.equal({ isDirectory: file });
    expect(calls[2].options).to.deep.equal({
      segregatedName: 'Foreign', emptyDirName: null, fileName: file, fileType: 'file'
    });
    expect(calls[2].type).to.equal('jmsForeignServerBinding');
    expect(attribute.observable()).to.equal('config/wlsdeploy/jms/foreignServer/Foreign/bindings');
    expect(dialog.hasErrorMessages()).to.equal(false);
  });

  it('archives saved directory URLs as directories', async() => {
    const { dialog, calls } = createDialog(pathToFileURL(directory).href + '/');
    await dialog.addToArchive();
    // Node preserves the trailing separator when converting a directory URL.
    expect(calls[2].options.fileName).to.equal(fileURLToPath(pathToFileURL(directory).href + '/'));
    expect(calls[2].options.fileType).to.equal('dir');
    expect(dialog.hasErrorMessages()).to.equal(false);
  });

  it('continues to accept native paths for ordinary attributes', async() => {
    const { dialog, calls } = createDialog(file, { fileUrl: false });
    await dialog.addToArchive();
    expect(calls[2].options.fileName).to.equal(file);
    expect(dialog.hasErrorMessages()).to.equal(false);
  });

  it('preserves missing file URLs and reports the existing error', async() => {
    const value = pathToFileURL(path.join(directory, 'missing file')).href;
    const { dialog, attribute, calls } = createDialog(value);
    await dialog.addToArchive();
    expect(calls).to.have.length(1);
    expect(attribute.observable()).to.equal(value);
    expect(dialog.errorMessageProvider.data()[0].summary).to.equal('attribute-dialog-archive-file-not-present');
  });

  it('reports invalid file URLs without making filesystem calls or changing the value', async() => {
    const value = 'file://[invalid';
    const { dialog, attribute, calls } = createDialog(value);
    await dialog.addToArchive();
    expect(calls).to.have.length(0);
    expect(attribute.observable()).to.equal(value);
    expect(dialog.hasErrorMessages()).to.equal(true);
  });
});
