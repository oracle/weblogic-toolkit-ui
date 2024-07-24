/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ModelEditHelper) {
  function ApplicationEditViewModel(args) {
    this.i18n = i18n;
    this.name = args.name;

    const subscriptions = [];

    const APPLICATION_PATH = 'appDeployments/Application/' + args.name;

    const LABEL_PREFIX = 'model-edit-application';

    this.connected = () => {
      accUtils.announce(`Application Page for ${this.name} loaded.`, 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`${LABEL_PREFIX}-${labelId}`, payload);
    };

    const fields = [
      {
        key: 'SourcePath',
        attribute: 'SourcePath',
        path: APPLICATION_PATH,
        type: 'string'
      }
    ];

    const fieldMap = ModelEditHelper.createFieldMap(fields, subscriptions);

    this.fieldConfig = (key) => {
      return ModelEditHelper.createFieldModuleConfig(key, fieldMap, LABEL_PREFIX);
    };
  }

  return ApplicationEditViewModel;
});
