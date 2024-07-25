/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
// eslint-disable-next-line no-redeclare
const { name } = require('../../package.json');
const { getLogger } = require('./wktLogging');

class CredentialStore {
  /**
   * The constructor
   * @param serviceName only intended for unit tests...
   */
  constructor(serviceName) {
    this.serviceName = !serviceName ? name : serviceName;
    getLogger().debug('CredentialStore service name = %s', this.serviceName);
  }

  async storeCredential(credentialName, credentialValue) {
    const keytar = require('keytar');
    return new Promise((resolve, reject) => {
      keytar.setPassword(this.serviceName, credentialName, credentialValue).then(() => {
        resolve();
      }).catch(err => reject(err));
    });
  }

  async getCredential(credentialName) {
    const keytar = require('keytar');
    return new Promise((resolve, reject) => {
      keytar.getPassword(this.serviceName, credentialName).then(credentialValue => resolve(credentialValue)).catch(err => reject(err));
    });
  }

  async findCredentials() {
    const keytar = require('keytar');
    return new Promise((resolve, reject) => {
      keytar.findCredentials(this.serviceName).then(credentials => {
        const results = [];
        if (credentials) {
          for (const credential of credentials) {
            results.push({ name: credential.account, value: credential.password });
          }
        }
        resolve(results);
      }).catch(err => reject(err));
    });
  }

  async deleteCredential(credentialName) {
    const keytar = require('keytar');
    return new Promise((resolve, reject) => {
      keytar.deletePassword(this.serviceName, credentialName).then(result => resolve(!!result)).catch(err => reject(err));
    });
  }
}

module.exports = CredentialStore;
