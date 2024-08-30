/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper','utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper',
  'oj-c/form-layout', 'oj-c/input-text'
],
function(accUtils, i18n, ko, ModelEditHelper, MessageHelper, AliasHelper) {
  function RcuDbInfoEditViewModel(args) {
    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const subscriptions = [];

    this.i18n = i18n;
    this.folderLabel = MessageHelper.getFolderLabel(ALIAS_PATH);

    const DB_TYPES = [
      { key: 'ORACLE', label: 'ORACLE' },
      { key: 'EBR', label: 'EBR' },
      { key: 'SQLSERVER', label: 'SQLSERVER' },
      { key: 'DB2', label: 'DB2' },
      { key: 'MYSQL', label: 'MYSQL' }
    ];

    const CONNECTION_TYPES = [
      { key: 'SSL', label: 'SSL' },
      { key: 'ATP', label: 'ATP' }
    ];

    const STORE_TYPES = [
      { key: 'SSO', label: 'SSO' },
      { key: 'PKCS12', label: 'PKCS12' },
      { key: 'JKS', label: 'JKS' }
    ];

    this.connected = () => {
      accUtils.announce('RCU Database Info Page loaded.', 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-rcudbinfo-${labelId}`, payload);
    };

    this.editLabelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-${labelId}`, payload);
    };

    const connectionFields = [
      'rcu_database_type',
      'oracle_database_connection_type',
      'rcu_admin_password',
      'rcu_admin_user',
      'rcu_db_conn_string',
      'rcu_prefix',
      'rcu_schema_password',
      'tns.alias'
    ];

    const atpFields = [
      'atp.default.tablespace',
      'atp.temp.tablespace',
    ];

    const storeFields = [
      'javax.net.ssl.keyStore',
      'javax.net.ssl.keyStoreType',
      'javax.net.ssl.keyStorePassword',
      'javax.net.ssl.trustStore',
      'javax.net.ssl.trustStoreType',
      'javax.net.ssl.trustStorePassword'
    ];

    const excludeFieldNames = [
      'databaseType'
    ];

    const fieldOverrides = {
      rcu_database_type: { options: DB_TYPES },
      oracle_database_connection_type: { options: CONNECTION_TYPES },
      'javax.net.ssl.keyStoreType': { options: STORE_TYPES },
      'javax.net.ssl.trustStoreType': { options: STORE_TYPES },
    };

    const fieldMap = ModelEditHelper.createAliasFieldMap(MODEL_PATH, fieldOverrides, subscriptions);

    // disable connection type based on database type
    const dbTypeField = fieldMap['rcu_database_type'];
    const connectionTypeField = fieldMap['oracle_database_connection_type'];
    connectionTypeField['disabled'] = ko.computed(() => {
      return ModelEditHelper.getDerivedValue(dbTypeField.observable()) !== 'ORACLE';
    });

    // create a list of remaining fields
    const knownFieldNames = [...connectionFields, ...atpFields, ...storeFields, ...excludeFieldNames];
    const remainingFieldNames = ModelEditHelper.getRemainingFieldNames(fieldMap, knownFieldNames);

    this.connectionModuleConfig = ModelEditHelper.createFieldSetModuleConfig(connectionFields, fieldMap,
      MODEL_PATH);

    this.advancedModuleConfig = ModelEditHelper.createFieldSetModuleConfig(remainingFieldNames, fieldMap,
      MODEL_PATH);

    this.atpModuleConfig = ModelEditHelper.createFieldSetModuleConfig(atpFields, fieldMap, MODEL_PATH);

    this.storesModuleConfig = ModelEditHelper.createFieldSetModuleConfig(storeFields, fieldMap, MODEL_PATH);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, MODEL_PATH);
    };
  }

  return RcuDbInfoEditViewModel;
});
