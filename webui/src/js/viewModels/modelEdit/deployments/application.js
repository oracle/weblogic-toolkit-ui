/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ModelEditHelper, MessageHelper) {
  function ApplicationEditViewModel(args) {
    const MODEL_PATH = args.modelPath;

    const subscriptions = [];

    this.i18n = i18n;
    this.name = MODEL_PATH[MODEL_PATH.length - 1];
    this.title = MessageHelper.getPageTitle(MODEL_PATH);

    this.connected = () => {
      accUtils.announce(`Application Page for ${this.name} loaded.`, 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    const attributeMap = ModelEditHelper.createAttributeMap(MODEL_PATH, {}, subscriptions);

    this.attributeConfig = (key) => {
      return ModelEditHelper.createAttributeModuleConfig(key, attributeMap, MODEL_PATH);
    };
  }

  return ApplicationEditViewModel;
});
