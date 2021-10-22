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
async function testInternetConnectivity() {
  const userSettings = require('./userSettings');
  const httpsProxyUrl = await userSettings.getHttpsProxyUrl();
  const options = {
    timeout: CONNECT_TIMEOUT,
    method: 'HEAD'
  };
  if (httpsProxyUrl) {
    options.agent = new HttpsProxyAgent(httpsProxyUrl);
  }

  const logger = getLogger();
  return new Promise((resolve, reject) => {
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
    })
  });
}

module.exports = {
  testInternetConnectivity
};
