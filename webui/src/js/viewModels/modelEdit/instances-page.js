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
  function InstancesPageViewModel(args) {
    // for model folders with multiple instances (such as Server/myServer).
    // display an instances table, usually for folders in the navigation tree.

    const MODEL_PATH = args.modelPath;

    this.i18n = i18n;

    this.connected = () => {
      accUtils.announce('Instances Page loaded.', 'assertive');
    };

    this.getTitle = () => {
      return MessageHelper.getPageTitle(MODEL_PATH);
    };

    this.folderHeaderModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-header',
      params: {
        modelPath: MODEL_PATH,
      }
    });

    this.getTableModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/instances-table',
        params: {
          modelPath: MODEL_PATH,
          menuLink: true
        }
      });
    };
  }

  return InstancesPageViewModel;
});
