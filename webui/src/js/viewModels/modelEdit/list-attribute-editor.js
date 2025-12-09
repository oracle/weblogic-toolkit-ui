/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/dialog-helper','ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/view-helper', 'utils/common-utilities', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/meta-handlers', 'utils/modelEdit/alias-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/list-view', 'oj-c/input-password'
],
function(accUtils, ko, DialogHelper, ArrayDataProvider,
  BufferingDataProvider, ViewHelper, utils, ModelEditHelper, MessageHelper, MetaHandlers, AliasHelper) {

  function ListAttributeEditor(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE = args.attribute;
    const ATTRIBUTE_MAP = args.attributeMap;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.attribute = ATTRIBUTE;
    this.observable = ATTRIBUTE.observable;
    this.disabled = MetaHandlers.getDisabledHandler(ATTRIBUTE, ATTRIBUTE_MAP);
    this.extraClass = ko.computed(() => this.disabled() ? 'wkt-model-edit-table-disabled' : null);
    this.reorderable = ATTRIBUTE.reorderable;

    this.ariaLabel = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);
    this.addLabel = MessageHelper.getAddItemLabel(ATTRIBUTE, ALIAS_PATH, false);
    this.deleteLabel = MessageHelper.getDeleteItemLabel(ATTRIBUTE, ALIAS_PATH);
    this.noDataLabel = MessageHelper.getNoItemsMessage(ATTRIBUTE, ALIAS_PATH);
    this.helpText = MessageHelper.getAttributeHelp(ATTRIBUTE, ALIAS_PATH);
    this.moveUpLabel = MessageHelper.t('move-up-label');
    this.moveDownLabel = MessageHelper.t('move-down-label');

    const subscriptions = [];

    this.connected = () => {
      this.updateList();
      subscriptions.push(this.observable.subscribe(() => {
        this.updateList();
      }));
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    // this is dynamic to allow i18n values to load correctly
    this.columnData = [];
    this.columnData.push({
      headerText: MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH),
      headerClassName: 'wkt-model-edit-attribute-label',
      sortable: 'disable'
    });

    if (this.reorderable) {
      this.columnData.push({
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        template: 'actionTemplate',
        sortable: 'disabled',
        width: '30px'
      });
    }

    this.columnData.push({
      className: 'wkt-table-delete-cell',
      headerClassName: 'wkt-table-add-header',
      headerTemplate: 'headerTemplate',
      template: 'actionTemplate',
      sortable: 'disable',
      width: ViewHelper.BUTTON_COLUMN_WIDTH
    });

    this.observableItems = ko.observableArray([]);

    // update the internal list observable from the attribute observable.
    // the attribute observable value may be a list or comma-separated string.
    // if the value is a string, it might be a variable token.
    this.updateList = () => {
      const newItems = [];
      const value = ModelEditHelper.getDerivedValue(this.observable());
      if(value != null) {
        let elements;
        if (Array.isArray(value)) {
          elements = value;
        } else {
          const text = String(value);
          elements = text.split(',');
        }

        elements.forEach(element => {
          newItems.push({
            uid: utils.getShortUuid(),
            name: element
          });
        });
      }
      this.observableItems(newItems);
    };

    // update attribute observable from the internal list observable.
    // the attribute value is a list of primitives, the internal list contains table objects.
    this.updateObservable = () => {
      const names = [];
      this.observableItems().forEach(item => {
        names.push(item.name);
      });
      this.observable(names.length ? names : null);
    };

    // use unique ID (uid) as key in the UI only, in case name changes
    this.listDataProvider = new BufferingDataProvider(new ArrayDataProvider(
      this.observableItems, {keyAttributes: 'uid'}));

    // add a new row with an unused unique ID and new name
    this.addItem = () => {
      const options = {
        attribute: ATTRIBUTE,
        modelPath: MODEL_PATH,
        observableItems: this.observableItems
      };

      // TODO: attribute alias could specify a different dialog
      DialogHelper.promptDialog('modelEdit/new-list-item-dialog', options)
        .then(result => {
          if(result.changed) {
            this.updateObservable();
          }
        });
    };

    this.deleteItem = (event, context) => {
      this.observableItems.remove(context.item.data);
      this.updateObservable();
    };

    this.canMoveUp = rowData => {
      return this.observableItems.indexOf(rowData) > 0;
    };

    this.canMoveDown = rowData => {
      return this.observableItems.indexOf(rowData) < this.observableItems().length - 1;
    };

    this.moveUp = (event, context) => {
      const rowData = context.item.data;
      const index = this.observableItems.indexOf(rowData);
      this.observableItems.splice(index, 1);  // remove from old location
      this.observableItems.splice(index - 1, 0, rowData);
      this.updateObservable();
    };

    this.moveDown = (event, context) => {
      const rowData = context.item.data;
      const index = this.observableItems.indexOf(rowData);
      this.observableItems.splice(index, 1);  // remove from old location
      this.observableItems.splice(index + 1, 0, rowData);
      this.updateObservable();
    };
  }

  return ListAttributeEditor;
});
