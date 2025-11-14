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
    this.moveUpLabel = MessageHelper.t('move-up-label');
    this.moveDownLabel = MessageHelper.t('move-down-label');
    this.emptyMessage = MessageHelper.getNoInstancesMessage(ALIAS_PATH);
    this.ariaLabel = MODEL_PATH[MODEL_PATH.length - 1] + ' Instances Table';

    this.useTypeFolder = AliasHelper.usesTypeFolders(MODEL_PATH);

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
          let attributePath = ALIAS_PATH;
          let modelInstanceFolder = value || {};

          // the attributeName may have a sub-path, such as SSL/ListenPort
          const parts = attributeKey.split('/');
          if(parts.length > 1) {
            parts.slice(0, parts.length - 1).forEach(part => {
              modelInstanceFolder = modelInstanceFolder[part] || {};
            });
            attributeKey = parts[parts.length - 1];
            const partsPath = parts.slice(0, -1);
            attributePath = [...ALIAS_PATH, ...partsPath];
          }

          const getter = attValue.getter;
          const modelValue = getter ? getter(modelInstanceFolder) : modelInstanceFolder[attributeKey];

          let displayValue = ModelEditHelper.getDerivedValue(modelValue);

          // may need to get the display label from the list of options
          const options = MetaHelper.getAttributeOptions(attributePath, attributeKey) || [];
          const option = options.find(option => option.value === displayValue);
          displayValue = option ? option.label : displayValue;

          instance[attKey] = displayValue;
        }
        this.instances.push(instance);
      }
    };

    this.reorderable = MetaHelper.canReorder(ALIAS_PATH) || this.useTypeFolder;
    const defaultSortable = this.reorderable ? 'disabled' : 'enabled';

    this.instancesColumnData = [
      {
        headerText: MessageHelper.t('table-name-label'),
        sortable: defaultSortable,
        sortProperty: 'name',
        resizable: 'enabled'
      }
    ];

    if(this.useTypeFolder) {
      this.instancesColumnData.push({
        headerText: MessageHelper.t('table-type-label'),
        sortable: defaultSortable,
        resizable: 'enabled'
      });
    }

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
        sortable: defaultSortable,
        sortProperty: attributeName,
        resizable: 'enabled'
      });
    }

    if (this.reorderable) {
      this.instancesColumnData.push({
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        template: 'actionTemplate',
        sortable: 'disabled',
        width: '30px'
      });
    }

    this.instancesColumnData.push({
      className: 'wkt-table-delete-cell',
      headerClassName: 'wkt-table-add-header',
      headerTemplate: 'addHeaderTemplate',
      template: 'actionTemplate',
      sortable: 'disabled',
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

            if(this.useTypeFolder && result.providerType) {
              const instancePath = [...MODEL_PATH, newName];
              ModelEditHelper.addFolder(instancePath, result.providerType);
            }
          }
        });
    };

    this.providerType = rowData => {
      // get the type from the model
      const providerPath = [...MODEL_PATH, rowData.name];
      let typeName = ModelEditHelper.getTypeFolderName(providerPath);

      // if this is a known type, translate the alias name
      if(ModelEditHelper.isKnownTypeName(MODEL_PATH, typeName)) {
        const typePath = [...ALIAS_PATH, typeName];
        typeName = MessageHelper.getFolderLabel(typePath);
      }
      return typeName;
    };

    this.deleteInstance = (event, context) => {
      const key = context.item.data.name;
      ModelEditHelper.deleteModelElement(MODEL_PATH, key);
    };

    this.editInstance = (event, context) => {
      NavigationHelper.navigateToElement(MODEL_PATH, context.item.data.name);
    };

    this.canMoveUp = rowData => {
      const parentFolder = ModelEditHelper.getFolder(MODEL_PATH);
      const folderNames = Object.keys(parentFolder);
      const folderName = rowData.name;
      return folderNames.indexOf(folderName) > 0;
    };

    this.canMoveDown = rowData => {
      const parentFolder = ModelEditHelper.getFolder(MODEL_PATH);
      const folderNames = Object.keys(parentFolder);
      const folderName = rowData.name;
      return folderNames.indexOf(folderName) < folderNames.length - 1;
    };

    this.moveUp = (event, context) => {
      const folderName = context.item.data.name;
      ModelEditHelper.moveFolder(folderName, MODEL_PATH, true);
    };

    this.moveDown = (event, context) => {
      const folderName = context.item.data.name;
      ModelEditHelper.moveFolder(folderName, MODEL_PATH, false);
    };
  }

  return InstancesTableViewModel;
});
