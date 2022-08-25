/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const jsYaml = require('js-yaml');
const githubUtils = require('./githubUtils');
const kubectlUtils = require('./kubectlUtils');
const { getLogger } = require('./wktLogging');
const i18n = require('./i18next.config');
const { compareVersions } = require('./versionUtils');

const VZ_BASE_API_URL = 'https://api.github.com/repos/verrazzano/verrazzano';
const VZ_BASE_URL = 'https://github.com/verrazzano/verrazzano';
const VZ_BETA1_SWITCH_VERSION = '1.4.0';
const VZ_MIN_VERSION = '1.3.0';

async function getVerrazzanoReleaseVersions() {
  return new Promise(resolve => {
    githubUtils.getReleaseVersions('Verrazzano', VZ_BASE_API_URL).then(results => {
      const mappedResults = [];
      results.forEach(result => {
        const version = getVersionFromTag(result.tag);
        // Filter out versions less than the minimum we want to support...
        if (compareVersions(version, VZ_MIN_VERSION) >= 0) {
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
    platformOperatorUrl = `${VZ_BASE_URL}/releases/download/${vzOptions.tag}/operator.yaml`;
  } else {
    platformOperatorUrl = `${VZ_BASE_URL}/releases/latest/operator.yaml`;
  }

  return new Promise(resolve => {
    kubectlUtils.applyUsingUrl(kubectlExe, platformOperatorUrl, k8sOptions).then(result => resolve(result));
  });
}

async function verifyVerrazzanoPlatformOperatorInstall(kubectlExe, k8sOptions, _vzOptions) {
  return kubectlUtils.verifyVerrazzanoPlatformOperatorRollout(kubectlExe, k8sOptions);
}

async function installVerrazzano(kubectlExe, k8sOptions, vzOptions) {
  return new Promise(resolve => {
    kubectlUtils.verifyVerrazzanoPlatformOperatorRollout(kubectlExe, k8sOptions).then(verifyResult => {
      if (!verifyResult.isSuccess) {
        verifyResult.reason = i18n.t('vz-installer-operator-not-ready-error-message', verifyResult.reason);
        return resolve(verifyResult);
      }

      kubectlUtils.apply(kubectlExe, _getVerrazzanoKindData(vzOptions), k8sOptions).then(applyResult => {
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
    kubectlUtils.getVerrazzanoInstallationObject(kubectlExe, k8sOptions, vzOptions.name).then(result => {
      if (!result.isSuccess) {
        status.isSuccess = false;
        status.reason = i18n.t('vz-installer-check-install-status-failed-error-message', { name: vzOptions.name, error: result.reason });
      } else {
        _getStatusFromConditions(result.payload, status);
      }

      resolve(status);
    });
  });
}

function _getVerrazzanoKindData(vzOptions) {
  const data = {
    apiVersion: getVerrazzanoApiVersion(vzOptions),
    kind: 'Verrazzano',
    metadata: {
      name: vzOptions.name,
    },
    spec: {
      profile: vzOptions.profile || 'dev',
    }
  };
  return jsYaml.dump(data);
}

function _getStatusFromConditions(vzObject, status) {
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
  if (latestCondition && latestCondition.type === 'InstallComplete' && Boolean(latestCondition.status)) {
    status.isComplete = true;
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

function getVerrazzanoApiVersion(vzOptions) {
  let result = 'UNKNOWN';
  if (vzOptions.tag) {
    const version = getVersionFromTag(vzOptions.tag);
    if (compareVersions(version, VZ_BETA1_SWITCH_VERSION) < 0) {
      result = 'install.verrazzano.io/v1alpha1';
    } else {
      result = 'install.verrazzano.io/v1beta1';
    }
  }
  return result;
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
