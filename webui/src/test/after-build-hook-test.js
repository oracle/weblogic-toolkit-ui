/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const assert = require('assert').strict;
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { afterEach, beforeEach, describe, it } = require('mocha');

/* global __dirname */
const hookPath = path.resolve(__dirname, '..', '..', 'scripts', 'hooks', 'after_build.js');

describe('JET after_build hook', () => {
  let directory;
  let staged;
  let packaged;

  beforeEach(async() => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wktui-build-hook-'));
    staged = path.join(directory, 'webui', 'web');
    packaged = path.join(directory, 'electron', 'app', 'web');
  });

  afterEach(async() => {
    await fs.rm(directory, { force: true, recursive: true });
  });

  async function write(relativePath, contents) {
    const destination = path.join(directory, relativePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, contents);
  }

  async function loadHook(overrides = {}) {
    const exported = { exports: {} };
    vm.runInNewContext(await fs.readFile(hookPath, 'utf8'), {
      __dirname: path.join(directory, 'webui', 'scripts', 'hooks'),
      console: { log() {} },
      module: exported,
      require: name => name === 'fs/promises' ? { ...fs, ...overrides } : require(name)
    }, { filename: hookPath });
    return exported.exports;
  }

  it('publishes a complete release tree without staged tests', async() => {
    await write('webui/web/index.html', 'new application');
    await write('webui/web/js/libs/oj/21.0.3/min/runtime.js', 'new runtime');
    await write('webui/web/test/example-test.js', 'test code');
    const config = { buildType: 'release' };

    assert.equal(await (await loadHook())(config), config);

    assert.equal(await fs.readFile(path.join(packaged, 'index.html'), 'utf8'), 'new application');
    assert.equal(await fs.readFile(path.join(packaged, 'js/libs/oj/21.0.3/min/runtime.js'), 'utf8'), 'new runtime');
    await assert.rejects(fs.stat(path.join(packaged, 'test')), { code: 'ENOENT' });
    await assert.rejects(fs.stat(staged), { code: 'ENOENT' });
  });

  it('removes obsolete files and JET versions on a second release build', async() => {
    await write('webui/web/index.html', 'first application');
    await write('webui/web/js/libs/oj/19.0.0/min/runtime.js', 'old runtime');
    await write('webui/web/removed-module.js', 'old module');
    await write('electron/app/main.js', 'desktop application');
    const hook = await loadHook();
    await hook({ buildType: 'release' });

    await write('webui/web/index.html', 'second application');
    await write('webui/web/js/libs/oj/21.0.3/min/runtime.js', 'new runtime');
    await hook({ buildType: 'release' });

    assert.equal(await fs.readFile(path.join(packaged, 'index.html'), 'utf8'), 'second application');
    assert.deepEqual(await fs.readdir(path.join(packaged, 'js/libs/oj')), ['21.0.3']);
    await assert.rejects(fs.stat(path.join(packaged, 'removed-module.js')), { code: 'ENOENT' });
    assert.equal(await fs.readFile(path.join(directory, 'electron/app/main.js'), 'utf8'), 'desktop application');
    assert.deepEqual(await fs.readdir(path.join(directory, 'webui')), []);
  });

  it('purges staged tests during a debug build and leaves packaged output untouched', async() => {
    await write('webui/web/index.html', 'development application');
    await write('webui/web/test/example-test.js', 'test code');
    await write('electron/app/web/index.html', 'previous release');
    const config = { buildType: 'dev' };

    assert.equal(await (await loadHook())(config), config);

    assert.equal(await fs.readFile(path.join(staged, 'index.html'), 'utf8'), 'development application');
    assert.equal(await fs.readFile(path.join(packaged, 'index.html'), 'utf8'), 'previous release');
    await assert.rejects(fs.stat(path.join(staged, 'test')), { code: 'ENOENT' });
  });

  it('rejects missing release output instead of silently packaging an older build', async() => {
    await write('electron/app/web/index.html', 'previous release');

    await assert.rejects((await loadHook())({ buildType: 'release' }), { code: 'ENOENT' });

    assert.equal(await fs.readFile(path.join(packaged, 'index.html'), 'utf8'), 'previous release');
  });

  it('rejects publication failures and restores the previous release', async() => {
    await write('webui/web/index.html', 'new application');
    await write('electron/app/web/index.html', 'previous release');
    const failure = new Error('Cannot publish the staged tree');
    const hook = await loadHook({
      rename: async(source, target) => {
        if (source === staged) {
          throw failure;
        }
        return fs.rename(source, target);
      }
    });

    await assert.rejects(hook({ buildType: 'release' }), error => error === failure);

    assert.equal(await fs.readFile(path.join(packaged, 'index.html'), 'utf8'), 'previous release');
    assert.equal(await fs.readFile(path.join(staged, 'index.html'), 'utf8'), 'new application');
    assert.deepEqual(await fs.readdir(path.join(directory, 'webui')), ['web']);
  });

  it('retains the previous release backup when restoration also fails', async() => {
    await write('webui/web/index.html', 'new application');
    await write('electron/app/web/index.html', 'previous release');
    const failure = new Error('Cannot publish the staged tree');
    const restoreFailure = new Error('Cannot restore the previous tree');
    let previousOutput;
    const hook = await loadHook({
      rename: async(source, target) => {
        if (source === staged) {
          throw failure;
        }
        if (target === packaged) {
          throw restoreFailure;
        }
        previousOutput = target;
        return fs.rename(source, target);
      }
    });

    await assert.rejects(hook({ buildType: 'release' }), error => {
      assert.deepEqual(Array.from(error.errors), [failure, restoreFailure]);
      assert.ok(error.message.includes(previousOutput));
      return true;
    });

    assert.equal(await fs.readFile(path.join(previousOutput, 'index.html'), 'utf8'), 'previous release');
    assert.equal(await fs.readFile(path.join(staged, 'index.html'), 'utf8'), 'new application');
  });
});
