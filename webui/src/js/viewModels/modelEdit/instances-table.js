/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/instance-helper', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/navigation-helper', 'utils/modelEdit/alias-helper',
  'utils/common-utilities', 'utils/dialog-helper', 'utils/view-helper', 'utils/modelEdit/meta-helper', 'ojs/ojarraydataprovider',
  'ojs/ojtable', 'oj-c/button', 'oj-c/labelled-link'
],
function(accUtils, ko, InstanceHelper, ModelEditHelper, MessageHelper, NavigationHelper, AliasHelper,
  utils, DialogHelper, ViewHelper, MetaHelper, ArrayDataProvider) {

  function InstancesTableViewModel(args) {
    // for model folders with multiple instances (such as Server/myServer).

    const MODEL_PATH = args.modelPath;
    const NAME_VALIDATORS = args.nameValidators;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const subscriptions = [];

    this.addLabel = MessageHelper.getAddInstanceMessage(ALIAS_PATH);
    this.deleteLabel = MessageHelper.getDeleteInstanceMessage(ALIAS_PATH);
    this.emptyMessage = MessageHelper.getNoInstancesMessage(ALIAS_PATH);
    this.ariaLabel = MODEL_PATH[MODEL_PATH.length - 1] + ' Instances Table';

    this.connected = () => {
      accUtils.announce('Instances table loaded.', 'assertive');

      this.updateFromModel();
      subscriptions.push(ModelEditHelper.modelObject.subscribe(() => {
        this.updateFromModel();
      }));
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.summaryAttributes = MetaHelper.getMetadata(ALIAS_PATH)['summaryAttributes'] || {};
    this.attributes = Object.keys(this.summaryAttributes);

    this.instances = ko.observableArray();

    this.updateFromModel = () => {
      this.instances.removeAll();
      const instancesFolder = ModelEditHelper.getFolder(MODEL_PATH);
      for (const [key, value] of Object.entries(instancesFolder)) {
        const instance = {
          uid: utils.getShortUuid(),
          name: key,
        };
        for (const [attKey, attValue] of Object.entries(this.summaryAttributes)) {
          let attributeKey = attKey;
          let modelInstanceFolder = value || {};

          // the attributeName may have a sub-path, such as SSL/ListenPort
          const parts = attributeKey.split('/');
          if(parts.length > 1) {
            parts.slice(0, parts.length - 1).forEach(part => {
              modelInstanceFolder = modelInstanceFolder[part] || {};
            });
            attributeKey = parts[parts.length - 1];
          }

          const getter = attValue.getter;
          const modelValue = getter ? getter(modelInstanceFolder) : modelInstanceFolder[attributeKey];
          instance[attKey] = ModelEditHelper.getDerivedValue(modelValue);
        }
        this.instances.push(instance);
      }
    };

    this.instancesColumnData = [
      {
        headerText: MessageHelper.t('table-name-label'),
        sortProperty: 'name',
        resizable: 'enabled'
      }
    ];

    // attributePath is usually a simple name, but may be qualified, like "SSL/ListenPort"
    for (const [attributePath, options] of Object.entries(this.summaryAttributes)) {
      let aliasPath = [...ALIAS_PATH];

      const parts = attributePath.split('/');
      if(parts.length > 1) {
        parts.slice(0, parts.length - 1).forEach(part => {
          aliasPath.push(part);
        });
      }
      const attributeName = parts[parts.length - 1];

      this.instancesColumnData.push({
        headerText: MessageHelper.getAttributeLabelFromName(attributeName, aliasPath),
        sortProperty: attributeName,
        resizable: 'enabled'
      });
    }

    this.instancesColumnData.push({
      className: 'wkt-table-delete-cell',
      headerClassName: 'wkt-table-add-header',
      headerTemplate: 'addHeaderTemplate',
      template: 'actionTemplate',
      sortable: 'disable',
      width: ViewHelper.BUTTON_COLUMN_WIDTH
    });

    const instanceComparators = ViewHelper.getSortComparators(this.instancesColumnData);

    this.instancesProvider = new ArrayDataProvider(this.instances,
      { keyAttributes: 'uid', sortComparators: instanceComparators });

    this.addInstance = () => {
      // if instances of this type already exist, prompt for a new name.
      // otherwise, prompt for a name and folder contents.

      const options = {
        modelPath: MODEL_PATH,
        nameValidators: NAME_VALIDATORS
      };
      DialogHelper.promptDialog('modelEdit/new-instance-dialog', options)
        .then(result => {
          const newName = result.instanceName;
          if (newName) {
            ModelEditHelper.addFolder(MODEL_PATH, newName);
          }
        });
    };

    this.deleteInstance = (event, context) => {
      const key = context.item.data.name;
      ModelEditHelper.deleteModelElement(MODEL_PATH, key);
    };

    this.editInstance = (event, context) => {
      NavigationHelper.navigateToElement(MODEL_PATH, context.item.data.name);
    };
  }

  return InstancesTableViewModel;
});
