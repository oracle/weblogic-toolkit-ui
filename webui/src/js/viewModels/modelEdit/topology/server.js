/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ko, ModelEditHelper, MessageHelper, AliasHelper) {
  function ServerEditViewModel(args) {
    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const subscriptions = [];

    this.i18n = i18n;
    this.name = MODEL_PATH[MODEL_PATH.length - 1];
    this.elementLabel = MessageHelper.getElementLabel(ALIAS_PATH);

    const SSL_PATH = [...MODEL_PATH, 'SSL'];


    this.connected = () => {
      accUtils.announce(`Server Page for ${this.name} loaded.`, 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-server-${labelId}`, payload);
    };

    this.editLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-${labelId}`, payload);
    };

    const knownFields = [
      'Cluster',
      'DefaultIIOPUser',
      'ListenPort',
      'Notes',
    ];

    // valid for Server and Server/SSL, since ListenPort is in both
    const fieldOverrides = {
      ListenPort: { validators: [ModelEditHelper.portValidator] }
    };

    const fieldMap = ModelEditHelper.createAliasFieldMap(MODEL_PATH, fieldOverrides, subscriptions);
    const sslFieldMap = ModelEditHelper.createAliasFieldMap(SSL_PATH, fieldOverrides, subscriptions);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, MODEL_PATH);
    };

    this.sslFieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, sslFieldMap, SSL_PATH);
    };

    // create a module config for remaining Server fields
    const remainingFieldNames = ModelEditHelper.getRemainingFieldNames(fieldMap, knownFields);
    this.remainingModuleConfig = ModelEditHelper.createFieldSetModuleConfig(remainingFieldNames, fieldMap,
      MODEL_PATH);
  }

  return ServerEditViewModel;
});
