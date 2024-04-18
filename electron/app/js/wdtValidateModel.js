/**
 * @license
 * Copyright (c) 2022, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const fsUtils = require('./fsUtils');
const { getLogger } = require('./wktLogging');
const { getWdtCustomConfigDirectory, getValidateModelShellScript, isWdtErrorExitCode, isWdtVersionCompatible} = require('./wktTools');
const childProcessExecutor = require('./childProcessExecutor');
const { getErrorMessage } = require('./errorUtils');

const i18n = require('./i18next.config');

const MINIMUM_WDT_VALIDATE_VERSION = '2.0.0';

async function validateModel(currentWindow, stdoutChannel, stderrChannel, validateConfig) {
  const logger = getLogger();
  const { javaHome, oracleHome, projectDirectory, modelFiles, variableFiles, archiveFiles } = validateConfig;

  const argList = [
    '-oracle_home', oracleHome,
    '-target_mode', 'offline',
    '-method', 'wktui'
  ];

  const absoluteModelFiles = fsUtils.getAbsolutePathsList(modelFiles, projectDirectory);
  if (absoluteModelFiles.length > 0) {
    argList.push('-model_file', absoluteModelFiles.join(','));
  }

  const absoluteVariableFiles = fsUtils.getAbsolutePathsList(variableFiles, projectDirectory);
  if (absoluteVariableFiles.length > 0) {
    argList.push('-variable_file', absoluteVariableFiles.join(','));
  }

  const absoluteArchiveFiles = fsUtils.getAbsolutePathsList(archiveFiles, projectDirectory);
  if (absoluteArchiveFiles.length > 0) {
    argList.push('-archive_file', absoluteArchiveFiles.join(','));
  }

  const env = {
    JAVA_HOME: javaHome,
    WLSDEPLOY_CUSTOM_CONFIG: getWdtCustomConfigDirectory()
  };

  const wktLogger = getLogger();
  if (wktLogger.isDebugEnabled()) {
    wktLogger.debug(`Invoking ${getValidateModelShellScript()} with args ${JSON.stringify(argList)} and environment ${JSON.stringify(env)}`);
  }

  const results = {
    isSuccess: true
  };
  try {
    const versionCheckResult = await isWdtVersionCompatible(MINIMUM_WDT_VALIDATE_VERSION);
    if (!versionCheckResult.isSuccess) {
      return Promise.resolve(versionCheckResult);
    }

    const exitCode = await childProcessExecutor.executeChildShellScript(currentWindow, getValidateModelShellScript(),
      argList, env, stdoutChannel, { stderrEventName: stderrChannel });

    if (isWdtErrorExitCode(exitCode)) {
      results.isSuccess = false;
      results.reason = i18n.t('validate-model-error-exit-code-error-message', { exitCode: exitCode });
      logger.error(results.reason);
      return Promise.resolve(results);
    }
  } catch (err) {
    results.isSuccess = false;
    results.reason = i18n.t('validate-model-execution-failed-error-message', { error: getErrorMessage(err) });
    results.error = err;
    logger.error(results.reason);
    return Promise.resolve(results);
  }
  return Promise.resolve(results);
}

module.exports = {
  validateModel
};
