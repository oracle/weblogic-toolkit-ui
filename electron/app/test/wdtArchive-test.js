/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const { expect } = require('chai');
const { after, before, describe, it } = require('mocha');
const fs = require('fs');
const os = require('os');
const path = require('path');
const proxyquire = require('proxyquire');

describe('Foreign server archive bindings', () => {
  let directory;
  let file;
  const errors = [];
  const archive = proxyquire('../js/wdtArchive', {
    './i18next.config': { t: key => key, '@noCallThru': true },
    './wktLogging': { getLogger: () => ({ debug() {} }), '@noCallThru': true },
    './wktWindow': { showErrorMessage: async(...args) => errors.push(args), '@noCallThru': true }
  });

  before(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wktui-foreign-bindings-'));
    file = path.join(directory, 'bindings.properties');
    fs.writeFileSync(file, 'connectionFactory=example\n');
    fs.mkdirSync(path.join(directory, 'nested'));
    fs.writeFileSync(path.join(directory, 'nested', '.bindings'), 'example');
  });

  after(() => fs.rmSync(directory, { recursive: true, force: true }));

  it('offers both file and directory binding types', () => {
    const type = archive.getEntryTypes().jmsForeignServerBinding;
    expect(type.subtype).to.equal('either');
    expect(type.dirLabel).to.equal('wdt-archiveType-jmsForeignServerBinding-dirLabel');
  });

  it('preserves the existing file archive layout', async() => {
    const result = await archive.addArchiveEntry(null, 'jmsForeignServerBinding', {
      fileType: 'file', fileName: file, segregatedName: 'ForeignServer'
    });
    expect(result.archiveUpdatePath).to.equal('config/wlsdeploy/jms/foreignServer/ForeignServer/bindings.properties');
    expect(result.filePath).to.equal(file);
    expect(result.childPaths).to.equal(undefined);
  });

  it('accepts a directory and inventories its nested binding files', async() => {
    const result = await archive.addArchiveEntry(null, 'jmsForeignServerBinding', {
      fileType: 'dir', fileName: directory, segregatedName: 'ForeignServer'
    });
    expect(result.archiveUpdatePath).to.equal(
      'config/wlsdeploy/jms/foreignServer/ForeignServer/' + path.basename(directory) + '/');
    expect(result.childPaths).to.have.members(['bindings.properties', 'nested/', 'nested/.bindings']);
  });

  it('rejects the wrong filesystem type and still requires a foreign server name', async() => {
    for (const data of [
      { fileType: 'file', fileName: directory, segregatedName: 'ForeignServer' },
      { fileType: 'dir', fileName: file, segregatedName: 'ForeignServer' },
      { fileType: 'dir', fileName: directory }
    ]) {
      expect(await archive.addArchiveEntry(null, 'jmsForeignServerBinding', data)).to.deep.equal({});
    }
    expect(errors).to.have.length(3);
  });
});
