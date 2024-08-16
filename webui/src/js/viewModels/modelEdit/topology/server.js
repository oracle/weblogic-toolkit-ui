/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ko, ModelEditHelper) {
  function ServerEditViewModel(args) {
    this.i18n = i18n;
    this.name = args.name;

    const subscriptions = [];

    const SERVER_PATH = ['topology', 'Server', args.name];
    const SSL_PATH = [...SERVER_PATH, 'SSL'];

    const LABEL_PREFIX = 'model-edit-server';
    const SSL_LABEL_PREFIX = 'model-edit-server-ssl';

    this.connected = () => {
      accUtils.announce(`Server Page for ${this.name} loaded.`, 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`${LABEL_PREFIX}-${labelId}`, payload);
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

    const fieldMap = ModelEditHelper.createAliasFieldMap(SERVER_PATH, fieldOverrides, subscriptions);
    const sslFieldMap = ModelEditHelper.createAliasFieldMap(SSL_PATH, fieldOverrides, subscriptions);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, LABEL_PREFIX);
    };

    this.sslFieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, sslFieldMap, SSL_LABEL_PREFIX);
    };

    // create a module config for remaining Server fields
    const remainingFieldNames = ModelEditHelper.getRemainingFieldNames(fieldMap, knownFields);
    this.remainingModuleConfig = ModelEditHelper.createFieldSetModuleConfig(remainingFieldNames, fieldMap,
      LABEL_PREFIX);
  }

  return ServerEditViewModel;
});
