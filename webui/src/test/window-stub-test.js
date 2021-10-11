/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
"use strict";
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const {after, before, beforeEach, describe, it} = require('mocha');
const {WindowStub} = require('./window-stub');


describe('window stub', function () {
  before(function () {
    WindowStub.install();
  })

  beforeEach(function () {
    WindowStub.initialize();
  })

  after(function () {
    WindowStub.remove();
  })

  it('defines an ipc call that returns a promise', function () {
    WindowStub.defineChannel('test-channel', function() { return 'xyzzy'; });

    return expect(window.api.ipc.invoke('test-channel')).to.eventually.equal('xyzzy');
  })

  it('when channel not defined, returns undefined result', function () {
    return expect(window.api.ipc.invoke('test-channel')).to.eventually.be.undefined;
  })
})
