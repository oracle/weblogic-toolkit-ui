/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { getReleaseVersions } = require('./githubUtils');
const { apply, applyUsingUrl, verifyVerrazzanoPlatformOperatorRollout } = require('./kubectlUtils');
const { compareVersions } = require('./versionUtils');

const VZ_BASE_API_URL = 'https://api.github.com/repos/verrazzano/verrazzano';
const VZ_BASE_URL = 'https://github.com/verrazzano/verrazzano';
const VZ_BETA1_SWITCH_VERSION = '1.4.0';

async function getVerrazzanoReleaseVersions() {
  return getReleaseVersions('Verrazzano', VZ_BASE_API_URL);
}

async function installVerrazzano(kubectlExe, k8sOptions, v8oOptions) {
  let platformOperatorUrl;

  if (v8oOptions.tag) {
    platformOperatorUrl = `${VZ_BASE_URL}/releases/download/${v8oOptions.tag}/operator.yaml`;
  } else {
    platformOperatorUrl = `${VZ_BASE_URL}/releases/latest/operator.yaml`;
  }

  return new Promise(resolve => {
    applyUsingUrl(kubectlExe, platformOperatorUrl, k8sOptions).then(result => {
      if (!result.isSuccess) {
        return resolve(result);
      }

      // Hard to know how long it will take for the deployment to finish so let the user
      // specify and default to 10 seconds, if they elect to not specify a value;
      //
      const waitTime = v8oOptions.waitTimeMillis || 10000;
      setTimeout(() => {
        verifyVerrazzanoPlatformOperatorRollout(kubectlExe, k8sOptions).then(verifyResult => {
          if (!verifyResult.isSuccess) {
            return resolve(verifyResult);
          }

          apply(kubectlExe, _getVerrazzanoKindData(v8oOptions), k8sOptions).then(applyResult => {
            resolve(applyResult);
          });
        });
      }, waitTime);
    });
  });
}

function _getVerrazzanoKindData(v8oOptions) {
  return {
    apiVersion: getVerrazzanoApiVersion(v8oOptions),
    kind: 'Verrazzano',
    metadata: {
      name: v8oOptions.name,
    },
    spec: {
      profile: v8oOptions.profile || 'dev',
    }
  };
}

function getVerrazzanoApiVersion(v8oOptions) {
  let result = 'UNKNOWN';
  if (v8oOptions.tag) {
    const version = v8oOptions.tag.slice(1);
    if (compareVersions(version, VZ_BETA1_SWITCH_VERSION) < 0) {
      result = 'install.verrazzano.io/v1alpha1';
    } else {
      result = 'install.verrazzano.io/v1beta1';
    }
  }
  return result;
}

module.exports = {
  getVerrazzanoReleaseVersions,
  installVerrazzano,
};
