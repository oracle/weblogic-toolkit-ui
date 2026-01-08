/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/dialog-helper','ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/view-helper', 'utils/common-utilities', 'utils/modelEdit/message-helper',
  'utils/modelEdit/meta-handlers', 'utils/modelEdit/alias-helper',
  'oj-c/button', 'oj-c/input-text', 'oj-c/list-view', 'oj-c/input-password'
],
function(accUtils, ko, DialogHelper, ArrayDataProvider,
  BufferingDataProvider, ViewHelper, utils, MessageHelper, MetaHandlers, AliasHelper) {

  function DictAttributeEditor(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE = args.attribute;
    const ATTRIBUTE_MAP = args.attributeMap;
    const READ_ONLY = args.readOnlyObservable;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.attribute = ATTRIBUTE;
    this.observable = ATTRIBUTE.observable;
    this.disabled = MetaHandlers.getDisabledHandler(ATTRIBUTE, ATTRIBUTE_MAP);
    this.extraClass = ko.computed(() => this.disabled() ? 'wkt-model-edit-table-disabled' : null);
    this.hideControls = ko.computed(() => this.disabled() || READ_ONLY());

    this.ariaLabel = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);
    this.title = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);

    this.addLabel = MessageHelper.getAddEntryLabel(ATTRIBUTE, ALIAS_PATH, false);
    this.deleteLabel = MessageHelper.getDeleteEntryLabel(ATTRIBUTE, ALIAS_PATH);
    this.noDataLabel = MessageHelper.getNoEntriesMessage(ATTRIBUTE, ALIAS_PATH);
    this.helpText = MessageHelper.getAttributeHelp(ATTRIBUTE, ALIAS_PATH);

    const keyLabel = MessageHelper.getKeyLabel(ATTRIBUTE, ALIAS_PATH);
    const valueLabel = MessageHelper.getValueLabel(ATTRIBUTE, ALIAS_PATH);

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
    this.columnData = [
      {
        headerText: keyLabel,
        headerClassName: 'wkt-model-edit-attribute-label',
        sortable: 'disable'
      },
      {
        headerText: valueLabel,
        headerClassName: 'wkt-model-edit-attribute-label',
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

    this.observableEntries = ko.observableArray([]);

    // update the internal list observable from the attribute observable.
    // the attribute observable value should be a dictionary, variable tokens are not allowed.
    this.updateList = () => {
      this.observableEntries.removeAll();
      const map = this.observable();
      if(map != null) {
        if ((typeof map === 'object') && !Array.isArray(map)) {
          Object.keys(map).forEach(key => {
            this.observableEntries.push({
              uid: utils.getShortUuid(),
              key,
              value: map[key]
            });
          });
        }
      }
    };

    // update attribute observable from the internal list observable.
    // the attribute value is a dictionary, the internal list contains table objects.
    this.updateObservable = () => {
      const entries = {};
      this.observableEntries().forEach(entry => {
        entries[entry.key] = entry.value;
      });
      this.observable(Object.keys(entries).length ? entries : null);
    };

    // use unique ID (uid) as key in the UI only, in case name changes
    this.propertiesDataProvider = new BufferingDataProvider(new ArrayDataProvider(
      this.observableEntries, {keyAttributes: 'uid'}));

    // add a new row with an unused unique ID and new name
    this.addEntry = () => {
      const options = {
        attribute: ATTRIBUTE,
        attributeMap: ATTRIBUTE_MAP,
        modelPath: MODEL_PATH,
        observableEntries: this.observableEntries
      };
      DialogHelper.promptDialog('modelEdit/new-dict-entry-dialog', options)
        .then(result => {
          if(result.changed) {
            this.updateObservable();
          }
        });
    };

    this.deleteEntry = (event, context) => {
      this.observableEntries.remove(context.item.data);
      this.updateObservable();
    };
  }

  return DictAttributeEditor;
});
