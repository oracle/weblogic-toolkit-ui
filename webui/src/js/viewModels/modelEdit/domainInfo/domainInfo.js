/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper',
  'oj-c/form-layout', 'oj-c/input-text', 'ojs/ojpopup'
],
function(accUtils, i18n, ModelEditHelper, MessageHelper, AliasHelper) {
  function DomainInfoEditViewModel(args) {
    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.i18n = i18n;
    this.folderLabel = MessageHelper.getFolderLabel(ALIAS_PATH);
    this.advancedLabel = i18n.t('model-edit-advanced-label');

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Domain Info Page loaded.', 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    // these are directly referenced in HTML
    const primaryAttributeNames = [
      'AdminUserName',
      'AdminPassword'
    ];

    const excludeAttributeNames = [
      'OPSSSecrets'
    ];

    const attributeMap = ModelEditHelper.createAttributeMap(MODEL_PATH, {}, subscriptions);

    // create a list of remaining attributes
    const knownAttributeNames = [...primaryAttributeNames, ...excludeAttributeNames];
    const remainingAttributeNames = ModelEditHelper.getRemainingAttributeNames(attributeMap, knownAttributeNames);

    this.remainingModuleConfig = ModelEditHelper.createAttributeSetModuleConfig(remainingAttributeNames, attributeMap,
      MODEL_PATH);

    this.attributeConfig = (key) => {
      return ModelEditHelper.createAttributeModuleConfig(key, attributeMap, MODEL_PATH);
    };
  }

  return DomainInfoEditViewModel;
});
