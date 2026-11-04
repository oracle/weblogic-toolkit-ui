/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { describe, it } = require('mocha');

/* global __dirname */
const bootstrap = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');

function loadBootstrap(protocol, scheduler = {}) {
  const window = {
    location: { protocol },
    api: { i18n: { language: 'en' } },
    setTimeout,
    clearTimeout,
    ...scheduler
  };
  let schedulerAtRootLoad;
  vm.runInNewContext(bootstrap, {
    window,
    requirejs: { config() {} },
    require() { schedulerAtRootLoad = window.setImmediate; }
  });
  return { window, schedulerAtRootLoad };
}

describe('JET bootstrap scheduling', () => {
  it('schedules file:// callbacks asynchronously with arguments before loading JET', async() => {
    const { window, schedulerAtRootLoad } = loadBootstrap('file:');
    assert.equal(schedulerAtRootLoad, window.setImmediate);
    let synchronous = true;
    const completed = new Promise(resolve => {
      window.setImmediate((first, second) => resolve({ first, second, synchronous }), 'one', 2);
    });
    synchronous = false;

    assert.deepEqual(await completed, { first: 'one', second: 2, synchronous: false });
  });

  it('cancels a pending file:// callback without cancelling another callback', async() => {
    const { window } = loadBootstrap('file:');
    let cancelledCallbackRan = false;
    const handle = window.setImmediate(() => { cancelledCallbackRan = true; });
    window.clearImmediate(handle);

    await new Promise(resolve => window.setImmediate(resolve));

    assert.equal(cancelledCallbackRan, false);
  });

  it('preserves an existing scheduler under file://', () => {
    const setImmediate = () => {};
    const clearImmediate = () => {};
    const { window } = loadBootstrap('file:', { setImmediate, clearImmediate });

    assert.equal(window.setImmediate, setImmediate);
    assert.equal(window.clearImmediate, clearImmediate);
  });

  it('leaves HTTP and HTTPS scheduling to JET', () => {
    for (const protocol of ['http:', 'https:']) {
      const { window } = loadBootstrap(protocol);
      assert.equal(window.setImmediate, undefined);
      assert.equal(window.clearImmediate, undefined);
    }
  });

  it('rejects string callbacks instead of evaluating them as scripts', () => {
    const { window } = loadBootstrap('file:');

    assert.throws(() => window.setImmediate('window.injected = true'), /requires a function/);
    assert.equal(window.injected, undefined);
  });
});
