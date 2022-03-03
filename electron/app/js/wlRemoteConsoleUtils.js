/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const path = require('path');
const readline = require('readline');
const { app, dialog } = require('electron');
const fsPromises = require('fs/promises');

const userSettings = require('./userSettings');
const fsUtils = require('./fsUtils');
const i18n = require('./i18next.config');
const { getErrorMessage } = require('./errorUtils');
const { getLogger } = require('./wktLogging');
const osUtils = require('./osUtils');
const { sendToWindow } = require('./windowUtils');
const { spawnDaemonChildProcess } = require('./childProcessExecutor');

// TODO - Change this to the correct version once the RC version changes to 2.3.0...
const MIN_VERSION = '2.2.0';
const MIN_VERSION_COMPONENTS = MIN_VERSION.split('.').map((item) => { return Number(item); });
let _wlRemoteConsoleChildProcess;
let _wlRemoteConsolePort;

async function startWebLogicRemoteConsoleBackend(currentWindow, skipVersionCheck = false) {
  if (_wlRemoteConsoleChildProcess) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    _getWebLogicRemoteConsoleHome(skipVersionCheck).then(rcHome => {
      if (!rcHome) {
        return resolve();
      }
      _getWebLogicRemoteConsoleExecutableData(rcHome).then(result => {
        const executable = result['executable'];
        const argList = result['arguments'];
        const options = result['options'];

        _wlRemoteConsoleChildProcess = spawnDaemonChildProcess(executable, argList, null, options);
        _wlRemoteConsoleChildProcess.on('error', (err) => {
          const title = i18n.t('wrc-spawn-error-title');
          dialog.showErrorBox(title, getErrorMessage(err));
        });
        _wlRemoteConsoleChildProcess.on('exit', (code) => {
          getLogger().info('WebLogic Remote Console backend process exited with code %s', code);
          _wlRemoteConsoleChildProcess = undefined;
          _wlRemoteConsolePort = undefined;
        });

        const stdoutLines = readline.createInterface({ input: _wlRemoteConsoleChildProcess.stdout });
        const stderrLines = readline.createInterface({ input: _wlRemoteConsoleChildProcess.stderr });

        let foundPort = false;
        const portRegex = /^Port=(\d+)\s?$/;
        stdoutLines.on('line', (line) => {
          getLogger().debug('WebLogic Remote Console stdout: %s', line.trim());
          if (!foundPort) {
            const matcher = line.match(portRegex);
            if (matcher) {
              foundPort = true;
              // The exported getWebLogicRemoteConsolePort function returns
              // the current port, so we need to save it.
              _wlRemoteConsolePort = matcher[1];
              sendToWindow(currentWindow, 'set-wrc-backend-port', matcher[1]);
            }
          }
        });
        stderrLines.on('line', (line) => {
          getLogger().debug('WebLogic Remote Console stderr: %s', line.trim());
        });
        resolve();
      }).catch(err => {
        const title = i18n.t('wrc-init-error-title');
        dialog.showErrorBox(title, getErrorMessage(err));
        resolve();
      });
    }).catch(err => {
      const title = i18n.t('wrc-home-error-title');
      dialog.showErrorBox(title, getErrorMessage(err));
      resolve();
    });
  });
}

async function setWebLogicRemoteConsoleHomeAndStart(currentWindow, rcHome) {
  const title = i18n.t('wrc-set-and-start-error-title');
  return new Promise(resolve => {
    fsUtils.exists(rcHome).then(doesExist => {
      if (!doesExist) {
        const message = i18n.t('wrc-set-home-not-exists', { rcHome: rcHome });
        dialog.showErrorBox(title, message);
        return resolve();
      }

      _isCompatibleVersion(rcHome).then(isCompatibleResult => {
        getLogger().debug('_isCompatibleVersion() returned %s', JSON.stringify(isCompatibleResult));
        if (isCompatibleResult.isCompatible) {
          userSettings.setWebLogicRemoteConsoleHome(rcHome);
          startWebLogicRemoteConsoleBackend(currentWindow, true).then(() => resolve() );
        } else {
          const message = i18n.t('wrc-version-incompatible-message',
            { rcVersion: isCompatibleResult['version'], minVersion: MIN_VERSION });
          dialog.showErrorBox(title, message);
          return resolve();
        }
      }).catch(err => {
        dialog.showErrorBox(title, getErrorMessage(err));
        return resolve();
      });
    }).catch(err => {
      const message = i18n.t('wrc-set-home-existence-check-failed', { rcHome: rcHome, error: getErrorMessage(err) });
      dialog.showErrorBox(title, message);
      resolve();
    });
  });
}

async function getDefaultWebLogicRemoteConsoleHome() {
  let rcHome = userSettings.getWebLogicRemoteConsoleHome();
  if (rcHome) {
    return Promise.resolve(rcHome);
  }

  // This only works if the WebLogic Remote Console is installed and has been run at least once.
  //
  rcHome = await _getLocationFromPreferencesFile();
  if (rcHome) {
    return Promise.resolve(rcHome);
  }

  // Just in case the WebLogic Remote Console is installed but has never been run...
  //
  if (osUtils.isMac()) {
    return _getDefaultLocationForMacOS();
  } else if (osUtils.isWindows()) {
    return _getDefaultLocationForWindows();
  } else {
    return _getDefaultLocationForLinux();
  }
}

function getDefaultDirectoryForOpenDialog(isAppImage = false) {
  let result;
  if (osUtils.isMac()) {
    result = '/Applications';
  } else if (osUtils.isWindows()) {
    result = path.normalize(path.join(path.dirname(app.getPath('exe')), '..'));
  } else if (isAppImage) {
    result = app.getPath('home');
  } else {
    result = '/opt';
  }
  return result;
}

function getWebLogicRemoteConsolePort() {
  return _wlRemoteConsolePort;
}

async function _getWebLogicRemoteConsoleHome(skipVersionCheck = false) {
  const rcHome = userSettings.getWebLogicRemoteConsoleHome();
  if (!rcHome) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    fsUtils.exists(rcHome).then(doesExist => {
      if (doesExist) {
        if (!skipVersionCheck) {
          _isCompatibleVersion(rcHome).then(isCompatibleResult => {
            if (isCompatibleResult['isCompatible']) {
              resolve(rcHome);
            } else {
              const message = i18n.t('wrc-version-incompatible-message',
                { rcVersion: isCompatibleResult['version'], minVersion: MIN_VERSION });
              reject(new Error(message));
            }
          }).catch(err => reject(err));
        } else {
          resolve(rcHome);
        }
      } else {
        const message = i18n.t('wrc-home-not-exist', { rcHome: rcHome });
        reject(new Error(message));
      }
    }).catch(err => {
      const message = i18n.t('wrc-location-existence-check-failed', { location: rcHome, error: getErrorMessage(err) });
      reject(new Error(message));
    });
  });
}

async function _isCompatibleVersion(rcHome) {
  let packageJsonFile;
  if (osUtils.isMac()) {
    packageJsonFile = path.join(rcHome, 'Contents', 'MacOS', 'package.json');
  } else if (osUtils.isWindows()) {
    packageJsonFile = path.join(rcHome, 'package.json');
  } else {
    // For Linux, the rcHome is either a directory or a path to an AppImage file.
    //
    let isDirectory;
    try {
      isDirectory = await fsUtils.isDirectory(rcHome);
    } catch (err) {
      const message = i18n.t('wrc-linux-executable-directory-check-failed',
        { rcHome: rcHome, error: getErrorMessage(err) });
      return Promise.reject(new Error(message));
    }

    if (isDirectory) {
      packageJsonFile = path.join(rcHome, 'package.json');
    }
  }

  return new Promise((resolve, reject) => {
    _verifyVersionCompatibility(packageJsonFile, rcHome).then(versionResult => {
      resolve(versionResult);
    }).catch(err => {
      const message = i18n.t('wrc-version-verification-failed', { error: getErrorMessage(err) });
      reject(new Error(message));
    });
  });
}

async function _getWebLogicRemoteConsoleExecutableData(rcHome) {
  // The first thing we need to do is to determine if the Remote Console "home"
  // is a dev install or not.
  //
  // In a dev install, the assumption is that the home is set to <path-to-repo>/electron.
  //
  const results = { };
  if (rcHome.endsWith('electron')) {
    const pathToDirectoryWithExecutable = path.join(rcHome, 'node_modules', 'electron', 'dist');
    return new Promise((resolve, reject) => {
      fsUtils.isDirectory(pathToDirectoryWithExecutable).then(doesExist => {
        if (!doesExist) {
          const message = i18n.t('wrc-dev-executable-directory-not-exists',
            { rcHome: rcHome, location: pathToDirectoryWithExecutable });
          return reject(new Error(message));
        }

        _getDevExecutablePath(rcHome, pathToDirectoryWithExecutable).then(exeResult => {
          if (exeResult.exists) {
            results['executable'] = exeResult.executable;
            results['arguments'] = ['.', 'dev', '--showPort', `--check-pid=${process.pid}`, '--quiet', '--headless', '--useTokenNotCookie'];
            results['options'] = { cwd: rcHome };
          } else {
            const message = i18n.t('wrc-dev-executable-existence-check-failed',
              { rcHome: rcHome, executable: exeResult['executable'] });
            reject(new Error(message));
          }
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  // If we get here, this is an (installed) executable environment.
  //
  return new Promise((resolve, reject) => {
    _getInstalledExecutablePath(rcHome).then(exeResult => {
      if (exeResult['exists']) {
        results['executable'] = exeResult['executable'];
        results['arguments'] = ['--showPort', '--useTokenNotCookie', `--check-pid=${process.pid}`, '--quiet', '--headless'];
        resolve(results);
      } else {
        const message = i18n.t('wrc-executable-not-exists', { rcHome: rcHome, executable: results['executable'] });
        reject(new Error(message));
      }
    }).catch(err => reject(err));
  });
}

async function _getDevExecutablePath(rcHome, pathToDirectoryWithExecutable) {
  const result = {
    exists: true
  };

  if (osUtils.isMac()) {
    result['executable'] = path.join(pathToDirectoryWithExecutable, 'Electron.app', 'Contents', 'MacOS', 'Electron');
  } else {
    result['executable'] = path.join(pathToDirectoryWithExecutable, `electron${osUtils.isWindows() ? '.exe' : ''}`);
  }

  return new Promise((resolve, reject) => {
    fsUtils.exists(result['executable']).then(doesExist => {
      if (!doesExist) {
        result['exists'] = false;
      }
      resolve(result);
    }).catch(err => {
      const message = i18n.t('wrc-dev-executable-existence-check-failed',
        { rcHome: rcHome, executable: result['executable'], error: getErrorMessage(err) });
      reject(new Error(message));
    });
  });
}

async function _getInstalledExecutablePath(rcHome) {
  const result = {
    exists: true
  };

  if (osUtils.isMac()) {
    result['executable'] = path.join(rcHome, 'Contents', 'MacOS', 'WebLogic Remote Console');
  } else if (osUtils.isWindows()) {
    result['executable'] = path.join(rcHome, 'WebLogic Remote Console.exe');
  } else {
    // For Linux, the rcHome is either a directory or a path to an AppImage file.
    //
    let isDirectory;
    try {
      isDirectory = await fsUtils.isDirectory(rcHome);
    } catch (err) {
      const message = i18n.t('wrc-linux-executable-directory-check-failed',
        { rcHome: rcHome, error: getErrorMessage(err) });
      return Promise.reject(new Error(message));
    }

    if (isDirectory) {
      result['executable'] = path.join(rcHome, 'weblogic-remote-console');
    } else {
      result['executable'] = rcHome;
    }
  }

  return new Promise((resolve, reject) => {
    fsUtils.exists(result['executable']).then(doesExist => {
      result['exists'] = doesExist;
      resolve(result);
    }).catch(err => {
      const message = i18n.t('wrc-executable-existence-check-failed',
        {rcHome: rcHome, executable: result['executable'], error: getErrorMessage(err) });
      reject(new Error(message));
    });
  });
}

async function _verifyVersionCompatibility(packageJsonFile, executablePath) {
  const result = {
    isCompatible: false
  };

  if (packageJsonFile) {
    return new Promise((resolve, reject) => {
      fsUtils.exists(packageJsonFile).then(doesExist => {
        if (doesExist) {
          const packageJson = require(packageJsonFile);
          if (packageJson.version) {
            result['version'] = packageJson.version;
            result['isCompatible'] = _verifyVersionNumberCompatibility(packageJson.version);
            resolve(result);
          } else {
            const message = i18n.t('wrc-package-json-missing-version', { packageJsonFile: packageJsonFile });
            reject(new Error(message));
          }
        } else {
          const message = i18n.t('wrc-package-json-file-missing', { packageJsonFile: packageJsonFile });
          reject(new Error(message));
        }
      }).catch(err => {
        const message = i18n.t('wrc-package-json-existence-check-failed',
          {packageJsonFile: packageJsonFile, error: getErrorMessage(err)});
        reject(new Error(message));
      });
    });
  }

  // If we get here, that means the user is using the AppImage file.
  // All we can really do is try to look at the file name for the
  // version number and hope that they didn't change the file name...
  //
  const appImageRegex = /^WebLogic.Remote.Console-(\d+\.\d+\.\d+)\.AppImage$/;
  const executableFileName = path.basename(executablePath);
  const matcher = executableFileName.match(appImageRegex);
  if (matcher) {
    result['version'] = matcher[1];
    result['isCompatible'] = _verifyVersionNumberCompatibility(matcher[1]);
    return Promise.resolve(result);
  } else {
    const message = i18n.t('wrc-app-image-file-version-no-match',
      { rcHone: executablePath, filename: executableFileName });
    return Promise.reject(new Error(message));
  }
}

function _verifyVersionNumberCompatibility(actualVersion) {
  const versionComponents = actualVersion.split('.').map((item) => { return Number(item); });

  let versionIsCompatible = true;
  for (let i = 0; i < 3; i++) {
    if (versionComponents[i] < MIN_VERSION_COMPONENTS[i]) {
      versionIsCompatible = false;
      break;
    }
  }
  return versionIsCompatible;
}

async function _getLocationFromPreferencesFile() {
  const autoPrefsLocation = path.join(app.getPath('appData'), 'weblogic-remote-console', 'auto-prefs.json');

  return new Promise(resolve => {
    fsUtils.exists(autoPrefsLocation).then(doesExist => {
      if (!doesExist) {
        return resolve();
      }

      fsPromises.readFile(autoPrefsLocation, { encoding: 'utf8' }).then(contents => {
        try {
          const props = JSON.parse(contents);
          resolve(props.location);
        } catch (err) {
          getLogger().debug('Failed to parse file %s: %s', autoPrefsLocation, getErrorMessage(err));
          resolve();
        }
      }).catch(err => {
        getLogger().debug('Failed to read file %s: %s', autoPrefsLocation, getErrorMessage(err));
        resolve();
      });
    }).catch(err => {
      getLogger().debug('Failed to determine whether the file %s exists: %s', autoPrefsLocation, getErrorMessage(err));
      resolve();
    });
  });
}

async function _getDefaultLocationForMacOS() {
  const defaultLocation = '/Applications/WebLogic Remote Console.app';
  return new Promise(resolve => {
    fsUtils.exists(defaultLocation).then(doesExist => {
      if (doesExist) {
        resolve(defaultLocation);
      } else {
        resolve();
      }
    }).catch(err => {
      getLogger().debug('Existence check for default WebLogic Remote Console Home location %s failed: %s',
        defaultLocation, getErrorMessage(err));
      resolve();
    });
  });
}

async function _getDefaultLocationForWindows() {
  const defaultAllUsersLocation = 'c:\\Program Files\\WebLogic Remote Console';
  fsUtils.exists(defaultAllUsersLocation).then(doesExist => {
    if (doesExist) {
      return Promise.resolve(defaultAllUsersLocation);
    }
    // fall through to check the alternate location...
  }).catch(err => {
    getLogger().debug('Existence check for default WebLogic Remote Console Home location %s failed: %s',
      defaultAllUsersLocation, getErrorMessage(err));
    return Promise.resolve();
  });

  const defaultLocation = path.join(app.getPath('appData'), 'Local', 'Programs', 'WebLogic Remote Console');
  fsUtils.exists(defaultLocation).then(doesExist => {
    if (doesExist) {
      return Promise.resolve(defaultLocation);
    }
    return Promise.resolve();
  }).catch(err => {
    getLogger().debug('Existence check for default WebLogic Remote Console Home location %s failed: %s',
      defaultAllUsersLocation, getErrorMessage(err));
    return Promise.resolve();
  });
}

async function _getDefaultLocationForLinux() {
  const defaultLocation = '/opt/WebLogic Remote Console';
  return new Promise(resolve => {
    fsUtils.exists(defaultLocation).then(doesExist => {
      if (doesExist) {
        resolve(defaultLocation);
      } else {
        resolve();
      }
    }).catch(err => {
      getLogger().debug('Existence check for default WebLogic Remote Console Home location %s failed: %s',
        defaultLocation, getErrorMessage(err));
      resolve();
    });
  });
}

module.exports = {
  getDefaultDirectoryForOpenDialog,
  getDefaultWebLogicRemoteConsoleHome,
  setWebLogicRemoteConsoleHomeAndStart,
  startWebLogicRemoteConsoleBackend,
  getWebLogicRemoteConsolePort
};
