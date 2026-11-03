/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const { gzipSync } = require('node:zlib');
const { setImmediate } = require('node:timers/promises');
const { beforeEach, afterEach, describe, it } = require('mocha');
const proxyquire = require('proxyquire');
const tar = require('tar');

describe('WKT Tools installation', () => {
  const release = {
    name: 'WebLogic Image Tool 1.2.3',
    assets: [{ name: 'imagetool.tar.gz', browser_download_url: 'https://example.invalid/imagetool.tar.gz' }]
  };
  let tempDirectory;
  let toolsDirectory;
  let oldToolFile;

  beforeEach(async () => {
    tempDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'wktui-tools-'));
    toolsDirectory = path.join(tempDirectory, 'tools');
    oldToolFile = path.join(toolsDirectory, 'imagetool', 'previous-version.txt');
    await fsPromises.mkdir(path.dirname(oldToolFile), { recursive: true });
    await fsPromises.writeFile(oldToolFile, 'previous installation');
  });

  afterEach(async () => {
    await fsPromises.rm(tempDirectory, { recursive: true, force: true });
  });

  function installerWith(fetchGitHub, stubs = {}) {
    return proxyquire('../js/wktToolsInstaller', {
      './githubUtils': {
        getLatestReleaseObject: async () => release,
        fetchGitHub,
        '@noCallThru': true
      },
      ...stubs
    });
  }

  function successfulResponse(data) {
    return { ok: true, body: Readable.from([data]) };
  }

  async function expectFailure(promise, message) {
    await assert.rejects(promise, error => {
      assert.ok(String(error).includes(message), String(error));
      return true;
    });
  }

  async function assertPreviousToolPreserved() {
    assert.equal(await fsPromises.readFile(oldToolFile, 'utf8'), 'previous installation');
  }

  async function createArchive() {
    const sourceDirectory = path.join(tempDirectory, 'source');
    await fsPromises.mkdir(path.join(sourceDirectory, 'imagetool', 'lib'), { recursive: true });
    await fsPromises.writeFile(path.join(sourceDirectory, 'imagetool', 'lib', 'imagetool.jar'), 'fixture library');
    const archive = path.join(tempDirectory, 'fixture.tar.gz');
    await tar.c({ cwd: sourceDirectory, file: archive, gzip: true }, ['imagetool']);
    return fsPromises.readFile(archive);
  }

  it('installs a complete tar archive before resolving and removes the downloaded archive', async () => {
    const archive = await createArchive();
    const installer = installerWith(async () => successfulResponse(archive));

    await installer.installWitRelease(toolsDirectory, {});

    assert.equal(await fsPromises.readFile(path.join(toolsDirectory, 'imagetool', 'lib', 'imagetool.jar'), 'utf8'),
      'fixture library');
    assert.equal(fs.existsSync(oldToolFile), false);
    assert.equal(fs.existsSync(path.join(toolsDirectory, 'imagetool.tar.gz')), false);
  });

  it('rejects archive HTTP failures without replacing the installed tool', async () => {
    const installer = installerWith(async () => { throw new Error('HTTP 503 Service Unavailable'); });

    await expectFailure(installer.installWitRelease(toolsDirectory, {}), 'HTTP 503 Service Unavailable');

    await assertPreviousToolPreserved();
    assert.equal(fs.existsSync(path.join(toolsDirectory, 'imagetool.tar.gz')), false);
  });

  it('propagates network failures through the runtime tool-update flow', async () => {
    const installer = installerWith(async () => { throw new Error('connection refused'); });

    await expectFailure(installer.updateTools(['WebLogic Image Tool 1.2.3'], toolsDirectory, {}),
      'connection refused');

    await assertPreviousToolPreserved();
  });

  it('rejects interrupted response streams without replacing the installed tool', async () => {
    const installer = installerWith(async () => ({
      ok: true,
      body: new Readable({ read() { this.destroy(new Error('download interrupted')); } })
    }));

    await expectFailure(installer.installWitRelease(toolsDirectory, {}), 'download interrupted');

    await assertPreviousToolPreserved();
  });

  it('rejects archive write errors without replacing the installed tool', async () => {
    const installer = installerWith(async () => successfulResponse(Buffer.from('archive')), {
      fs: { createWriteStream: () => new Writable({
        write(chunk, encoding, callback) { callback(new Error('disk full')); }
      }) }
    });

    await expectFailure(installer.installWitRelease(toolsDirectory, {}), 'disk full');

    await assertPreviousToolPreserved();
  });

  it('rejects invalid tar data instead of reporting installation success', async () => {
    const installer = installerWith(async () => successfulResponse(gzipSync('not a tar archive')));

    await expectFailure(installer.installWitRelease(toolsDirectory, {}), 'Failed to extract');
  });

  it('rejects archive read errors during extraction', async () => {
    const installer = installerWith(async () => successfulResponse(Buffer.from('archive')), {
      fs: { createReadStream: () => new Readable({
        read() { this.destroy(new Error('archive read failed')); }
      }) }
    });

    await expectFailure(installer.installWitRelease(toolsDirectory, {}), 'archive read failed');
  });

  it('rejects extraction write errors', async () => {
    const installer = installerWith(async () => successfulResponse(gzipSync('archive')), {
      tar: { x: () => new Writable({
        write(chunk, encoding, callback) { callback(new Error('extraction write failed')); }
      }) }
    });

    await expectFailure(installer.installWitRelease(toolsDirectory, {}), 'extraction write failed');
  });

  it('waits for the extractor to finish after the archive input has closed', async () => {
    let finishExtraction;
    let inputClosed;
    let installationFinished = false;
    let archiveRemoved = false;
    const closed = new Promise(resolve => { inputClosed = resolve; });
    const installer = installerWith(async () => successfulResponse(gzipSync('archive')), {
      fs: { createReadStream: file => {
        const stream = fs.createReadStream(file);
        stream.once('close', inputClosed);
        return stream;
      } },
      'fs/promises': { rm: async () => { archiveRemoved = true; } },
      tar: { x: () => new Writable({
        write(chunk, encoding, callback) { callback(); },
        final(callback) { finishExtraction = callback; }
      }) }
    });
    const installation = installer.installWitRelease(toolsDirectory, {}).then(() => { installationFinished = true; });

    await closed;
    await setImmediate();
    try {
      assert.equal(installationFinished, false);
      assert.equal(archiveRemoved, false);
    } finally {
      finishExtraction();
      await installation;
    }

    assert.equal(archiveRemoved, true);
  });
});
