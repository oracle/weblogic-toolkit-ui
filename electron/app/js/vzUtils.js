/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
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

async function deployProject(kubectlExe, project, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.apply(kubectlExe, project, kubectlOptions).then(result => resolve(result));
  });
}

async function deployApplication(kubectlExe, application, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.apply(kubectlExe, application, kubectlOptions).then(result => resolve(result));
  });
}

async function undeployApplication(kubectlExe, isMultiClusterApplication, applicationName, namespace, kubectlOptions) {
  const kind = isMultiClusterApplication ? 'MultiClusterApplicationConfiguration' : 'ApplicationConfiguration';

  return new Promise(resolve => {
    kubectlUtils.deleteObjectIfExists(kubectlExe, namespace, applicationName, kind, kubectlOptions).then(result => resolve(result));
  });
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

async function getHostNames(kubectlExe, applicationName, applicationNamespace, options) {
  return new Promise(resolve => {
    kubectlUtils.getVerrazzanoApplicationHostnames(kubectlExe, applicationName, applicationNamespace, options).then(result => {
      if (!result.isSuccess) {
        return resolve(result);
      }
      resolve(result);
    });
  });
}

async function getVerrazzanoClusterNames(kubectlExe, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.getKubernetesObjectsByNamespace(kubectlExe, kubectlOptions, 'VerrazzanoManagedCluster', 'verrazzano-mc').then(result => {
      if (!result.isSuccess) {
        return resolve(result);
      }

      result.payload = result.payload.map(vmc => vmc.metadata?.name);
      result.payload.splice(0, 0, 'local');
      getLogger().debug('Found verrazzano clusters: %s', result.payload);
      resolve(result);
    });
  });
}

async function getDeploymentNamesFromAllNamespaces(kubectlExe, kubectlOptions) {
  return new Promise(resolve => {
    kubectlUtils.getKubernetesObjectsFromAllNamespaces(kubectlExe, kubectlOptions, 'deployment').then(result => {
      if (!result.isSuccess) {
        return resolve(result);
      }

      result.payload = result.payload.map(deployment => `${deployment.metadata.namespace}/${deployment.metadata.name}`);
      resolve(result);
    });
  });
}

module.exports = {
  deployApplication,
  deployComponents,
  deployProject,
  getComponentNamesByNamespace,
  getDeploymentNamesFromAllNamespaces,
  getHostNames,
  getSecretNamesByNamespace,
  getVerrazzanoClusterNames,
  undeployApplication,
  undeployComponents,
};
