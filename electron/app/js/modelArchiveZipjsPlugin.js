/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fsPromises = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const zip = require('@zip.js/zip.js');
const fsExtra = require('fs-extra');

const ModelArchivePlugin = require('./modelArchivePlugin');
const fsUtils = require('./fsUtils');
const i18n = require('./i18next.config');
const { getErrorMessage } = require('./errorUtils');

// Ensure the zip.js library is configured for Node.js environments
zip.configure({
  useWebWorkers: false,
});

class ZipDotJsPlugin extends ModelArchivePlugin {
  constructor(logger, options) {
    super('zipjs');
    super.modelArchivePlugin = this;
    this.logger = logger;
    this.tmpdir = options['macZipjsTmpDir'] ? options['macZipjsTmpDir'] : os.tmpdir();
  }

  get archivePluginType() {
    return super.archivePluginType;
  }

  // This method reads the original zip file first to produce an efficient set of operations
  // that needs to be performed to create the new zip file.  While it ends up reading the
  // original zip file twice, the simplicity for copying the entries from the original to
  // the new zip file seems worth it.
  //
  // After further review, the multiple passes do not seem to be a problem.  The size of the updated
  // zip file being written and copied is much slower with a large zip file to the point where the
  // user doesn't have any indication that the project is still being saved.
  //
  async saveZipEntries(file, operations) {
    // Collect the collapsed operations needed to create the new archive file.
    //
    const zipEntries = await this._getZipEntries(file);
    const formattedZipEntries = this._formatZipEntries(zipEntries);
    const { copyOperationsMap, addOperations } = this._mergeZipOperations(formattedZipEntries, operations);

    // Create the new archive file in a temporary directory
    //
    const archiveBaseName = path.basename(file, '.zip');
    let tempDirectory;
    try {
      tempDirectory = path.normalize(await fsPromises.mkdtemp(path.join(this.tmpdir, archiveBaseName + '-')));
      this.logger.debug('Created temporary directory %s for writing updated archive file', tempDirectory);
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-create-temp-dir-failed-error-message',
        { parentDirectory: this.tmpdir, error: getErrorMessage(err) })));
    }

    const newArchiveFilePath = path.join(tempDirectory, fsUtils.getTemporaryFileName(path.basename(file)));
    try {
      await this._createNewArchiveFile(file, newArchiveFilePath, copyOperationsMap, addOperations);
      this.logger.debug('Created updated archive file %s', newArchiveFilePath);
    } catch(err) {
      // Best effort attempt to remove the tempDirectory
      fsUtils.removeDirectoryRecursively(tempDirectory).then().catch((err) => {
        this.logger.error('Failed to remove temp directory %s for new archive file: %s', newArchiveFilePath, err);
      });
      return Promise.reject(new Error(i18n.t('model-archive-create-new-file-failed-error-message',
        { archiveFile: newArchiveFilePath, error: getErrorMessage(err) })));
    }

    try {
      await this._swapArchiveFiles(file, newArchiveFilePath);
      this.logger.debug('Replaced archive file %s with updated archive file %s', file, newArchiveFilePath);
    } catch(err) {
      // Detailed error created in this._swapArchiveFiles() function so just propagate it here.
      return Promise.reject(err);
    } finally {
      // Best effort attempt to remove the tempDirectory
      fsUtils.removeDirectoryRecursively(tempDirectory).then().catch((err) => {
        this.logger.error('Failed to remove temp directory %s for new archive file: %s', newArchiveFilePath,
          getErrorMessage(err));
      });
    }
    return Promise.resolve();
  };

  async _getZipEntries(file) {
    let zipFileReader;
    let zipReader;
    try {
      zipFileReader = new ZipFileReader(file);
      zipReader = new zip.ZipReader(zipFileReader);
    } catch (err) {
      this._closeReaders(zipFileReader, zipReader).then();
      return Promise.reject(new Error(i18n.t('model-archive-read-file-failed-error-message',
        { archiveFile: file, error: getErrorMessage(err) })));
    }

    const files = {};
    const entries = { files: files };
    try {
      const zipEntries = await zipReader.getEntries();
      zipEntries.forEach((zipEntry) => {
        files[zipEntry.filename] = { directory: zipEntry.directory };
      });
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-process-zip-contents-failed-error-message',
        { archiveFile: file, error: getErrorMessage(err) })));
    } finally {
      this._closeReaders(zipFileReader, zipReader).then();
    }
    return Promise.resolve(entries);
  }

  async _createNewArchiveFile(file, newArchiveFilePath, copyOperationsMap, addOperations) {
    let zipFileReader;
    let zipReader;
    try {
      zipFileReader = new ZipFileReader(file);
      zipReader = new zip.ZipReader(zipFileReader);
    } catch (err) {
      await this._closeReaders(zipFileReader, zipReader);
      return Promise.reject(new Error(i18n.t('model-archive-read-file-failed-error-message',
        { archiveFile: file, error: getErrorMessage(err) })));
    }

    let zipFileWriter;
    let zipWriter;
    try {
      zipFileWriter = new ZipFileWriter(newArchiveFilePath);
      zipWriter = new zip.ZipWriter(zipFileWriter);
    } catch (err) {
      await this._closeReaders(zipFileReader, zipReader);
      await this._closeWriters(zipFileWriter, zipWriter);
      return Promise.reject(new Error(i18n.t('model-archive-write-file-open-failed-error-message',
        { archiveFile: newArchiveFilePath, error: getErrorMessage(err) })));
    }

    try {
      const zipEntries = await zipReader.getEntries();
      for (const zipEntry of zipEntries) {
        const zipPath = zipEntry.filename;
        if (copyOperationsMap.has(zipPath)) {
          if (zipEntry.directory) {
            await zipWriter.add(zipPath, null);
          } else {
            const entryData = await zipEntry.getData(new zip.BlobWriter());
            await zipWriter.add(zipPath, new zip.BlobReader(entryData));
          }
        }
      }
    } catch (err) {
      await this._closeReaders(zipFileReader, zipReader);
      await this._closeWriters(zipFileWriter, zipWriter);
      return Promise.reject(new Error(i18n.t('model-archive-write-file-copy-failed-error-message',
        { archiveFile: newArchiveFilePath, error: getErrorMessage(err) })));
    }

    try {
      for (const addOperation of addOperations) {
        if (addOperation.directory) {
          await zipWriter.add(addOperation.path, null);
        } else {
          const fileReader = new ZipFileReader(addOperation.filePath);
          await zipWriter.add(addOperation.path, fileReader);
          await fileReader.close();
        }
      }
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-write-file-add-failed-error-message',
        { archiveFile: newArchiveFilePath, error: getErrorMessage(err) })));
    } finally {
      await this._closeReaders(zipFileReader, zipReader);
      await this._closeWriters(zipFileWriter, zipWriter);
    }
    return Promise.resolve();
  }

  async _swapArchiveFiles(file, newArchiveFilePath) {
    return new Promise((resolve, reject) => {
      fsExtra.move(newArchiveFilePath, file, { overwrite: true }).then(() => {
        this.logger.debug('Replaced original archive file %s with new archive file %s', file, newArchiveFilePath);
        resolve();
      }).catch(err => reject(new Error(i18n.t('model-archive-swap-files-failed-error-message',
        { originalFile: file, newFile: newArchiveFilePath, error: getErrorMessage(err) }))));
    });
  }

  async _closeReaders(zipFileReader, zipReader) {
    if (zipFileReader) {
      try {
        await zipFileReader.close();
      } catch(err) {
        this.logger.warn(`zipFileReader.close() failed: ${getErrorMessage(err)}`);
      }
    }
    if (zipReader) {
      try {
        await zipReader.close();
      } catch(err) {
        this.logger.warn(`zipReader.close() failed: ${getErrorMessage(err)}`);
      }
    }
  }

  async _closeWriters(zipFileWriter, zipWriter) {
    // Must close ZipWriter first so that the cached data can be written to ZipFileWriter
    //
    if (zipWriter) {
      try {
        await zipWriter.close();
      } catch(err) {
        this.logger.warn(`zipWriter.close() failed: ${getErrorMessage(err)}`);
      }
    }
    if (zipFileWriter) {
      try {
        await zipFileWriter.close();
      } catch(err) {
        this.logger.warn(`zipWriter.close() failed: ${getErrorMessage(err)}`);
      }
    }
  }

  // Create a structure based on path names for the existing archive.zip file such as:
  //
  // {
  //   config: {
  //     wlsdeploy: {
  //       stores:
  //         bar: { op: "copy", directory: true, zipEntry: null }
  //     }
  //   },
  //   wlsdeploy: {
  //     applications: {
  //       "foo.war": { op: "copy", directory: false, zipEntry: entry },
  //     }
  //   }
  // }
  //
  _formatZipEntries(zipEntries) {
    const structuredZipEntries = {};
    if ('files' in zipEntries) {
      const zipEntriesFiles = zipEntries['files'];
      for (const [zipPath, zipEntry] of Object.entries(zipEntriesFiles)) {
        let currentMap = structuredZipEntries;
        const zipPathElements = zipPath.split('/');
        for (let idx = 0; idx < zipPathElements.length; idx++) {
          const zipEntryElement = zipPathElements[idx];
          if (idx === zipPathElements.length - 1) {
            currentMap[zipEntryElement] = { op: 'copy', directory: zipEntry.directory };
          } else {
            if (zipEntryElement in currentMap) {
              currentMap = currentMap[zipEntryElement];
            } else {
              currentMap[zipEntryElement] = {};
              currentMap = currentMap[zipEntryElement];
            }
          }
        }
      }
    }
    this._removeIntermediateDirectoryEntries(structuredZipEntries);
    return structuredZipEntries;
  }

  // merge the structure of the original zip file contents:
  //  - process all remove operations first by removing them from the formattedZipEntries
  //  - restructure the remaining formattedZipEntries based on the full zipPath and the "copy" block
  //  - process all the add operations by merging them into the restructured data structure
  //
  _mergeZipOperations(formattedZipEntries, operations) {
    const addOperations = [];
    for (const operation of operations) {
      switch(operation.op) {
        case 'add':
          operation.directory = operation.path.endsWith('/');
          addOperations.push(operation);
          break;

        case 'remove':
          this._removeFormattedZipEntry(formattedZipEntries, operation.path, addOperations);
          break;

        default:
          // error
          break;
      }
    }

    // before processing the add entries, reformat the remaining zip entries into an
    // of leaf nodes of copy operations:
    //
    // [
    //   { op: "copy", directory: false, path: "wlsdeploy/applications/foo.war" },
    //   { op: "copy", directory: true,  path: "config/wlsdeploy/stores/bar/" },
    //   ...
    // ]
    //
    const copyLeafNodes = [];
    this._findCopyLeafNodes(formattedZipEntries, copyLeafNodes, '');
    const copyOperationsMap = new Map();
    for (const operation of copyLeafNodes) {
      copyOperationsMap.set(operation.path, operation);
    }
    return { copyOperationsMap: copyOperationsMap, addOperations: addOperations };
  }

  // remove intermediate directories...
  //
  _removeIntermediateDirectoryEntries(structuredZipEntries, context = '') {
    const objectKeys = Object.keys(structuredZipEntries);
    if (objectKeys.length > 1 && objectKeys.includes('')) {
      delete structuredZipEntries[''];
    }
    for (const [key, value] of Object.entries(structuredZipEntries)) {
      if (this._isCopyDescription(value)) {
        // leaf node, so skip...
        //
        continue;
      }
      this._removeIntermediateDirectoryEntries(value, context ? `${context}/${key}` : key);
    }
  }

  _findCopyLeafNodes(structuredZipEntries, leafNodes = [], context = '') {
    for (const [key, value] of Object.entries(structuredZipEntries)) {
      const newContext = context ? `${context}/${key}` : key;
      if (this._isCopyDescription(value)) {
        value.path = newContext;
        leafNodes.push(value);
      } else {
        this._findCopyLeafNodes(value, leafNodes, newContext);
      }
    }
    return leafNodes;
  }

  _isCopyDescription(value) {
    return typeof value === 'object' && 'op' in value && value.op === 'copy' && 'directory' in value;
  }

  _removeFormattedZipEntry(formattedZipEntries, zipPath, addOperations) {
    const zipPathElements = zipPath.split('/');
    const isDirectory = zipPathElements[zipPathElements.length - 1] === '';
    if (isDirectory) {
      // discard the empty element created by the trailing slash...
      zipPathElements.pop();
    }
    const elementToDelete = zipPathElements.pop();
    let objectContainingElementToDelete = formattedZipEntries;
    for (const zipPathElement of zipPathElements) {
      if (zipPathElement in objectContainingElementToDelete) {
        objectContainingElementToDelete = objectContainingElementToDelete[zipPathElement];
      }
    }
    delete objectContainingElementToDelete[elementToDelete];

    // Now, clean up any previous add operations for the removed location...
    //
    const indicesToRemove = [];
    if (zipPath.endsWith('/')) {
      for (let idx = 0; idx < addOperations.length; idx++) {
        if (addOperations[idx].path.startsWith(zipPath)) {
          // put them in reverse order to simplify removal
          //
          indicesToRemove.unshift(idx);
        }
      }
    } else {
      for (let idx = 0; idx < addOperations.length; idx++) {
        if (addOperations[idx].path === zipPath) {
          indicesToRemove.unshift(idx);
          break;
        }
      }
    }
    if (indicesToRemove.length > 0) {
      // since indices are in reverse order (highest to lowest),
      // the indices stay valid throughout the remove operations.
      //
      indicesToRemove.forEach((index) => {
        addOperations.splice(index, 1);
      });
    }
  }
}

class ZipFileReader extends zip.Reader {
  constructor(filename) {
    super();
    this.filename = filename;
  }

  async init() {
    await super.init();
    const fileURI = new URL(this.filename, 'file:///');
    const stats = await fsPromises.stat(fileURI);
    this.size = stats.size;
    this.fileHandle = await fsPromises.open(fileURI, 'r');
  }

  async readUint8Array(offset, length) {
    if (offset + length > this.size) {
      length = this.size - offset;
    }
    if (length > 0) {
      const buffer = new Buffer(length);
      await this.fileHandle.read(buffer, 0, length, offset);
      return new Uint8Array(buffer);
    } else {
      return new Uint8Array(new Buffer(0));
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.fileHandle.close().then(() => {
        resolve();
      }).catch((err) => {
        reject(new Error(i18n.t('model-archive-close-zip-error-message',
          { archiveFile: this.filename, error: getErrorMessage(err) })));
      });
    });
  }
}

class ZipFileWriter extends zip.Writer {
  constructor(filename) {
    super();
    this.filename = filename;
  }

  async init(size = undefined) {
    await super.init(size);
    const fileURI = new URL(this.filename, 'file:///');
    this.fileHandle = await fsPromises.open(fileURI, 'w');
    this.position = 0;
  }

  async writeUint8Array(uint8Array) {
    await this.fileHandle.write(Buffer.from(uint8Array), 0, uint8Array.length, this.position);
    this.position += uint8Array.length;
  }

  async close() {
    await this.fileHandle.close();
  }
}

module.exports = {
  ZipDotJsPlugin
};
