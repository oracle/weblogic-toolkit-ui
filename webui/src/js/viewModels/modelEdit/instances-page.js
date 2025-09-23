/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils',
  'utils/modelEdit/message-helper', 'ojs/ojmodule-element-utils'
],
function(accUtils, MessageHelper, ModuleElementUtils) {
  function InstancesPageViewModel(args) {
    // for model folders with multiple instances (such as Server/myServer).
    // display an instances table, usually for folders in the navigation tree.

    const MODEL_PATH = args.modelPath;

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
        }
      });
    };
  }

  return InstancesPageViewModel;
});
