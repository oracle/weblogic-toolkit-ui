/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const HttpsProxyAgent = require('https-proxy-agent');
const fetch = require('node-fetch');

// WARNING: This file contains functions that are called by build scripts
//          (where this code is not running in Electron).  As such, do not
//          require files like userSettings.js, wktLogging.js, or
//          wktTools.js, all of which execute code during that requires an
//          electron environment to function properly.
//
async function getReleaseVersions(name, baseUrl, options = undefined, perPage = 5, page = 1) {
  const proxyAgent = await getProxyAgent(options);
  return new Promise((resolve, reject) => {
    // const releasesUrl = `${baseUrl}/releases?per_page=${perPage}&page=${page}`;
    const releasesUrl = `${baseUrl}/releases`;
    console.log(`YYYYYY releasesUrl = ${releasesUrl}`);
    fetch(releasesUrl, getFetchOptions(proxyAgent)).then(res => {
      const fetchResults = res.json();
      console.log(`YYYYYY fetchResults = ${JSON.stringify(fetchResults)}`);

      const results = [];
      if (Array.isArray(fetchResults)) {
        fetchResults.forEach(fetchResult => {
          results.push({
            name: fetchResult.name,
            tag: fetchResult.tag,
          });
        });
      }
      resolve(results);
    }).catch(err => reject(new Error(`Failed to get release versions for ${name} from ${releasesUrl}: ${err}`)));
  });
}

async function getLatestReleaseObject(name, baseUrl, options = undefined) {
  const proxyAgent = await getProxyAgent(options);
  return new Promise((resolve, reject) => {
    const latestUrl = baseUrl + '/releases/latest';
    fetch(latestUrl, getFetchOptions(proxyAgent)).then(res => {
      const results = res.json();
      resolve(results);
    }).catch(err => reject(new Error(`Failed to get the latest release of ${name} from ${latestUrl}: ${err}`)));
  });
}

async function getSpecifiedReleaseObject(name, tag, baseUrl, options = undefined) {
  const proxyAgent = await getProxyAgent(options);
  return new Promise((resolve, reject) => {
    const releaseUrl = baseUrl + '/releases/tags/' + tag;
    fetch(releaseUrl, getFetchOptions(proxyAgent))
      .then(res => resolve(res.json()))
      .catch(err => reject(new Error(`Failed to get the ${tag} release of ${name} from ${releaseUrl}: ${err}`)));
  });
}

async function getProxyOptionsFromPreferences() {
  return new Promise((resolve, reject) => {
    try {
      // This require statement for userSettings should be safe since the build
      // scripts always pass a non-empty options object, which means that
      // getProxyAgent() will never call this function in a build scripts context.
      //
      const httpsProxyUrl = require('./userSettings').getHttpsProxyUrl();
      if (httpsProxyUrl) {
        resolve({ httpsProxyUrl: httpsProxyUrl });
      } else {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}

async function getProxyAgent(options = undefined) {
  const proxyOptions = options || await getProxyOptionsFromPreferences();
  console.log(`YYYYYY proxyOptions = ${JSON.stringify(proxyOptions)}`);
  const httpsProxyUrl = _getHttpsProxyUrl(proxyOptions);
  console.log(`YYYYYY httpsProxyUrl = ${httpsProxyUrl}`);

  let proxyAgent;
  if (httpsProxyUrl) {
    proxyAgent = new HttpsProxyAgent(httpsProxyUrl);
  }
  return proxyAgent;
}

function getFetchOptions(proxyAgent) {
  let options = {};
  if (proxyAgent) {
    options = {
      agent: proxyAgent
    };
  }
  return options;
}

function _getHttpsProxyUrl(options) {
  const myOptions = _getOptions(options, {httpsProxyUrl: undefined});
  return myOptions.httpsProxyUrl;
}

function _getOptions(options, defaultOptions) {
  if (options === null || options === undefined || typeof options === 'function') {
    return defaultOptions;
  }

  if (typeof options === 'string') {
    defaultOptions = {...defaultOptions};
    defaultOptions.httpsProxy = options;
    options = defaultOptions;
  } else if (typeof options !== 'object') {
    throw new Error(`Invalid options argument type: ${typeof options}`);
  }
  return options;
}

module.exports = {
  getFetchOptions,
  getLatestReleaseObject,
  getProxyOptionsFromPreferences,
  getProxyAgent,
  getReleaseVersions,
  getSpecifiedReleaseObject,
};
