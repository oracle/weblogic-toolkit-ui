/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const path = require('path');
const osUtils = require('./osUtils');

// This module is used by the ipcRendererPreload module so be careful what you require here...
//
/* global process */
function getKubeConfig() {
  let kubeConfig;
  if (process.env.KUBECONFIG) {
    kubeConfig = process.env.KUBECONFIG.split(path.delimiter);
  } else {
    const userHomeDir = osUtils.isWindows() ? process.env.USERPROFILE : process.env.HOME;
    kubeConfig = path.normalize(path.join(userHomeDir, '.kube', 'config'));
  }
  return kubeConfig;
}

function getRegistryAddressFromImageTag(tag) {
  let result;
  if (tag && tag.length > 0) {
    const tagComponents = tag.split('/');
    if (tagComponents.length > 1) {
      const candidateRegistryAddress = tagComponents[0];

      if (candidateRegistryAddress.includes('.') ||
          candidateRegistryAddress.includes(':') ||
          candidateRegistryAddress === 'localhost') {
        result = candidateRegistryAddress;
      }
    }
  }
  return result;
}

module.exports = {
  getKubeConfig,
  getRegistryAddressFromImageTag
};
