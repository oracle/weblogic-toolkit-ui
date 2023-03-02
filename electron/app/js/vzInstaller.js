/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const githubUtils = require('./githubUtils');
const kubectlUtils = require('./kubectlUtils');
const i18n = require('./i18next.config');
const { compareVersions } = require('./versionUtils');

const VZ_BASE_API_URL = 'https://api.github.com/repos/verrazzano/verrazzano';
const VZ_BASE_URL = 'https://github.com/verrazzano/verrazzano';

async function getVerrazzanoReleaseVersions(minVersion = '1.3.0') {
  return new Promise(resolve => {
    githubUtils.getReleaseVersions('Verrazzano', VZ_BASE_API_URL).then(results => {
      const mappedResults = [];
      results.forEach(result => {
        const version = getVersionFromTag(result.tag);
        // Filter out versions less than the minimum we want to support...
        if (compareVersions(version, minVersion) >= 0) {
          mappedResults.push({ ...result, version });
        }
      });
      resolve(mappedResults);
    });
  });
}

async function isVerrazzanoInstalled(kubectlExe, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.isVerrazzanoInstalled(kubectlExe, kubectlOptions).then(vzInstallData => {
      if (vzInstallData.isInstalled) {
        _normalizeVersionData(vzInstallData);
      }
      resolve(vzInstallData);
    });
  });
}

async function installVerrazzanoPlatformOperator(kubectlExe, k8sOptions, vzOptions) {
  let platformOperatorUrl;

  if (vzOptions.tag) {
    const version = vzOptions.tag.slice(1);
    if (compareVersions(version, '1.4.0') >= 0) {
      platformOperatorUrl = `${VZ_BASE_URL}/releases/download/${vzOptions.tag}/verrazzano-platform-operator.yaml`;
    } else {
      // Before Verrazzano 1.4, the operator file name was operator.yaml...
      //
      platformOperatorUrl = `${VZ_BASE_URL}/releases/download/${vzOptions.tag}/operator.yaml`;
    }
    platformOperatorUrl = `${VZ_BASE_URL}/releases/download/${vzOptions.tag}/operator.yaml`;
  } else {
    platformOperatorUrl = `${VZ_BASE_URL}/releases/latest/verrazzano-platform-operator.yaml`;
  }

  return new Promise(resolve => {
    kubectlUtils.applyUsingUrl(kubectlExe, platformOperatorUrl, k8sOptions).then(result => resolve(result));
  });
}

// eslint-disable-next-line no-unused-vars
async function verifyVerrazzanoPlatformOperatorInstall(kubectlExe, k8sOptions, _vzOptions) {
  return kubectlUtils.verifyVerrazzanoPlatformOperatorRollout(kubectlExe, k8sOptions);
}

async function installVerrazzano(kubectlExe, k8sOptions, verrazzanoResource) {
  return new Promise(resolve => {
    kubectlUtils.verifyVerrazzanoPlatformOperatorRollout(kubectlExe, k8sOptions).then(verifyResult => {
      if (!verifyResult.isSuccess) {
        verifyResult.reason = i18n.t('vz-installer-operator-not-ready-error-message', verifyResult.reason);
        return resolve(verifyResult);
      }

      kubectlUtils.apply(kubectlExe, verrazzanoResource, k8sOptions).then(applyResult => {
        resolve(applyResult);
      });
    });
  });
}

async function verifyVerrazzanoInstallStatus(kubectlExe, k8sOptions, vzOptions) {
  const status = {
    isSuccess: true,
    isComplete: false,
  };

  return new Promise(resolve => {
    kubectlUtils.getVerrazzanoInstallationObject(kubectlExe, k8sOptions).then(result => {
      if (!result.isSuccess) {
        status.isSuccess = false;

        // Two possible cases:
        //     1. Verrazzano CRD is not installed
        //     2. Some lower-level error in finding the Verrazzano object
        //
        if (_isVerrazzanoDefinitionNotFound(result.reason)) {
          status.reason = i18n.t('vz-installer-check-install-status-no-resource-error-message');
        } else {
          status.reason = i18n.t('vz-installer-check-install-status-failed-error-message', { name: vzOptions.name, error: result.reason });
        }
      } else {
        // Two possible scenarios:
        //    1. Verrazzano installed but under a different name (this is a failure condition).
        //    2. Verrazzano installed with the same name.
        //
        const vzObject = result.payload;
        _getStatusFromConditions(result.payload, status);
        if (vzOptions.name !== vzObject.metadata?.name) {
          status.isSuccess = false;
          status.reason = i18n.t('vz-installer-check-install-status-mismatched-names-error-message',
            { name: vzObject.metadata?.name, version: status.version });
        }
      }
      resolve(status);
    });
  });
}

function _isVerrazzanoDefinitionNotFound(vzErrorMessage) {
  return vzErrorMessage.includes('server doesn\'t have a resource type "verrazzano"');
}

function _getStatusFromConditions(vzObject, status) {
  const version = vzObject.status?.version;
  const conditions = vzObject.status?.conditions || [];

  let latestCondition;
  let latestConditionTime = 0;
  for (const condition of conditions) {
    const conditionTime = _convertTimeStringToTime(condition['lastTransitionTime']) || 0;
    if (conditionTime > latestConditionTime) {
      latestConditionTime = conditionTime;
      latestCondition = condition;
    }
  }

  status.payload = latestCondition;
  if (latestCondition &&
      (latestCondition.type === 'InstallComplete' || latestCondition.type === 'UpgradeComplete') &&
      Boolean(latestCondition.status)) {
    status.isComplete = true;
    status.version = version;
    _normalizeVersionData(status);
  }
}

function _convertTimeStringToTime(str) {
  if (typeof str === 'string') {
    return new Date(str).getTime();
  } else if (typeof str === 'object' && typeof str.getTime === 'function') {
    return str.getTime();
  } else {
    return str;
  }
}

function getVersionFromTag(tag) {
  return tag.slice(1);
}

function getTagFromVersion(version) {
  return `v${version}`;
}

function _normalizeVersionData(vzInstallData) {
  if (vzInstallData.version) {
    const firstDashIndex = vzInstallData.version.indexOf('-');
    if (firstDashIndex !== -1) {
      vzInstallData.version = vzInstallData.version.substring(0, firstDashIndex);
      vzInstallData.tag = getTagFromVersion(vzInstallData.version);
    }
  }
}

module.exports = {
  getVerrazzanoReleaseVersions,
  installVerrazzano,
  installVerrazzanoPlatformOperator,
  isVerrazzanoInstalled,
  verifyVerrazzanoInstallStatus,
  verifyVerrazzanoPlatformOperatorInstall,
};
