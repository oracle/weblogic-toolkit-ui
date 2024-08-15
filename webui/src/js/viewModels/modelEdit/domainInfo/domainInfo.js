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

    const INFO_PATH = ['domainInfo'];
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

    // these are directly referenced in HTML
    const primaryFieldNames = [
      'AdminUserName',
      'AdminPassword'
    ];

    const excludeFieldNames = [
      'OPSSSecrets'
    ];

    const fieldMap = ModelEditHelper.createAliasFieldMap(INFO_PATH, subscriptions);

    // create a list of remaining fields
    const knownFieldNames = [...primaryFieldNames, ...excludeFieldNames];
    const remainingFieldNames = ModelEditHelper.getRemainingFieldNames(fieldMap, knownFieldNames);

    this.remainingModuleConfig = ModelEditHelper.createFieldSetModuleConfig(remainingFieldNames, fieldMap,
      LABEL_PREFIX);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, LABEL_PREFIX);
    };
  }

  return DomainInfoEditViewModel;
});
