/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/navigation-helper', 'utils/modelEdit/alias-helper',
  'utils/dialog-helper', 'utils/view-helper', 'ojs/ojarraydataprovider',
  'ojs/ojtable', 'oj-c/button', 'oj-c/labelled-link'
],
function(accUtils, i18n, ko, ModelEditHelper, MessageHelper, NavigationHelper, AliasHelper, DialogHelper,
  ViewHelper, ArrayDataProvider) {

  function ElementsTableViewModel(args) {
    const MODEL_PATH = args.modelPath;
    const NAME_VALIDATORS = args.nameValidators;
    const ATTRIBUTES = args.summaryAttributes || {};

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const subscriptions = [];

    this.i18n = i18n;
    this.addLabel = MessageHelper.getAddElementMessage(ALIAS_PATH);
    this.deleteLabel = MessageHelper.getDeleteElementMessage(ALIAS_PATH);
    this.emptyMessage = MessageHelper.getNoDataMessage(ALIAS_PATH);
    this.ariaLabel = MODEL_PATH[MODEL_PATH.length - 1] + ' Elements Table';

    this.connected = () => {
      accUtils.announce('Elements table loaded.', 'assertive');

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

    this.attributes = Object.keys(ATTRIBUTES);

    this.elements = ko.observableArray();

    this.updateFromModel = () => {
      this.elements.removeAll();
      const elementsFolder = ModelEditHelper.getFolder(MODEL_PATH);
      for (const [key, value] of Object.entries(elementsFolder)) {
        const element = {
          uid: key,
          name: key,
        };
        for (const [attKey, attValue] of Object.entries(ATTRIBUTES)) {
          let attributeKey = attKey;
          let modelElementFolder = value || {};

          // the attributeName may have a sub-path, such as SSL/ListenPort
          const parts = attributeKey.split('/');
          if(parts.length > 1) {
            parts.slice(0, parts.length - 1).forEach(part => {
              modelElementFolder = modelElementFolder[part] || {};
            });
            attributeKey = parts[parts.length - 1];
          }

          const getter = attValue.getter;
          const modelValue = getter ? getter(modelElementFolder) : modelElementFolder[attributeKey];
          element[attKey] = ModelEditHelper.getDerivedValue(modelValue);
        }
        this.elements.push(element);
      }
    };

    this.elementsColumnData = [
      {
        headerText: i18n.t('model-edit-table-name-label'),
        sortProperty: 'name',
        resizable: 'enabled'
      }
    ];

    for (const [attribute, options] of Object.entries(ATTRIBUTES)) {
      const typeKey = options['typeKey'];  // ???
      let attributeName = attribute;
      let aliasPath = [...ALIAS_PATH];

      // the attribute may be in a sub-folder, such as SSL/ListenPort
      const parts = attribute.split('/');
      if(parts.length > 1) {
        parts.slice(0, parts.length - 1).forEach(part => {
          aliasPath.push(part);
        });
        attributeName = parts[parts.length - 1];
      }

      this.elementsColumnData.push({
        headerText: MessageHelper.getAttributeLabel(attributeName, aliasPath),
        sortProperty: attribute,
        resizable: 'enabled'
      });
    }

    this.elementsColumnData.push({
      className: 'wkt-table-delete-cell',
      headerClassName: 'wkt-table-add-header',
      headerTemplate: 'addHeaderTemplate',
      template: 'actionTemplate',
      sortable: 'disable',
      width: ViewHelper.BUTTON_COLUMN_WIDTH
    });

    const elementComparators = ViewHelper.getSortComparators(this.elementsColumnData);

    this.elementsProvider = new ArrayDataProvider(this.elements,
      { keyAttributes: 'uid', sortComparators: elementComparators });

    this.addElement = () => {
      const options = {
        modelPath: MODEL_PATH,
        nameValidators: NAME_VALIDATORS
      };
      DialogHelper.promptDialog('modelEdit/new-element-dialog', options)
        .then(result => {
          const newName = result.elementName;
          if(newName) {
            ModelEditHelper.addElement(MODEL_PATH, newName);
          }
        });
    };

    this.deleteElement = (event, context) => {
      const key = context.item.data.name;
      ModelEditHelper.deleteElement(MODEL_PATH, key);
    };

    this.navigateToElement = (event, context) => {
      NavigationHelper.openNavigation(MODEL_PATH);
      NavigationHelper.navigateToElement(MODEL_PATH, context.item.data.name);
    };
  }

  return ElementsTableViewModel;
});
