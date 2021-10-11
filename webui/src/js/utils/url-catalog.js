/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['utils/wkt-logger'],
  function (wktLogger) {
    class UrlCatalog {
      constructor() {
        this.catalog = undefined;
      }

      async initializeCatalog() {
        return new Promise((resolve, reject) => {
          window.api.ipc.invoke('get-url-catalog').then(catalogJson => {
            if (catalogJson) {
              this.catalog = JSON.parse(catalogJson);
              resolve(this);
            } else {
              const error = new Error('URL catalog JSON was empty!');
              wktLogger.error(error);
              reject(error);
            }
          }).catch(err => reject(err));
        });
      }

      getUrl(pageKey, urlKey) {
        return this.catalog[pageKey][urlKey];
      }
    }

    const instance = new UrlCatalog();
    instance.initializeCatalog().then(() => wktLogger.debug('URL catalog initialized'));
    return instance;
  }
);
