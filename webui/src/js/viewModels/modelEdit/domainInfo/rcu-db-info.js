/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper', 'ojs/ojmodule-element-utils',
  'oj-c/input-text'
],
function(accUtils, i18n, ModelEditHelper, ModuleElementUtils) {
  function RcuDbInfoEditViewModel() {
    this.i18n = i18n;

    const subscriptions = [];

    const INFO_PATH = 'domainInfo/RCUDbInfo';
    const LABEL_PREFIX = 'model-edit-rcudbinfo';

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

    this.primaryFields = [
      {
        key: 'rcu_database_type',
        attribute: 'rcu_database_type',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'oracle_database_connection_type',
        attribute: 'oracle_database_connection_type',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'compInfoXMLLocation',
        attribute: 'compInfoXMLLocation',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'oracle_net_tns_admin',
        attribute: 'oracle.net.tns_admin',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'rcu_admin_password',
        attribute: 'rcu_admin_password',
        path: INFO_PATH,
        type: 'password'
      },
      {
        key: 'rcu_admin_user',
        attribute: 'rcu_admin_user',
        path: INFO_PATH,
        type: 'credential'
      },
      {
        key: 'rcu_db_conn_string',
        attribute: 'rcu_db_conn_string',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'rcu_edition',
        attribute: 'rcu_edition',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'rcu_prefix',
        attribute: 'rcu_prefix',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'rcu_schema_password',
        attribute: 'rcu_schema_password',
        path: INFO_PATH,
        type: 'password'
      },
      {
        key: 'rcu_default_tablespace',
        attribute: 'rcu_default_tablespace',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'rcu_temp_tablespace',
        attribute: 'rcu_temp_tablespace',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'rcu_unicode_support',
        attribute: 'rcu_unicode_support',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'tns_alias',
        attribute: 'tns.alias',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'rcu_variables',
        attribute: 'rcu_variables',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'storageXMLLocation',
        attribute: 'storageXMLLocation',
        path: INFO_PATH,
        type: 'string'
      },
    ];

    this.atpFields = [
      {
        key: 'atp_default_tablespace',
        attribute: 'atp.default.tablespace',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'atp_temp_tablespace',
        attribute: 'atp.temp.tablespace',
        path: INFO_PATH,
        type: 'string'
      },
    ];

    this.remainingFields = [
      {
        key: 'javax_net_ssl_keyStore',
        attribute: 'javax.net.ssl.keyStore',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'javax_net_ssl_keyStoreType',
        attribute: 'javax.net.ssl.keyStoreType',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'javax_net_ssl_keyStorePassword',
        attribute: 'javax.net.ssl.keyStorePassword',
        path: INFO_PATH,
        type: 'password'
      },
      {
        key: 'javax_net_ssl_trustStore',
        attribute: 'javax.net.ssl.trustStore',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'javax_net_ssl_trustStoreType',
        attribute: 'javax.net.ssl.trustStoreType',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'javax_net_ssl_trustStorePassword',
        attribute: 'javax.net.ssl.trustStorePassword',
        path: INFO_PATH,
        type: 'password'
      },
    ];

    this.att = {};
    ModelEditHelper.addVariables(this.primaryFields, subscriptions, this.att);
    ModelEditHelper.addVariables(this.atpFields, subscriptions, this.att);
    ModelEditHelper.addVariables(this.remainingFields, subscriptions, this.att);

    this.primaryModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/field-set',
      params: {fields: this.primaryFields, labelPrefix: LABEL_PREFIX, att: this.att}
    });

    this.atpModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/field-set',
      params: {fields: this.atpFields, labelPrefix: LABEL_PREFIX, att: this.att}
    });

    this.remainingModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/field-set',
      params: {fields: this.remainingFields, labelPrefix: LABEL_PREFIX, att: this.att}
    });

    this.fieldConfig = (key) => {
      for(const fieldConfig of this.remainingFields) {
        if(fieldConfig.key === key) {
          return ModelEditHelper.fieldConfig(fieldConfig, this.att[key], LABEL_PREFIX);
        }
      }
      return ModelEditHelper.fieldConfig(null, null, LABEL_PREFIX);
    };
  }

  return RcuDbInfoEditViewModel;
});
