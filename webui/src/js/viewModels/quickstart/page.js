/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/view-helper'], function(accUtils, i18n) {
  function PageViewModel(args) {
    this.i18n = i18n;
    this.pageNumber = args['pageNumber'];
    this.wrcFrontendCompatibilityVersion = args['wrcFrontendCompatibilityVersion'];

    this.connected = () => {
      accUtils.announce(`Quickstart Page ${this.pageNumber} loaded.`, 'assertive');
    };

    // this.themeClasses = ViewHelper.themeClasses;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`quickstart-page${this.pageNumber}-${labelId}`, payload);
    };
  }

  return PageViewModel;
});
