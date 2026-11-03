/**
 * @license
 * Copyright (c) 2022, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const { HttpsProxyAgent } = require('https-proxy-agent');

// Node.js now has a built-in fetch implementation but it does not appear to
// support proxies so let's stick with node-fetch for now...
//
// eslint-disable-next-line no-redeclare
const fetch = require('node-fetch');
let gitHubLogger = console;

function setGitHubLogger(logger = console) {
  gitHubLogger = logger;
}

// WARNING: This file contains functions that are called by build scripts
//          (where this code is not running in Electron).  As such, do not
//          require files like userSettings.js, wktLogging.js, or
//          wktTools.js, all of which execute code during that requires an
//          electron environment to function properly.
//
async function getReleaseVersions(name, baseUrl, options = undefined, authToken = undefined) {
  const releasesUrl = `${baseUrl}/releases`;
  try {
    const releases = await getReleaseJson(releasesUrl, options, authToken, true);
    return releases.map(release => ({ name: release.name, tag: release.tag_name }));
  } catch (err) {
    throw new Error(`Failed to get release versions for ${name} from ${sanitizeUrl(releasesUrl)}: ${err}`, { cause: err });
  }
}

async function getLatestReleaseObject(name, baseUrl, options = undefined, authToken = undefined) {
  const latestUrl = baseUrl + '/releases/latest';
  try {
    return await getReleaseJson(latestUrl, options, authToken);
  } catch (err) {
    throw new Error(`Failed to get the latest release of ${name} from ${sanitizeUrl(latestUrl)}: ${err}`, { cause: err });
  }
}

async function getSpecifiedReleaseObject(name, tag, baseUrl, options = undefined, authToken = undefined) {
  const releaseUrl = baseUrl + '/releases/tags/' + tag;
  try {
    return await getReleaseJson(releaseUrl, options, authToken);
  } catch (err) {
    throw new Error(`Failed to get the ${tag} release of ${name} from ${sanitizeUrl(releaseUrl)}: ${err}`, { cause: err });
  }
}

async function getReleaseJson(url, options, authToken, isReleaseList = false) {
  const response = await fetchGitHub(url, options, authToken);
  const redact = createRedactor(authToken, url, options);
  let result;
  try {
    result = await response.json();
  } catch (err) {
    const message = redact(err.message || String(err));
    logGitHubFailure(response, url, { kind: 'json', message }, redact);
    // The original error can contain request credentials; retain only its sanitized message.
    // eslint-disable-next-line preserve-caught-error
    throw new Error(`Invalid JSON response from ${redact(sanitizeUrl(url))}: ${message}`, { cause: new Error(message) });
  }
  const isRelease = value => value && typeof value === 'object' &&
    typeof value.name === 'string' && Array.isArray(value.assets);
  if (isReleaseList ? !Array.isArray(result) || !result.every(isRelease) : !isRelease(result)) {
    const message = isReleaseList ? 'Expected an array of GitHub releases with names and assets' :
      'Expected a GitHub release with a name and assets';
    logGitHubFailure(response, url, { kind: 'response', message, body: redact(JSON.stringify(result)) }, redact);
    throw new Error(`Invalid GitHub response from ${redact(sanitizeUrl(url))}: ${message}`);
  }
  return result;
}

async function fetchGitHub(url, options = undefined, authToken = undefined) {
  let response;
  let proxyAgent;
  try {
    proxyAgent = await getProxyAgent(options);
    response = await fetch(url, getFetchOptions(proxyAgent, authToken));
  } catch (err) {
    const redact = createRedactor(authToken, url, options, proxyAgent);
    const message = redact(err.message || String(err));
    logGitHubFailure(undefined, url, { kind: 'network', message, code: err.code ? redact(err.code) : undefined }, redact);
    // The original error can contain proxy credentials; retain only its sanitized message.
    // eslint-disable-next-line preserve-caught-error
    throw new Error(`GitHub request failed for ${redact(sanitizeUrl(url))}: ${message}`, { cause: new Error(message) });
  }
  if (!response.ok) {
    const redact = createRedactor(authToken, url, options, proxyAgent);
    const details = { kind: 'http' };
    try {
      const body = await response.text();
      try {
        const error = JSON.parse(body);
        if (error && typeof error.message === 'string') {
          details.message = redact(error.message);
        }
        if (error?.errors !== undefined) {
          details.errors = redact(JSON.stringify(error.errors));
        }
        if (typeof error?.documentation_url === 'string') {
          details.documentation_url = redact(error.documentation_url);
        }
        if (!details.message && !details.errors && !details.documentation_url) {
          details.body = redact(body);
        }
      } catch {
        details.body = redact(body);
      }
    } catch (err) {
      details.bodyReadError = redact(err.message || String(err));
    }
    logGitHubFailure(response, url, details, redact);
    const message = details.message ? `: ${details.message}` : '';
    throw new Error(`HTTP ${response.status} ${redact(response.statusText)}${message}`);
  }
  return response;
}

function logGitHubFailure(response, url, details, redact) {
  const headers = {};
  for (const header of ['x-github-request-id', 'x-ratelimit-limit', 'x-ratelimit-remaining',
    'x-ratelimit-reset', 'x-ratelimit-resource', 'retry-after']) {
    const value = response?.headers?.get(header);
    if (value !== null && value !== undefined) {
      headers[header] = redact(value);
    }
  }
  gitHubLogger.error(`GitHub request failed: ${JSON.stringify({
    url: redact(sanitizeUrl(url)),
    status: response?.status,
    statusText: response ? redact(response.statusText) : undefined,
    ...details,
    headers
  })}`);
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    url.username = '';
    url.password = '';
    // Release asset redirects may contain signed URLs. Do not record query strings or fragments.
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '[invalid URL]';
  }
}

function createRedactor(authToken, url, options, proxyAgent) {
  const secrets = [authToken];
  for (const candidate of [url, options?.httpsProxyUrl, proxyAgent?.proxy?.href]) {
    if (!candidate) {
      continue;
    }
    try {
      const parsed = new URL(candidate);
      secrets.push(parsed.username, parsed.password, decodeURIComponent(parsed.username), decodeURIComponent(parsed.password));
      for (const [key, value] of parsed.searchParams) {
        if (/token|key|sig|auth|credential|password/i.test(key)) {
          secrets.push(value);
        }
      }
    } catch {
      // An invalid URL is omitted from diagnostic output by sanitizeUrl().
    }
  }
  return value => {
    let text = String(value);
    for (const secret of secrets.filter(Boolean)) {
      text = text.split(secret).join('[REDACTED]');
      text = text.split(encodeURIComponent(secret)).join('[REDACTED]');
    }
    text = text.replace(/https?:\/\/[^\s"'<>]+/g, sanitizeUrl);
    return text.slice(0, 2048);
  };
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
  const httpsProxyUrl = _getHttpsProxyUrl(proxyOptions);

  let proxyAgent;
  if (httpsProxyUrl) {
    proxyAgent = new HttpsProxyAgent(httpsProxyUrl);
  }
  return proxyAgent;
}

function getFetchOptions(proxyAgent, authToken = undefined) {
  let options = {};
  if (proxyAgent) {
    options = {
      agent: proxyAgent
    };
  }
  if (authToken) {
    options.headers = {
      Authorization: `Bearer ${authToken}`
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
  fetchGitHub,
  getFetchOptions,
  getLatestReleaseObject,
  getProxyOptionsFromPreferences,
  getProxyAgent,
  getReleaseVersions,
  getSpecifiedReleaseObject,
  setGitHubLogger,
};
