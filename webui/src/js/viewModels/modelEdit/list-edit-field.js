/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/dialog-helper','ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/view-helper', 'utils/common-utilities', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/list-view', 'oj-c/input-password'
],
function(accUtils, ko, i18n, DialogHelper, ArrayDataProvider,
  BufferingDataProvider, ViewHelper, utils, ModelEditHelper, MessageHelper, AliasHelper) {

  function ListEditField(args) {
    const MODEL_PATH = args.modelPath;
    const field = args.field;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.i18n = i18n;
    this.field = field;
    this.observable = args.field.observable;
    this.disabled = field.hasOwnProperty('disabled') ? field.disabled : false;

    this.ariaLabel = MessageHelper.getAttributeFieldLabel(field, ALIAS_PATH);
    this.addLabel = MessageHelper.getAddItemLabel(field, ALIAS_PATH, false);
    this.deleteLabel = MessageHelper.getDeleteItemLabel(field, ALIAS_PATH);
    this.noDataLabel = i18n.t('model-edit-no-items-label');

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

    // this is dynamic to allow i18n fields to load correctly
    this.columnData = [
      {
        headerText: MessageHelper.getAttributeFieldLabel(field, ALIAS_PATH),
        headerClassName: 'wkt-model-edit-field-label',
        sortable: 'disable'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: ViewHelper.BUTTON_COLUMN_WIDTH
      }];

    this.observableItems = ko.observableArray([]);

    // update the internal list observable from the field observable.
    // the field observable value may be a list or comma-separated string.
    // if the value is a string, it might be a variable token.
    this.updateList = () => {
      this.observableItems.removeAll();
      const value = ModelEditHelper.getDerivedValue(this.observable());
      let elements = null;
      if(value != null) {
        if (Array.isArray(value)) {
          elements = value;
        } else {
          const text = String(value);
          elements = text.split(',');
        }

        elements.forEach(element => {
          this.observableItems.push({
            uid: utils.getShortUuid(),
            name: element
          });
        });
      }
    };

    // update field observable from the internal list observable.
    // the field value is a list of primitives, the internal list contains table objects.
    this.updateObservable = () => {
      const names = [];
      this.observableItems().forEach(item => {
        names.push(item.name);
      });
      this.observable(names.length ? names : null);
    };

    // use unique ID (uid) as key in the UI only, in case name changes
    this.propertiesDataProvider = new BufferingDataProvider(new ArrayDataProvider(
      this.observableItems, {keyAttributes: 'uid'}));

    // add a new row with an unused unique ID and new name
    this.addItem = () => {
      const options = {
        field: field,
        modelPath: MODEL_PATH,
        observableItems: this.observableItems
      };

      // TODO: field could specify a different dialog
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
  }

  return ListEditField;
});
