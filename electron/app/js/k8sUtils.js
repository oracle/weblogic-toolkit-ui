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
    kubeConfig = [ path.normalize(path.join(userHomeDir, '.kube', 'config')) ];
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

// Need to handle all possible flavors of the tag:
//
//  - my-registry/foo/image
//  - my-registry/foo/image:1.0
//  - 2001:0db8:85a3:0000:0000:8a2e:0370:7334/foo/image
//  - 2001:0db8:85a3:0000:0000:8a2e:0370:7334/foo/image:1.0
//  - my-registry:8888/foo/image
//  - my-registry:8888/foo/image:1.0
//
function splitImageNameAndVersion(imageTag) {
  let imageName = imageTag;
  let imageVersion = 'latest';
  if (imageTag) {
    const lastColon = imageTag.lastIndexOf(':');
    const firstSlash = imageTag.indexOf('/');

    // If no colon, then the imageTag is the imageName...
    if (lastColon !== -1) {
      // There may or may not be a slash in the image tag.  The important
      // thing we have to check is if the first slash (if there is one)
      // is before or after the last colon.
      //
      // If before, the colon found is separating the image name from the version.
      //
      // If after, the colon found is part of the registry address.  It could be
      // separating the port number from the DNS name/IP address, or it could be
      // part of an IPv6 address.  Either way, there is no version specified.
      //
      if (firstSlash < lastColon) {
        imageName = imageTag.slice(0, lastColon);
        imageVersion = imageTag.slice(lastColon + 1);
      }
    }
  }
  return { name: imageName, version: imageVersion };
}

module.exports = {
  getKubeConfig,
  getRegistryAddressFromImageTag,
  splitImageNameAndVersion
};
