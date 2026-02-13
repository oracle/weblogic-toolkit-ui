/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
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
    const ATTRIBUTE = args.attribute;
    const ATTRIBUTE_MAP = args.attributeMap;
    const OBSERVABLE_ENTRIES = args.observableEntries;

    const MODEL_PATH = ATTRIBUTE.path;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const DIALOG_SELECTOR = '#newDictEntryDialog';

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

    this.themeClasses = ViewHelper.themeClasses;

    function getEditorType(details) {
      const hasOptions = ('options' in details) || ('optionsMethod' in details);
      const defaultEditorType = hasOptions ? 'select' : 'string';
      return details.editorType || defaultEditorType;
    }

    function getOptions(details) {
      return MetaOptions.getOptions(details, ATTRIBUTE, ATTRIBUTE_MAP, subscriptions);
    }

    this.entryKey = ko.observable();
    const keyAdd = ATTRIBUTE.keyAdd || {};
    const keyOptions = getOptions(keyAdd);

    this.entryValue = ko.observable();
    const valueAdd = ATTRIBUTE.valueAdd || {};
    const valueOptions = getOptions(valueAdd);

    this.fields = [
      {
        editorType: getEditorType(keyAdd),
        observable: this.entryKey,
        label: MessageHelper.getKeyLabel(ATTRIBUTE, ALIAS_PATH),
        help: MessageHelper.getKeyHelp(ATTRIBUTE, ALIAS_PATH),
        optionsProvider: new ArrayDataProvider(keyOptions, { keyAttributes: 'value' }),
        validators: []
      },
      {
        editorType: getEditorType(valueAdd),
        observable: this.entryValue,
        label: MessageHelper.getValueLabel(ATTRIBUTE, ALIAS_PATH),
        help: MessageHelper.getValueHelp(ATTRIBUTE, ALIAS_PATH),
        optionsProvider: new ArrayDataProvider(valueOptions, { keyAttributes: 'value' }),
        validators: []
      }
    ];

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
