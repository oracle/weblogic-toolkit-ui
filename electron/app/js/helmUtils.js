/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const path = require('path');

const i18n = require('./i18next.config');
const fsUtils = require('./fsUtils');
const { executeFileCommand } = require('./childProcessExecutor');
const { getLogger } = require('./wktLogging');
const { getHttpsProxyUrl, getBypassProxyHosts } = require('./userSettings');
const { getErrorMessage } = require('./errorUtils');
const osUtils = require('./osUtils');

const _wkoHelmChartUrl = 'https://oracle.github.io/weblogic-kubernetes-operator/charts/';
const _wkoHelmChartRepoName = 'weblogic-operator';
const _wkoHelmChartName = `${_wkoHelmChartRepoName}/weblogic-operator`;

/* global process */
async function validateHelmExe(helmExe) {
  const results = {
    isValid: true
  };

  if (!helmExe) {
    results.isValid = false;
    results.reason = i18n.t('helm-not-specified-error-message');
    return Promise.resolve(results);
  }

  return new Promise(resolve => {
    fsUtils.exists(helmExe).then(doesExist => {
      if (!doesExist) {
        results.isValid = false;
        results.reason = i18n.t('helm-not-exists-error-message', { filePath: helmExe });
      }
      resolve(results);
    }).catch(err => {
      results.isValid = false;
      results.reason = i18n.t('helm-exists-failed-error-message',
        { filePath: helmExe, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function addOrUpdateWkoHelmChart(helmExe, helmOptions) {
  return addOrUpdateHelmChart(helmExe, _wkoHelmChartRepoName, _wkoHelmChartUrl, helmOptions);
}

async function addOrUpdateHelmChart(helmExe, repoName, repoUrl, helmOptions) {
  const args = [ 'repo', 'add', repoName, repoUrl, '--force-update' ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getHelmEnv(httpsProxyUrl, bypassProxyHosts, helmOptions);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(helmExe, args, env).then(() => resolve(results)).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('helm-repo-add-failed-error-message',
        { helmRepo: repoName, error: getErrorMessage(err) });
      getLogger().error(results.reason);
      getLogger().error(err);
      resolve(results);
    });
  });
}

async function installIngressController(helmExe, ingressControllerName, ingressChartName,  ingressControllerNamespace,
  helmChartValues, helmOptions) {
  const args = [ 'install', ingressControllerName, ingressChartName, '--namespace', ingressControllerNamespace ];
  processHelmChartValues(args, helmChartValues);
  processHelmOptions(args, helmOptions);
  args.push('--wait');

  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getHelmEnv(httpsProxyUrl, bypassProxyHosts, helmOptions);
  const results = {
    isSuccess: true
  };
  return new Promise(resolve => {
    executeFileCommand(helmExe, args, env).then(() => resolve(results)).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('helm-install-ingress-controller-failed-error-message',
        { namespace: ingressControllerNamespace, controllerName: ingressControllerName, error: getErrorMessage(err) });
      getLogger().error(results.reason);
      getLogger().error(err);
      resolve(results);
    });
  });
}

async function uninstallIngressController(helmExe, ingressName, ingressNamespace, helmOptions) {
  const args = [ 'uninstall', ingressName, '--namespace', ingressNamespace ];
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getHelmEnv(httpsProxyUrl, bypassProxyHosts, helmOptions);

  processHelmOptions(args, helmOptions);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(helmExe, args, env).then(stdout => {
      getLogger().debug(stdout);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t('helm-uninstall-ingress-failed-error-message',
        { controllerName: ingressName, namespace: ingressNamespace, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function installWko(helmExe, name, namespace, helmChartValues, helmOptions) {
  const args = [ 'install', name, _wkoHelmChartName, '--namespace', namespace ];
  processHelmChartValues(args, helmChartValues);
  processHelmOptions(args, helmOptions);
  args.push('--wait');

  return _runHelmWko(helmExe, name, namespace, args, helmOptions, 'helm-install-wko-failed-error-message');
}

async function updateWko(helmExe, name, namespace, helmChartValues, helmOptions) {
  const args = [ 'upgrade', name, _wkoHelmChartName, '--namespace', namespace, '--reuse-values' ];
  processHelmChartValues(args, helmChartValues);
  processHelmOptions(args, helmOptions);
  args.push('--wait');

  return _runHelmWko(helmExe, name, namespace, args, helmOptions, 'helm-upgrade-wko-failed-error-message');
}

async function uninstallWko(helmExe, name, namespace, helmOptions) {
  const args = [ 'uninstall', name, '--namespace', namespace ];
  processHelmOptions(args, helmOptions);

  return _runHelmWko(helmExe, name, namespace, args, helmOptions, 'helm-uninstall-wko-failed-error-message');
}


async function helmListAllNamespaces(helmExe, helmOptions) {
  const args = [ 'list', '--all-namespaces' ];
  processHelmOptions(args, helmOptions);
  args.push('-o');
  args.push('json');

  return _runHelmCommand(helmExe, args, helmOptions, 'helm-list-failed-error-message');
}

async function _runHelmWko(helmExe, name, namespace, args, helmOptions, errorKey) {
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getHelmEnv(httpsProxyUrl, bypassProxyHosts, helmOptions);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(helmExe, args, env).then(stdout => {
      getLogger().debug(stdout);
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t(errorKey, { name: name, helmChart: _wkoHelmChartName, namespace: namespace, error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

async function _runHelmCommand(helmExe, args, helmOptions, errorKey) {
  const httpsProxyUrl = getHttpsProxyUrl();
  const bypassProxyHosts = getBypassProxyHosts();
  const env = getHelmEnv(httpsProxyUrl, bypassProxyHosts, helmOptions);
  const results = {
    isSuccess: true
  };

  return new Promise(resolve => {
    executeFileCommand(helmExe, args, env).then(stdout => {
      getLogger().debug(stdout);
      results.stdout = stdout;
      resolve(results);
    }).catch(err => {
      results.isSuccess = false;
      results.reason = i18n.t(errorKey, { error: getErrorMessage(err) });
      resolve(results);
    });
  });
}

function getHelmEnv(httpsProxyUrl, bypassProxyHosts, helmOptions) {
  const env = {};
  if (httpsProxyUrl) {
    env['HTTPS_PROXY'] = httpsProxyUrl;
  }
  if (bypassProxyHosts) {
    env['NO_PROXY'] = bypassProxyHosts;
  }
  env['PATH'] = process.env.PATH;
  if (helmOptions && helmOptions.extraPathDirectories &&
    Array.isArray(helmOptions.extraPathDirectories) && helmOptions.extraPathDirectories.length > 0) {
    const extraPathDirectories = helmOptions.extraPathDirectories.join(path.delimiter);
    getLogger().debug('extraPathDirectories = %s', extraPathDirectories);
    env['PATH'] = env['PATH'] + path.delimiter + extraPathDirectories;
  }
  if (!osUtils.isWindows()) {
    env['HOME'] = process.env.HOME;
  } else {
    env['USERPROFILE'] = process.env.USERPROFILE;
    env['PROGRAMDATA'] = process.env.PROGRAMDATA;
    env['TEMP'] = process.env.TEMP;
    env['APPDATA'] = process.env.APPDATA;
  }

  const wktLogger = getLogger();
  if (wktLogger.isDebugEnabled()) {
    wktLogger.debug('Returning Helm Environment: %s', JSON.stringify(env, null, 2));
  }
  return env;
}

function processHelmChartValues(args, helmChartValues) {
  if (helmChartValues) {
    for (const [propertyName, propertyValue] of Object.entries(helmChartValues)) {
      if (propertyName === 'imagePullSecrets') {
        args.push(...formatArrayOfObjectsSetArgument(propertyName, propertyValue));
      } else if (propertyName === 'nodeSelector') {
        args.push(...formatNodeSelectorSetArgument(propertyValue));
      } else {
        args.push('--set', formatSetArgument(propertyName, propertyValue));
      }
    }
  }
}

function processHelmOptions(args, options) {
  if (options.kubeConfig && Array.isArray(options.kubeConfig) && options.kubeConfig.length > 0) {
    args.push('--kubeconfig', options.kubeConfig.join(path.delimiter));
  }
  if (options.kubeContext) {
    args.push('--kube-context', options.kubeContext);
  }
}

function formatSetArgument(name, value, addQuotes) {
  let result = `${name}=${value}`;
  if (addQuotes) {
    result = `"${result}"`;
  }
  return result;
}

function formatArrayOfObjectsSetArgument(name, objectArray) {
  const result = [];
  if (Array.isArray(objectArray)) {
    for (let i = 0; i < objectArray.length; i++) {
      const object = objectArray[i];
      for (const [key, value] of Object.entries(object)) {
        result.push('--set', formatSetArgument(`${name}[${i}].${key}`, value, true));
      }
    }
  }
  return result;
}

function formatNodeSelectorSetArgument(nodeSelectorMap) {
  const result = [];
  for (const [key, value] of Object.entries(nodeSelectorMap)) {
    result.push('--set', formatSetArgument(`nodeSelector.${_getQuotedInnerKey(key)}`, value, true));
  }
  return result;
}

function _getQuotedInnerKey(key) {
  let result = key;
  if (key.includes('.')) {
    result = `${key.replaceAll('.', '\\.')}`;
  }
  return result;
}

module.exports = {
  addOrUpdateWkoHelmChart,
  installWko,
  uninstallWko,
  updateWko,
  helmListAllNamespaces,
  installIngressController,
  uninstallIngressController,
  addOrUpdateHelmChart,
  validateHelmExe
};
