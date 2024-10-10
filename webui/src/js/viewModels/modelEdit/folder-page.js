/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, ModelEditHelper, MessageHelper, AliasHelper, ModuleElementUtils) {
  function FolderPageViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const NAME = args.name;

    this.i18n = i18n;

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Folder Page loaded.', 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.getTitle = () => {
      if(MODEL_PATH) {
        return MessageHelper.getPageTitle(MODEL_PATH);
      }
      return NAME;
    };

    this.getFolderContentModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/folder-content',
        params: {
          modelPath: MODEL_PATH,
        }
      });
    };
  }

  return FolderPageViewModel;
});
