/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const fsUtils = require('./fsUtils');
const osUtils = require('./osUtils');
const {executeFileCommand} = require('./childProcessExecutor');
const {getLogger} = require('./wktLogging');
const i18n = require('./i18next.config');

/* global process */
async function tryToComputeJavaHome() {
  if (process.env.JAVA_HOME) {
    return Promise.resolve(process.env.JAVA_HOME);
  }

  const javaExeFileName = osUtils.isWindows() ? 'java.exe' : 'java';
  const pathToJava = fsUtils.getExecutableFilePath(javaExeFileName);
  if (!pathToJava) {
    return Promise.resolve();
  }

  let pathToJavaHome = getJavaHomeFromExecutable(pathToJava);
  if (!pathToJavaHome && !osUtils.isWindows()) {
    pathToJavaHome = getJavaHomeFromOsUtility(pathToJava);
  }
  return Promise.resolve(pathToJavaHome);
}

async function validateJavaHomeNoWindow(javaHomeDirectory, errorPrefix) {
  const results = {
    isValid: true,
    reason: null
  };

  if (!javaHomeDirectory) {
    results.isValid = false;
    results.reason = `${errorPrefix}: ${i18n.t('java-home-not-specified')}`;
    return Promise.resolve(results);
  }

  if (! await fsUtils.isDirectory(javaHomeDirectory)) {
    results.isValid = false;
    results.reason = `${errorPrefix}: ${i18n.t('java-home-not-directory', { javaHome: javaHomeDirectory})}`;
    return Promise.resolve(results);
  }

  const javaExePath = path.normalize(path.join(javaHomeDirectory, 'bin', osUtils.isWindows() ? 'java.exe' : 'java'));
  if (! await fsUtils.exists(javaExePath)) {
    results.isValid = false;
    results.reason = `${errorPrefix}: ${i18n.t('java-exe-not-exists', {javaExe: javaExePath})}`;
    return Promise.resolve(results);
  }
  return Promise.resolve(results);
}

// validate the java home directory.
// show dialog if directory is not specified, or is invalid, and resolve when closed.
async function validateJavaHome(currentWindow, javaHomeDirectory, errorMessageKey) {
  try {
    if (!javaHomeDirectory) {
      await displayErrorMessage(currentWindow, errorMessageKey, 'dialog-invalid-java-home-not-specified');
      return Promise.resolve(false);
    }

    const isDir = await fsUtils.isDirectory(javaHomeDirectory);
    if (!isDir) {
      await displayErrorMessage(currentWindow, errorMessageKey, 'dialog-invalid-java-home-not-directory',
        {javaHome: javaHomeDirectory});
      return Promise.resolve(false);

    } else {
      const javaExePath = path.normalize(path.join(javaHomeDirectory, 'bin', osUtils.isWindows() ? 'java.exe' : 'java'));
      const doesExist = await fsUtils.exists(javaExePath);
      return Promise.resolve(doesExist);
    }
  } catch (err) {
    getLogger().error('Failed to determine if Java Home directory %s was an existing directory: %s', javaHomeDirectory, err);
    return Promise.resolve(false);
  }
}

async function displayErrorMessage(currentWindow, errorMessageKey, errorDetailsKey, errorDetails) {
  return dialog.showMessageBox(currentWindow, {
    title: i18n.t('dialog-invalid-java-home-title'),
    message: `${i18n.t(errorMessageKey)}: ${i18n.t(errorDetailsKey, errorDetails)}`,
    type: 'error',
    buttons: [ i18n.t('button-ok') ],
    defaultId: 0,
    cancelId: 0
  });
}

function getJavaHomeFromExecutable(pathToJava) {
  let javaHome;
  let currentDir = path.dirname(pathToJava);
  if (path.basename(currentDir) === 'bin') {
    currentDir = path.dirname(currentDir);
    if (!fsUtils.isRootDirectory(currentDir)) {
      if (path.basename(currentDir) === 'jre') {
        currentDir = path.dirname(currentDir);
        javaHome = currentDir;
      } else {
        switch (currentDir) {
          case '/usr':
          case '/usr/local':
            // Not a JAVA_HOME directory
            break;

          default:
            javaHome = currentDir;
            break;
        }
      }
    }
  }
  return javaHome;
}

async function getJavaHomeFromOsUtility(pathToJava) {
  if (osUtils.isMac()) {
    return Promise.resolve(getJavaHomeFromMacOS());
  } else if (osUtils.isLinux()) {
    return Promise.resolve(getJavaHomeFromLinux(pathToJava));
  }
  return Promise.resolve();
}

async function getJavaHomeFromMacOS() {
  const javaHomeUtil = '/usr/libexec/java_home';
  return new Promise((resolve) => {
    fsUtils.exists(javaHomeUtil)
      .then(doesExist => {
        if (!doesExist) {
          return resolve();
        }
        executeFileCommand(javaHomeUtil)
          .then(javaHome => resolve(javaHome))
          .catch(err => {
            getLogger().error(`Failed to run ${javaHomeUtil}: ${err}`);
            return resolve();
          });
      });
  });
}

async function getJavaHomeFromLinux(pathToJava) {
  return new Promise((resolve) => {
    if (!pathToJava) {
      return resolve();
    }
    fs.realpath(pathToJava, {}, (err, resolvedPath) => {
      if (err) {
        getLogger().error(`Failed to get the real path to ${pathToJava}: ${err}`);
        resolve();
      } else {
        getLogger().debug(`Real path to ${pathToJava} is ${resolvedPath}`);
        resolve(getJavaHomeFromExecutable(resolvedPath));
      }
    });
  });
}

async function getSelectJavaHomeDefaultPath(currentJavaHomeValue) {
  return new Promise(resolve => {
    let dirPath;
    if (osUtils.isWindows()) {
      dirPath = getWindowsSelectJavaHomeDefaultPath(currentJavaHomeValue);
    } else if (osUtils.isMac()) {
      dirPath = getMacOsSelectJavaHomeDefaultPath(currentJavaHomeValue);
    } else if (osUtils.isLinux()) {
      dirPath = getLinuxSelectJavaHomeDefaultPath(currentJavaHomeValue);
    } else {
      return Promise.reject(new Error(`Unsupported Platform: ${process.platform}`));
    }
    resolve(dirPath);
  });
}

async function getWindowsSelectJavaHomeDefaultPath(currentJavaHomeValue) {
  return new Promise(resolve => {
    if (currentJavaHomeValue) {
      fsUtils.exists(currentJavaHomeValue).then(currentExists => {
        if (currentExists) {
          resolve(currentJavaHomeValue);
        } else {
          resolve(process.env.PROGRAMFILES);
        }
      });
    } else {
      resolve(process.env.PROGRAMFILES);
    }
  });
}

async function getMacOsSelectJavaHomeDefaultPath(currentJavaHomeValue) {
  return _getSelectJavaHomeDefaultPath('/Library/Java/JavaVirtualMachines', currentJavaHomeValue);
}

async function getLinuxSelectJavaHomeDefaultPath(currentJavaHomeValue) {
  return _getSelectJavaHomeDefaultPath('/usr/java', currentJavaHomeValue);
}

async function _getSelectJavaHomeDefaultPath(defaultDir, currentJavaHomeValue) {
  return new Promise(resolve => {
    fsUtils.exists(defaultDir).then(defaultExists => {
      if (currentJavaHomeValue) {
        fsUtils.exists(currentJavaHomeValue).then(currentExists => {
          if (currentExists) {
            resolve(currentJavaHomeValue);
          } else if (defaultExists) {
            resolve(defaultDir);
          } else {
            resolve();
          }
        });
      } else {
        if (defaultExists) {
          resolve(defaultDir);
        } else {
          resolve();
        }
      }
    });
  });
}

module.exports = {
  getJavaHomeFromExecutable,      // for unit testing only
  getJavaHomeFromLinux,           // for unit testing only
  getJavaHomeFromMacOS,           // for unit testing only
  getSelectJavaHomeDefaultPath,
  tryToComputeJavaHome,
  validateJavaHome,
  validateJavaHomeNoWindow
};
