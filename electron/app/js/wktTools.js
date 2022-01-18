/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { dialog } = require('electron');
const path = require('path');
const fsPromises = require('fs/promises');
const i18n = require('./i18next.config');
const osUtils = require('./osUtils');

/* global __dirname */
const jsDir = __dirname;

const fsUtils = require(path.join(jsDir, 'fsUtils'));
const {
  downloadWdtRelease,
  getWdtLatestReleaseName,
  getWitLatestReleaseName,
  getWkoLatestReleaseImageName,
  updateTools
} = require(path.join(jsDir, 'wktToolsInstaller'));
const { getLogger } = require(path.join(jsDir, 'wktLogging'));

const scriptExtension = osUtils.isWindows() ? '.cmd' : '.sh';
const VERSION_FILE_NAME = 'VERSION.txt';

let _toolsDirectory;
let _wdtDirectory;
let _witDirectory;
let _wkoImageName;
let _wktMode;

function initialize(wktMode) {
  _wktMode = wktMode;
}

function getDiscoverDomainShellScript() {
  return path.join(getWdtDirectory(), 'bin', 'discoverDomain' + scriptExtension);
}

function getImagetoolShellScript() {
  return path.join(getWitDirectory(), 'bin', 'imagetool' + scriptExtension);
}

function getPrepareModelShellScript() {
  return path.join(getWdtDirectory(), 'bin', 'prepareModel' + scriptExtension);
}

function getValidateModelShellScript() {
  return path.join(getWdtDirectory(), 'bin', 'validateModel' + scriptExtension);
}

function getWdtCustomConfigDirectory(config) {
  const targetDomainLocation = config.targetDomainLocation || 'mii';
  return path.join(getToolsDirectory(), 'wdt-config', targetDomainLocation);
}

function isWdtErrorExitCode(exitCode) {
  return !(exitCode === 0 | exitCode === 1);
}

function isWitErrorExitCode(exitCode) {
  return exitCode !== 0;
}

async function getWdtSupportedDomainTypes() {
  const typedefsDirectory = path.join(getWdtDirectory(), 'lib', 'typedefs');
  return new Promise((resolve, reject) => {
    fsPromises.readdir(typedefsDirectory).then(files => {
      const typeNames = [];
      if (files) {
        for (const file of files) {
          if (path.extname(file) === '.json') {
            typeNames.push(path.basename(file, '.json'));
          }
        }
      }
      resolve(typeNames);
    }).catch(err => reject(err));
  });
}

async function getLatestWkoImageName() {
  if (_wkoImageName) {
    return Promise.resolve(_wkoImageName);
  }
  return new Promise((resolve, reject) => {
    getOptions().then(options => {
      getWkoLatestReleaseImageName(options)
        .then(imageName => {
          _wkoImageName = imageName;
          resolve(imageName);
        })
        .catch(err => reject(new Error(`Failed to get the latest WebLogic Kubernetes Operator Image Name: ${err}`)));
    }).catch(err => reject(err));
  });
}

async function downloadLatestWdtInstaller(outputDirectory) {
  return new Promise((resolve, reject) => {
    getOptions().then(options => {
      downloadWdtRelease(outputDirectory, options)
        .then(installerData => resolve(installerData))
        .catch(err => reject(new Error(`Failed to download the latest WebLogic Deploy Tooling installer: ${err}`)));
    }).catch(err => reject(err));
  });
}

async function checkForUpdates(targetWindow) {
  const logger = getLogger();
  const result = [];

  const wdtInstalledReleaseName = await getInstalledWdtReleaseName();
  const witInstalledReleaseName = await getInstalledWitReleaseName();
  if (!wdtInstalledReleaseName && !witInstalledReleaseName) {
    return Promise.resolve(result);
  }

  const options = await getOptions();

  let wdtLatestReleaseName;
  if (wdtInstalledReleaseName) {
    wdtLatestReleaseName = await getWdtLatestReleaseName(options);
    if (wdtLatestReleaseName && wdtLatestReleaseName !== wdtInstalledReleaseName) {
      result.push(wdtLatestReleaseName);
    }
  } else {
    logger.debug('WebLogic Deploy Tooling is not installed so no need to check for updates');
  }

  let witLatestReleaseName;
  if (witInstalledReleaseName) {
    witLatestReleaseName = await getWitLatestReleaseName(options);
    if (witLatestReleaseName && witLatestReleaseName !== witInstalledReleaseName) {
      result.push(witLatestReleaseName);
    }
  } else {
    logger.debug('WebLogic Image Tool is not installed so no need to check for updates');
  }

  if (result.length !== 0) {
    logger.debug(`Updates available are ${result}`);
    const buttonResponse = await dialog.showMessageBox(targetWindow, {
      type: 'question',
      detail: getToolsUpdateQuestionText(result),
      buttons: [
        i18n.t('button-updateTools'),
        i18n.t('button-cancel')
      ],
      defaultId: 0,
      cancelId: 1
    });

    if (buttonResponse.response === 0) {
      await updateTools(result, getToolsDirectory(), options);
      await dialog.showMessageBox(targetWindow, {
        type: 'info',
        detail: getToolsUpdateSuccessfulText(result),
        buttons: [ i18n.t('button-ok') ]
      });
    }
  } else {
    await dialog.showMessageBox(targetWindow, {
      type: 'info',
      detail: i18n.t('dialog-noToolsUpdateMessage'),
      buttons: [ i18n.t('button-ok') ]
    });
  }
}

async function getInstalledWdtReleaseName() {
  return new Promise((resolve, reject) => {
    getReleaseName(getWdtDirectory())
      .then(releaseName => resolve(releaseName))
      .catch(err => reject(err));
  });
}

async function getInstalledWitReleaseName() {
  return new Promise((resolve, reject) => {
    getReleaseName(getWitDirectory())
      .then(releaseName => resolve(releaseName))
      .catch(err => reject(err));
  });
}

function getWdtDirectory() {
  if (!_wdtDirectory) {
    _wdtDirectory = path.join(getToolsDirectory(), 'weblogic-deploy');
  }
  return _wdtDirectory;
}

function getWitDirectory() {
  if (!_witDirectory) {
    _witDirectory = path.join(getToolsDirectory(), 'imagetool');
  }
  return _witDirectory;
}

function getToolsDirectory() {
  if (!_toolsDirectory) {
    _toolsDirectory = path.join(_wktMode.getExtraFilesDirectory(), 'tools');
  }
  return _toolsDirectory;
}

async function getReleaseName(toolBaseDir) {
  const versionFile = path.join(toolBaseDir, VERSION_FILE_NAME);
  return new Promise((resolve, reject) => {
    fsUtils.exists(versionFile)
      .then(doesExist => {
        if (doesExist) {
          fsPromises.readFile(versionFile, 'utf8')
            .then(fileContents => resolve(fileContents))
            .catch(err => reject(`Failed to read file ${versionFile}: ${err}`));
        } else {
          resolve();
        }
      })
      .catch(err => reject(`Failed to determine if ${versionFile} exists: ${err}`));
  });
}

function getToolsUpdateQuestionText(releaseNames) {
  if (releaseNames.length === 2) {
    return i18n.t('dialog-updateTwoToolsQuestionMessage', { toolName1: releaseNames[0], toolName2: releaseNames[1] });
  } else if (releaseNames.length === 1) {
    return i18n.t('dialog-updateOneToolQuestionMessage', { toolName1: releaseNames[0] });
  }
  return '';
}

function getToolsUpdateSuccessfulText(releaseNames) {
  if (releaseNames.length === 2) {
    return i18n.t('dialog-updateTwoToolsSuccessMessage', { toolName1: releaseNames[0], toolName2: releaseNames[1] });
  } else if (releaseNames.length === 1) {
    return i18n.t('dialog-updateOneToolSuccessMessage', { toolName1: releaseNames[0] });
  }
  return '';
}

async function getOptions() {
  return new Promise((resolve, reject) => {
    try {
      const httpsProxyUrl = require('./userSettings').getHttpsProxyUrl();
      if (httpsProxyUrl) {
        resolve({ httpsProxyUrl: httpsProxyUrl });
      } else {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  checkForUpdates,
  downloadLatestWdtInstaller,
  getDiscoverDomainShellScript,
  getImagetoolShellScript,
  getOptions,
  getPrepareModelShellScript,
  getInstalledWdtReleaseName,
  getInstalledWitReleaseName,
  getLatestWkoImageName,
  getValidateModelShellScript,
  getWdtCustomConfigDirectory,
  getWdtSupportedDomainTypes,
  initialize,
  isWdtErrorExitCode,
  isWitErrorExitCode
};
