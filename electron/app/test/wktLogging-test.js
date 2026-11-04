/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { format } = require('node:util');
const vm = require('node:vm');
const { describe, it } = require('mocha');

/* global __dirname */
const loggingSource = readFileSync(path.join(__dirname, '../js/wktLogging.js'), 'utf8');

function initializeWithEnvironment(env) {
  const messages = [];
  const logger = { level: 'info', info: (...args) => messages.push(format(...args)), debug() {} };
  class Transport {
    constructor() {
      this.name = 'fixture';
    }
  }
  const dependencies = {
    path,
    winston: {
      createLogger: () => logger,
      format: { combine() {}, splat() {}, simple() {} },
      config: { npm: { levels: {} } },
      transports: { File: Transport, Console: Transport }
    },
    'winston-daily-rotate-file': {},
    '../../package.json': { name: 'fixture', productName: 'Fixture Application' },
    './userSettings': { getLoggingConfiguration: () => ({ level: 'info', file: {}, console: {} }) },
    './fsUtils': {}
  };
  const sandbox = {
    module: { exports: {} },
    require: name => {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    // Never expose or log the real test runner's environment.
    process: { env, argv: ['fixture-app'], cwd: () => path.join(path.sep, 'fixture') }
  };
  vm.runInNewContext(loggingSource, sandbox, { filename: 'wktLogging.js' });
  const initializedLogger = sandbox.module.exports.initializeLoggingSystem(
    { isDevelopmentMode: () => true },
    {
      getApplicationName: () => 'Fixture Application',
      getApplicationVersion: () => '1.0.0',
      getApplicationBuildVersion: () => 'fixture-build'
    },
    path.join(path.sep, 'fixture-temp')
  );
  assert.equal(initializedLogger, logger);
  return messages;
}

describe('Startup environment logging', () => {
  for (const tokenKey of ['WKTUI_GITHUB_TOKEN', 'wktui_github_token', 'Wktui_Github_Token']) {
    it(`redacts ${tokenKey} without changing the environment or ordinary logging`, () => {
      const env = { [tokenKey]: 'dummy-build-secret', WKTUI_FIXTURE: 'ordinary-fixture-value' };
      const originalEnv = { ...env };

      const messages = initializeWithEnvironment(env);

      assert.ok(messages.includes(`${tokenKey} = [REDACTED]`));
      assert.ok(messages.includes('WKTUI_FIXTURE = ordinary-fixture-value'));
      assert.ok(messages.every(message => !message.includes('dummy-build-secret')));
      assert.deepEqual(env, originalEnv);
    });
  }
});
