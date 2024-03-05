/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const path = require('path');
const { readFile } = require('fs/promises');

const i18n = require('./i18next.config');
const childProcessExecutor = require('./childProcessExecutor');
const fsUtils = require('./fsUtils');
const { getLogger } = require('./wktLogging');
const { getPrepareModelShellScript, getWdtCustomConfigDirectory, isWdtErrorExitCode, isWdtVersionCompatible} = require('./wktTools');
const { getModelFileContent } = require('./project');
const errorUtils = require('./errorUtils');

const MINIMUM_WDT_PREPARE_VERSION = '2.0.0';

const _resultsFileName = 'results.json';

const _deleteTempDirectory = true;

async function prepareModel(currentWindow, stdoutChannel, stderrChannel, prepareConfig) {
  const logger = getLogger();
  const { javaHome, oracleHome, projectDirectory, modelsSubdirectory, modelFiles,
    variableFiles, wdtTargetType, targetDomainLocation } = prepareConfig;
  const outputDirectory = await fsUtils.createTemporaryDirectory(projectDirectory, 'prepareModel');
  const absoluteModelFiles = fsUtils.getAbsolutePathsList(modelFiles, projectDirectory);

  const argList = [
    '-oracle_home', oracleHome,
    '-model_file', absoluteModelFiles.join(','),
    '-output_dir', outputDirectory,
    '-target', getToolTargetType(wdtTargetType, targetDomainLocation)
  ];

  const absoluteVariableFiles = fsUtils.getAbsolutePathsList(variableFiles, projectDirectory);
  if (absoluteVariableFiles.length > 0) {
    argList.push('-variable_file', absoluteVariableFiles.join(','));
  }

  // Nothing below this point should use the absolute file lists...
  //
  const env = {
    JAVA_HOME: javaHome,
    WLSDEPLOY_CUSTOM_CONFIG: getWdtCustomConfigDirectory()
  };

  if (logger.isDebugEnabled()) {
    logger.debug(`Invoking ${getPrepareModelShellScript()} with args ${JSON.stringify(argList)} and environment ${JSON.stringify(env)}`);
  }

  const results = {
    isSuccess: true
  };
  try {
    const versionCheckResult = await isWdtVersionCompatible(MINIMUM_WDT_PREPARE_VERSION);
    if (!versionCheckResult.isSuccess) {
      return Promise.resolve(versionCheckResult);
    }

    const exitCode = await childProcessExecutor.executeChildShellScript(currentWindow, getPrepareModelShellScript(),
      argList, env, stdoutChannel, { stderrEventName: stderrChannel });

    if (isWdtErrorExitCode(exitCode)) {
      results.isSuccess = false;
      results.reason = i18n.t('prepare-model-error-exit-code-error-message', { exitCode: exitCode });
      logger.error(results.reason);
      removeTempDirectory(outputDirectory).then().catch();
      return Promise.resolve(results);
    }
  } catch (err) {
    results.isSuccess = false;
    results.reason = i18n.t('prepare-model-execution-failed-error-message', { error: errorUtils.getErrorMessage(err) });
    results.error = err;
    logger.error(results.reason);
    removeTempDirectory(outputDirectory).then().catch();
    return Promise.resolve(results);
  }

  try {
    const updatedModelFileMap =
      await moveModelFiles(projectDirectory, modelsSubdirectory, outputDirectory, modelFiles);
    const updatedModelFiles = getUpdatedModelFileNames(updatedModelFileMap, modelFiles);

    let updatedVariableFiles;
    if (variableFiles.length > 0) {
      const updatedVariableFileMap =
        await moveModelFiles(projectDirectory, modelsSubdirectory, outputDirectory, variableFiles);
      updatedVariableFiles = getUpdatedModelFileNames(updatedVariableFileMap, variableFiles);
    } else {
      updatedVariableFiles = [];
      const newVariableFileName = `${wdtTargetType}_variable.properties`;
      const outputVariableFile = path.join(outputDirectory, newVariableFileName);
      if (await fsUtils.exists(outputVariableFile)) {
        const relativeVariableFileName =
          await moveFile(outputVariableFile, projectDirectory, path.join(projectDirectory, modelsSubdirectory));
        updatedVariableFiles.push(relativeVariableFileName);
      }
    }

    results['model'] =
      await getModelFileContent(currentWindow, updatedModelFiles, updatedVariableFiles, []);
  } catch (err) {
    results.isSuccess = false;
    results.reason = i18n.t('prepare-model-move-files-failed-error-message', { error: errorUtils.getErrorMessage(err) });
    results.error = err;
    logger.error(results.reason);
    removeTempDirectory(outputDirectory).then().catch();
    return Promise.resolve(results);
  }

  try {
    const jsonResults = await getJsonResultsContent(outputDirectory);
    results['secrets'] = jsonResults['secrets'];
    results['domain'] = jsonResults['domain'];
  } catch (err) {
    results.isSuccess = false;
    results.reason = errorUtils.getErrorMessage(err);
    results.error = err;
    logger.error(results.reason);
    removeTempDirectory(outputDirectory).then().catch();
    return Promise.resolve(results);
  }

  removeTempDirectory(outputDirectory).then().catch();
  return Promise.resolve(results);
}

async function removeTempDirectory(outputDirectory) {
  return new Promise(resolve => {
    if (_deleteTempDirectory) {
      fsUtils.removeDirectoryRecursively(outputDirectory).then(() => {
        resolve();
      }).catch(err => {
        getLogger().warning(`Prepare Model failed to remove the temporary directory ${outputDirectory}: ${err}`);
        resolve();
      });
    } else {
      getLogger().info(`Prepare Model skipping removal of temporary directory ${outputDirectory}`);
      resolve();
    }
  });
}

async function moveModelFiles(projectDirectory, modelsSubdirectory, outputDirectory, modelFiles) {
  const updatedFileMap = new Map();
  for (const modelFile of modelFiles) {
    const sourceFile = path.join(outputDirectory, path.basename(modelFile));

    // if file was not created by prepareModel, don't copy or update location.
    // for example, prepareModel may not write the variables file if no changes.
    const sourceExists = await fsUtils.exists(sourceFile);
    if(sourceExists) {
      // If the file is inside the project directory, simply replace it.  Otherwise, move it inside the project directory.
      const targetFile = fsUtils.getAbsolutePath(modelFile, projectDirectory);
      if (targetFile.startsWith(projectDirectory)) {
        await replaceFile(sourceFile, targetFile);
        if (path.isAbsolute(modelFile)) {
          // convert existing absolute to a relative path
          updatedFileMap.set(modelFile, path.relative(projectDirectory, modelFile));
        }
      } else {
        const modelsDirectory = path.join(projectDirectory, modelsSubdirectory);
        getLogger().debug('creating directory %s if it does not already exist', modelsDirectory);
        await fsUtils.makeDirectoryIfNotExists(modelsDirectory);

        const newRelativePath = await moveFile(sourceFile, projectDirectory, modelsDirectory);
        updatedFileMap.set(modelFile, newRelativePath);
      }
    }
  }
  // The map returned only has entries for files whose paths need to be changed.
  return Promise.resolve(updatedFileMap);
}

async function replaceFile(sourceFile, targetFile) {
  return new Promise(resolve => {
    backupFile(targetFile).then(() => {
      fsUtils.renameFileDeletingOldFileIfNeeded(sourceFile, targetFile).then(() => resolve());
    });
  });
}

async function moveFile(sourceFile, projectDirectory, targetDirectory) {
  const targetFileName = path.join(targetDirectory, path.basename(sourceFile));
  return new Promise(resolve => {
    fsUtils.renameFileDeletingOldFileIfNeeded(sourceFile, targetFileName).then(() => {
      resolve(path.relative(projectDirectory, targetFileName));
    });
  });
}

async function backupFile(fileName) {
  const ext = path.extname(fileName);
  const backupFileName = path.join(path.dirname(fileName), `${path.basename(fileName, ext)}-original${ext}`);

  return new Promise(resolve => {
    fsUtils.renameFileDeletingOldFileIfNeeded(fileName, backupFileName).then(() => resolve());
  });
}

function getUpdatedModelFileNames(updatedFileMap, files) {
  const updatedFiles = [];
  if (files) {
    for (const file of files) {
      if (updatedFileMap.has(file)) {
        updatedFiles.push(updatedFileMap.get(file));
      } else {
        updatedFiles.push(file);
      }
    }
  }
  return updatedFiles;
}

async function getJsonResultsContent(outputDirectory) {
  const resultsFileName = path.join(outputDirectory, _resultsFileName);

  return new Promise((resolve, reject) => {
    fsUtils.exists(resultsFileName).then(doesExist => {
      if (!doesExist) {
        return reject(new Error(i18n.t('prepare-model-results-file-missing-error-message',
          { fileName: resultsFileName })));
      }

      readFile(resultsFileName, { encoding: 'utf8' }).then(data => {
        let jsonContent;
        try {
          jsonContent = JSON.parse(data);
          resolve(formatResultsData(jsonContent));
        } catch (err) {
          const error = new Error(i18n.t('prepare-model-results-file-parse-error-message',
            { fileName: resultsFileName, error: errorUtils.getErrorMessage(err) }));
          error.cause = err;
          reject(err);
        }
      }).catch(err => {
        const error = new Error(i18n.t('prepare-model-results-file-read-error-message',
          { fileName: resultsFileName, error: errorUtils.getErrorMessage(err) }));
        error.cause = err;
        reject(err);
      });
    }).catch(err => reject(err));
  });
}

function formatResultsData(jsonContent) {
  const results = { };
  if (!jsonContent) {
    return results;
  }

  const secrets = jsonContent['secrets'] || [];
  results.secrets = [];
  for (const [secretName, secret] of Object.entries(secrets)) {
    const secretResult = {
      name: secretName
    };
    const secretKeys = secret['keys'];
    if (secretKeys) {
      const secretKeyResult = [];
      for (const secretKey of Object.getOwnPropertyNames(secretKeys)) {
        // Filter out all secrets that do not have a value set.
        if (secretKeys[secretKey]) {
          secretKeyResult.push({ key: secretKey, defaultValue: secretKeys[secretKey] });
        }
      }
      if (secretKeyResult.length > 0) {
        secretResult.keys = secretKeyResult;
      }
    }
    if ('keys' in secretResult) {
      results.secrets.push(secretResult);
    }
  }

  const domain = {};
  domain['domainUID'] = jsonContent.domainUID;

  const clusters = jsonContent['clusters'] || [];
  const clustersResult = [];
  for (const [clusterName, cluster] of Object.entries(clusters)) {
    const clusterResult = {
      clusterName: clusterName,
      replicas: cluster['serverCount'] || 0
    };
    clustersResult.push(clusterResult);
  }
  domain['clusters'] = clustersResult;

  const servers = jsonContent['servers'] || [];
  const serversResult = [];
  for (const [serverName] of Object.entries(servers)) {
    const serverResult = {
      serverName: serverName
    };
    serversResult.push(serverResult);
  }
  domain['servers'] = serversResult;

  results['domain'] = domain;
  return results;
}

function getToolTargetType(wdtTargetType, targetDomainLocation) {
  const suffix = targetDomainLocation === 'mii' ? '' : `-${targetDomainLocation}`;
  return `${wdtTargetType}${suffix}`;
}

module.exports = {
  prepareModel
};
