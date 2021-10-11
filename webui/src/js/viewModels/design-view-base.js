/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define([],
  function () {
    function DesignViewModelBase(accUtils, i18n) {
      this.accUtils = accUtils;
      this.i18n = i18n;
    }

    //----------- events relating to the page being connected to the DOM ----------

    DesignViewModelBase.prototype.connected = function () {
      this.accUtils.announce(`${this.getPageName()} loaded.`, 'assertive');
    };

    //----------------- internationalization processing ---------------

    DesignViewModelBase.prototype.getEffectiveLabelId = function(labelId) {
      if (labelId.startsWith('page-design-')) {
        return labelId;
      } else {
        return `${this.getPageLabelGroup()}-${labelId}`;
      }
    };

    DesignViewModelBase.prototype.labelMapper = function (labelId, arg) {
      return this.i18n.t(this.getEffectiveLabelId(labelId), arg);
    };

    return DesignViewModelBase;
  });
