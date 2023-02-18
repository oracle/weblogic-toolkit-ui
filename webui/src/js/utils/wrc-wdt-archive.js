/**
 * @license
 * Copyright (c) 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'utils/i18n', 'utils/wdt-archive-helper'],
  function(project, i18n, archiveHelper) {
    class WrcWdtArchive {
      constructor() {
        this.project = project;
      }

      async addToArchive(wrcEntryTypeName, filePath, otherArgs={}) {
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

        return new Promise((resolve, reject) => {
          archiveHelper.addToArchive(archiveEntryTypeName, options).then((archivePath) => {
            resolve(archivePath);
          }).catch(err => {
            const errMessage = err instanceof Error ? err.message : err;
            const error =
              new Error(i18n.t('wrc-wdt-archive-add-failed-error', {wrcType: wrcEntryTypeName, error: errMessage}));
            reject(error);
          });
        });
      }

      async removeFromArchive(archivePath) {
        return new Promise((resolve, reject) => {
          if (archivePath) {
            archiveHelper.removeFromArchive(archivePath);
            resolve();
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
    }

    return new WrcWdtArchive();
  }
);
