/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fsPromises = require('node:fs/promises');
const fs = require('node:fs');
const path = require('node:path');

const ModelArchivePlugin = require('./modelArchivePlugin');
const JSZip = require('jszip');
const fsUtils = require('./fsUtils');
const i18n = require('./i18next.config');
const { getErrorMessage } = require('./errorUtils');

/* global process */
class JSZipPlugin extends ModelArchivePlugin {
  constructor(logger) {
    super('jszip');
    super.modelArchivePlugin = this;
    this.logger = logger;
  }

  get archivePluginType() {
    return super.archivePluginType;
  }

  async saveZipEntries(file, operations) {
    let zip;
    try {
      zip = await this._openArchiveFile(file);
    } catch (err) {
      const errMessage = i18n.t('model-archive-open-archive-failed-error-message',
        { archiveFile: file, error: getErrorMessage(err) });
      return Promise.reject(new Error(errMessage));
    }

    try {
      await this._processArchiveOperations(file, zip, operations);
    } catch (err) {
      return Promise.reject(err);
    }

    try {
      await this._saveArchiveFile(zip, file);
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.resolve();
  };

  async _getZipEntries(file) {
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

  async _openArchiveFile(archiveFile) {
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

  async _processArchiveOperations(archiveFile, zip, operations) {
    for (const operation of operations) {
      switch (operation.op) {
        case 'add':
          await this._performAddOperation(archiveFile, zip, operation);
          break;

        case 'remove':
          await this._performRemoveOperation(archiveFile, zip, operation.path);
          break;

        default:
          return Promise.reject(new Error(i18n.t('model-archive-unknown-operation-error-message',
            { archiveFile: archiveFile, operation: operation.op, path: operation.path })));
      }
    }
    return Promise.resolve();
  }

  async _performAddOperation(archiveFile, zip, operation) {
    const opPath = operation.path;
    const filePath = operation.filePath ? operation.filePath : undefined;

    if (opPath.endsWith('/')) {
      if (filePath) {
        return new Promise((resolve, reject) => {
          this._validateFilePathForArchivePath(archiveFile, opPath, filePath).then(() => {
            this._addDirectoryToArchiveFile(archiveFile, zip, opPath, filePath).then(() => resolve()).catch(err => reject(err));
          }).catch(err => reject(err));
        });
      } else {
        return new Promise((resolve, reject) => {
          this._addEmptyDirectoryToArchive(archiveFile, zip, opPath).then(() => resolve()).catch(err => reject(err));
        });
      }
    } else {
      if (filePath) {
        return new Promise((resolve, reject) => {
          this._validateFilePathForArchivePath(archiveFile, opPath, filePath).then(() => {
            this._addFileToArchive(archiveFile, zip, opPath, filePath).then(() => {
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

  async _performRemoveOperation(archiveFile, zip, zipPath) {
    return this._removePathFromArchive(archiveFile, zip, zipPath);
  }

  async _saveArchiveFile(zip, archiveFile) {
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

  async _addDirectoryToArchiveFile(archiveFile, zip, zipPath, dirPath) {
    let fileList = [];
    try {
      fileList = await fsUtils.getFilesRecursivelyFromDirectory(dirPath);
    } catch (err) {
      this.logger().error('Failed to get files from directory %s: %s', dirPath, err);
      return Promise.reject(err);
    }

    for (const file of fileList) {
      const relativePath = path.relative(dirPath, file).replace(/\\/g, '/');
      const effectivePath = zipPath + relativePath;
      await this._addFileToArchive(archiveFile, zip, effectivePath, file);
    }
    return Promise.resolve();
  }

  async _addEmptyDirectoryToArchive(archiveFile, zip, zipPath) {
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

  async _addFileToArchive(archiveFile, zip, zipPath, filePath) {
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

  async _removePathFromArchive(archiveFile, zip, zipPath) {
    if (!zipPath) {
      this.logger.warn('_removePathFromArchive received empty zipPath so skipping...');
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
}

module.exports = {
  JSZipPlugin
};
