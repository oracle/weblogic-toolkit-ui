/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n',
  'utils/modelEdit/message-helper', 'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, MessageHelper, ModuleElementUtils) {
  function ElementsPageViewModel(args) {
    this.i18n = i18n;
    this.modelPath = args.modelPath;
    this.summaryAttributes = args.summaryAttributes;

    this.connected = () => {
      accUtils.announce('Elements Page loaded.', 'assertive');
    };

    this.getTitle = () => {
      return MessageHelper.getPageTitle(this.modelPath);
    };

    this.getTableModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/elements-table',
        params: {
          modelPath: this.modelPath,
          summaryAttributes: this.summaryAttributes,
          menuLink: true
        }
      });
    };
  }

  return ElementsPageViewModel;
});
