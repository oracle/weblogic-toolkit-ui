/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'ojs/ojmodule-element-utils',
  'oj-c/input-text'
],
function(accUtils, ko, ModelEditHelper, MessageHelper, ModuleElementUtils) {
  function ServerEditViewModel(args) {
    const MODEL_PATH = args.modelPath;

    const subscriptions = [];

    this.name = MODEL_PATH[MODEL_PATH.length - 1];
    this.title = MessageHelper.getPageTitle(MODEL_PATH);

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
      return MessageHelper.t(`server-${labelId}`, payload);
    };

    this.editLabelMapper = (labelId, payload) => {
      return ModelEditHelper.t(labelId, payload);
    };

    const knownAttributes = [
      'Cluster',
      'DefaultIIOPUser',
      'ListenPort',
      'Notes',
    ];

    // valid for Server and Server/SSL, since ListenPort is in both
    const attributeOverrides = {
      ListenPort: { validators: [ModelEditHelper.portValidator] }
    };

    const attributeMap = ModelEditHelper.createAttributeMap(MODEL_PATH, attributeOverrides, subscriptions);
    const sslAttributeMap = ModelEditHelper.createAttributeMap(SSL_PATH, attributeOverrides, subscriptions);

    this.attributeConfig = (key) => {
      return ModelEditHelper.createAttributeModuleConfig(key, attributeMap, MODEL_PATH);
    };

    this.sslAttributeConfig = (key) => {
      return ModelEditHelper.createAttributeModuleConfig(key, sslAttributeMap, SSL_PATH);
    };

    // create a module config for remaining Server attributes
    const remainingAttributeNames = ModelEditHelper.getRemainingAttributeNames(attributeMap, knownAttributes);
    this.remainingModuleConfig = ModelEditHelper.createAttributeSetModuleConfig(remainingAttributeNames, attributeMap,
      MODEL_PATH);

    this.folderHeaderModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-header',
      params: {
        modelPath: MODEL_PATH,
      }
    });
  }

  return ServerEditViewModel;
});
