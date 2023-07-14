/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fs = require('fs');
const fsPromises = require('fs/promises');
const JSZip = require('jszip');
const path = require('path');

const fsUtils = require('./fsUtils');
const i18n = require('./i18next.config');
const { getErrorMessage } = require('./errorUtils');
const { getLogger } = require('./wktLogging');

/* global process */
async function getContentsOfArchiveFiles(projectDirectory, archiveFiles) {
  if (!archiveFiles || archiveFiles.length === 0) {
    return null;
  }

  const archiveFilesContents = { };
  for (const archiveFile of archiveFiles) {
    archiveFilesContents[archiveFile] = await _getArchiveFileContents(projectDirectory, archiveFile);
  }
  return archiveFilesContents;
}

// This function expects the archiveUpdates object to look like this:
//
// {
//     <path-to-archive>: [
//         { op: <operation-name>, path: <archive-entry-path>, [filePath: <path of the content>] },
//         { op: <operation-name>, path: <archive-entry-path>, [filePath: <path of the content>] },
//         ...
//     ],
//     ...
// }
//
// Currently supported operations:
//       add - Adds/Updates the file or directory specified by filePath to the archive at the specified path.
//             To add an empty folder, make sure the path value ends with '/' and filePath is not specified.
//
//    remove - Removes the entry specified by path from the archive.  If the path is a folder, the
//             folder and all of its content is removed recursively.  Make sure that the path ends
//             with a '/'.
//
// This function will first scan the list of operations on a particular archive file to consolidate
// multiple user actions into a single action.  The logic is as follows:
//
// 1. If the operations are on a file, the last operation wins.
// 2. If the operations are on a directory:
//    a. If the last operation is a remove, then it wins.
//    b. If the last operation is an add, then it wins.  The only difference is we need to remove the existing
//       directory in the archive, if it exists, before performing the add operation.
//
async function saveContentsOfArchiveFiles(projectDirectory, archiveUpdates) {
  if (!archiveUpdates) {
    return Promise.resolve( { });
  }

  for (const [archiveFileName, userOperations ] of Object.entries(archiveUpdates)) {
    const archiveFile = fsUtils.getAbsolutePath(archiveFileName, projectDirectory);
    const operations = getCollapsedOperations(userOperations);

    if (operations.length > 0) {
      let zip;
      try {
        zip = await _openArchiveFile(archiveFile);
      } catch (err) {
        const errMessage = i18n.t('model-archive-open-archive-failed-error-message',
          { archiveFile: archiveFile, error: getErrorMessage(err) });
        return Promise.reject(new Error(errMessage));
      }

      try {
        await _processArchiveOperations(archiveFile, zip, operations);
      } catch (err) {
        return Promise.reject(err);
      }

      try {
        await _saveArchiveFile(zip, archiveFile);
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }
  const archiveFiles = Object.getOwnPropertyNames(archiveUpdates);
  const archiveContents = await getContentsOfArchiveFiles(projectDirectory, archiveFiles);
  return Promise.resolve(archiveContents);
}

async function _getArchiveFileContents(projectDirectory, archiveFile) {
  const effectiveArchiveFilePath = fsUtils.getAbsolutePath(archiveFile, projectDirectory);

  return new Promise((resolve, reject) => {
    fsUtils.exists(effectiveArchiveFilePath).then(doesExist => {
      if (!doesExist) {
        return reject(new Error(i18n.t('model-archive-read-failed-not-exist-error-message',
          { archiveFile: effectiveArchiveFilePath })));
      }
      fsUtils.isDirectory(effectiveArchiveFilePath).then(isDir => {
        if (isDir) {
          return reject(new Error(i18n.t('model-archive-read-failed-is-directory-error-message',
            { archiveFile: effectiveArchiveFilePath })));
        }

        _readArchiveFile(effectiveArchiveFilePath)
          .then(archiveEntries => resolve(archiveEntries))
          .catch(err => reject(err));
      });
    });
  });
}

async function _readArchiveFile(file) {
  return new Promise((resolve, reject) => {
    fsUtils.exists(file).then(doesExist => {
      if (doesExist) {
        fsUtils.isDirectory(file).then(isDir => {
          if (isDir) {
            return reject(new Error(i18n.t('model-archive-read-failed-is-directory-error-message',
              { archiveFile: file })));
          }
          _getZipEntries(file).then(zip => {
            resolve(_getArchiveEntries(zip));
          }).catch(err => reject(err));
        }).catch(err => reject(new Error(i18n.t('model-archive-read-directory-check-error-message',
          { archiveFile: file, error: getErrorMessage(err) }))));
      } else {
        reject(new Error(i18n.t('model-archive-read-failed-not-exist-error-message',
          { archiveFile: file })));
      }
    }).catch(err => reject(new Error(i18n.t('model-archive-exists-failed-error-message',
      { archiveFile: file, error: getErrorMessage(err) }))));
  });
}

async function _getZipEntries(file) {
  return new Promise((resolve, reject) => {
    fsPromises.readFile(file).then(data => {
      JSZip.loadAsync(data).then(zip => {
        resolve(zip);
      }).catch(err => reject(new Error(i18n.t('model-archive-read-zip-contents-error-message',
        { archiveFile: file, error: getErrorMessage(err) }))));
    }).catch(err => reject(new Error(i18n.t('model-archive-read-file-failed-error-message',
      { archiveFile: file, error: getErrorMessage(err) }))));
  });
}

function _getArchiveEntries(zip) {
  const archiveEntries = { };
  for (const entry in zip.files) {
    let dirPath;
    let fileName;

    if (entry) {
      if (entry.endsWith('/')) {
        const entryNoTrailingSlash = entry.slice(0, -1);
        // Handle the theoretical "/" case.
        if (entryNoTrailingSlash) {
          dirPath = entryNoTrailingSlash.split('/');
        }
      } else {
        const lastSlashIndex = entry.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          dirPath = entry.substring(0, lastSlashIndex).split('/');
          fileName = entry.substring(lastSlashIndex + 1, entry.length);
        } else {
          fileName = entry;
        }
      }
    }

    let lastDir = archiveEntries;
    if (dirPath) {
      for (const dir of dirPath) {
        if (!Object.prototype.hasOwnProperty.call(lastDir, dir)) {
          lastDir[dir] = { };
        }
        lastDir = lastDir[dir];
      }
    }
    if (fileName) {
      lastDir[fileName] = '';
    }
  }
  return archiveEntries;
}

async function _processArchiveOperations(archiveFile, zip, operations) {
  for (const operation of operations) {
    switch (operation.op) {
      case 'add':
        await _performAddOperation(archiveFile, zip, operation);
        break;

      case 'remove':
        await _performRemoveOperation(archiveFile, zip, operation.path);
        break;

      default:
        return Promise.reject(new Error(i18n.t('model-archive-unknown-operation-error-message',
          { archiveFile: archiveFile, operation: operation.op, path: operation.path })));
    }
  }
  return Promise.resolve();
}

async function _openArchiveFile(archiveFile) {
  return new Promise((resolve, reject) => {
    fsUtils.exists(archiveFile).then(doesExist => {
      if (doesExist) {
        fsPromises.readFile(archiveFile).then(buffer => {
          JSZip.loadAsync(buffer).then(zip => resolve(zip)).catch(err => reject(err));
        }).catch(err => reject(err));
      } else {
        resolve(new JSZip());
      }
    }).catch(err => reject(err));
  });
}

async function _performAddOperation(archiveFile, zip, operation) {
  const opPath = operation.path;
  const filePath = operation.filePath ? operation.filePath : undefined;

  if (opPath.endsWith('/')) {
    if (filePath) {
      return new Promise((resolve, reject) => {
        _validateFilePathForArchivePath(archiveFile, opPath, filePath).then(() => {
          _addDirectoryToArchiveFile(archiveFile, zip, opPath, filePath).then(() => resolve()).catch(err => reject(err));
        }).catch(err => reject(err));
      });
    } else {
      return new Promise((resolve, reject) => {
        _addEmptyDirectoryToArchive(archiveFile, zip, opPath).then(() => resolve()).catch(err => reject(err));
      });
    }
  } else {
    if (filePath) {
      return new Promise((resolve, reject) => {
        _validateFilePathForArchivePath(archiveFile, opPath, filePath).then(() => {
          _addFileToArchive(archiveFile, zip, opPath, filePath).then(() => {
            resolve();
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      });
    } else {
      const errMessage = i18n.t('model-archive-add-file-path-empty-error-message',
        { archiveFile: archiveFile, path: opPath });
      return Promise.reject(new Error(errMessage));
    }
  }
}

async function _performRemoveOperation(archiveFile, zip, zipPath) {
  return _removePathFromArchive(archiveFile, zip, zipPath);
}

async function _validateFilePathForArchivePath(archiveFile, zipPath, filePath) {
  const pathIsDir = zipPath.endsWith('/');
  return new Promise((resolve, reject) => {
    fsUtils.exists(filePath).then(doesExist => {
      if (! doesExist) {
        return reject(new Error(i18n.t('model-archive-add-file-not-exists-error-message',
          { path: zipPath, archiveFile: archiveFile, filePath: filePath })));
      }

      fsUtils.isDirectory(filePath).then(isDir => {
        if (pathIsDir !== isDir) {
          const errMessage = i18n.t('model-archive-path-file-mismatch-error-message',
            { archiveFile: archiveFile, archivePath: zipPath, filePath: filePath });
          return reject(new Error(errMessage));
        }
        resolve();
      }).catch(err => {
        const errMessage = i18n.t('model-archive-file-is-directory-failed-error-message',
          { archiveFile: archiveFile, archivePath: zipPath, filePath: filePath, error: getErrorMessage(err) });
        reject(new Error(errMessage));
      });
    }).catch(err => {
      const errMessage = i18n.t('model-archive-file-exists-failed-error-message',
        { archiveFile: archiveFile, archivePath: zipPath, filePath: filePath, error: getErrorMessage(err) });
      reject(new Error(errMessage));
    });
  });
}

async function _saveArchiveFile(zip, archiveFile) {
  return new Promise((resolve, reject) => {
    try {
      zip.generateNodeStream( { streamFiles: true, platform: process.platform })
        .pipe(fs.createWriteStream(archiveFile))
        .on('finish', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    } catch (err) {
      const errMessage = i18n.t('model-archive-save-failed-error-message',
        { archiveFile: archiveFile, error: getErrorMessage(err) });
      reject(new Error(errMessage));
    }
  });
}

async function _addFileToArchive(archiveFile, zip, zipPath, filePath) {
  return new Promise((resolve, reject) => {
    fsPromises.readFile(filePath).then(buffer => {
      try {
        zip.file(zipPath, buffer, { createFolders: false });
        resolve();
      } catch (err) {
        reject(err);
      }
    }).catch(err => {
      const errMessage = i18n.t('model-archive-add-file-read-failed-error-message',
        {archiveFile: archiveFile, path: zipPath, filePath: filePath, error: getErrorMessage(err) });
      reject(new Error(errMessage));
    });
  });
}

async function _addEmptyDirectoryToArchive(archiveFile, zip, zipPath) {
  return new Promise((resolve, reject) => {
    try {
      zip.folder(zipPath);
      resolve();
    } catch (err) {
      const errMessage = i18n.t('model-archive-add-folder-failed-error-message',
        {archiveFile: archiveFile, path: zipPath, error: getErrorMessage(err) });
      reject(new Error(errMessage));
    }
  });
}

async function _addDirectoryToArchiveFile(archiveFile, zip, zipPath, dirPath) {
  let fileList = [];
  try {
    fileList = await fsUtils.getFilesRecursivelyFromDirectory(dirPath);
  } catch (err) {
    getLogger().error('Failed to get files from directory %s: %s', dirPath, err);
    return Promise.reject(err);
  }

  for (const file of fileList) {
    const relativePath = path.relative(dirPath, file).replace(/\\/g, '/');
    const effectivePath = zipPath + relativePath;
    await _addFileToArchive(archiveFile, zip, effectivePath, file);
  }
  return Promise.resolve();
}

async function _removePathFromArchive(archiveFile, zip, zipPath) {
  if (!zipPath) {
    getLogger().warn('_removePathFromArchive received empty zipPath so skipping...');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      if (zip.file(zipPath)) {
        zip.remove(zipPath);
      } else if (zipPath?.endsWith('/')) {
        // Remove the trailing slash so the target folder is also removed, not just its contents...
        zip.remove(zipPath.slice(0, -1));
      }
      resolve();
    } catch (err) {
      const errMessage = i18n.t('model-archive-remove-path-failed-error-message',
        {archiveFile: archiveFile, path: zipPath, error: getErrorMessage(err) });
      reject(new Error(errMessage));
    }
  });
}

function getCollapsedOperations(userOperations) {
  const pathOperationMap = new Map();

  for (const userOperation of userOperations) {
    pathOperationMap.set(userOperation.path, userOperation);
  }

  const operations = [];
  for (const [ zipPath, operation ] of pathOperationMap.entries()) {
    operations.push(...getOperationsForPath(zipPath, operation));
  }
  return operations;
}

function getOperationsForPath(zipPath, operation) {
  const results = [ operation ];
  if (operation.op === 'add' && zipPath.endsWith('/')) {
    // Insert this operation ahead of the add operation.
    results.unshift({ op: 'remove', path: zipPath });
  }
  return results;
}

module.exports = {
  getContentsOfArchiveFiles,
  saveContentsOfArchiveFiles,
};
