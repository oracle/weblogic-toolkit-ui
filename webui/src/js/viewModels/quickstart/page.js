/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n'], function(accUtils, i18n) {
  function PageViewModel(args) {
    this.i18n = i18n;
    this.pageNumber = args['pageNumber'];

    this.connected = () => {
      accUtils.announce('Quickstart Page 1 loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`quickstart-page${this.pageNumber}-${labelId}`, payload);
    };
  }

  return PageViewModel;
});
