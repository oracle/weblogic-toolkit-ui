/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const process = require('node:process');
const { describe, it } = require('mocha');

// Run the real command in a child process, replacing only network/installation dependencies.
/* global __dirname */
const driver = `
const Module = require('node:module');
const originalLoad = Module._load;
const failure = process.argv[1];
Module._load = function(request, ...args) {
  if (request === '../app/js/wktToolsInstaller') {
    return {
      async installWdtRelease() {
        if (failure === 'wdt') throw new Error('WDT HTTP 403: API rate limit exceeded');
      },
      async installWitRelease() {
        console.log('WIT attempted');
        if (failure === 'wit') throw new Error('WIT HTTP 502: Bad Gateway');
      }
    };
  }
  if (request === '../build/verifyTools') {
    return { async verifyTools() {
      console.log('Tools verified');
      if (failure === 'validation') throw new Error('imagetool.jar is missing');
    } };
  }
  return originalLoad.call(this, request, ...args);
};
require(${JSON.stringify(path.resolve(__dirname, '../../scripts/installTools.js'))});
`;

describe('install-tools command', () => {
  function run(failure) {
    const result = spawnSync(process.execPath, ['-e', driver, failure], { encoding: 'utf8', timeout: 5000 });
    assert.ifError(result.error);
    return result;
  }

  it('exits unsuccessfully when WDT fails, without attempting WIT', () => {
    const result = run('wdt');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /WDT HTTP 403: API rate limit exceeded/);
    assert.doesNotMatch(result.stdout, /WIT attempted|Tools verified/);
  });

  it('exits unsuccessfully when WIT fails and retains error details', () => {
    const result = run('wit');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /WIT HTTP 502: Bad Gateway/);
    assert.doesNotMatch(result.stdout, /Tools verified/);
  });

  it('fails if installation completes without the required tool files', () => {
    const result = run('validation');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /imagetool.jar is missing/);
  });

  it('exits successfully only after both installations and verification succeed', () => {
    const result = run('none');
    assert.equal(result.status, 0);
    assert.match(result.stdout, /WebLogic Deploy Tooling installed[\s\S]*WebLogic Image Tool installed[\s\S]*Tools verified/);
  });
});
