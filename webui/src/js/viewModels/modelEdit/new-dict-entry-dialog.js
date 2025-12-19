/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/meta-options',
  'utils/modelEdit/alias-helper', 'utils/common-utilities', 'utils/view-helper', 'ojs/ojarraydataprovider',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, ModelEditHelper, MessageHelper, MetaOptions, AliasHelper, utils,
  ViewHelper, ArrayDataProvider) {

  function NewDictEntryDialogModel(args) {
    const MODEL_PATH = args.modelPath;
    const ATTRIBUTE = args.attribute;
    const ATTRIBUTE_MAP = args.attributeMap;
    const OBSERVABLE_ENTRIES = args.observableEntries;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const DIALOG_SELECTOR = '#newDictEntryDialog';

    this.entryKey = ko.observable();
    this.entryValue = ko.observable();

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('New dict entry dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.disconnected = () => {
      subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    function getEditorType(details) {
      const hasOptions = ('options' in details) || ('optionsMethod' in details);
      const defaultEditorType = hasOptions ? 'select' : 'string';
      return details.editorType || defaultEditorType;
    }

    function getOptions(details) {
      let options = details.options || [];
      const optionsMethod = details.optionsMethod;
      if(optionsMethod) {
        options = MetaOptions[optionsMethod](ATTRIBUTE, ATTRIBUTE_MAP, subscriptions);
      }
      ModelEditHelper.updateOptionLabels(options);
      return options;
    }

    this.keyLabel = MessageHelper.getKeyLabel(ATTRIBUTE, ALIAS_PATH);
    this.keyHelp = MessageHelper.getKeyHelp(ATTRIBUTE, ALIAS_PATH);

    const keyAdd = ATTRIBUTE.keyAdd || {};
    const keyOptions = getOptions(keyAdd);

    this.keyEditorType = getEditorType(keyAdd);
    this.keyOptionsProvider = new ArrayDataProvider(keyOptions, { keyAttributes: 'value' });

    this.valueLabel = MessageHelper.getValueLabel(ATTRIBUTE, ALIAS_PATH);
    this.valueHelp = MessageHelper.getValueHelp(ATTRIBUTE, ALIAS_PATH);

    const valueAdd = ATTRIBUTE.valueAdd || {};
    this.valueEditorType = getEditorType(valueAdd);

    const valueOptions = getOptions(valueAdd);
    this.valueOptionsProvider = new ArrayDataProvider(valueOptions, { keyAttributes: 'value' });

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.getTitle = ko.computed(() => {
      return MessageHelper.getAddEntryLabel(ATTRIBUTE, ALIAS_PATH, true);
    });

    this.keyValidators = [{
      validate: () => {
        // check with regex?
      }
    }];

    this.okInput = () => {
      let tracker = document.getElementById('modelNewEntryTracker');

      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      const itemToAdd = {
        uid: utils.getShortUuid(),
        key: this.entryKey(),
        value: this.entryValue()
      };
      OBSERVABLE_ENTRIES.push(itemToAdd);

      const result = {
        changed: true
      };

      args.setValue(result);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue({});
    };
  }

  return NewDictEntryDialogModel;
});
