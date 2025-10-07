/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const i18n = require('./i18next.config');
const { getLogger } = require('./wktLogging');
const { getImagetoolShellScript } = require('./wktTools');
const { executeScriptCommand } = require('./childProcessExecutor');

async function cacheInstallers(cacheConfig) {
  const results = {
    isSuccess: true
  };
  return new Promise(resolve => {
    cacheJdkInstaller(cacheConfig).then(jdkResult => {
      Object.assign(jdkResult, results);
      if (!jdkResult.isSuccess) {
        return resolve(results);
      }

      cacheOracleInstaller(cacheConfig).then(oracleResult => {
        Object.assign(oracleResult, results);
        if (!oracleResult.isSuccess) {
          return resolve(results);
        }

        cacheWdtInstaller(cacheConfig).then(wdtResult => {
          Object.assign(wdtResult, results);
          return resolve(results);
        }).catch(err => {
          results.isSuccess = false;
          results.reason = i18n.t('wit-cache-wdt-installer-cache-failed-error-message', {
            error: err.message || err
          });
          return resolve(results);
        });
      }).catch(err => {
        results.isSuccess = false;
        results.reason = i18n.t('wit-cache-oracle-installer-cache-failed-error-message', {
          error: err.message || err
        });
        return resolve(results);
      });
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('wit-cache-jdk-installer-cache-failed-error-message', {
        error: err.message || err
      });
      return resolve(results);
    });
  });
}

async function cacheJdkInstaller(cacheConfig) {
  const javaHome = cacheConfig.javaHome;
  const jdkInstaller = cacheConfig.jdkInstaller;
  const jdkInstallerVersion = cacheConfig.jdkInstallerVersion;
  const architecture = cacheConfig.architecture;

  if (!jdkInstaller) {
    return Promise.resolve({ isSuccess: true, jdkStdoutMessage: i18n.t('wit-cache-skipped-jdk-install-message')});
  }
  return executeCacheCommand(javaHome, 'jdk', jdkInstaller, jdkInstallerVersion, architecture);
}

async function cacheOracleInstaller(cacheConfig) {
  const javaHome = cacheConfig.javaHome;
  const oracleInstaller = cacheConfig.oracleInstaller;
  const oracleInstallerVersion = cacheConfig.oracleInstallerVersion;
  const oracleInstallerType = cacheConfig.oracleInstallerType;
  const architecture = cacheConfig.architecture;

  if (!oracleInstaller) {
    const result = {
      isSuccess: true
    };
    result[`${oracleInstallerType || 'oracle'}StdoutMessage`] = i18n.t('wit-cache-skipped-oracle-install-message');
    return Promise.resolve(result);
  }

  return executeCacheCommand(javaHome, oracleInstallerType, oracleInstaller, oracleInstallerVersion, architecture);
}

async function cacheWdtInstaller(cacheConfig) {
  const javaHome = cacheConfig.javaHome;
  const wdtInstaller = cacheConfig.wdtInstaller;
  const wdtInstallerVersion = cacheConfig.wdtInstallerVersion;
  const architecture = cacheConfig.architecture;

  if (!wdtInstaller) {
    return Promise.resolve({ isSuccess: true, wdtStdoutMessage: i18n.t('wit-cache-skipped-wdt-install-message')});
  }

  return executeCacheCommand(javaHome, 'wdt', wdtInstaller, wdtInstallerVersion, architecture);
}

async function executeCacheCommand(javaHome, installerType, installerPath, installerVersion, architecture = 'amd64') {
  const imageToolScript = getImagetoolShellScript();
  const args = [
    'cache', 'addInstaller',
    '--force',
    `--type=${installerType}`,
    `--path=${installerPath}`,
    `--version=${installerVersion}`,
    `--architecture=${architecture}`
  ];
  const env = {
    JAVA_HOME: javaHome
  };

  const result = {
    isSuccess: true
  };
  return new Promise(resolve => {
    const wktLogger = getLogger();
    if (wktLogger.isDebugEnabled()) {
      wktLogger.debug('Executing %s shell script with args %s and environment %s', imageToolScript, args, JSON.stringify(env));
    }

    executeScriptCommand(imageToolScript, args, env).then(message => {
      getLogger().debug('%s shell script completed successfully: %s', imageToolScript, message);
      result[`${installerType}StdoutMessage`] = message;
      resolve(result);
    }).catch(err => {
      getLogger().error('%s shell script failed: %s', imageToolScript, err);
      result.isSuccess = false;
      result.reason = err.message || err.toString();
      resolve(result);
    });
  });
}

module.exports = {
  cacheInstallers
};
