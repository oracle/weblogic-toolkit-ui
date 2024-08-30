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
    const primaryFieldNames = [
      'AdminUserName',
      'AdminPassword'
    ];

    const excludeFieldNames = [
      'OPSSSecrets'
    ];

    const fieldMap = ModelEditHelper.createAliasFieldMap(MODEL_PATH, {}, subscriptions);

    // create a list of remaining fields
    const knownFieldNames = [...primaryFieldNames, ...excludeFieldNames];
    const remainingFieldNames = ModelEditHelper.getRemainingFieldNames(fieldMap, knownFieldNames);

    this.remainingModuleConfig = ModelEditHelper.createFieldSetModuleConfig(remainingFieldNames, fieldMap,
      MODEL_PATH);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, MODEL_PATH);
    };
  }

  return DomainInfoEditViewModel;
});
