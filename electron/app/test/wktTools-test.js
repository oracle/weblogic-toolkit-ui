/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { describe, it } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();
const { getErrorMessage } = require('../js/errorUtils');

const installedWdt = 'WebLogic Deploy Tooling 4.4.6';
const installedWit = 'WebLogic Image Tool 1.16.3';
const latestWdt = 'WebLogic Deploy Tooling 4.4.7';
const latestWit = 'WebLogic Image Tool 1.16.4';
const proxyOptions = { httpsProxyUrl: 'https://proxy.example:443' };
const authToken = 'test-token';
const bundledDirectory = path.join(path.sep, 'application', 'tools');
const stagingDirectory = path.join(path.sep, 'external-tools');
const targetWindow = {};

function createTools(settings = {}) {
  const messages = [];
  const errors = [];
  const errorLogs = [];
  const updates = [];
  const lookups = [];
  const tools = proxyquire('../js/wktTools', {
    electron: {
      dialog: {
        showMessageBox: async (window, options) => {
          assert.equal(window, targetWindow);
          messages.push(options);
          return { response: settings.cancel ? 1 : 0 };
        },
        showErrorBox: (title, message) => errors.push({ title, message })
      }
    },
    'fs/promises': {
      readFile: async file => path.basename(path.dirname(file)) === 'weblogic-deploy' ? installedWdt : installedWit
    },
    'node:fs': {
      existsSync: file => file === settings.externalDirectory && !settings.missingExternalDirectory
    },
    './fsUtils': { exists: async () => true },
    './i18next.config': { t: (key, options) => options?.error ? `${key}: ${options.error}` : key },
    './osUtils': {
      isWindows: () => false,
      isLinuxAppImage: () => !!settings.linuxAppImage
    },
    './userSettings': {
      getGithubAuthToken: () => authToken,
      getWktToolsExternalStagingDirectory: () => settings.externalDirectory
    },
    './wktApp': class {},
    './wktLogging': { getLogger: () => ({ debug() {}, error: message => errorLogs.push(message) }) },
    './errorUtils': { getErrorMessage },
    './githubUtils': { getProxyOptionsFromPreferences: async () => proxyOptions },
    './wktToolsInstaller': {
      getWdtLatestReleaseName: async (...args) => {
        lookups.push(args);
        if (settings.wdtLookupError) {
          throw settings.wdtLookupError;
        }
        return settings.noUpdates ? installedWdt : latestWdt;
      },
      getWitLatestReleaseName: async (...args) => {
        lookups.push(args);
        if (settings.witLookupError) {
          throw settings.witLookupError;
        }
        return settings.noUpdates ? installedWit : latestWit;
      },
      updateTools: async (...args) => {
        updates.push(args);
        if (settings.updateError) {
          throw settings.updateError;
        }
      }
    }
  });
  tools.initialize({ getExtraFilesDirectory: () => path.dirname(bundledDirectory) });
  return { tools, messages, errors, errorLogs, updates, lookups };
}

describe('Help menu WKT tools updates', () => {
  for (const tool of ['wdt', 'wit']) {
    it(`shows the ${tool.toUpperCase()} release lookup error without an update or no-updates dialog`, async () => {
      const message = `Failed to get ${tool.toUpperCase()} release: HTTP 403 Forbidden: API rate limit exceeded`;
      const result = createTools({ [`${tool}LookupError`]: new Error(message) });

      await result.tools.checkForUpdates(targetWindow);

      assert.deepEqual(result.errors, [{ title: 'dialog-updateToolsFailedTitle',
        message: `dialog-updateToolsFailedMessage: ${message}` }]);
      assert.deepEqual(result.errorLogs, [message]);
      assert.deepEqual(result.messages, []);
      assert.deepEqual(result.updates, []);
    });
  }

  for (const linuxAppImage of [false, true]) {
    const platform = linuxAppImage ? 'Linux AppImage' : 'bundled application';
    const directory = linuxAppImage ? stagingDirectory : bundledDirectory;

    it(`shows installation errors without reporting success for a ${platform}`, async () => {
      const message = 'Failed to download WebLogic Image Tool: HTTP 503 Service Unavailable';
      const result = createTools({ linuxAppImage, externalDirectory: stagingDirectory, updateError: message });

      await result.tools.checkForUpdates(targetWindow);

      assert.deepEqual(result.errors, [{ title: 'dialog-updateToolsFailedTitle',
        message: `dialog-updateToolsFailedMessage: ${message}` }]);
      assert.deepEqual(result.errorLogs, [message]);
      assert.deepEqual(result.messages.map(message => message.type), ['question']);
      assert.deepEqual(result.updates, [[[latestWdt, latestWit], directory, proxyOptions, authToken]]);
    });

    it(`updates the expected directory with user proxy and authentication for a ${platform}`, async () => {
      const result = createTools({ linuxAppImage, externalDirectory: stagingDirectory });

      await result.tools.checkForUpdates(targetWindow);

      assert.deepEqual(result.lookups, [[proxyOptions, authToken], [proxyOptions, authToken]]);
      assert.deepEqual(result.updates, [[[latestWdt, latestWit], directory, proxyOptions, authToken]]);
      assert.deepEqual(result.messages.map(message => message.type), ['question', 'info']);
      assert.equal(result.messages[1].detail, 'dialog-updateTwoToolsSuccessMessage');
      assert.deepEqual(result.errors, []);
      assert.deepEqual(result.errorLogs, []);
    });
  }

  it('does not install or show success when the user cancels', async () => {
    const result = createTools({ cancel: true });

    await result.tools.checkForUpdates(targetWindow);

    assert.deepEqual(result.messages.map(message => message.type), ['question']);
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.errorLogs, []);
  });

  it('still reports that no updates are available after successful release checks', async () => {
    const result = createTools({ noUpdates: true });

    await result.tools.checkForUpdates(targetWindow);

    assert.deepEqual(result.messages.map(message => message.detail), ['dialog-noToolsUpdateMessage']);
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.errorLogs, []);
  });

  for (const missingExternalDirectory of [false, true]) {
    it(`preserves the Linux staging-directory error when it is ${missingExternalDirectory ? 'missing' : 'unset'}`, async () => {
      const result = createTools({
        linuxAppImage: true,
        externalDirectory: missingExternalDirectory ? stagingDirectory : undefined,
        missingExternalDirectory
      });

      await result.tools.checkForUpdates(targetWindow);

      assert.deepEqual(result.errors, [{
        title: 'app-image-update-tools-failed-title',
        message: missingExternalDirectory ? 'app-image-update-tools-external-dir-not-exists' :
          'app-image-update-tools-external-dir-no-specified'
      }]);
      assert.deepEqual(result.messages.map(message => message.type), ['question']);
      assert.deepEqual(result.updates, []);
    });
  }
});
