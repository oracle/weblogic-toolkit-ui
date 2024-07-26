/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper',
  'oj-c/form-layout', 'oj-c/input-text', 'ojs/ojpopup'
],
function(accUtils, i18n, ModelEditHelper) {
  function DomainInfoEditViewModel() {
    this.i18n = i18n;

    const subscriptions = [];

    const INFO_PATH = 'domainInfo';
    const LABEL_PREFIX = 'model-edit-domainInfo';

    this.connected = () => {
      accUtils.announce('Domain Info Page loaded.', 'assertive');
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
        key: 'AdminPassword',
        attribute: 'AdminPassword',
        path: INFO_PATH,
        type: 'password'
      },
      {
        key: 'AdminUserName',
        attribute: 'AdminUserName',
        path: INFO_PATH,
        type: 'credential'
      },
    ];

    this.remainingFields = [
      {
        key: 'AppDir',
        attribute: 'AppDir',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'OPSSWalletPassphrase',
        attribute: 'OPSSWalletPassphrase',
        path: INFO_PATH,
        type: 'password'
      },
      {
        key: 'ServerGroupTargetingLimits',
        attribute: 'ServerGroupTargetingLimits',
        path: INFO_PATH,
        type: 'dict'
      },
      {
        key: 'DynamicClusterServerGroupTargetingLimits',
        attribute: 'DynamicClusterServerGroupTargetingLimits',
        path: INFO_PATH,
        type: 'dict'
      },
      {
        key: 'ServerStartMode',
        attribute: 'ServerStartMode',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'UseSampleDatabase',
        attribute: 'UseSampleDatabase',
        path: INFO_PATH,
        type: 'string'
      },
      {
        key: 'EnableJMSStoreDBPersistence',
        attribute: 'EnableJMSStoreDBPersistence',
        path: INFO_PATH,
        type: 'boolean'
      },
      {
        key: 'EnableJTATLogDBPersistence',
        attribute: 'EnableJTATLogDBPersistence',
        path: INFO_PATH,
        type: 'boolean'
      },
      {
        key: 'domainBin',
        attribute: 'domainBin',
        path: INFO_PATH,
        type: 'list'
      },
      {
        key: 'domainLibraries',
        attribute: 'domainLibraries',
        path: INFO_PATH,
        type: 'list'
      },
    ];

    const fieldMap = {};
    ModelEditHelper.addFields(this.primaryFields, fieldMap, subscriptions);
    ModelEditHelper.addFields(this.remainingFields, fieldMap, subscriptions);

    this.remainingModuleConfig = ModelEditHelper.createFieldSetModuleConfig(this.remainingFields, fieldMap,
      LABEL_PREFIX);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, LABEL_PREFIX);
    };
  }

  return DomainInfoEditViewModel;
});
