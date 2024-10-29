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

    const connectionAttributes = [
      'rcu_database_type',
      'oracle_database_connection_type',
      'rcu_admin_password',
      'rcu_admin_user',
      'rcu_db_conn_string',
      'rcu_prefix',
      'rcu_schema_password',
      'tns.alias'
    ];

    const atpAttributes = [
      'atp.default.tablespace',
      'atp.temp.tablespace',
    ];

    const storeAttributes = [
      'javax.net.ssl.keyStore',
      'javax.net.ssl.keyStoreType',
      'javax.net.ssl.keyStorePassword',
      'javax.net.ssl.trustStore',
      'javax.net.ssl.trustStoreType',
      'javax.net.ssl.trustStorePassword'
    ];

    const excludeAttributeNames = [
      'databaseType'
    ];

    const attributeOverrides = {
      rcu_database_type: { options: DB_TYPES },
      oracle_database_connection_type: { options: CONNECTION_TYPES },
      'javax.net.ssl.keyStoreType': { options: STORE_TYPES },
      'javax.net.ssl.trustStoreType': { options: STORE_TYPES },
    };

    const attributeMap = ModelEditHelper.createAttributeMap(MODEL_PATH, attributeOverrides, subscriptions);

    // disable connection type based on database type
    const dbTypeAttribute = attributeMap['rcu_database_type'];
    const connectionTypeAttribute = attributeMap['oracle_database_connection_type'];
    connectionTypeAttribute['disabled'] = ko.computed(() => {
      return ModelEditHelper.getDerivedValue(dbTypeAttribute.observable()) !== 'ORACLE';
    });

    // create a list of remaining attributes
    const knownAttributeNames = [...connectionAttributes, ...atpAttributes, ...storeAttributes, ...excludeAttributeNames];
    const remainingAttributeNames = ModelEditHelper.getRemainingAttributeNames(attributeMap, knownAttributeNames);

    this.connectionModuleConfig = ModelEditHelper.createAttributeSetModuleConfig(connectionAttributes, attributeMap,
      MODEL_PATH);

    this.advancedModuleConfig = ModelEditHelper.createAttributeSetModuleConfig(remainingAttributeNames, attributeMap,
      MODEL_PATH);

    this.atpModuleConfig = ModelEditHelper.createAttributeSetModuleConfig(atpAttributes, attributeMap, MODEL_PATH);

    this.storesModuleConfig = ModelEditHelper.createAttributeSetModuleConfig(storeAttributes, attributeMap, MODEL_PATH);

    this.attributeConfig = (key) => {
      return ModelEditHelper.createAttributeModuleConfig(key, attributeMap, MODEL_PATH);
    };
  }

  return RcuDbInfoEditViewModel;
});
