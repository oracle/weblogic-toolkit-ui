/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';


const i18n = require('./i18next.config');
const fsUtils = require('./fsUtils');
const { executeFileCommand } = require('./childProcessExecutor');
const { getLogger } = require('./wktLogging');
const { getErrorMessage } = require('./errorUtils');


async function validateOpenSSLExe(openSSLExe) {
  const results = {
    isValid: true
  };

  if (!openSSLExe) {
    results.isValid = false;
    results.reason = i18n.t('openssl-not-specified-error-message');
    return Promise.resolve(results);
  }

  return new Promise(resolve => {
    fsUtils.exists(openSSLExe).then(doesExist => {
      if (!doesExist) {
        results.isValid = false;
        results.reason = i18n.t('openssl-not-exists-error-message', { filePath: openSSLExe });
      }
      resolve(results);
    }).catch(err => {
      results.isValid = false;
      results.reason = i18n.t('openssl-exists-failed-error-message',
        { filePath: openSSLExe, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function generateTLSFiles(openSSLExe, keyOut, certOut, subject) {
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    const args = [ 'req', '-x509', '-nodes', '-days', '365', '-newkey', 'rsa:2048', '-keyout', keyOut,
      '-out', certOut, '-subj', subject];
    executeFileCommand(openSSLExe, args, {}).then(stdout => {
      getLogger().debug(stdout);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('openssl-command-failed-error-message', { error: getErrorMessage(err) });
      resolve(results);
    });
  });

}


module.exports = {
  validateOpenSSLExe,
  generateTLSFiles
};
