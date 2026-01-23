/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/module-helper',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/message-helper',
  'oj-c/form-layout', 'ojs/ojknockout', 'oj-c/rich-radioset', 'oj-c/input-text', 'oj-c/input-password'
],
function(accUtils, ko, ModelEditHelper, ModuleHelper, AliasHelper, MessageHelper) {

  /**
   * Custom view for JDBC Driver Params / Properties
   */
  function PropertySection(args) {
    const META_SECTION = args.metaSection;
    const ATTRIBUTE_MAP = args.attributeMap;
    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const subscriptions = [];

    this.connected = () => {
      // when an option is selected, clear any other property value types
      subscriptions.push(this.selectedOption.subscribe(selectedOption => {
        this.selectOptions.forEach(option => {
          if(option.value !== selectedOption) {
            option.attribute.observable(null);
          }
        });
      }));
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    let attributeKeys = META_SECTION.attributes || [];

    this.selectLabel = MessageHelper.t('attribute-editor-property-value-type-label');
    this.selectHelp = MessageHelper.t('attribute-editor-property-value-type-help');
    this.selectedOption = ko.observable();

    this.selectOptions = [];
    this.attributes = [];

    attributeKeys.forEach(attributeKey => {
      const attribute = ATTRIBUTE_MAP[attributeKey];

      this.selectOptions.push({
        id: attributeKey,
        value: attributeKey,
        label: MessageHelper.getAttributeLabel(attribute, ALIAS_PATH),
        secondaryText: MessageHelper.getAttributeHelp(attribute, ALIAS_PATH),
        attribute
      });

      // select the first option that has a value
      const value = ModelEditHelper.getValue(MODEL_PATH, attributeKey);
      if(value && !this.selectedOption()) {
        this.selectedOption(attributeKey);
      }
    });

    // if no option had a value, select first option (Value) by default
    if(!this.selectedOption()) {
      const firstOptionValue = this.selectOptions.length ? this.selectOptions[0].value : null;
      this.selectedOption(firstOptionValue);
    }

    this.attributeConfig = ko.computed(() => {
      if(!this.selectedOption()) {
        return ModuleHelper.createEmptyConfig();
      }
      return ModuleHelper.createAttributeEditorConfig(this.selectedOption(), ATTRIBUTE_MAP);
    });
  }

  return PropertySection;
});
