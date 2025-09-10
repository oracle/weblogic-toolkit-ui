/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/instance-helper', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/navigation-helper', 'utils/modelEdit/alias-helper',
  'utils/common-utilities', 'utils/dialog-helper', 'utils/view-helper', 'utils/modelEdit/meta-helper', 'ojs/ojarraydataprovider',
  'ojs/ojtable', 'oj-c/button', 'oj-c/labelled-link'
],
function(accUtils, i18n, ko, InstanceHelper, ModelEditHelper, MessageHelper, NavigationHelper, AliasHelper,
  utils, DialogHelper, ViewHelper, MetaHelper, ArrayDataProvider) {

  function InstancesTableViewModel(args) {
    // for model folders with multiple instances (such as Server/myServer).

    const MODEL_PATH = args.modelPath;
    const NAME_VALIDATORS = args.nameValidators;
    const MENU_LINK = args.menuLink;
    const TEMP_MODEL = args.model;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const subscriptions = [];

    this.i18n = i18n;
    this.addLabel = MessageHelper.getAddInstanceMessage(ALIAS_PATH);
    this.deleteLabel = MessageHelper.getDeleteInstanceMessage(ALIAS_PATH);
    this.emptyMessage = MessageHelper.getNoDataMessage(ALIAS_PATH);
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
        headerText: i18n.t('model-edit-table-name-label'),
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
      // if instances of this type appear in the nav menu, prompt for a new name.
      // otherwise, prompt for a name and folder contents.

      // if(MENU_LINK) {
      const options = {
        modelPath: MODEL_PATH,
        nameValidators: NAME_VALIDATORS
      };
      DialogHelper.promptDialog('modelEdit/new-instance-dialog', options)
        .then(result => {
          const newName = result.instanceName;
          if (newName) {
            ModelEditHelper.addFolder(MODEL_PATH, newName, TEMP_MODEL);
          }
        });

      // } else {
      //   const newName = InstanceHelper.getNewInstanceName(MODEL_PATH, TEMP_MODEL);
      //
      //   const instancePath = [...MODEL_PATH, newName];
      //   const options = {
      //     modelPath: instancePath,
      //     model: TEMP_MODEL,
      //     add: true
      //   };
      //   DialogHelper.promptDialog('modelEdit/folder-dialog', options)
      //     .then(result => {
      //       if (result) {
      //
      //       }
      //     });
      // }
    };

    this.deleteInstance = (event, context) => {
      const key = context.item.data.name;
      ModelEditHelper.deleteModelElement(MODEL_PATH, key, TEMP_MODEL);
    };

    this.editInstance = (event, context) => {
      // if(MENU_LINK) {
      NavigationHelper.navigateToElement(MODEL_PATH, context.item.data.name);

      // } else {
      //   const instancePath = [...MODEL_PATH, context.item.data.name];
      //   const options = { modelPath: instancePath, add: false };
      //
      //   DialogHelper.promptDialog('modelEdit/folder-dialog', options).then(result => {
      //     if (result) {
      //
      //     }
      //   });
      // }
    };
  }

  return InstancesTableViewModel;
});
