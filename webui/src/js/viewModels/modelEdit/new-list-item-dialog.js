/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'utils/modelEdit/file-select-helper', 'utils/modelEdit/meta-options', 'utils/common-utilities',
  'utils/view-helper', 'ojs/ojarraydataprovider',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, ModelEditHelper, MessageHelper, AliasHelper, FileSelectHelper,
  MetaOptions, utils, ViewHelper, ArrayDataProvider) {

  function NewListItemDialogModel(args) {
    const ATTRIBUTE = args.attribute;
    const ATTRIBUTE_MAP = args.attributeMap;
    const OBSERVABLE_ITEMS = args.observableItems;

    const MODEL_PATH = ATTRIBUTE.path;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const DIALOG_SELECTOR = '#newListItemDialog';

    const subscriptions = [];

    this.elementName = ko.observable();

    this.connected = () => {
      accUtils.announce('New list item dialog loaded.', 'assertive');

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

    this.title = MessageHelper.getAddItemLabel(ATTRIBUTE, ALIAS_PATH, true);
    this.nameLabel = MessageHelper.getItemLabel(ATTRIBUTE, ALIAS_PATH);
    this.nameHelp = MessageHelper.getItemHelp(ATTRIBUTE, ALIAS_PATH);

    const itemAdd = ATTRIBUTE.itemAdd || {};
    this.editorType = itemAdd.editorType || 'string';

    let options = itemAdd.options || [];
    const optionsMethod = itemAdd.optionsMethod;
    if(optionsMethod) {
      options = MetaOptions[optionsMethod](ATTRIBUTE, ATTRIBUTE_MAP, subscriptions);
    }
    ModelEditHelper.updateOptionLabels(options);
    this.optionsProvider = new ArrayDataProvider(options, { keyAttributes: 'value' });

    this.fileLabel = MessageHelper.t('attribute-editor-select-file');
    this.directoryLabel = MessageHelper.t('attribute-editor-select-directory');

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.nameValidators = [{
      validate: () => {
        // check with regex?
      }
    }];

    this.canChooseFile = ATTRIBUTE.usesPath && FileSelectHelper.canChooseFile(ATTRIBUTE);

    this.canChooseDirectory = ATTRIBUTE.usesPath && FileSelectHelper.canChooseDirectory(ATTRIBUTE);

    this.chooseDirectory = async() => {
      const path = await FileSelectHelper.chooseDirectory(ATTRIBUTE, null, false);
      if(path) {
        this.elementName(path);
      }
    };

    this.chooseFile = async() => {
      const path = await FileSelectHelper.chooseFile(ATTRIBUTE, null, false);
      if(path) {
        this.elementName(path);
      }
    };

    this.okInput = async() => {
      let tracker = document.getElementById('modelNewEntryTracker');

      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      const itemPath = await FileSelectHelper.checkArchiveUpdate(this.elementName(), ATTRIBUTE);

      const itemToAdd = {
        uid: utils.getShortUuid(),
        name: itemPath
      };
      OBSERVABLE_ITEMS.push(itemToAdd);

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

  return NewListItemDialogModel;
});
