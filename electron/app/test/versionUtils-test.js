/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const proxyquire = require('proxyquire');

const wktLoggerMock = {
  getLogger: () => {
    console.isDebugEnabled = () => { return true; };
    return console;
  }
};

const { compareVersions } = proxyquire('../js/versionUtils', { './wktLogging': wktLoggerMock });

const VZ_SWITCH_VERSION = '1.4.0';

describe('Version Utils Tests', function() {
  it('version 1.3.3 is older than 1.4.0', () => {
    expect(compareVersions('1.3.3', VZ_SWITCH_VERSION)).to.equal(-1);
  });

  it('version 1.4.0 is equal to 1.4.0', () => {
    expect(compareVersions('1.4.0', VZ_SWITCH_VERSION)).to.equal(0);
  });

  it('version 1.4.1 is newer than 1.4.0', () => {
    expect(compareVersions('1.4.1', VZ_SWITCH_VERSION)).to.equal(1);
  });
});
