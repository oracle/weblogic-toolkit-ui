/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const path = require('path');
const readline = require('readline');

const i18n = require('./i18next.config');
const fsUtils = require('./fsUtils');
const { executeFileCommand, spawnDaemonChildProcess } = require('./childProcessExecutor');
const { getLogger } = require('./wktLogging');
const { getHttpsProxyUrl, getBypassProxyHosts } = require('./userSettings');
const { getErrorMessage } = require('./errorUtils');
const osUtils = require('./osUtils');
const k8sUtils = require('./k8sUtils');

/* global process */
async function validateKubectlExe(kubectlExe) {
  const results = {
    isValid: true
  };

  if (!kubectlExe) {
    results.isValid = false;
    results.reason = i18n.t('kubectl-not-specified-error-message');
    return Promise.resolve(results);
  }

  return new Promise(resolve => {
    fsUtils.exists(kubectlExe).then(doesExist => {
      if (!doesExist) {
        results.isValid = false;
        results.reason = i18n.t('kubectl-not-exists-error-message', { filePath: kubectlExe });
      }
      resolve(results);
    }).catch(err => {
      results.isValid = false;
      results.reason = i18n.t('kubectl-exists-failed-error-message',
        { filePath: kubectlExe, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getCurrentContext(kubectlExe, options) {
  const args = [ 'config', 'current-context' ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(currentContext => {
      results['context'] = currentContext.trim();
      resolve(results);
    }).catch(err => {
      // kubectl config current-context returns an error if a context is not set or the config file doesn't exist...
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-current-context-error-message',{ error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function setCurrentContext(kubectlExe, context, options) {
  const args = [ 'config', 'use-context', context ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(() => {
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-use-context-error-message', { context: context, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getContexts(kubectlExe, options) {
  const args = [ 'config', 'get-contexts', '--output=name' ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(currentContext => {
      results['contexts'] = currentContext.trim().split('\n');
      getLogger().debug('getContexts result = %s', results['contexts']);
      resolve(results);
    }).catch(err => {
      // kubectl config get-contexts returns an error if the config file doesn't exist...
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-get-contexts-error-message',{ error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getK8sConfigView(kubectlExe, options) {
  const args = [ 'config', 'view', '-o', 'json'];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(configView => {
      results['configView'] = JSON.parse(configView);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-config-view-error-message', { error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getK8sClusterInfo(kubectlExe, options) {
  const args = [ 'cluster-info'];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(clusterInfo => {
      results['clusterInfo'] = clusterInfo;
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-cluster-info-error-message', { error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getWkoDomainStatus(kubectlExe, domainUID, domainNamespace, options) {
  const args = [ 'get', 'domain', domainUID, '-n', domainNamespace, '-o', 'json'];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(domainStatus => {
      results['domainStatus'] = JSON.parse(domainStatus);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-get-wko-domain-status-error-message', { error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getOperatorStatus(kubectlExe, operatorNamespace, options) {
  const args = [ 'get', 'pods', '-n', operatorNamespace, '-o', 'json'];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(operatorStatus => {
      results['operatorStatus'] = JSON.parse(operatorStatus);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-get-operator-status-error-message', { error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getOperatorVersion(kubectlExe, operatorNamespace, options) {
  const args = [ 'logs', '-n', operatorNamespace, '-c', 'weblogic-operator', 'deployments/weblogic-operator'];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise((resolve) => {
    const _kubectlChildProcess = spawnDaemonChildProcess(kubectlExe, args, env);
    _kubectlChildProcess.on('error', (err) => {
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-get-operator-version-error-message', { error: getErrorMessage(err) });
      resolve(results);
    });
    _kubectlChildProcess.on('exit', (code) => {
      getLogger().debug('kubectl command to get the operator version from the pod log exited with code %s', code);
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-get-operator-version-no-version-message', { code });
    });

    const stdoutLines = readline.createInterface({ input: _kubectlChildProcess.stdout });
    const stderrLines = readline.createInterface({ input: _kubectlChildProcess.stderr });

    let foundVersion = false;
    const versionRegex = /^Oracle WebLogic Kubernetes Operator, version:\s*(\d+\.\d+\.\d+).*$/;
    stdoutLines.on('line', (line) => {
      if (!foundVersion) {
        const parseEntry = _parseLogEntryAsJson(line);
        if (typeof parseEntry !== 'undefined') {
          const message = parseEntry.message || '';
          const matcher = message.match(versionRegex);

          if (Array.isArray(matcher) && matcher.length > 1) {
            foundVersion = true;
            results.version = matcher[1];
            getLogger().debug('Found installed operator version %s', results.version);
            resolve(results);
          }
        }
      }
    });
    stderrLines.on('line', (line) => {
      getLogger().debug('kubectl logs for operator pod stderr: %s', line.trim());
    });
  });
}

async function getOperatorVersionFromDomainConfigMap(kubectlExe, domainNamespace, options) {
  const args = [ 'get', 'configmap', 'weblogic-scripts-cm', '-n', domainNamespace, '-o',
    'jsonpath={.metadata.labels.weblogic\\.operatorVersion}'];

  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);

  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(operatorVersion => {
      results['operatorVersion'] = operatorVersion;
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-get-operator-version-from-cm-error-message',{ error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function verifyClusterConnectivity(kubectlExe, options) {
  const args = [ 'version', '-o', 'json' ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(stdout => {
      if (stdout) {
        const jsonOutput = JSON.parse(stdout);
        results.clientVersion = jsonOutput?.clientVersion?.gitVersion;
        getLogger().debug('Kubernetes Client Version = %s', results.clientVersion);
        if (jsonOutput?.serverVersion?.gitVersion) {
          results.serverVersion = jsonOutput?.serverVersion?.gitVersion;
          getLogger().debug('Kubernetes Server Version = %s', results.serverVersion);
        }
      }
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason =
        i18n.t('kubectl-verify-failed-error-message', { error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function validateNamespacesExist(kubectlExe, options, ...namespaces) {
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);

  const result = {
    isSuccess: true,
    isValid: true,
    missingNamespaces: []
  };

  for (const namespace of namespaces) {
    const args = [ 'get', 'namespace', namespace ];

    try {
      await executeFileCommand(kubectlExe, args, env);
    } catch (err) {
      if (isNotFoundError(err)) {
        result.isValid = false;
        result.missingNamespaces.push(namespace);
      } else {
        result.isSuccess = false;
        result.reason = getErrorMessage(err);
        return Promise.resolve(result);
      }
    }
  }
  return Promise.resolve(result);
}

async function validateDomainExist(kubectlExe, options, domain, namespace) {
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);

  const result = {
    isSuccess: true,
    isValid: true,
  };

  const args = [ 'get', 'domain', domain, '-n', namespace ];
  try {
    await executeFileCommand(kubectlExe, args, env);
  } catch (err) {
    if (isNotFoundError(err)) {
      result.isValid = false;
    } else {
      result.isSuccess = false;
      result.reason = getErrorMessage(err);
      return Promise.resolve(result);
    }
  }
  return Promise.resolve(result);
}

async function isOperatorAlreadyInstalled(kubectlExe, operatorNamespace, options) {
  // We are currently using kubectl to see if the operator deployment exists.  The operator deployment
  // name is always weblogic-operator...
  //
  const args = [ 'get', 'deployment', 'weblogic-operator', '-n', operatorNamespace, '--output=json' ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isInstalled: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, args, env).then(deploymentJson => {
      try {
        const operatorDeployment = JSON.parse(deploymentJson);
        const imageTag = getOperatorImageTag(operatorDeployment);
        results['image'] = getOperatorImageWithoutVersion(imageTag);
        results['version'] = getOperatorImageVersion(imageTag);
      } catch (err) {
        getLogger().error('Failed to parse operator deployment JSON: %s', err);
      }
      resolve(results);
    }).catch(err => {
      results.isInstalled = false;
      if (!isNotFoundError(err)) {
        results.reason = i18n.t('kubectl-is-operator-installed-failed-error-message',
          { operatorNamespace: operatorNamespace, error: getErrorMessage(err) });
      }
      resolve(results);
    });
  });
}

async function createNamespacesIfNotExists(kubectlExe, options, ...namespaces) {
  let results;
  for (const namespace of namespaces) {
    results = await createNamespaceIfNotExists(kubectlExe, namespace, options);
    if (!results.isSuccess) {
      break;
    }
  }
  return Promise.resolve(results);
}

async function createNamespaceIfNotExists(kubectlExe, namespace, options) {
  const getArgs = [ 'get', 'namespaces', '--output=json' ];
  const createArgs = [ 'create', 'namespace', namespace ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, getArgs, env).then(namespaceJson => {
      if (doesNamedObjectExist(namespaceJson, namespace)) {
        return resolve(results);
      }

      executeFileCommand(kubectlExe, createArgs, env).then(() => resolve(results)).catch(err => {
        results.isSuccess = false;
        results.reason = i18n.t('kubectl-create-ns-failed-error-message',
          { namespace: namespace, error: getErrorMessage(err) });
        resolve(results);
      });
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-get-nss-failed-error-message',
        { namespace: namespace, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function deleteObjectIfExists(kubectlExe, namespace, object, kind, options) {
  let getArgs;
  let deleteArgs;
  if (kind === 'namespace') {
    getArgs = [ 'get', kind, object, '--output=json' ];
    deleteArgs = [ 'delete', kind, object ];
  } else {
    getArgs = [ 'get', '-n', namespace, kind, object, '--output=json' ];
    deleteArgs = [ 'delete', kind, object, '-n', namespace ];
  }

  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, getArgs, env).then(objectJson => {
      const result = JSON.parse(objectJson);
      if (result.metadata.name === object) {
        executeFileCommand(kubectlExe, deleteArgs, env).then(() => resolve(results)).catch(err => {
          results.isSuccess = false;
          results.reason = i18n.t('kubectl-delete-object-failed-error-message',
            { object: object, namespace: namespace, error: getErrorMessage(err) });
          resolve(results);
        });
      }
      resolve(results);
    }).catch(err => {
      if (!isNotFoundError(err)) {
        results.isSuccess = false;
        results.reason = i18n.t('kubectl-delete-object-failed-error-message',
          { object: object, namespace: namespace, error: getErrorMessage(err) });
      }
      resolve(results);
    });
  });
}

async function createNamespaceLabelIfNotExists(kubectlExe, namespace, labels, options) {
  const getArgs = [ 'get', 'namespace', namespace, '--output=json' ];
  // overwrite is needed since our detection of the labels existing only returns true if both the key and value matches.
  const createArgs = [ 'label', '--overwrite', 'namespace', namespace ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, getArgs, env).then(namespaceJson => {
      const labelsToWrite = getLabelsToWrite(namespaceJson, labels);
      if (labelsToWrite.length > 0) {
        createArgs.push(...labelsToWrite);
      } else {
        return resolve(results);
      }

      executeFileCommand(kubectlExe, createArgs, env).then(() => resolve(results)).catch(err => {
        results.isSuccess = false;
        results.reason = i18n.t('kubectl-label-ns-failed-error-message',
          { namespace: namespace, labels: JSON.stringify(labels), error: getErrorMessage(err) });
        resolve(results);
      });
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-label-get-ns-failed-error-message',
        { namespace: namespace, label: JSON.stringify(labels), error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function createServiceAccountIfNotExists(kubectlExe, namespace, serviceAccount, options) {
  const getArgs = [ 'get', 'serviceaccounts', '-n', namespace, '--output=json' ];
  const createArgs = [ 'create', 'serviceaccount', serviceAccount, '-n', namespace ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, getArgs, env).then((serviceAccountsJson) => {
      if (doesNamedObjectExist(serviceAccountsJson, serviceAccount)) {
        return resolve(results);
      }

      executeFileCommand(kubectlExe, createArgs, env).then(() => resolve(results)).catch(err => {
        results.isSuccess = false;
        results.reason = i18n.t('kubectl-create-sa-failed-error-message',
          { serviceAccount: serviceAccount, namespace: namespace, error: getErrorMessage(err) });
        resolve(results);
      });
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-get-sas-failed-error-message',
        { serviceAccount: serviceAccount, namespace: namespace, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function createOrReplacePullSecret(kubectlExe, namespace, secret, secretData, options) {
  const createArgs = [ 'create', 'secret', 'docker-registry', secret, '-n', namespace,
    `--docker-username=${secretData.username}`, `--docker-email=${secretData.email}`,
    `--docker-password=${secretData.password}`
  ];
  if (secretData.server) {
    createArgs.push(`--docker-server=${secretData.server}`);
  }
  const errorKeys = {
    get: 'kubectl-get-pull-secrets-failed-error-message',
    delete: 'kubectl-delete-pull-secret-failed-error-message',
    create: 'kubectl-create-pull-secret-failed-error-message'
  };

  return createOrReplaceSecret(kubectlExe, namespace, secret, createArgs, errorKeys, options);
}

async function createOrReplaceGenericSecret(kubectlExe, namespace, secret, secretData, options) {
  const createArgs = [ 'create', 'secret', 'generic', secret, '-n', namespace ];
  for (const [key, value] of Object.entries(secretData)) {
    createArgs.push(`--from-literal=${key}=${value}`);
  }

  const errorKeys = {
    get: 'kubectl-get-generic-secrets-failed-error-message',
    delete: 'kubectl-delete-generic-secret-failed-error-message',
    create: 'kubectl-create-generic-secret-failed-error-message'
  };

  return createOrReplaceSecret(kubectlExe, namespace, secret, createArgs, errorKeys, options);
}

async function createOrReplaceTLSSecret(kubectlExe, namespace, secret, key, cert, options) {
  const createArgs = [ 'create', 'secret', 'tls', secret, '--key', key, '--cert', cert, '-n', namespace ];

  const errorKeys = {
    get: 'kubectl-get-generic-secrets-failed-error-message',
    delete: 'kubectl-delete-generic-secret-failed-error-message',
    create: 'kubectl-create-generic-secret-failed-error-message'
  };

  return createOrReplaceSecret(kubectlExe, namespace, secret, createArgs, errorKeys, options);
}

async function getServiceDetails(kubectlExe, namespace, serviceName, options) {
  const getArgs = [ 'get', 'services' ];
  if (serviceName) {
    getArgs.push(serviceName);
  }
  getArgs.push('-n', namespace, '--output=json');
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, getArgs, env).then((serviceDetailsJson) => {
      results.serviceDetails = JSON.parse(serviceDetailsJson);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-get-service-details-error-message',
        {namespace: namespace, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function getIngresses(kubectlExe, namespace, serviceType, options) {
  const getArgs = [ 'get', serviceType ];
  getArgs.push('-n', namespace, '--output=json');
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(kubectlExe, getArgs, env).then((serviceDetailsJson) => {
      results.serviceDetails = JSON.parse(serviceDetailsJson);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('kubectl-get-ingresses-error-message',
        {namespace: namespace, error: getErrorMessage(err), type: serviceType });
      resolve(results);
    });
  });
}

async function apply(kubectlExe, fileData, options) {
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);

  const result = {
    isSuccess: true
  };

  return new Promise(resolve => {
    fsUtils.writeTempFile(fileData, { baseName: 'k8sApplyData', extension: '.yaml' }).then(fileName => {
      const args = [ 'apply', '-f', fileName ];
      executeFileCommand(kubectlExe, args, env).then(stdout => {
        getLogger().debug('kubectl apply returned: %s', stdout);
        fsUtils.recursivelyRemoveTemporaryFileDirectory(fileName).then(() => resolve(result)).catch(err => {
          getLogger().warn('kubectlUtils.apply() failed to remove temporary file %s: %s', fileName, err);
          resolve(result);
        });
      }).catch(err => {
        result.isSuccess = false;
        result.reason = i18n.t('kubectl-apply-failed-error-message', { error: getErrorMessage(err) });
        fsUtils.recursivelyRemoveTemporaryFileDirectory(fileName).then(() => resolve(result)).catch(fileErr => {
          getLogger().warn('kubectlUtils.apply() failed to remove temporary file %s: %s', fileName, fileErr);
          resolve(result);
        });
      });
    }).catch(err => {
      result.isSuccess = false;
      result.reason = i18n.t('kubectl-apply-write-file-failed-error-message', { error: getErrorMessage(err) });
      resolve(result);
    });
  });
}

function getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts) {
  let env = {
    PATH: process.env.PATH
  };
  if (options) {
    if (options.kubeConfig && Array.isArray(options.kubeConfig) && options.kubeConfig.length > 0) {
      env['KUBECONFIG'] = options.kubeConfig.join(path.delimiter);
      getLogger().debug('Set KUBECONFIG environment variable to %s', env['KUBECONFIG']);
    }
    if (options.extraPathDirectories && Array.isArray(options.extraPathDirectories) && options.extraPathDirectories.length > 0) {
      env['PATH'] = env['PATH'] + path.delimiter + options.extraPathDirectories.join(path.delimiter);
    }
    getLogger().debug('Set PATH environment variable to %s', env['PATH']);
  }

  if (httpsProxyUrl) {
    env['HTTPS_PROXY'] = httpsProxyUrl;
    getLogger().debug('Set HTTPS_PROXY environment variable to %s', env['HTTPS_PROXY']);
  }
  if (bypassProxyHosts) {
    env['NO_PROXY'] = bypassProxyHosts;
    getLogger().debug('Set NO_PROXY environment variable to %s', env['NO_PROXY']);
  }

  if (!osUtils.isWindows()) {
    env['HOME'] = process.env.HOME;
  } else {
    env['USERPROFILE'] = process.env.USERPROFILE;
    env['PROGRAMDATA'] = process.env.PROGRAMDATA;
  }

  if (options?.extraEnvironmentVariables) {
    const extraEnvironmentVariables =
      osUtils.removeProtectedEnvironmentVariables(options.extraEnvironmentVariables);
    env = Object.assign(env, extraEnvironmentVariables);
  }
  return env;
}

function getOperatorImageTag(operatorDeployment) {
  let imageTag;
  if (operatorDeployment.spec?.template?.spec?.containers) {
    const containers = operatorDeployment.spec.template.spec.containers;

    for (const container of containers) {
      if (container.name === 'weblogic-operator') {
        imageTag = container.image;
        break;
      }
    }
  }
  return imageTag;
}

function getOperatorImageWithoutVersion(imageTag) {
  const imageComponents = k8sUtils.splitImageNameAndVersion(imageTag);
  return imageComponents.name;
}

function getOperatorImageVersion(imageTag) {
  const imageComponents = k8sUtils.splitImageNameAndVersion(imageTag);
  return imageComponents.version;
}

function doesNamedObjectExist(objectListJson, name) {
  let result = false;
  if (objectListJson) {
    const objectList = JSON.parse(objectListJson);
    const objects = objectList.items;
    for (const object of objects) {
      if (object.metadata && object.metadata.name === name) {
        result = true;
        break;
      }
    }
  }
  return result;
}

function getLabelsToWrite(objectJson, newLabels) {
  const result = [];
  if (newLabels.length > 0) {
    const existingLabels = objectJson ? (JSON.parse(objectJson).metadata?.labels || {}) : {};
    for (const newLabel of newLabels) {
      const newLabelComps = newLabel.split('=', 2);
      const newKey = newLabelComps[0];
      const newValue = newLabelComps.length > 1 ? newLabelComps[1] : undefined;

      if (!(Object.hasOwnProperty.call(existingLabels, newKey) && existingLabels[newKey] === newValue)) {
        result.push(newLabel);
      }
    }
  }
  return result;
}

async function createOrReplaceSecret(kubectlExe, namespace, secret, createArgs, errorKeys, options) {
  const getArgs = [ 'get', 'secrets', '-n', namespace, '--output=json' ];
  const deleteArgs = [ 'delete', 'secret', secret, '-n', namespace ];

  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();

  const env = getKubectlEnvironment(options, httpsProxyUrl, bypassProxyHosts);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    const createErrorTemplateKey = errorKeys.create;
    executeFileCommand(kubectlExe, getArgs, env).then(secretsJson => {
      if (doesNamedObjectExist(secretsJson, secret)) {
        executeFileCommand(kubectlExe, deleteArgs, env).then(() => {
          doCreateSecret(kubectlExe, createArgs, env, namespace, secret, resolve, results, createErrorTemplateKey);
        }).catch(err => {
          results.isSuccess = false;
          results.reason = i18n.t(errorKeys.delete, { namespace: namespace, secret: secret, error: getErrorMessage(err) });
          resolve(results);
        });
      } else {
        doCreateSecret(kubectlExe, createArgs, env, namespace, secret, resolve, results, createErrorTemplateKey);
      }
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t(errorKeys.get, { namespace: namespace, secret: secret, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function doCreateSecret(kubectlExe, createArgs, env, namespace, secret, resolve, results, key) {
  executeFileCommand(kubectlExe, createArgs, env, true).then(() => {
    resolve(results);
  }).catch(err => {
    results.isSuccess = false;
    results.reason = i18n.t(key,{ namespace: namespace, secret: secret, error: getErrorMessage(err) });
    results.reason = maskPasswordInCommand(results.reason);
    resolve(results);
  });
}

function maskPasswordInCommand(err) {
  // How about other cases?
  return err.replace(/--docker-password=[^\s]+/, '--docker-password=*****');
}

function isNotFoundError(err) {
  const errString = getErrorMessage(err);
  return /\(NotFound\)/.test(errString);
}

function _parseLogEntryAsJson(logEntry) {
  let result;

  try {
    result = JSON.parse(logEntry);
  } catch (err) {
    // Assume the entry is not in JSON format and return undefined
  }
  return result;
}

module.exports = {
  apply,
  createNamespaceIfNotExists,
  createNamespacesIfNotExists,
  createNamespaceLabelIfNotExists,
  createOrReplaceGenericSecret,
  createOrReplacePullSecret,
  createOrReplaceTLSSecret,
  createServiceAccountIfNotExists,
  getContexts,
  getCurrentContext,
  getOperatorVersion,
  isOperatorAlreadyInstalled,
  setCurrentContext,
  validateKubectlExe,
  deleteObjectIfExists,
  getServiceDetails,
  getIngresses,
  getK8sConfigView,
  getK8sClusterInfo,
  getWkoDomainStatus,
  getOperatorStatus,
  getOperatorVersionFromDomainConfigMap,
  validateNamespacesExist,
  validateDomainExist,
  verifyClusterConnectivity,
};
