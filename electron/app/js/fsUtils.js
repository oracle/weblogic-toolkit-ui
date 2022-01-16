/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fsPromises = require('fs/promises');
const path = require('path');
const osUtils = require('./osUtils');
const which = require('which');

const { getErrorMessage } = require('./errorUtils');

// WARNING: This file is used early on in the startup process so do not require other modules at the top level
//          that depend on Electron being fully initialized.  For example, i18next.config...
//
/* global process */
async function isDirectory(filePath) {
  return new Promise((resolve, reject) => {
    fsPromises.lstat(filePath)
      .then(stats => {
        if (stats) {
          resolve(stats.isDirectory());
        } else {
          resolve(false);
        }
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          resolve(false);
        } else {
          reject(err);
        }
      });
  });
}

async function exists(filePath) {
  return new Promise((resolve, reject) => {
    fsPromises.lstat(filePath)
      .then(() => {
        resolve(true);
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          resolve(false);
        } else {
          reject(err);
        }
      });
  });
}

async function removeDirectoryRecursively(directoryToDelete) {
  return new Promise((resolve, reject) => {
    exists(directoryToDelete)
      .then(doesExist => {
        if (doesExist) {
          fsPromises.rm(directoryToDelete, {
            force: true,
            recursive: true
          })
            .then(() => {
              exists(directoryToDelete).then(stillExists => {
                if (!stillExists) {
                  resolve(!stillExists);
                } else {
                  reject(`Failed to completely remove directory ${directoryToDelete}`);
                }
              }).catch(err => reject(err));
            }).catch(err => reject(err));
        } else {
          resolve(false);
        }
      })
      .catch(err => reject(err));
  });
}

async function makeDirectoryIfNotExists(directory) {
  return new Promise((resolve, reject) => {
    exists(directory)
      .then(doesExist => {
        if (!doesExist) {
          fsPromises.mkdir(directory, {
            recursive: true
          })
            .then(res => {
              resolve(res);
            })
            .catch(err => {
              reject(err);
            });
        } else {
          resolve();
        }
      })
      .catch(err => reject(err));
  });
}

async function writeTempFile(data, options) {
  const { app } = require('electron');
  const tmpdir = app.getPath('temp');
  let prefix = 'wktui-';
  let baseName = 'file';
  let extension = '.txt';

  if (options) {
    if (options.prefix) {
      prefix = options.prefix;
    }
    if (options.baseName) {
      baseName = options.baseName;
    }
    if (options.extension) {
      extension = options.extension;
    }
  }

  return new Promise((resolve, reject) => {
    fsPromises.mkdtemp(path.join(tmpdir, prefix)).then(dirName => {
      const fileName = path.join(dirName, baseName + extension);
      fsPromises.writeFile(fileName, data).then(() => resolve(fileName)).catch(err => reject(err));
    }).catch(err => reject(err));
  });
}

async function recursivelyRemoveTemporaryFileDirectory(file) {
  const tempDir = path.dirname(file);
  return new Promise((resolve, reject) => {
    fsPromises.rm(tempDir, { force: true, recursive: true }).then(() => resolve()).catch(err => reject(err));
  });
}

function isValidFileName(fileName) {
  if (!fileName || typeof fileName !== 'string' || fileName.length === 0) {
    return false;
  }

  let regexArray = [];
  const rg1 = /^.*[\\/*?"<>|:]+.*$/;                             // forbidden characters \ / : * ? " < > |
  regexArray.push(rg1);
  if (process.platform === 'win32') {
    // See https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file for details.
    //
    const rg2 = /^.*[. ]$/;                                         // cannot end with dot (.) or space
    const rg3 = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.[^.]+)?$/i; // forbidden/discouraged file names
    regexArray.push(rg2, rg3);
  }

  const effectiveFileName = path.basename(fileName);  // make sure there is no path elements in the name...
  regexArray.forEach(regex => {
    if (regex.test(effectiveFileName)) {
      return false;
    }
  });
  return true;
}

function getAbsolutePath(pathToCheck, baseDirectory) {
  if (path.isAbsolute(pathToCheck)) {
    return pathToCheck;
  }
  return path.normalize(path.join(baseDirectory, pathToCheck));
}

function getAbsolutePathsList(pathsToCheckList, baseDirectory) {
  const resultArray = [];
  if (pathsToCheckList) {
    for (const file of pathsToCheckList) {
      if (path.isAbsolute(file)) {
        resultArray.push(file);
      } else {
        resultArray.push(path.join(baseDirectory, file));
      }
    }
  }
  return resultArray;
}

// returns the relative path for childPath, only if it is below parentPath.
// returns null for any other case.
function getRelativePath(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  if(relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return relative;
  }
  return null;
}

function getExecutableFilePath(exeName, mode) {
  let resolvedPath;
  try {
    resolvedPath = which.sync(exeName);
  } catch (err) {
    // not found...
    if (osUtils.isMac() && mode === 'exe') {
      try {
        resolvedPath = which.sync(exeName, { path: '/usr/local/bin' });
      } catch (nestedErr) {
        // still not found...
      }
    }
  }
  return resolvedPath;
}

function isRootDirectory(dirPath) {
  return path.basename(dirPath) === '';
}

async function createTemporaryDirectory(baseDirectory, baseName) {
  return new Promise((resolve, reject) => {
    fsPromises.mkdtemp(path.join(baseDirectory, baseName)).then(tmpDir => {
      resolve(tmpDir);
    }).catch(err => reject(err));
  });
}

async function renameFileDeletingOldFileIfNeeded(sourceFile, targetFile) {
  return new Promise((resolve, reject) => {
    fsPromises.rm(targetFile, { force: true }).then(() => {
      fsPromises.rename(sourceFile, targetFile).then(() => {
        resolve();
      }).catch(err => reject(err));
    }).catch(err => reject(err));
  });
}

async function verifyFilesExist(baseDirectory, ...files) {
  const results = {
    isValid: true
  };

  const invalidFiles = [];
  for (const file of files) {
    let absolutePath = file;
    if (baseDirectory && !path.isAbsolute(file)) {
      absolutePath = path.join(baseDirectory, file);
    }
    const fileExists = await exists(absolutePath);
    if (!fileExists) {
      invalidFiles.push(absolutePath);
    }
  }
  if (invalidFiles.length > 0) {
    results.isValid = false;
    results.invalidFiles = invalidFiles;
  }
  return Promise.resolve(results);
}

async function getFilesRecursivelyFromDirectory(directory) {
  const i18n = require('./i18next.config');

  return new Promise((resolve, reject) => {
    if (!directory) {
      const errMessage = i18n.t('fs-utils-get-files-recursively-dir-empty-error-message');
      return reject(new Error(errMessage));
    }

    isDirectory(directory).then(isDir => {
      if (!isDir) {
        const errMessage = i18n.t('fs-utils-get-files-recursively-dir-not-dir-error-message',
          { directoryName: directory });
        return reject(new Error(errMessage));
      }

      _getFilesRecursivelyFromDirectory(directory, []).then(fileList => {
        resolve(fileList);
      });
    });
  });
}

async function _getFilesRecursivelyFromDirectory(directory, fileList) {
  const i18n = require('./i18next.config');

  return new Promise((resolve, reject) => {
    fsPromises.readdir(directory, { withFileTypes: true }).then(listing => {
      _processDirectoryListing(directory, listing, fileList).then(newFileList => {
        resolve(newFileList);
      });
    }).catch(err => {
      const errMessage = i18n.t('fs-utils-readdir-failed-error-message',
        { directoryName: directory, error: getErrorMessage(err) });
      reject(new Error(errMessage));
    });
  });
}

async function _processDirectoryListing(directory, listing, fileList) {
  const i18n = require('./i18next.config');

  if (listing.length === 0) {
    fileList.push(directory + path.sep);
    return Promise.resolve(fileList);
  }

  for (const dirent of listing) {
    if (dirent.isDirectory()) {
      fileList = await _getFilesRecursivelyFromDirectory(path.join(directory, dirent.name), fileList);
    } else if (dirent.isFile()) {
      fileList.push(path.join(directory, dirent.name));
    } else {
      const errMessage = i18n.t('fs-utils-entry-not-file-or-directory-error-message',
        {fileName: dirent.name, directoryName: directory});
      return Promise.reject(new Error(errMessage));
    }
  }
  return Promise.resolve(fileList);
}

module.exports = {
  exists,
  getAbsolutePath,
  getAbsolutePathsList,
  getRelativePath,
  getExecutableFilePath,
  getFilesRecursivelyFromDirectory,
  isDirectory,
  isRootDirectory,
  isValidFileName,
  makeDirectoryIfNotExists,
  removeDirectoryRecursively,
  createTemporaryDirectory,
  recursivelyRemoveTemporaryFileDirectory,
  renameFileDeletingOldFileIfNeeded,
  verifyFilesExist,
  writeTempFile
};
