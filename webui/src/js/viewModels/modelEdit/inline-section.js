/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper'
],
function(accUtils, ko, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper) {
  function InlineSectionViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const META_SECTION = args.metaSection;
    const ATTRIBUTE_MAP = args.attributeMap;
    const REMAINING_NAMES = args.remainingNames;

    this.subscriptions = [];

    this.connected = () => {
      accUtils.announce('Inline section loaded.', 'assertive');
      this.subscriptions = [];
    };

    this.disconnected = () => {
      this.subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    this.contents = [];

    const contents = META_SECTION.contents || [];
    contents.forEach(content => {
      let moduleConfig;
      if(content.type === 'attributeSet') {
        let attributes = content.attributes || [];
        if(content['remainder']) {
          const remainingNames = REMAINING_NAMES || [];
          attributes = [...attributes, ...remainingNames];
        }
        moduleConfig = ModelEditHelper.createAttributeSetModuleConfig(MODEL_PATH, attributes, ATTRIBUTE_MAP);
      } else {
        console.log('UNKNOWN CONTENT TYPE: ' + content.type);
      }

      this.contents.push({
        title: MessageHelper.t(content.title),
        moduleConfig: moduleConfig
      });
    });
  }

  return InlineSectionViewModel;
});
