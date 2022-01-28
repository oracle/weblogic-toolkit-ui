/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const { app } = require('electron');
const i18n = require('./i18next.config');
const { getLogger } = require('./wktLogging');
const { getImagetoolShellScript } = require('./wktTools');
const { getHttpsProxyUrl, getBypassProxyHosts } = require('./userSettings');
const { executeChildShellScript } = require('./childProcessExecutor');
const { getDockerEnv } = require('./imageBuilderUtils');

async function createImage(currentWindow, stdoutChannel, stderrChannel, createConfig) {
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const imageToolScript = getImagetoolShellScript();
  const [ args, argsContainCredentials ] = buildArgumentsListForCreate(createConfig, httpsProxyUrl);
  const env = getCreateEnvironment(createConfig, httpsProxyUrl, bypassProxyHosts);

  const result = {
    isSuccess: true
  };

  return new Promise(resolve => {
    const filteredArgs = argsContainCredentials ? filterArgsForLogging(args) : args;
    getLogger().debug('Executing %s shell script with args %s and environment %s', imageToolScript, filteredArgs, JSON.stringify(env));
    executeChildShellScript(currentWindow, imageToolScript, args, env, stdoutChannel,
      { stderrEventName: stderrChannel })
      .then(exitCode => {
        if (exitCode !== 0) {
          result.isSuccess = false;
          result.reason = i18n.t('wit-create-create-exit-code-error-message', { exitCode: exitCode });
        }
        resolve(result);
      })
      .catch(err => {
        getLogger().error(err);
        result.isSuccess = false;
        result.reason = i18n.t('wit-create-create-error-message', { error: err.message || err });
        resolve(result);
      });
  });
}

async function createAuxImage(currentWindow, stdoutChannel, stderrChannel, createConfig) {
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const imageToolScript = getImagetoolShellScript();
  const args = buildArgumentsListForCreateAuxImage(createConfig, httpsProxyUrl);
  const env = getCreateEnvironment(createConfig, httpsProxyUrl, bypassProxyHosts);
  const result = {
    isSuccess: true
  };

  return new Promise(resolve => {
    getLogger().debug('Executing %s shell script with args %s and environment %s', imageToolScript, args, JSON.stringify(env));
    executeChildShellScript(currentWindow, imageToolScript, args, env, stdoutChannel,
      { stderrEventName: stderrChannel }).then(exitCode => {
      if (exitCode !== 0) {
        result.isSuccess = false;
        result.reason = i18n.t('wit-create-create-aux-image-exit-code-error-message', { exitCode: exitCode });
      }
      resolve(result);
    }).catch(err => {
      getLogger().error(err);
      result.isSuccess = false;
      result.reason = i18n.t('wit-create-create-aux-image-error-message', { error: err.message || err });
      resolve(result);
    });
  });
}

function getCreateEnvironment(createConfig, httpsProxyUrl, bypassProxyHosts) {
  const env = getDockerEnv(httpsProxyUrl, bypassProxyHosts, createConfig);
  env['JAVA_HOME'] = createConfig.javaHome;
  env['WLSIMG_BLDDIR'] = app.getPath('temp');
  return env;
}

function buildArgumentsListForCreate(createConfig, httpsProxyUrl) {
  const args = [ 'create' ];

  if (createConfig.imageBuilderExe) {
    args.push('--builder', createConfig.imageBuilderExe);
  }
  args.push('--tag', createConfig.imageTag);

  if (httpsProxyUrl) {
    args.push('--httpsProxyUrl', httpsProxyUrl);
  }

  if (createConfig.baseImage) {
    args.push('--fromImage', createConfig.baseImage);
  }
  if (createConfig.alwaysPullBaseImage) {
    args.push('--pull');
  }
  addInstallerArgs(args, createConfig);
  const argsContainCredentials = addPatchingArgs(args, createConfig);
  addWdtArgs(args, createConfig);
  addAdvancedArgs(args, createConfig);
  return [ args, argsContainCredentials ];
}

function buildArgumentsListForCreateAuxImage(createConfig, httpsProxyUrl) {
  const args = [ 'createAuxImage' ];

  if (createConfig.imageBuilderExe) {
    args.push('--builder', createConfig.imageBuilderExe);
  }
  args.push('--tag', createConfig.imageTag);

  if (httpsProxyUrl) {
    args.push('--httpsProxyUrl', httpsProxyUrl);
  }

  if (createConfig.baseImage) {
    args.push('--fromImage', createConfig.baseImage);
  }
  if (createConfig.alwaysPullBaseImage) {
    args.push('--pull');
  }
  addInstallerArgs(args, createConfig);
  addWdtArgs(args, createConfig);
  addAdvancedArgs(args, createConfig);
  return args;
}

function addInstallerArgs(args, createConfig) {
  if (createConfig.jdkInstallerVersion) {
    args.push('--jdkVersion', createConfig.jdkInstallerVersion);
  }
  if (createConfig.oracleInstallerVersion) {
    args.push('--version', createConfig.oracleInstallerVersion);
  }
  if (createConfig.oracleInstallerType) {
    args.push('--type', createConfig.oracleInstallerType);
  }
  if (createConfig.wdtInstallerVersion) {
    args.push('--wdtVersion', createConfig.wdtInstallerVersion);
  }
}

function addPatchingArgs(args, createConfig) {
  let credentialsRequired = false;

  if (createConfig.recommended) {
    args.push('--recommendedPatches');
    credentialsRequired = true;
  } else if (createConfig.latestPsu) {
    args.push('--latestPSU');
    credentialsRequired = true;
  }

  if (createConfig.patches && createConfig.patches.length > 0) {
    args.push('--patches', createConfig.patches.join(','));
    credentialsRequired = true;
  }

  if (credentialsRequired) {
    args.push('--user', createConfig.username);
    args.push('--password', createConfig.password);
  }
  return credentialsRequired;
}

function addWdtArgs(args, createConfig) {
  const modelFiles = createConfig.modelFiles;
  if (modelFiles && modelFiles.length > 0) {
    args.push('--wdtModel', modelFiles.join(','));
  }

  const variableFiles = createConfig.variableFiles;
  if (variableFiles && variableFiles.length > 0) {
    args.push('--wdtVariables', variableFiles.join(','));
  }

  const archiveFiles = createConfig.archiveFiles;
  if (archiveFiles && archiveFiles.length > 0) {
    args.push('--wdtArchive', archiveFiles.join(','));
  }

  if (createConfig.targetDomainLocation === 'mii') {
    args.push('--wdtModelOnly');
  } else if (createConfig.targetDomainLocation === 'dii') {
    // For MII, domain type is set in the Domain Resource file
    if (createConfig.targetDomainType) {
      args.push('--wdtDomainType', createConfig.targetDomainType);
    }
  }

  if (createConfig.domainHome) {
    args.push('--wdtDomainHome', createConfig.domainHome);
  }

  if (createConfig.wdtHome) {
    args.push('--wdtHome', createConfig.wdtHome);
  }

  if (createConfig.modelHome) {
    args.push('--wdtModelHome', createConfig.modelHome);
  }
}

function addAdvancedArgs(args, createConfig) {
  if (createConfig.additionalBuildCommandsFile) {
    args.push('--additionalBuildCommands', createConfig.additionalBuildCommandsFile);

    if (createConfig.additionalBuildFiles && createConfig.additionalBuildFiles.length > 0) {
      args.push('--additionalBuildFiles', createConfig.additionalBuildFiles.join(','));
    }
  }

  if (createConfig.buildNetwork) {
    args.push('--buildNetwork', createConfig.buildNetwork);
  }

  if (createConfig.target) {
    args.push('--target', createConfig.target);
  }

  if (createConfig.chownOwner && createConfig.chownGroup) {
    args.push('--chown', `${createConfig.chownOwner}:${createConfig.chownGroup}`);
  }
}

function filterArgsForLogging(args) {
  const filteredArgs = [];
  let filterNextArg = false;
  for (const arg of args) {
    if (filterNextArg) {
      filteredArgs.push('********');
      filterNextArg = false;
    } else {
      filteredArgs.push(arg);
      if (arg === '--user' || arg === '--password') {
        filterNextArg = true;
      }
    }
  }
  return filteredArgs;
}

module.exports = {
  createImage,
  createAuxImage
};
