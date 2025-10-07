/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
// Be careful what you put in terms of require statements in this file
// since it is used during bootstrapping of the app.
//
const path = require('path');

/* global process */
function isWindows() {
  return process.platform === 'win32' || process.platform === 'cygwin' || process.platform === 'msys';
}

function isMac() {
  return process.platform === 'darwin';
}

function isLinux() {
  return process.platform === 'linux';
}

function isLinuxAppImage() {
  return process.platform === 'linux' && process.env.APPIMAGE !== undefined && process.env.APPIMAGE !== '';
}

function getArgv(name) {
  const args = process.argv;
  let result;
  if (Array.isArray(args)) {
    for (const arg of args) {
      if (arg.startsWith(name + '=')) {
        result = arg.split('=')[1];
        break;
      }
    }
  }
  return result;
}

function getPathDirectories() {
  const result = [];
  const pathEnvVar = process.env.PATH;
  if (pathEnvVar) {
    result.push(...pathEnvVar.split(path.delimiter));
  }
  return result;
}

function getEnvironmentVariables() {
  return JSON.parse(JSON.stringify(process.env));
}

function removeProtectedEnvironmentVariables(extraEnvironmentVariablesObject) {
  const envCopy = Object.assign({}, extraEnvironmentVariablesObject);

  if ('PATH' in envCopy) {
    delete envCopy['PATH'];
  }
  if ('HTTPS_PROXY' in envCopy) {
    delete envCopy['HTTPS_PROXY'];
  }
  if ('https_proxy' in envCopy) {
    delete envCopy['https_proxy'];
  }
  if ('NO_PROXY' in envCopy) {
    delete envCopy['NO_PROXY'];
  }
  if ('no_proxy' in envCopy) {
    delete envCopy['no_proxy'];
  }
  return envCopy;
}


module.exports = {
  getArgv,
  getEnvironmentVariables,
  getPathDirectories,
  isLinux,
  isLinuxAppImage,
  isMac,
  isWindows,
  removeProtectedEnvironmentVariables
};
