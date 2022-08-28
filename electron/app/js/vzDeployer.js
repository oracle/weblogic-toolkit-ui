/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const kubectlUtils = require('./kubectlUtils');

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

module.exports = {
  deployComponents,
  undeployComponents,
};
