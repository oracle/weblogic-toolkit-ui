/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const proxyquire = require('proxyquire');
const { assert, expect } = require('chai');
const { before, describe, it } = require('mocha');
const osUtils = require('../js/osUtils');

/* global process */
describe('Credential Store tests', () => {
  const wktLoggerMock = {
    getLogger: () => {
      return console;
    }
  };

  const CredentialStore = proxyquire('../js/credentialStore', { './wktLogging': wktLoggerMock });
  let credStore;

  let skipTestsInJenkins = false;
  if (!osUtils.isWindows() && 'JENKINS_NODE_COOKIE' in process.env) {
    skipTestsInJenkins = true;
  }

  before(async () => {
    credStore = new CredentialStore('wktui-test');
    await cleanStaleCredentials();
  });

  async function cleanStaleCredentials() {
    const staleCreds = credStore.findCredentials();
    if (staleCreds && Array.isArray(staleCreds)) {
      for (const staleCred of staleCreds) {
        await credStore.deleteCredential(staleCred.account);
      }
    }
  }

  if (!skipTestsInJenkins) {
    it('store new credential works', async () => {
      try {
        await credStore.storeCredential('test1', 'f00b@r!');
      } catch (err) {
        assert.fail(`Failed to store credential test1: ${err}`);
      }
    });

    // On the Jenkins MacOS slaves, this test fails at least half the time with the error:
    // The specified item already exists in the keychain.  This causes some of the subsequent
    // tests to fail.
    //
    // This has never once reproduced on a developer's MacOS machine so we will just not run
    // the tests in the Jenkins MacOS environment.
    //
    it('replace existing credential works', async () => {
      try {
        await credStore.storeCredential('test1', '8e7rty9wrfhofhd98@92382093ue09udjo8dfsyu');
        const newCredentialValue = await credStore.getCredential('test1');
        expect(newCredentialValue).to.equal('8e7rty9wrfhofhd98@92382093ue09udjo8dfsyu');
      } catch (err) {
        assert.fail(`Failed to replace existing credential test1: ${err}`);
      }
    });

    it('get existing credential works', async () => {
      try {
        const credentialValue = await credStore.getCredential('test1');
        expect(credentialValue).to.equal('8e7rty9wrfhofhd98@92382093ue09udjo8dfsyu');
      } catch (err) {
        assert.fail(`Failed to get existing credential test1: ${err}`);
      }
    });

    it('get non-existent credential works as expected', async () => {
      try {
        const credentialValue = await credStore.getCredential('test2');
        expect(credentialValue).to.be.null;
      } catch (err) {
        assert.fail(`Failed to get non-existent credential test2: ${err}`);
      }
    });

    it('find credentials to work', async () => {
      try {
        const credentials = await credStore.findCredentials();
        expect(credentials).to.not.be.null;
        expect(credentials).to.have.length(1);
        expect(credentials[0].name).to.equal('test1');
        expect(credentials[0].value).to.equal('8e7rty9wrfhofhd98@92382093ue09udjo8dfsyu');
      } catch (err) {
        assert.fail(`Failed to get credentials: ${err}`);
      }
    });

    it('delete non-existent credential works as expected', async () => {
      try {
        const result = await credStore.deleteCredential('test2');
        expect(result).to.be.false;
      } catch (err) {
        assert.fail(`Failed to handle delete for non-existent credential: ${err}`);
      }
    });

    it('delete existing credential works as expected', async () => {
      try {
        const result = await credStore.deleteCredential('test1');
        expect(result).to.be.true;
      } catch (err) {
        assert.fail(`Failed to handle delete for existing credential: ${err}`);
      }
    });

    it('find credentials when there are none works as expected', async () => {
      try {
        const credentials = await credStore.findCredentials();
        expect(credentials).to.not.be.null;
        expect(credentials).to.have.length(0);
      } catch (err) {
        assert.fail(`Failed to get credentials when there were none: ${err}`);
      }
    });
  }
});
