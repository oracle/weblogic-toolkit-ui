/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fsUtils = require('./fsUtils');
const i18n = require('./i18next.config');
const { getErrorMessage } = require('./errorUtils');

class ModelArchivePlugin {
  constructor(modelArchivePluginType, logger) {
    this.modelArchivePluginType = modelArchivePluginType;
    this.modelArchivePlugin = null;
    this.logger = logger;
  }

  get archivePluginType() {
    return this.modelArchivePluginType;
  }

  async getArchiveFileContents(projectDirectory, archiveFile) {
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

          this._readArchiveFile(effectiveArchiveFilePath, this.modelArchivePlugin)
            .then(archiveEntries => resolve(archiveEntries))
            .catch(err => reject(err));
        });
      });
    });
  }

  async saveZipEntries(file, operations) {
    return this.modelArchivePlugin.saveZipEntries(file, operations);
  };

  async _getZipEntries(file) {
    return this.modelArchivePlugin._getZipEntries(file);
  }

  async _validateFilePathForArchivePath(archiveFile, zipPath, filePath) {
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

  async _readArchiveFile(file) {
    return new Promise((resolve, reject) => {
      this.modelArchivePlugin._getZipEntries(file).then(zipEntries => {
        resolve(this._getArchiveEntries(zipEntries));
      }).catch(err => reject(err));
    });
  }

  _getArchiveEntries(zip) {
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
}

module.exports = ModelArchivePlugin;
