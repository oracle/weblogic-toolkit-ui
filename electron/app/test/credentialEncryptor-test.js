/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const CredentialEncryptor = require('../js/credentialEncryptor');

describe('Credential Encryptor tests', () => {
  const passphrase = 'isdfgwgfigr94re9fhc8oifh298ei';
  let encryptor = new CredentialEncryptor(passphrase);
  const textToHide = 'My Super Secret Text';
  const storedEncryptedText = 'eJwVy8lygjAAANAP6jgUZLEHDg0RWzKNbEblBmHfIRIIX+/03R/qiheGw0evTelSD+RHXJL42zQPy9AWt0gn9d6' +
    'NNnx4YMlzxb/5nKvmIbWRv/ZWI+mrhZJAOsqvU/u/NrqV4LK6qKeGnEVUsqeMlZVPCJb0qn1SZ2pUy3OrcODub8yFoz2P3tblyXyHhed06hSipc72' +
    'l+XgqPurTkY+rmRGArHz/DCIajBRGlqqoSuGioia+DPmQKaWq8CpzIJNyTGGoCBhwvoKbNl5L+/CYcK/LqDhI/uaqaLyOGDmGyy9VlY=';
  let encryptedText;

  it('encryption works', () => {
    encryptedText = encryptor.getEncryptedText(textToHide);
    expect(encryptedText).to.not.be.null;
  });

  it('decryption works', () => {
    const clearText = encryptor.getDecryptedText(encryptedText);
    expect(clearText).to.equal(textToHide);
  });

  it('decryption with new encryptor works', () => {
    const clearText = encryptor.getDecryptedText(storedEncryptedText);
    expect(clearText).to.equal(textToHide);
  });
});
