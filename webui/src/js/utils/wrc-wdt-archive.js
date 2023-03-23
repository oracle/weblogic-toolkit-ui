/**
 * @license
 * Copyright (c) 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'utils/i18n', 'utils/wdt-archive-helper', 'utils/wkt-logger'],
  function(project, i18n, archiveHelper, wktLogger) {
    class WrcWdtArchive {
      constructor() {
        this.project = project;
      }

      async addToArchive(wrcEntryTypeName, filePath, otherArgs={}) {
        wktLogger.debug('entering WRC API addToArchive(%s, %s, %s)', wrcEntryTypeName, filePath, otherArgs);
        const typeInfo = this._convertWrcType(wrcEntryTypeName);
        if (typeof typeInfo === 'undefined') {
          return Promise.reject(new Error(i18n.t('wrc-wdt-archive-add-empty-wrc-type-error')));
        } else if (!filePath) {
          return Promise.reject(new Error(i18n.t('wrc-wdt-archive-add-empty-file-path-error')));
        }

        const archiveEntryTypeName = typeInfo.entryTypeName;
        let filePathType = typeInfo.fileType;
        const archiveEntryTypes = await archiveHelper.getEntryTypes();
        const archiveEntry = archiveEntryTypes[archiveEntryTypeName];
        if (typeof archiveEntry === 'undefined') {
          return Promise.reject(new Error(i18n.t('wrc-wdt-archive-add-bad-wrc-type-error', {wrcType: wrcEntryTypeName})));
        }
        if (!filePathType && (archiveEntry.subtype === 'file' || archiveEntry.subtype === 'dir')) {
          filePathType = archiveEntry.subtype;
        }

        const options =
          archiveHelper.buildAddToArchiveOptions(archiveEntryTypeName, archiveEntry, filePath, filePathType, otherArgs);

        wktLogger.debug('preparing to call archiveHelper.addToArchive(%s, %s)', archiveEntryTypeName, options);
        return new Promise((resolve, reject) => {
          archiveHelper.addToArchive(archiveEntryTypeName, options).then((archivePath) => {
            wktLogger.debug('WRC API addToArchive(%s, %s, %s) returned %s', wrcEntryTypeName, filePath,
              otherArgs, archivePath);
            resolve(archivePath);
          }).catch(err => {
            const errMessage = err instanceof Error ? err.message : err;
            const error =
              new Error(i18n.t('wrc-wdt-archive-add-failed-error', {wrcType: wrcEntryTypeName, error: errMessage}));
            reject(error);
          });
        });
      }

      // WRC does not have the ability to remember the archivePath returned from addToArchive().
      // This causes a problem for removing directories, where the underlying code depends on
      // directory entries having a trailing slash.  As such, we have to go determine if the
      // archivePath argument is a directory and, if so, make sure it ends with a trailing slash
      // before passing it on.
      //
      async removeFromArchive(archivePath) {
        wktLogger.debug('entering WRC API removeFromToArchive(%s)', archivePath);
        return new Promise((resolve, reject) => {
          if (archivePath) {
            try {
              const updatedArchivePath = this._convertWrcArchivePath(archivePath);

              wktLogger.debug('calling archiveHelper.removeFromArchive(%s)', updatedArchivePath);
              archiveHelper.removeFromArchive(updatedArchivePath);
              resolve();
            } catch (err) {
              const errorMessage = window.api.utils.getErrorMessage(err);
              reject(new Error(i18n.t('wrc-wdt-archive-remove-failed-to-match-path-error',
                { archivePath, error: errorMessage})));
            }
          } else {
            reject(new Error(i18n.t('wrc-wdt-archive-remove-empty-path-error')));
          }
        });
      }

      getExtensionsObject() {
        return {
          wktui: {
            modelArchive: this
          }
        };
      }

      _convertWrcType(wrcEntryTypeName) {
        const result = {};

        if (wrcEntryTypeName) {
          if (wrcEntryTypeName.endsWith('File')) {
            result.fileType = 'file';
            result.entryTypeName = wrcEntryTypeName.slice(0, -4);
          } else if (wrcEntryTypeName.endsWith('Dir')) {
            result.fileType = 'dir';
            result.entryTypeName = wrcEntryTypeName.slice(0, -3);
          }
          else {
            result.type = wrcEntryTypeName;
          }
        }

        return result;
      }

      _convertWrcArchivePath(wrcArchivePath, nodesObservable = this.project.wdtModel.archiveRoots) {
        const wrcPath = wrcArchivePath.endsWith('/') ? wrcArchivePath.slice(0, -1) : wrcArchivePath;
        wktLogger.debug('Entering _convertWrcArchivePath(%s, %s)', wrcArchivePath, JSON.stringify(nodesObservable()));
        for (const node of nodesObservable()) {
          wktLogger.debug('wrcPath %s, node.id = %s', wrcPath, node.id);
          if (wrcPath === node.id || wrcPath + '/' === node.id) {
            wktLogger.debug('Found matching node id = %s', node.id);
            return node.id;
          }

          if (node.children) {
            wktLogger.debug('node %s has children', node.id);
            const result = this._convertWrcArchivePath(wrcArchivePath, node.children)
            if (result) {
              wktLogger.debug('return nested _convertWrcArchivePath() call from node %s: %s', node.id, result);
              return result;
            }
          }
        }
        throw new Error(i18n.t('wrc-wdt-archive-remove-no-matching-node-error', {archivePath: wrcArchivePath}));
      }
    }

    return new WrcWdtArchive();
  }
);
