/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const kubectlUtils = require('./kubectlUtils');
const { getLogger } = require('./wktLogging');

async function deployComponents(kubectlExe, components, kubectlOptions) {
  if (!Array.isArray(components)) {
    components = [components];
  }

  let result = { isSuccess: true };
  for (const component of components) {
    result = await kubectlUtils.apply(kubectlExe, component, kubectlOptions);
    if (!result.isSuccess) {
      break;
    }
  }
  return Promise.resolve(result);
}

async function undeployComponents(kubectlExe, componentNames, namespace, kubectlOptions) {
  if (!Array.isArray(componentNames)) {
    componentNames = [ componentNames ];
  }

  let result = { isSuccess: true };
  for (const componentName of componentNames) {
    result = await kubectlUtils.deleteObjectIfExists(kubectlExe, namespace, componentName, 'Component', kubectlOptions);
    if (!result.isSuccess) {
      break;
    }
  }
  return Promise.resolve(result);
}

async function getComponentNamesByNamespace(kubectlExe, namespace, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.getKubernetesObjectsByNamespace(kubectlExe, kubectlOptions, 'component', namespace).then(result => {
      if (!result.isSuccess) {
        return resolve(result);
      }

      result.payload = result.payload.map(component => component.metadata?.name);
      resolve(result);
    });
  });
}

async function getSecretNamesByNamespace(kubectlExe, namespace, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.getKubernetesObjectsByNamespace(kubectlExe, kubectlOptions, 'secret', namespace).then(result => {
      if (!result.isSuccess) {
        return resolve(result);
      }

      result.payload = result.payload.map(secret => secret.metadata?.name);
      resolve(result);
    });
  });
}

async function getVerrazzanoClusterNames(kubectlExe, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.getKubernetesObjectsByNamespace(kubectlExe, kubectlOptions, 'VerrazzanoManagedCluster', 'verrazzano-mc').then(result => {
      if (!result.isSuccess) {
        getLogger().debug('result.reason = %s', result.reason);

        return resolve(result);
      }

      result.payload = result.payload.map(vmc => vmc.metadata?.name);
      result.payload.splice(0, 0, 'local');
      resolve(result);
    });
  });
}

module.exports = {
  deployComponents,
  getComponentNamesByNamespace,
  getSecretNamesByNamespace,
  getVerrazzanoClusterNames,
  undeployComponents,
};
