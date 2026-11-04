/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const assert = require('node:assert/strict');
const process = require('node:process');
const { describe, it } = require('mocha');
const { Response: FetchResponse } = require('node-fetch');
const proxyquire = require('proxyquire').noCallThru();

const baseUrl = 'https://api.github.com/repos/oracle/weblogic-image-tool';
const toolName = 'WebLogic Image Tool';
const release = { name: 'WebLogic Image Tool 1.16.4', tag_name: '1.16.4', assets: [{ name: 'imagetool.zip' }] };

function createUtils(fetch, preferences = {}, logs = []) {
  const utils = proxyquire('../js/githubUtils', {
    'node-fetch': fetch,
    'https-proxy-agent': {
      HttpsProxyAgent: class {
        constructor(url) {
          this.url = url;
          this.proxy = new URL(url);
        }
      }
    },
    './userSettings': { getHttpsProxyUrl: () => preferences.httpsProxyUrl }
  });
  utils.setGitHubLogger({ error: message => logs.push(message) });
  return utils;
}

function jsonResponse(value, status = 200, statusText = 'OK') {
  return new FetchResponse(JSON.stringify(value), { status, statusText });
}

describe('GitHub release requests', () => {
  it('returns the latest release and retains explicit proxy and authentication options', async () => {
    let request;
    const utils = createUtils(async (url, options) => {
      request = { url, options };
      return jsonResponse(release);
    });

    assert.deepEqual(await utils.getLatestReleaseObject(toolName, baseUrl,
      { httpsProxyUrl: 'https://proxy.example:443' }, 'test-token'), release);
    assert.equal(request.url, `${baseUrl}/releases/latest`);
    assert.equal(request.options.agent.url, 'https://proxy.example:443');
    assert.deepEqual(request.options.headers, { Authorization: 'Bearer test-token' });
  });

  it('retains proxy lookup from runtime user preferences when options are omitted', async () => {
    let requestOptions;
    const utils = createUtils(async (url, options) => {
      requestOptions = options;
      return jsonResponse(release);
    }, { httpsProxyUrl: 'https://runtime-proxy.example:443' });

    await utils.getLatestReleaseObject(toolName, baseUrl);
    assert.equal(requestOptions.agent.url, 'https://runtime-proxy.example:443');
    assert.equal(requestOptions.headers, undefined);
  });

  it('uses only the explicit authentication token even when a build token is present', async () => {
    const previousBuildToken = process.env.WKTUI_GITHUB_TOKEN;
    process.env.WKTUI_GITHUB_TOKEN = 'dummy-build-token';
    try {
      const requests = [];
      const utils = createUtils(async (url, options) => {
        requests.push(options);
        return jsonResponse(release);
      });

      await utils.getLatestReleaseObject(toolName, baseUrl, {}, 'dummy-preferences-token');
      await utils.getLatestReleaseObject(toolName, baseUrl, {});

      assert.deepEqual(requests[0].headers, { Authorization: 'Bearer dummy-preferences-token' });
      assert.equal(requests[1].headers, undefined);
    } finally {
      if (previousBuildToken === undefined) {
        delete process.env.WKTUI_GITHUB_TOKEN;
      } else {
        process.env.WKTUI_GITHUB_TOKEN = previousBuildToken;
      }
    }
  });

  it('returns the requested tagged release', async () => {
    let requestUrl;
    const utils = createUtils(async url => {
      requestUrl = url;
      return jsonResponse(release);
    });

    assert.deepEqual(await utils.getSpecifiedReleaseObject(toolName, '1.16.4', baseUrl, {}), release);
    assert.equal(requestUrl, `${baseUrl}/releases/tags/1.16.4`);
  });

  it('maps release versions without changing the public result shape', async () => {
    const utils = createUtils(async url => {
      assert.equal(url, `${baseUrl}/releases`);
      return jsonResponse([release]);
    });

    assert.deepEqual(await utils.getReleaseVersions(toolName, baseUrl, {}), [
      { name: release.name, tag: release.tag_name }
    ]);
  });

  const requests = [
    { name: 'latest release', path: '/releases/latest',
      invoke: utils => utils.getLatestReleaseObject(toolName, baseUrl, {}, 'test-token') },
    { name: 'tagged release', path: '/releases/tags/1.16.4',
      invoke: utils => utils.getSpecifiedReleaseObject(toolName, '1.16.4', baseUrl, {}, 'test-token') },
    { name: 'release list', path: '/releases',
      invoke: utils => utils.getReleaseVersions(toolName, baseUrl, {}, 'test-token') }
  ];
  for (const request of requests) {
    it(`reports HTTP status and the GitHub error for the ${request.name}`, async () => {
      const utils = createUtils(async () => jsonResponse({ message: 'API rate limit exceeded' }, 403, 'Forbidden'));

      await assert.rejects(request.invoke(utils), err => {
        assert.match(err.message, /HTTP 403 Forbidden: API rate limit exceeded/);
        assert.ok(err.message.includes(toolName));
        assert.ok(err.message.includes(baseUrl + request.path));
        assert.ok(!err.message.includes('test-token'));
        return true;
      });
    });
  }

  it('reports an HTTP failure even if its JSON body looks like a release', async () => {
    const utils = createUtils(async () => jsonResponse(release, 503, 'Service Unavailable'));

    await assert.rejects(utils.getLatestReleaseObject(toolName, baseUrl, {}), /HTTP 503 Service Unavailable/);
  });

  it('retains the HTTP status for non-JSON errors without logging arbitrary response content', async () => {
    const utils = createUtils(async () => new FetchResponse('<html>proxy internal details</html>', {
      status: 502, statusText: 'Bad Gateway'
    }));

    await assert.rejects(utils.getLatestReleaseObject(toolName, baseUrl, {}), err => {
      assert.match(err.message, /HTTP 502 Bad Gateway/);
      assert.ok(!err.message.includes('proxy internal details'));
      return true;
    });
  });

  it('reports invalid JSON in a successful response with release context', async () => {
    const utils = createUtils(async () => new FetchResponse('not json'));

    await assert.rejects(utils.getLatestReleaseObject(toolName, baseUrl, {}), err => {
      assert.ok(err.message.includes(`latest release of ${toolName}`));
      assert.ok(err.message.includes(`${baseUrl}/releases/latest`));
      assert.match(err.message, /invalid json/i);
      return true;
    });
  });

  it('reports network failures with release context', async () => {
    const utils = createUtils(async () => { throw new Error('connection reset'); });

    await assert.rejects(utils.getLatestReleaseObject(toolName, baseUrl, {}), err => {
      assert.ok(err.message.includes(`latest release of ${toolName}`));
      assert.ok(err.message.includes(`${baseUrl}/releases/latest`));
      assert.match(err.message, /connection reset/);
      return true;
    });
  });

  it('logs GitHub diagnostic fields and selected response headers once', async () => {
    const logs = [];
    const headers = {
      'x-github-request-id': 'TEST:1234',
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': '1793744400',
      'x-ratelimit-resource': 'core',
      'retry-after': '60',
      'set-cookie': 'private-cookie-value'
    };
    const utils = createUtils(async () => new FetchResponse(JSON.stringify({
      message: 'API rate limit exceeded',
      errors: [{ resource: 'Release', code: 'limit' }],
      documentation_url: 'https://docs.github.com/rest/rate-limits'
    }), { status: 403, statusText: 'Forbidden', headers }), {}, logs);

    await assert.rejects(utils.getLatestReleaseObject(toolName, baseUrl, {}));
    assert.equal(logs.length, 1);
    const details = JSON.parse(logs[0].slice('GitHub request failed: '.length));
    assert.equal(details.url, `${baseUrl}/releases/latest`);
    assert.equal(details.status, 403);
    assert.equal(details.statusText, 'Forbidden');
    assert.equal(details.message, 'API rate limit exceeded');
    assert.deepEqual(JSON.parse(details.errors), [{ resource: 'Release', code: 'limit' }]);
    assert.equal(details.documentation_url, 'https://docs.github.com/rest/rate-limits');
    for (const [header, value] of Object.entries(headers)) {
      if (header === 'set-cookie') {
        assert.ok(!logs[0].includes(value));
      } else {
        assert.equal(details.headers[header], value);
      }
    }
  });

  it('redacts reflected tokens, URL credentials and signed queries from HTTP diagnostics', async () => {
    const logs = [];
    const token = 'github-private-token';
    const proxyUrl = 'https://proxy-user:proxy-password@proxy.example:443';
    const url = 'https://download-user:download-password@github.com/archive?token=signed-secret#private-fragment';
    const utils = createUtils(async () => jsonResponse({
      message: `Rejected ${token}; proxy-user proxy-password; ${proxyUrl}; ${url}`,
      errors: [{ message: token }],
      documentation_url: `https://docs.github.com/help?token=${token}`
    }, 401, 'Unauthorized'), {}, logs);

    let error;
    await assert.rejects(utils.fetchGitHub(url, { httpsProxyUrl: proxyUrl }, token), err => {
      error = err;
      return true;
    });
    const diagnostic = logs.join('\n') + String(error);
    for (const secret of [token, 'proxy-user', 'proxy-password', 'download-user', 'download-password',
      'signed-secret', 'private-fragment']) {
      assert.ok(!diagnostic.includes(secret), `Leaked ${secret}`);
    }
    assert.match(logs[0], /https:\/\/github.com\/archive/);
    assert.match(logs[0], /\[REDACTED\]/);
  });

  it('logs a bounded non-JSON error body excerpt with sensitive values removed', async () => {
    const logs = [];
    const utils = createUtils(async () => new FetchResponse('gateway failure secret-token ' + 'x'.repeat(3000), {
      status: 502, statusText: 'Bad Gateway'
    }), {}, logs);

    await assert.rejects(utils.fetchGitHub(baseUrl, {}, 'secret-token'));
    const details = JSON.parse(logs[0].slice('GitHub request failed: '.length));
    assert.match(details.body, /gateway failure \[REDACTED\]/);
    assert.equal(details.body.length, 2048);
    assert.ok(!logs[0].includes('secret-token'));
  });

  it('logs network errors using runtime proxy preferences without exposing credentials', async () => {
    const logs = [];
    const utils = createUtils(async () => {
      throw new Error('Failed https://runtime-user:runtime-password@proxy.example:443 with runtime-password token-value');
    }, { httpsProxyUrl: 'https://runtime-user:runtime-password@proxy.example:443' }, logs);

    await assert.rejects(utils.fetchGitHub(baseUrl, undefined, 'token-value'));
    assert.equal(logs.length, 1);
    assert.match(logs[0], /"kind":"network"/);
    for (const secret of ['runtime-user', 'runtime-password', 'token-value']) {
      assert.ok(!logs[0].includes(secret));
    }
  });

  it('logs successful-HTTP JSON parsing failures with request and response details once', async () => {
    const logs = [];
    const utils = createUtils(async () => new FetchResponse('invalid-json', {
      status: 200, statusText: 'OK', headers: { 'x-github-request-id': 'parse-request' }
    }), {}, logs);

    await assert.rejects(utils.getLatestReleaseObject(toolName, baseUrl, {}));
    assert.equal(logs.length, 1);
    const details = JSON.parse(logs[0].slice('GitHub request failed: '.length));
    assert.equal(details.kind, 'json');
    assert.equal(details.status, 200);
    assert.equal(details.headers['x-github-request-id'], 'parse-request');
    assert.match(details.message, /invalid json/i);
  });

  it('uses console by default and can switch to the initialized application logger', async () => {
    const appLogs = [];
    const consoleLogs = [];
    const utils = createUtils(async () => jsonResponse({ message: 'Not Found' }, 404, 'Not Found'), {}, appLogs);
    const originalError = console.error;
    console.error = message => consoleLogs.push(message);
    try {
      utils.setGitHubLogger();
      await assert.rejects(utils.fetchGitHub(baseUrl, {}));
      assert.equal(consoleLogs.length, 1);
      assert.equal(appLogs.length, 0);

      utils.setGitHubLogger({ error: message => appLogs.push(message) });
      await assert.rejects(utils.fetchGitHub(baseUrl, {}));
      assert.equal(consoleLogs.length, 1);
      assert.equal(appLogs.length, 1);
    } finally {
      console.error = originalError;
    }
  });

  it('leaves successful response streams available to archive download callers', async () => {
    const logs = [];
    const utils = createUtils(async () => new FetchResponse('archive bytes'), {}, logs);

    const response = await utils.fetchGitHub('https://github.com/oracle/weblogic-image-tool/releases/download/1.16.4/imagetool.zip', {});
    assert.equal(response.bodyUsed, false);
    assert.equal(await response.text(), 'archive bytes');
    assert.equal(logs.length, 0);
  });

  for (const result of [null, [], {}, { message: 'Unexpected response' }, { name: release.name }]) {
    it(`logs and rejects malformed release metadata ${JSON.stringify(result)}`, async () => {
      const logs = [];
      const utils = createUtils(async () => jsonResponse(result), {}, logs);

      await assert.rejects(utils.getLatestReleaseObject(toolName, baseUrl, {}), /Expected a GitHub release/);
      assert.equal(logs.length, 1);
      assert.match(logs[0], /"kind":"response"/);
    });
  }

  it('allows releases with no assets for the operator release lookup', async () => {
    const operatorRelease = { name: 'WebLogic Kubernetes Operator 4.3.0', assets: [] };
    const utils = createUtils(async () => jsonResponse(operatorRelease));

    assert.deepEqual(await utils.getLatestReleaseObject('WebLogic Kubernetes Operator', baseUrl, {}), operatorRelease);
  });

  it('logs malformed release lists instead of silently accepting an error object', async () => {
    const logs = [];
    const utils = createUtils(async () => jsonResponse({ message: 'Unexpected response' }), {}, logs);

    await assert.rejects(utils.getReleaseVersions(toolName, baseUrl, {}), /Expected an array of GitHub releases/);
    assert.equal(logs.length, 1);
  });

  it('retains status and diagnostic headers when reading an HTTP error body fails', async () => {
    const logs = [];
    const utils = createUtils(async () => ({
      ok: false, status: 503, statusText: 'Service Unavailable',
      headers: new Map([['x-github-request-id', 'body-read-request']]),
      text: async () => { throw new Error('response stream closed'); }
    }), {}, logs);

    await assert.rejects(utils.fetchGitHub(baseUrl, {}), /HTTP 503 Service Unavailable/);
    const details = JSON.parse(logs[0].slice('GitHub request failed: '.length));
    assert.equal(details.status, 503);
    assert.equal(details.headers['x-github-request-id'], 'body-read-request');
    assert.equal(details.bodyReadError, 'response stream closed');
  });

  it('logs sanitized JSON error bodies with an unexpected response shape', async () => {
    const logs = [];
    const utils = createUtils(async () => jsonResponse({ error: 'Gateway rejected request for test-token' },
      502, 'Bad Gateway'), {}, logs);

    await assert.rejects(utils.fetchGitHub(baseUrl, {}, 'test-token'), /HTTP 502 Bad Gateway/);
    assert.equal(logs.length, 1);
    const details = JSON.parse(logs[0].slice('GitHub request failed: '.length));
    assert.match(details.body, /Gateway rejected request for \[REDACTED\]/);
    assert.ok(!logs[0].includes('test-token'));
  });
});
