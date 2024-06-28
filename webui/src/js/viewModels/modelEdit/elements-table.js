/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/view-helper', 'ojs/ojarraydataprovider',
  'ojs/ojtable', 'oj-c/labelled-link'
],
function(accUtils, i18n, ko, ModelEditHelper, ViewHelper, ArrayDataProvider) {
  function ElementsTableViewModel(args) {
    this.i18n = i18n;

    const ELEMENTS_PATH = args.path;
    const ELEMENTS_KEY = args.key;
    const ATTRIBUTES = args.attributes;

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Servers page loaded.', 'assertive');

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

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-${ELEMENTS_KEY}-${labelId}`, payload);
    };

    this.attributes = Object.keys(ATTRIBUTES);

    this.elements = ko.observableArray();

    this.updateFromModel = () => {
      this.elements.removeAll();
      const elementsFolder = ModelEditHelper.getFolder(ELEMENTS_PATH);
      for (const [key, value] of Object.entries(elementsFolder)) {
        const element = {
          uid: key,
          name: key,
        };
        for (const [attKey, attValue] of Object.entries(ATTRIBUTES)) {
          const attributeKey = attValue['key'];
          const modelElementFolder = value || {};

          const getter = attValue.getter;
          if(getter) {
            element[attKey] = getter(modelElementFolder);
          } else {
            element[attKey] = modelElementFolder[attributeKey];
          }
        }
        this.elements.push(element);
      }
    };

    this.elementsColumnData = [
      {
        headerText: this.labelMapper('attribute-name-label'),
        sortProperty: 'name',
        resizable: 'enabled'
      }
    ];

    for (const [attKey, attValue] of Object.entries(ATTRIBUTES)) {
      this.elementsColumnData.push({
        headerText: this.labelMapper(`attribute-${attKey}-label`),
        sortProperty: attKey,
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
      const newName = 'NewElement';
      ModelEditHelper.addElement(ELEMENTS_PATH, newName);
    };

    this.deleteElement = (event, context) => {
      const key = context.item.data.name;
      ModelEditHelper.deleteElement(ELEMENTS_PATH, key);
    };

    this.navigateToElement = (event, context) => {
      ModelEditHelper.openNavigation('folder-' + ELEMENTS_KEY);
      ModelEditHelper.navigateToElement(ELEMENTS_KEY, context.item.data.name);
    };
  }

  return ElementsTableViewModel;
});
