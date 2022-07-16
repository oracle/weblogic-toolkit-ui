/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const path = require('path');
const proxyquire = require('proxyquire');
const { expect } = require('chai');
const { describe, it } = require('mocha');
const osUtils = require('../js/osUtils');

const wktLoggerMock = {
  getLogger: () => {
    console.isDebugEnabled = () => { return true; };
    return console;
  }
};

const { executeFileCommand, executeScriptCommand } = proxyquire('../js/childProcessExecutor', { './wktLogging': wktLoggerMock });

/* global __dirname, process */
describe('Child Process Executor tests', () => {
  it('verify node version is returned', async () => {
    const args = [ '-v' ];

    const output = await executeFileCommand('node', args);
    expect(output.trim()).is.equal(process.version);
  });

  it('verify spaces in file path work', async () => {
    const scriptPath = path.join(__dirname, 'dir with spaces', 'testScript') + (osUtils.isWindows() ? '.cmd' : '.sh');
    const argList = [ '-v', 'some args with lots of spaces' ];

    const output = await executeScriptCommand(scriptPath, argList);
    expect(output.trim()).is.equal('Hello World from dir with spaces with 2 arguments');
  });
});
