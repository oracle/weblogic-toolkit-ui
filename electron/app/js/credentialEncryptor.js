/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes
} = require('node:crypto');
const zlib = require('zlib');

const _ivLength = 16;
const _saltLength = 128;
const _encryptionAlgorithm = 'aes-256-gcm';
const _iterations = 10000;
const _keyLength = 32;
const _digestAlgorithm = 'sha256';

/* global Buffer */
class CredentialEncryptor {
  constructor(passphrase) {
    this.passphrase = passphrase;
  }

  getEncryptedText(clearText) {
    const salt = randomBytes(_saltLength);
    const derivedKey = this._getDerivedKey(salt);

    const iv = randomBytes(_ivLength);
    const cipher = createCipheriv(_encryptionAlgorithm, derivedKey, iv);
    const encrypted = Buffer.concat([ cipher.update(clearText, 'utf8'), cipher.final() ]);
    let authTag = cipher.getAuthTag();

    return this._packCipherData(authTag, encrypted, iv, salt);
  }

  getDecryptedText(encryptedText) {
    const data = this._unpackCipherData(encryptedText);
    const authTag = Buffer.from(data.authTag, 'base64');
    const iv = Buffer.from(data.iv, 'base64');
    const encrypted = Buffer.from(data.content, 'base64');
    const salt = Buffer.from(data.salt, 'base64');
    const derivedKey = this._getDerivedKey(salt);

    const decipher = createDecipheriv(_encryptionAlgorithm, derivedKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  _getDerivedKey(salt) {
    // derive key with password and salt
    // keylength adheres to the "ECRYPT-CSA Recommendations" on "www.keylength.com"
    return pbkdf2Sync(this.passphrase, salt, _iterations, _keyLength, _digestAlgorithm);
  }

  _packCipherData(authTag, content, iv, salt) {
    const data =
      `${authTag.toString('base64')}-${content.toString('base64')}-${iv.toString('base64')}-${salt.toString('base64')}`;
    return zlib.deflateSync(data).toString('base64');
  }

  _unpackCipherData(cipherData) {
    const data = zlib.inflateSync(Buffer.from(cipherData, 'base64')).toString();
    const fields = data.split('-');
    if (fields.length !== 4) {
      throw new Error('Invalid packed cipher data');
    }

    return {
      authTag: fields[0],
      content: fields[1],
      iv: fields[2],
      salt: fields[3]
    };
  }
}

module.exports = CredentialEncryptor;
