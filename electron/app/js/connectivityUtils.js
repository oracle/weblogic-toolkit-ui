/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const https = require('https');
const HttpsProxyAgent = require('https-proxy-agent');
const { homepage } = require('../../package.json');
const { getLogger } = require('./wktLogging');
const errorUtils = require('./errorUtils');

// test connectivity for user settings configuration
async function testConfiguredInternetConnectivity() {
  const userSettings = require('./userSettings');
  const httpsProxyUrl = userSettings.getHttpsProxyUrl();
  const connectivityTimeout = userSettings.getConnectivityTestTimeout();
  return testInternetConnectivity(httpsProxyUrl, connectivityTimeout);
}

// test connectivity using supplied arguments
async function testInternetConnectivity(httpsProxyUrl, connectivityTimeout = 5000) {
  const options = {
    timeout: connectivityTimeout,
    method: 'HEAD'
  };
  if (httpsProxyUrl) {
    options.agent = new HttpsProxyAgent(httpsProxyUrl);
  }

  const logger = getLogger();
  return new Promise((resolve) => {
    let timeout = false;
    logger.debug('Starting Internet connectivity test request to %s with a timeout of %s ms', homepage, connectivityTimeout);
    const httpsRequest = https.request(homepage, options, (res) => {
      logger.debug('Internet connectivity test request to %s returned HTTP status code %s', homepage, res.statusCode);
      resolve(res.statusCode === 200);
    });
    httpsRequest.on('timeout', () => {
      logger.error('Internet connectivity test timed out after %s ms', connectivityTimeout);
      timeout = true;
      httpsRequest.destroy();
    });
    httpsRequest.on('error', (err) => {
      if (!timeout) {
        logger.error('Internet connectivity test failed: %s', errorUtils.getErrorMessage(err));
      }
      resolve(false);
    });
    httpsRequest.end();
  });
}

module.exports = {
  testConfiguredInternetConnectivity,
  testInternetConnectivity
};
