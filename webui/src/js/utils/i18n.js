/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define([],
  function () {
    function I18n() {
      this.t = (keys, options) => {
        return window.api.i18n.t(keys, options);
      };
    }

    return new I18n();
  }
);
