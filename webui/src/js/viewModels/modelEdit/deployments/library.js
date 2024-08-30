/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ModelEditHelper, MessageHelper, AliasHelper) {
  function LibraryEditViewModel(args) {
    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.i18n = i18n;
    this.name = MODEL_PATH[MODEL_PATH.length - 1];
    this.elementLabel = MessageHelper.getElementLabel(ALIAS_PATH);

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce(`Library Page for ${this.name} loaded.`, 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    const fieldMap = ModelEditHelper.createAliasFieldMap(MODEL_PATH, {}, subscriptions);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, MODEL_PATH);
    };
  }

  return LibraryEditViewModel;
});
