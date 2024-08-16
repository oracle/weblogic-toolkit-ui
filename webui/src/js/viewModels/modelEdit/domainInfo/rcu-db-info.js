/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'oj-c/form-layout', 'oj-c/input-text'
],
function(accUtils, i18n, ko, ModelEditHelper) {
  function RcuDbInfoEditViewModel() {
    this.i18n = i18n;

    const subscriptions = [];

    const INFO_PATH = ['domainInfo', 'RCUDbInfo'];
    const LABEL_PREFIX = 'model-edit-rcudbinfo';

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
      return i18n.t(`${LABEL_PREFIX}-${labelId}`, payload);
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

    const fieldMap = ModelEditHelper.createAliasFieldMap(INFO_PATH, fieldOverrides, subscriptions);

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
      LABEL_PREFIX);

    this.advancedModuleConfig = ModelEditHelper.createFieldSetModuleConfig(remainingFieldNames, fieldMap,
      LABEL_PREFIX);

    this.atpModuleConfig = ModelEditHelper.createFieldSetModuleConfig(atpFields, fieldMap, LABEL_PREFIX);

    this.storesModuleConfig = ModelEditHelper.createFieldSetModuleConfig(storeFields, fieldMap, LABEL_PREFIX);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, LABEL_PREFIX);
    };
  }

  return RcuDbInfoEditViewModel;
});
