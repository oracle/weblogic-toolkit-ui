/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const i18n = require('./i18next.config');
const fsUtils = require('./fsUtils');
const path = require('path');

async function validateDomainHome(domainHome, errorPrefix) {
  const results = {
    isValid: true,
    reason: null
  };

  if (!domainHome) {
    results.isValid = false;
    results.reason = `${errorPrefix}: ${i18n.t('domain-home-not-specified')}`;
    return Promise.resolve(results);
  }

  return new Promise(resolve => {
    fsUtils.isDirectory(domainHome).then(dhExists => {
      if (!dhExists) {
        results.isValid = false;
        results.reason = `${errorPrefix}: ${i18n.t('domain-home-not-directory', { domainHome: domainHome })}`;
        return resolve(results);
      }

      const configXml = path.join(domainHome, 'config', 'config.xml');
      fsUtils.exists(configXml).then(configXmlExists => {
        if (!configXmlExists) {
          results.isValid = false;
          results.reason = `${errorPrefix}: ${i18n.t('domain-config-xml-not-exists', { configXml: configXml })}`;
        }
        resolve(results);
      });
    });
  });
}

module.exports = {
  validateDomainHome
};
