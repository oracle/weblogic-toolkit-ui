/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const path = require('path');
const { readFile } = require('fs/promises');
const jsYaml = require('js-yaml');

const i18n = require('./i18next.config');
const childProcessExecutor = require('./childProcessExecutor');
const fsUtils = require('./fsUtils');
const { getLogger } = require('./wktLogging');
const { getPrepareModelShellScript, getWdtCustomConfigDirectory, isWdtErrorExitCode, isWdtVersionCompatible} = require('./wktTools');
const { getModelFileContent } = require('./project');
const errorUtils = require('./errorUtils');

const MINIMUM_WDT_PREPARE_VERSION = '2.0.0';

const _secretsFileName = 'k8s_secrets.json';
const _wkoDomainSpecFileName = 'wko-domain.yaml';
const _vzApplicationSpecFileName = 'vz-application.yaml';

const _deleteTempDirectory = true;

const _wkoTargetTypeName = i18n.t('prepare-model-wko-target-type-name');
const _vzTargetTypeName = i18n.t('prepare-model-wko-target-type-name');

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
    WDT_CUSTOM_CONFIG: getWdtCustomConfigDirectory()
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
    results['secrets'] = await getJsonSecretsContent(outputDirectory);
  } catch (err) {
    results.isSuccess = false;
    results.reason = errorUtils.getErrorMessage(err);
    results.error = err;
    logger.error(results.reason);
    removeTempDirectory(outputDirectory).then().catch();
    return Promise.resolve(results);
  }

  try {
    results['domain'] = await getTargetSpecContent(wdtTargetType, outputDirectory);
  } catch (err) {
    results.isSuccess = false;
    results.reason = errorUtils.getErrorMessage(err);
    results.error = err;
    logger.error(results.reason);
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

async function getJsonSecretsContent(outputDirectory) {
  const secretsFileName = path.join(outputDirectory, _secretsFileName);

  return new Promise((resolve, reject) => {
    fsUtils.exists(secretsFileName).then(doesExist => {
      if (!doesExist) {
        return reject(new Error(i18n.t('prepare-model-secrets-file-missing-error-message',
          { fileName: secretsFileName })));
      }

      readFile(secretsFileName, { encoding: 'utf8' }).then(data => {
        let jsonContent;
        try {
          jsonContent = JSON.parse(data);
          resolve(formatSecretsData(jsonContent));
        } catch (err) {
          const error = new Error(i18n.t('prepare-model-secrets-file-parse-error-message',
            { fileName: secretsFileName, error: errorUtils.getErrorMessage(err) }));
          error.cause = err;
          reject(err);
        }
      }).catch(err => {
        const error = new Error(i18n.t('prepare-model-secrets-file-read-error-message',
          { fileName: secretsFileName, error: errorUtils.getErrorMessage(err) }));
        error.cause = err;
        reject(err);
      });
    }).catch(err => reject(err));
  });
}

function formatSecretsData(jsonContent) {
  const results = { };
  if (!jsonContent) {
    return results;
  }

  results['domainUID'] = jsonContent.domainUID;
  const secrets = jsonContent['secrets'] || [];
  results.secrets = [];
  for (const secret of secrets) {
    const secretResult = {
      name: secret['secretName']
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
  return results;
}

async function getTargetSpecContent(wdtTargetType, outputDirectory) {
  let result = { };
  switch (wdtTargetType) {
    case 'wko':
      result = await getWkoSpecContent(outputDirectory);
      break;

    case 'vz':
      result = await getVzSpecContent(outputDirectory);
      break;

    default:
      // k8s target produces no spec...
      break;
  }
  return Promise.resolve(result);
}

async function getWkoSpecContent(outputDirectory) {
  const specFile = path.join(outputDirectory, _wkoDomainSpecFileName);

  return new Promise((resolve, reject) => {
    fsUtils.exists(specFile).then(doesExist => {
      if (!doesExist) {
        const error = new Error(i18n.t('prepare-model-spec-file-missing-error-message',
          { targetType: _wkoTargetTypeName, fileName: specFile }));
        reject(error);
      }

      readFile(specFile, { encoding: 'utf8' }).then(data => {
        try {
          const yamlDoc = jsYaml.load(data, { filename: specFile, json: true });
          resolve(formatWkoDomainSpecData(yamlDoc));
        } catch (err) {
          const error = new Error(i18n.t('prepare-model-spec-file-parse-error-message',
            { targetType: _wkoTargetTypeName, fileName: specFile, error: errorUtils.getErrorMessage(err) }));
          error.cause = err;
          reject(error);
        }
      }).catch(err => {
        const error = new Error(i18n.t('prepare-model-spec-file-read-error-message',
          { targetType: _wkoTargetTypeName, fileName: specFile, error: errorUtils.getErrorMessage(err) }));
        error.cause = err;
        reject(error);
      });
    }).catch(err => reject(getFileExistsErrorMessage(_wkoTargetTypeName, specFile, err)));
  });
}

function formatWkoDomainSpecData(yamlDoc) {
  const result = { };
  if (yamlDoc) {
    if ('metadata' in yamlDoc && 'name' in yamlDoc['metadata']) {
      result['domainUID'] = yamlDoc['metadata']['name'];
    }
    if ('spec' in yamlDoc && 'clusters' in yamlDoc['spec']) {
      const clusters = yamlDoc['spec']['clusters'];
      const clustersResult = [];
      for (const cluster of clusters) {
        const clusterResult = {
          clusterName: cluster['clusterName'],
          replicas: cluster['replicas'] || 0
        };
        clustersResult.push(clusterResult);
      }
      result['clusters'] = clustersResult;
    }
  }
  return result;
}

async function getVzSpecContent(outputDirectory) {
  const specFile = path.join(outputDirectory, _vzApplicationSpecFileName);

  return new Promise((resolve, reject) => {
    fsUtils.exists(specFile).then(doesExist => {
      if (!doesExist) {
        const error = new Error(i18n.t('prepare-model-spec-file-missing-error-message',
          { targetType: _vzTargetTypeName, fileName: specFile }));
        reject(error);
      }

      readFile(specFile, { encoding: 'utf8' }).then(data => {
        let yamlDocs;
        try {
          yamlDocs = jsYaml.loadAll(data, { filename: specFile, json: true });
        } catch (err) {
          const error = new Error(i18n.t('prepare-model-spec-file-parse-error-message',
            { targetType: _vzTargetTypeName, fileName: specFile, error: errorUtils.getErrorMessage(err) }));
          error.cause = err;
          reject(error);
        }

        try {
          resolve(formatVzApplicationSpecData(specFile, yamlDocs));
        } catch (err) {
          reject(err);
        }
      }).catch(err => {
        const error = new Error(i18n.t('prepare-model-spec-file-read-error-message',
          { targetType: _vzTargetTypeName, fileName: specFile, error: errorUtils.getErrorMessage(err) }));
        error.cause = err;
        reject(error);
      });
    }).catch(err => reject(getFileExistsErrorMessage(_wkoTargetTypeName, specFile, err)));
  });
}

function getToolTargetType(wdtTargetType, targetDomainLocation) {
  const suffix = targetDomainLocation === 'mii' ? '' : `-${targetDomainLocation}`;
  return `${wdtTargetType}${suffix}`;
}

function getFileExistsErrorMessage(targetType, fileName, err) {
  const error = new Error(i18n.t('prepare-model-spec-file-exists-error-message',
    { targetType: targetType, fileName: fileName, error: errorUtils.getErrorMessage(err) }));
  error.cause = err;
  return error;
}

function formatVzApplicationSpecData(specFile, yamlDocs) {
  const domainSpec = findVzDomainSpec(specFile, yamlDocs);
  const domainUID = domainSpec.domainUID;

  const clustersResult = [];
  if (domainSpec.clusters) {
    for (const cluster of domainSpec.clusters) {
      clustersResult.push({ clusterName: cluster.clusterName, replicas: cluster.replicas });
    }
  }
  return {
    domainUID: domainUID,
    clusters: clustersResult
  };
}

function findVzDomainSpec(specFile, yamlDocs) {
  let result;
  if (yamlDocs && yamlDocs.length > 0) {
    for (const yamlDoc of yamlDocs) {
      if (yamlDoc['kind'] !== 'Component') {
        continue;
      }
      if (yamlDoc.spec?.workload?.kind === 'VerrazzanoWebLogicWorkload') {
        result = yamlDoc;
        break;
      }
    }
  }

  if (!result) {
    throw new Error(i18n.t('prepare-model-vz-spec-file-missing-domain-error-message', { fileName: specFile }));
  } else if (!result.spec?.workload?.spec?.template?.spec) {
    throw new Error(i18n.t('prepare-model-vz-spec-file-missing-spec-error-message', { fileName: specFile }));
  } else {
    result = result.spec.workload.spec.template.spec;
  }
  return result;
}

module.exports = {
  prepareModel
};
