/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/message-helper',
  'ojs/ojknockout', 'oj-c/button', 'oj-c/input-password'
],
function(accUtils, ko, MessageHelper) {

  function CredentialCell(args) {
    const VALUE = args.value;

    this.show = ko.observable(false);

    this.showLabel = ko.computed(() => {
      const key = this.show() ? 'table-hide-value-label' : 'table-show-value-label';
      return MessageHelper.t(key);
    });

    this.icon = ko.computed(() => {
      return this.show() ? 'oj-ux-ico-view-hide' : 'oj-ux-ico-view';
    });

    this.value = ko.observable(VALUE);

    this.toggleShow = () => {
      this.show(!this.show());
    };
  }

  return CredentialCell;
});
