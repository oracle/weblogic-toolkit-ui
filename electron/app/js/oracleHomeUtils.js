/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const { dialog } = require('electron');
const path = require('path');
const fsUtils = require('./fsUtils');
const osUtils = require('./osUtils');
const i18n = require('./i18next.config');

const _shellScriptExtension = osUtils.isWindows() ? '.cmd' : '.sh';
const _wlHomeDirNames = [ 'wlserver', 'wlserver_12.1', 'wlserver_10.3' ];
const _ohExecutables = new Map([
  [ `wlst${_shellScriptExtension}`, path.join('..', '..', '..') ],
  [ `setWLSEnv${_shellScriptExtension}`, path.join('..', '..', '..') ]
]);

/* global process */
async function tryToComputeOracleHome() {
  if (process.env.MW_HOME && await validateOracleHome(process.env.MW_HOME)) {
    return Promise.resolve(process.env.MW_HOME);
  } else if (process.env.ORACLE_HOME && await validateOracleHome(process.env.ORACLE_HOME)) {
    return Promise.resolve(process.env.ORACLE_HOME);
  }
  const oracleHome = findOracleHomeFromExecutables();
  if (oracleHome && await validateOracleHome(oracleHome)) {
    return Promise.resolve(oracleHome);
  }
  return Promise.resolve();
}

async function getSelectOracleHomeDefaultPath(currentOracleHomeValue) {
  if (currentOracleHomeValue && await validateOracleHome(currentOracleHomeValue)) {
    return Promise.resolve(currentOracleHomeValue);
  } else {
    return Promise.resolve(await tryToComputeOracleHome());
  }
}

function findOracleHomeFromExecutables() {
  let oracleHome;
  for (const [ key, relativePath ] of _ohExecutables) {
    const executableFilePath = fsUtils.getExecutableFilePath(key);
    if (executableFilePath) {
      oracleHome = path.normalize(path.join(path.dirname(executableFilePath), relativePath));
      break;
    }
  }
  return oracleHome;
}

async function validateOracleHomeNoWindow(oracleHome, errorPrefix) {
  const results = {
    isValid: true,
    reason: null
  };

  if (!oracleHome) {
    results.isValid = false;
    results.reason = `${errorPrefix}: ${i18n.t('oracle-home-not-specified')}`;
    return Promise.resolve(results);
  }

  return new Promise(resolve => {
    fsUtils.isDirectory(oracleHome).then(ohExists => {
      if (!ohExists) {
        results.isValid = false;
        results.reason = `${errorPrefix}: ${i18n.t('oracle-home-not-exists', { oracleHome: oracleHome })}`;
        return resolve(results);
      }

      findWebLogicHome(oracleHome).then(wlHome => {
        if (!wlHome) {
          results.isValid = false;
          results.reason = `${errorPrefix}: ${i18n.t('oracle-home-weblogic-home-not-found', { oracleHome: oracleHome })}`;
        }
        resolve(results);
      });
    });
  });
}

async function validateOracleHome(oracleHome) {
  if (!oracleHome) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    fsUtils.exists(oracleHome).then(ohExists => {
      if (!ohExists) {
        resolve(false);
      }

      findWebLogicHome(oracleHome).then(wlHome => resolve(!!wlHome));
    });
  });
}

// validate the Oracle home directory, showing a dialog if a problem is encountered.
async function validateOracleHomeForUI(window, oracleHomeDirectory, errorMessageKey) {
  const homeValid = await validateOracleHome(oracleHomeDirectory);
  if(!homeValid) {
    const homeDetails = oracleHomeDirectory ?
      i18n.t('dialog-invalid-oracle-home-not-valid', { oracleHome: oracleHomeDirectory }) :
      i18n.t('dialog-invalid-oracle-home-not-specified');

    await dialog.showMessageBox(window, {
      title: i18n.t('dialog-invalid-oracle-home-title'),
      message: `${i18n.t(errorMessageKey)}:\n${homeDetails}`,
      type: 'error',
      buttons: [ i18n.t('button-ok') ],
      defaultId: 0,
      cancelId: 0
    });
    return false;
  }
  return true;
}

async function findDomainsDefaultDirectory(oracleHome) {
  if (!oracleHome) {
    return Promise.resolve();
  }

  const domainDefaultPath = path.join(oracleHome, 'user_projects', 'domains');
  fsUtils.exists(domainDefaultPath).then(doesExist => {
    return Promise.resolve(doesExist ? domainDefaultPath : undefined);
  });
}

async function findWebLogicHome(oracleHome) {
  if (!oracleHome) {
    return Promise.resolve();
  }

  let wlHome;
  for (const wlHomeDirName of _wlHomeDirNames) {
    const wlHomeCandidate = path.join(oracleHome, wlHomeDirName);
    if (await fsUtils.isDirectory(wlHomeCandidate)) {
      wlHome = wlHomeCandidate;
      break;
    }
  }
  return Promise.resolve(wlHome);
}

module.exports = {
  getSelectOracleHomeDefaultPath,
  tryToComputeOracleHome,
  validateOracleHomeForUI,
  validateOracleHomeNoWindow,
  findDomainsDefaultDirectory
};
