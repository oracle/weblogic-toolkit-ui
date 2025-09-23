/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper','utils/modelEdit/navigation-helper',
  'oj-c/labelled-link'
],
function(accUtils, ko, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper, NavigationHelper) {
  function InlineSectionViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.title = MessageHelper.getFolderLabel(ALIAS_PATH);

    this.goToFolder = () => {
      console.log('GO TO: ' + MODEL_PATH);
      NavigationHelper.navigateToElement(MODEL_PATH);
    };
  }

  return InlineSectionViewModel;
});
