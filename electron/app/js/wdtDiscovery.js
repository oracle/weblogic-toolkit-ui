/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const path = require('path');

const childProcessExecutor = require('./childProcessExecutor');
const project = require('./project');
const errorUtils = require('./errorUtils');
const i18n = require('./i18next.config');
const { getAbsolutePath, makeDirectoryIfNotExists } = require('./fsUtils');
const { getDiscoverDomainShellScript } = require('./wktTools');
const { getLogger } = require('./wktLogging');
const { sendToWindow } = require('./windowUtils');

/* global process */

// save the project and open the offline discover dialog.
// usually called from a menu click.
function startOfflineDiscover(targetWindow) {
  sendToWindow(targetWindow,'start-offline-discover');
}

// save the project and open the online discover dialog.
// usually called from a menu click.
function startOnlineDiscover(targetWindow) {
  sendToWindow(targetWindow,'start-online-discover');
}

// usually called by the run-offline-discover IPC invocation.
async function runOfflineDiscover(targetWindow, discoverConfig) {
  return _runDiscover(targetWindow, discoverConfig, false);
}

// usually called by the run-online-discover IPC invocation.
async function runOnlineDiscover(targetWindow, discoverConfig) {
  return _runDiscover(targetWindow, discoverConfig, true);
}

// start the discovery process (online or offline).
// verify the model directories exist.
// build the argument list and run the discover script.
// return the contents of the new model files.
async function _runDiscover(targetWindow, discoverConfig, online) {
  const logger = getLogger();
  const discoverType = online ? 'online' : 'offline';
  logger.info(`start ${discoverType} discover: ${discoverConfig['oracleHome']}`);

  let projectFile = discoverConfig['projectFile'];
  let projectDir = path.dirname(projectFile);

  let modelFile = getAbsolutePath(discoverConfig['modelFile'], projectDir);
  let propertiesFile = getAbsolutePath(discoverConfig['propertiesFile'], projectDir);
  let archiveFile = getAbsolutePath(discoverConfig['archiveFile'], projectDir);

  await makeDirectoryIfNotExists(path.dirname(modelFile));
  await makeDirectoryIfNotExists(path.dirname(propertiesFile));
  await makeDirectoryIfNotExists(path.dirname(archiveFile));

  let argList = [];
  argList.push('-oracle_home');
  argList.push(discoverConfig['oracleHome']);
  argList.push('-java_home');
  argList.push(discoverConfig['javaHome']);
  argList.push('-domain_home');
  argList.push(discoverConfig['domainHome']);
  argList.push('-domain_type');
  argList.push(discoverConfig['domainType']);

  if (online) {
    argList.push('-admin_url');
    argList.push(discoverConfig['adminUrl']);
    argList.push('-admin_user');
    argList.push(discoverConfig['adminUser']);
    argList.push('-admin_pass');
    argList.push(discoverConfig['adminPass']);
  }

  argList.push('-archive_file');
  argList.push(archiveFile);
  argList.push('-model_file');
  argList.push(modelFile);
  argList.push('-variable_file');
  argList.push(propertiesFile);

  const isRemote = discoverConfig['isRemote'];
  if (isRemote) {
    argList.push('-remote');
  }

  const env = {};
  if (!process.env.JAVA_HOME) {
    env['JAVA_HOME'] = discoverConfig['javaHome'];
  }

  let stdoutEventName = 'show-console-out-line';
  let stderrEventName = 'show-console-err-line';

  let results = {
    isSuccess: true
  };
  try {
    const exitCode = await childProcessExecutor.executeChildShellScript(targetWindow, getDiscoverDomainShellScript(),
      argList, env, stdoutEventName, {stderrEventName: stderrEventName});

    if (exitCode !== 0) {
      results.isSuccess = false;
      results.reason = i18n.t('wdt-discovery-non-zero-exit-code-error-message', { script: getDiscoverDomainShellScript(), exitCode: exitCode});
      logger.error(`${getDiscoverDomainShellScript()} failed with exit code: ${exitCode}`);
      return Promise.resolve(results);
    } else {
      logger.info(`${getDiscoverDomainShellScript()} completed successfully with exit code: ${exitCode}`);
    }

    let relativeModelFile = discoverConfig['modelFile'];
    let relativePropertiesFile = discoverConfig['propertiesFile'];
    let relativeArchiveFile = discoverConfig['archiveFile'];

    results.modelFileContent = await project.getModelFileContent(targetWindow, [relativeModelFile], [relativePropertiesFile],
      [relativeArchiveFile]);
  } catch (err) {
    results.isSuccess = false;
    results.reason = i18n.t('wdt-discovery-failed-error-message', { script: getDiscoverDomainShellScript(), error: errorUtils.getErrorMessage(err)});
  }
  return Promise.resolve(results);
}

module.exports = {
  runOfflineDiscover,
  runOnlineDiscover,
  startOfflineDiscover,
  startOnlineDiscover
};
