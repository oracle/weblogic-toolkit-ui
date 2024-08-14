/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/i18n', 'utils/wkt-logger'],
  function (ko, i18n, WktLogger) {
    function AliasHelper() {
      // maintain configuration derived from WDT aliases

      this.aliasData = ko.observable();

      this.aliasDataLoaded = ko.computed(() => {
        return !!this.aliasData();
      });

      this.aliasDataError = ko.observable();

      // TODO: reload if new version of WDT is downloaded

      window.api.ipc.invoke('get-alias-info')
        .then(result => {
          this.aliasData(result);
          this.aliasDataError(null);
        })
        .catch(err => {
          WktLogger.error('Error loading alias data: ' + err);
          this.aliasData(null);
          this.aliasDataError(err);
        });
    }

    // return a singleton instance
    return new AliasHelper();
  }
);
