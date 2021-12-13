/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'knockout', 'models/wkt-project', 'models/wkt-console', 'utils/dialog-helper',
  'utils/project-io', 'utils/i18n', 'utils/validation-helper', 'utils/wkt-logger', 'ojs/ojbootstrap', 'ojs/ojknockout',
  'ojs/ojbutton', 'ojs/ojdialog'],
function (WktActionsBase) {
  class WdtActionsBase extends WktActionsBase {
    constructor() {
      super();
    }
  }

  return WdtActionsBase;
});
