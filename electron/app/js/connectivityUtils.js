/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const https = require('https');
const HttpsProxyAgent = require('https-proxy-agent');
const { homepage } = require('../../package.json');
const { getLogger } = require('./wktLogging');
const errorUtils = require('./errorUtils');

const CONNECT_TIMEOUT = 5000;

// test connectivity for user settings configuration
async function testConfiguredInternetConnectivity() {
  const userSettings = require('./userSettings');
  const httpsProxyUrl = await userSettings.getHttpsProxyUrl();
  return testInternetConnectivity(httpsProxyUrl);
}

// test connectivity using supplied arguments
async function testInternetConnectivity(httpsProxyUrl) {
  const options = {
    timeout: CONNECT_TIMEOUT,
    method: 'HEAD'
  };
  if (httpsProxyUrl) {
    options.agent = new HttpsProxyAgent(httpsProxyUrl);
  }

  const logger = getLogger();
  return new Promise((resolve) => {
    let timeout = false;
    const httpsRequest = https.request(homepage, options, (res) => {
      logger.debug('Internet connectivity test required HTTP status code %s', res.statusCode);
      resolve(true);
    });
    httpsRequest.on('timeout', () => {
      logger.error('Internet connectivity test timed out after %s ms', CONNECT_TIMEOUT);
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
