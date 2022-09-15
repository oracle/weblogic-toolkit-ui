/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

function compareVersions(version, minimumVersion) {
  const versionComponents = version.split(/[.-]/);
  const minimumVersionComponents = minimumVersion.split(/[.-]/);

  // Fix up the minimum version components to have the correct number of places...
  if (minimumVersionComponents.length !== 4) {
    const len = minimumVersionComponents.length;
    const isSnapshot = minimumVersionComponents[len - 1] === 'SNAPSHOT';
    if (len !== 3 || isSnapshot) {
      const missingDigits = isSnapshot ? 4 - len : 3 - len;
      const insertPosition = isSnapshot ? len - 2 : len - 1;
      for (let i = 0; i < missingDigits; i++) {
        minimumVersionComponents.splice(insertPosition, 0, '0');
      }
    }
  }

  // Iterate over the version elements now that the minimum version elements is fully specified...
  let result = 0;
  for (let i = 0; i < 3; i++) {
    const versionNumber = Number(versionComponents[i]);
    const minVersionNumber = Number(minimumVersionComponents[i]);

    if (versionNumber < minVersionNumber) {
      result = -1;
      break;
    } else if (versionNumber > minVersionNumber) {
      result = 1;
      break;
    }
  }

  if (result === 0) {
    const versionIsSnapshot = versionComponents.length === 4;
    const minimumVersionIsSnapshot = minimumVersionComponents.length === 4;
    if (versionIsSnapshot && !minimumVersionIsSnapshot) {
      result = -1;
    } else if (!versionIsSnapshot && minimumVersionIsSnapshot) {
      result = 1;
    }
  }
  return result;
}

function getMinorVersionCompatibilityVersionString(version) {
  let result = version;
  if (version) {
    const components = result.split('.', 3);
    if (components[2]) {
      components[2] = 'x';
    }
    result = components.join('.');
  }
  return result;
}

module.exports = {
  compareVersions,
  getMinorVersionCompatibilityVersionString,
};
