/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n',
  'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper'
],
function(accUtils, i18n, MessageHelper, AliasHelper) {
  function FolderPageViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const NAME = args.name;


    this.i18n = i18n;

    this.connected = () => {
      accUtils.announce('Folder Page loaded.', 'assertive');
    };

    this.getTitle = () => {
      if(MODEL_PATH) {
        return MessageHelper.getPageTitle(MODEL_PATH);
      }
      return NAME;
    };
  }

  return FolderPageViewModel;
});
