/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper',
  'oj-c/collapsible'
],
function(accUtils, ko, i18n, ModelEditHelper, MetaHelper, MessageHelper, AliasHelper) {
  function AttributeGroupsModel(args) {
    // Display the attribute groups for a model path.
    // Customizations from MetaHelper are taken into account.
    // This is primarily used by folder-content.

    const MODEL_PATH = args.modelPath;
    const TEMP_MODEL = args.model;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.subscriptions = [];

    this.connected = () => {
      accUtils.announce('Folder Content loaded.', 'assertive');

      // this has to be done on connect - when this module is in a dialog,
      // the same instance is connected/disconnected multiple times on open (?)
      this.subscriptions = [];
      this.initializeAttributes();
    };

    this.disconnected = () => {
      this.subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(labelId, payload);
    };

    this.attributeGroups = ko.observableArray();

    this.initializeAttributes = () => {
      let attributeMap = {};

      if (MODEL_PATH) {
        attributeMap = ModelEditHelper.createAttributeMap(MODEL_PATH, {}, this.subscriptions, TEMP_MODEL);

        const metaAttributeGroups = MetaHelper.getAttributeGroups(ALIAS_PATH);

        this.attributeGroups.removeAll();

        // collect the configured metadata attribute names, and check for a group with remainder

        let remainderGroup = null;
        const knownAttributeNames = [];
        metaAttributeGroups.forEach(group => {
          const attributeNames = group['members'] || [];
          knownAttributeNames.push(...attributeNames);

          if (group['remainder']) {
            remainderGroup = group;
          }
        });

        const remainingNames = ModelEditHelper.getRemainingAttributeNames(attributeMap, knownAttributeNames);

        // create a module config for each configured attribute group, inserting remaining attributes if specified

        metaAttributeGroups.forEach(metaGroup => {
          const attributeNames = metaGroup['members'] || [];
          if (metaGroup === remainderGroup) {
            attributeNames.push(...remainingNames);
          }

          const exclude = metaGroup['exclude'];
          if (attributeNames.length && !exclude) {
            const moduleConfig = ModelEditHelper.createAttributeSetModuleConfig(attributeNames, attributeMap, MODEL_PATH);
            this.attributeGroups.push({
              moduleConfig,
              metadata: metaGroup
            });
          }
        });

        // if there are remaining attributes and no remaining group specified, create a remaining group

        if (remainingNames.length && !remainderGroup) {
          const remainderConfig = ModelEditHelper.createAttributeSetModuleConfig(remainingNames, attributeMap, MODEL_PATH);
          this.attributeGroups.push({
            moduleConfig: remainderConfig,
            metadata: {}  // TODO: should this get a default title, such as "Advanced"?
          });
        }
      }
    };
  }

  return AttributeGroupsModel;
});
