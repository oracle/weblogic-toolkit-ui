/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/dialog-helper','ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/view-helper', 'utils/common-utilities', 'utils/modelEdit/message-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/list-view', 'oj-c/input-password'
],
function(accUtils, ko, i18n, DialogHelper, ArrayDataProvider,
  BufferingDataProvider, ViewHelper, utils, MessageHelper) {

  function DictEditField(args) {
    const field = args.field;
    const labelPrefix = args.labelPrefix;

    this.i18n = i18n;
    this.field = field;
    this.observable = args.field.observable;
    this.disabled = field.hasOwnProperty('disabled') ? field.disabled : false;

    this.ariaLabel = MessageHelper.getAttributeLabel(field, labelPrefix);
    this.title = MessageHelper.getAttributeLabel(field, labelPrefix);

    this.addLabel = MessageHelper.getAddEntryLabel(field, labelPrefix, false);
    this.deleteLabel = MessageHelper.getDeleteEntryLabel(field, labelPrefix);
    this.noDataLabel = i18n.t('model-edit-no-entries-label');
    const keyLabel = MessageHelper.getKeyLabel(field, labelPrefix);
    const valueLabel = MessageHelper.getValueLabel(field, labelPrefix);

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
        headerText: i18n.t(keyLabel),
        headerClassName: 'wkt-model-edit-field-label',
        sortable: 'disable'
      },
      {
        headerText: i18n.t(valueLabel),
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
    // the field observable value should be a dictionary, variable tokens are not allowed.
    this.updateList = () => {
      this.observableItems.removeAll();
      const map = this.observable();
      if(map != null) {
        if ((typeof map === 'object') && !Array.isArray(map)) {
          Object.keys(map).forEach(key => {
            this.observableItems.push({
              uid: utils.getShortUuid(),
              name: key,
              value: map[key]
            });
          });
        }
      }
    };

    // update field observable from the internal list observable.
    // the field value is a dictionary, the internal list contains table objects.
    this.updateObservable = () => {
      const items = {};
      this.observableItems().forEach(item => {
        items[item.name] = item.value;
      });
      this.observable(Object.keys(items).length ? items : null);
    };

    // use unique ID (uid) as key in the UI only, in case name changes
    this.propertiesDataProvider = new BufferingDataProvider(new ArrayDataProvider(
      this.observableItems, {keyAttributes: 'uid'}));

    // add a new row with an unused unique ID and new name
    this.addItem = () => {
      const options = {
        field: field,
        labelPrefix: labelPrefix,
        observableItems: this.observableItems
      };
      DialogHelper.promptDialog('modelEdit/new-dict-entry-dialog', options)
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

  return DictEditField;
});
