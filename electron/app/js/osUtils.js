/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
// Be careful what you put in terms of require statements in this file
// since it is used during bootstrapping of the app.
//
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

module.exports = {
  getArgv,
  isLinux,
  isMac,
  isWindows
};
