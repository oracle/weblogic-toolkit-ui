/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const CredentialEncryptor = require('./credentialEncryptor');
const { getJsonPathReference } = require('./jsonPath');
const { getLogger } = require('./wktLogging');

/* global Buffer */
class CredentialManager {
  constructor(credentialStorePolicy) {
    this.credentialStorePolicy = credentialStorePolicy;
    this.manager = null;
  }

  get credentialStoreType() {
    return this.credentialStorePolicy;
  }

  set credentialManager(credentialManager) {
    this.manager = credentialManager;
  }

  async storeCredentials(project) {
    let projectToStore = project;
    if (project && 'credentialPaths' in project && project['credentialPaths'] && project['credentialPaths'].length > 0) {
      // Make a copy of the project prior to modification because the updated project is used to write to the file
      // file the original in-memory copy is set back to the UI (complete with clear text credentials).
      //
      const logger = getLogger();
      projectToStore = JSON.parse(JSON.stringify(project));
      logger.debug('Storing credentials for project');
      for (const jsonPath of projectToStore['credentialPaths']) {
        const refObj = getJsonPathReference(jsonPath, projectToStore);
        logger.debug('Storing credential from jsonPath %s and field %s', jsonPath, refObj.field);
        const clearText = refObj.reference[refObj.field];
        refObj.reference[refObj.field] = await this.manager.storeCredential(jsonPath, clearText);
      }
    }
    return Promise.resolve(projectToStore);
  }

  async loadCredentials(project) {
    let loadedProject = project;
    if (project && 'credentialPaths' in project && project['credentialPaths'] && project['credentialPaths'].length > 0) {
      // Don't bother making a copy of the project since we are modifying the in-memory copy to send back to the UI...
      const logger = getLogger();
      logger.debug('Loading credentials for project');
      for (const jsonPath of loadedProject['credentialPaths']) {
        logger.debug('Loading Credential for jsonPath %s', jsonPath);
        let refObj = getJsonPathReference(jsonPath, loadedProject);
        if (!refObj.reference) {
          logger.debug('Loading Credential for jsonPath %s failed to resolve the jsonPath reference', jsonPath);
          refObj.reference = { };
        }
        const cipherText = refObj.reference[refObj.field];
        refObj.reference[refObj.field] = await this.manager.loadCredential(jsonPath, cipherText);
      }
    }
    return Promise.resolve(loadedProject);
  }
}

class CredentialStoreManager extends CredentialManager {
  constructor(projectGuid) {
    super('native');
    const CredentialStore = require('./credentialStore');

    this.projectGuid = projectGuid;
    this.credentialStore = new CredentialStore();
    super.credentialManager = this;
  }

  get credentialStoreType() {
    return super.credentialStoreType;
  }

  async storeCredentials(project) {
    return super.storeCredentials(project);
  }

  async loadCredentials(project) {
    return super.loadCredentials(project);
  }

  async storeCredential(jsonPath, clearText) {
    return new Promise((resolve, reject) => {
      if (clearText) {
        this.credentialStore.storeCredential(this._getCredentialName(jsonPath), clearText)
          .then(() => resolve())
          .catch(err => reject(new Error(`Failed to save credential for ${jsonPath}: ${err}`)));
      } else {
        this.credentialStore.deleteCredential(this._getCredentialName(jsonPath))
          .then(() => resolve())
          .catch(err => reject(new Error(`Failed to delete empty credential for ${jsonPath}: ${err}`)));
      }
    });
  }

  // eslint-disable-next-line no-unused-vars
  async loadCredential(jsonPath, cipherText) {
    return new Promise((resolve, reject) => {
      this.credentialStore.getCredential(this._getCredentialName(jsonPath))
        .then(clearText => resolve(clearText))
        .catch(err => reject(new Error(`Failed to load credential for ${jsonPath}: ${err}`)));
    });
  }

  _getCredentialName(jsonPath) {
    return Buffer.from(`${this.projectGuid}:${jsonPath}`, 'utf8').toString('base64');
  }
}

class EncryptedCredentialManager extends CredentialManager {
  constructor(passphrase) {
    super('passphrase');
    super.credentialManager = this;
    this.passphrase = passphrase;
    this.credentialEncryptor = new CredentialEncryptor(passphrase);
  }

  get credentialStoreType() {
    return super.credentialStoreType;
  }

  async storeCredentials(project) {
    return super.storeCredentials(project);
  }

  async loadCredentials(project) {
    return super.loadCredentials(project);
  }

  async storeCredential(jsonPath, clearText) {
    return new Promise((resolve, reject) => {
      if (clearText) {
        try {
          return resolve(this.credentialEncryptor.getEncryptedText(clearText));
        } catch (err) {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  }

  async loadCredential(jsonPath, cipherText) {
    return new Promise((resolve, reject) => {
      try {
        return resolve(this.credentialEncryptor.getDecryptedText(cipherText));
      } catch (err) {
        reject(err);
      }
    });
  }
}

class CredentialNoStoreManager extends CredentialManager {
  constructor() {
    super('none');
    super.credentialManager = this;
  }

  async storeCredentials(project) {
    return super.storeCredentials(project);
  }

  async loadCredentials(project) {
    return super.loadCredentials(project);
  }

  get credentialStoreType() {
    return super.credentialStoreType;
  }

  // eslint-disable-next-line no-unused-vars
  async storeCredential(jsonPath, clearText) {
    return Promise.resolve();
  }

  // eslint-disable-next-line no-unused-vars
  async loadCredential(jsonPath, cipherText) {
    return Promise.resolve();
  }
}

module.exports = {
  CredentialNoStoreManager,
  CredentialStoreManager,
  EncryptedCredentialManager
};
