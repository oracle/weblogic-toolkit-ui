/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout'], function(accUtils, i18n, ko) {
  function ServerEditViewModel(args) {
    this.i18n = i18n;
    this.name = args.name;
    this.argFields = args.fields;

    this.fields = ko.observableArray();
    Object.keys(this.argFields).forEach(key => {
      this.fields.push({key: key, value: this.argFields[key]});
    });

    this.connected = () => {
      accUtils.announce(`Server Page for ${this.name} loaded.`, 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-server-${labelId}`, payload);
    };
  }

  return ServerEditViewModel;
});
