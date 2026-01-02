/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
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
const { readFile } = require('fs/promises');
const fsUtils = require('./fsUtils');

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

  let isRemote = false;
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

  argList.push('-domain_type');
  argList.push(discoverConfig['domainType']);

  argList.push('-model_file');
  argList.push(modelFile);
  argList.push('-variable_file');
  argList.push(propertiesFile);

  if (online) {
    argList.push('-admin_url');
    argList.push(discoverConfig['adminUrl']);
    argList.push('-admin_user');
    argList.push(discoverConfig['adminUser']);
    argList.push('-admin_pass');
    argList.push(discoverConfig['adminPass']);

    addArgumentIfPresent(discoverConfig['sshHost'], '-ssh_host', argList);
    addArgumentIfPresent(discoverConfig['sshPort'], '-ssh_port', argList);
    addArgumentIfPresent(discoverConfig['sshUser'], '-ssh_user', argList);
    addArgumentIfPresent(discoverConfig['sshPassword'], '-ssh_pass', argList);
    addArgumentIfPresent(discoverConfig['sshPrivateKey'], '-ssh_private_key', argList);
    addArgumentIfPresent(discoverConfig['sshPrivateKeyPassphrase'], '-ssh_private_key_pass', argList);

    const useRemote = discoverConfig['isRemote'];
    if (!useRemote) {
      argList.push('-archive_file');
      argList.push(archiveFile);
    } else {
      isRemote = true;
      argList.push('-remote');
    }

    if (discoverConfig['discoverPasswords']) {
      argList.push('-discover_passwords');
    }
    if (discoverConfig['discoverSecurityProviderData'] && discoverConfig['discoverSecurityProviderDataArgument']) {
      argList.push('-discover_security_provider_data');
      argList.push(discoverConfig['discoverSecurityProviderDataArgument']);
    }
    if (discoverConfig['discoverOPSSWallet'] && discoverConfig['discoverOPSSWalletPassphrase']) {
      argList.push('-discover_opss_wallet');
      argList.push('-opss_wallet_passphrase');
      argList.push(discoverConfig['discoverOPSSWalletPassphrase']);
    }
    addArgumentIfPresent(discoverConfig['discoverWdtPassphrase'], '-passphrase', argList);
  } else {
    // offline
    addArgumentIfPresent(discoverConfig['domainHome'], '-domain_home', argList);

    argList.push('-archive_file');
    argList.push(archiveFile);
  }

  const env = {
    JAVA_HOME: process.env.JAVA_HOME || discoverConfig['javaHome']
  };

  const additionalProperties = discoverConfig['additionalProperties'];
  if (additionalProperties && additionalProperties.length > 0) {
    env['WLSDEPLOY_PROPERTIES'] = additionalProperties;
  }

  let resultsDirectory = null;
  let resultsFile = null;
  if (isRemote) {
    resultsDirectory = await fsUtils.createTemporaryDirectory(projectDir, 'discoverModel');
    resultsFile = path.join(resultsDirectory, 'result.json');
    env['__WLSDEPLOY_STORE_RESULT__'] = resultsFile;
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
      [relativeArchiveFile], discoverConfig.wdtArchivePluginType, discoverConfig.javaHome);

    if(isRemote) {
      const resultsText = await readFile(resultsFile, {encoding: 'utf8'});
      results.resultData = JSON.parse(resultsText);
      await fsUtils.removeDirectoryRecursively(resultsDirectory);
    }
  } catch (err) {
    results.isSuccess = false;
    results.reason = i18n.t('wdt-discovery-failed-error-message', { script: getDiscoverDomainShellScript(), error: errorUtils.getErrorMessage(err)});
  }
  return Promise.resolve(results);
}

function addArgumentIfPresent(value, argName, argList) {
  if(value) {
    argList.push(argName);
    argList.push(value);
  }
}

module.exports = {
  runOfflineDiscover,
  runOnlineDiscover,
  startOfflineDiscover,
  startOnlineDiscover
};
