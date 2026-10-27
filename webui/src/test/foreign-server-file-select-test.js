/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL, fileURLToPath } = require('url');
const vm = require('vm');
const { expect } = require('chai');
const { describe, it } = require('mocha');

/* global __dirname */
const foreignServer = require('../js/utils/modelEdit/metadata/JMSSystemResource.json')
  ['JMSSystemResource/JmsResource/ForeignServer'];

function createHelper({ selectedPath = '/tmp/my bindings', addToArchive = false, fromFileUrl = fileURLToPath } = {}) {
  let helper;
  const calls = [];
  const type = { subtype: 'either', fileLabel: 'Binding file', dirLabel: 'Binding directory' };
  const attribute = {
    name: 'ConnectionURL',
    path: ['resources', 'JMSSystemResource', 'Module', 'JmsResource', 'ForeignServer', 'Foreign'],
    ...foreignServer.attributeDetails.ConnectionURL
  };
  const dependencies = {
    'utils/dialog-helper': { promptDialog: async() => ({ addToArchive, segregateName: 'Foreign' }) },
    'utils/wkt-logger': { error: message => { throw new Error(message); } },
    'utils/modelEdit/model-edit-helper': { getArchiveType: () => type },
    'utils/modelEdit/alias-helper': { getAliasPath: () => ['JMSSystemResource', 'JmsResource', 'ForeignServer'] },
    'utils/wdt-archive-helper': {
      chooseAttributeFile: async(option, current) => {
        calls.push({ option, current });
        return selectedPath;
      },
      addToArchive: async(archiveType, options) => {
        calls.push({ archiveType, options });
        return 'config/wlsdeploy/jms/foreignServer/Foreign/bindings/';
      }
    },
    'utils/modelEdit/message-helper': {
      getAttributeLabel: () => 'Connection URL',
      getLabel: option => option.label || null,
      t: key => key
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/utils/modelEdit/file-select-helper.js'), 'utf8'), {
    define(names, factory) { helper = factory(...names.map(name => dependencies[name])); },
    window: { api: { path: {
      fromFileURL: fromFileUrl,
      toFileURL: value => pathToFileURL(value).href,
      isAbsolute: path.isAbsolute
    } } }
  });
  return { helper, attribute, calls };
}

describe('Foreign server connection URL selection', () => {
  it('offers both file and directory choices using the configured archive type', () => {
    const { helper, attribute } = createHelper();
    expect(attribute.usesPath).to.equal(true);
    expect(helper.canChooseFile(attribute)).to.equal(true);
    expect(helper.canChooseDirectory(attribute)).to.equal(true);
    expect(helper.getSelectOptions(attribute, 'dir')[0].label).to.equal('Binding directory');
  });

  it('returns a properly escaped local directory URL when archiving is declined', async() => {
    const { helper, attribute, calls } = createHelper();
    const result = await helper.chooseDirectory(attribute, 'file:///tmp/old%20bindings/', true);
    expect(result).to.equal('file:///tmp/my%20bindings/');
    expect(calls[0].current).to.equal('/tmp/old bindings/');
  });

  it('returns a file URL for a local file without changing its filename', async() => {
    const { helper, attribute } = createHelper({ selectedPath: '/tmp/my bindings.properties' });
    expect(await helper.chooseFile(attribute, null, true)).to.equal('file:///tmp/my%20bindings.properties');
  });

  it('retains an archived directory reference for WDT and passes the selected type', async() => {
    const { helper, attribute, calls } = createHelper({ addToArchive: true });
    const result = await helper.chooseDirectory(attribute, 'file:config/wlsdeploy/jms/old/', true);
    expect(result).to.equal('config/wlsdeploy/jms/foreignServer/Foreign/bindings/');
    expect(calls[0].current).to.equal(undefined);
    expect(calls[1].options.fileType).to.equal('dir');
    expect(calls[1].options.segregatedName).to.equal('Foreign');
  });

  it('keeps remote provider URLs out of filesystem operations', async() => {
    const { helper, attribute, calls } = createHelper();
    expect(await helper.checkArchiveUpdate('t3://remote:7001', attribute)).to.equal('t3://remote:7001');
    expect(await helper.checkArchiveUpdate('file:config/wlsdeploy/jms/bindings/', attribute))
      .to.equal('file:config/wlsdeploy/jms/bindings/');
    await helper.chooseFile(attribute, 't3://remote:7001', false);
    expect(calls[0].current).to.equal(undefined);
  });

  it('preserves file URLs that cannot be represented as local paths', async() => {
    const { helper, attribute } = createHelper({ fromFileUrl: () => { throw new Error('Not a local path'); } });
    expect(await helper.checkArchiveUpdate('file://remote/bindings/', attribute)).to.equal('file://remote/bindings/');
  });

  it('does not change ordinary path attributes or canceled selections', async() => {
    const { helper, attribute } = createHelper();
    delete attribute.fileUrl;
    expect(await helper.chooseDirectory(attribute, null, false)).to.equal('/tmp/my bindings');
    const canceled = createHelper({ selectedPath: null });
    expect(await canceled.helper.chooseFile(canceled.attribute, null, true)).to.equal(undefined);
  });
});
