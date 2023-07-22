/**
 * @license
 * Copyright (c) 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/view-helper', 'utils/common-utilities', 'ojs/ojinputtext', 'ojs/ojlabel',
  'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, ArrayDataProvider,
  BufferingDataProvider, viewHelper, utils) {
  function SecretEditDialogModel(args) {
    const DIALOG_SELECTOR = '#secretEditDialog';

    this.connected = () => {
      accUtils.announce('Secret edit dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.i18n = i18n;
    this.project = project;

    this.labelMapper = (labelId, arg) => {
      return i18n.t(`domain-design-${labelId}`, arg);
    };

    this.keyColumns = [{
      headerText: this.labelMapper('secret-key-header'),
      id: 'secretKey',
      field: 'secretKey',
      resizable: 'enabled',
      sortable: 'disabled'
    }, {
      headerText: this.labelMapper('secret-value-header'),
      id: 'secretValue',
      field: 'secretValue',
      resizable: 'disabled',
      sortable: 'disabled'
    }, {
      className: 'wkt-table-delete-cell',
      headerClassName: 'wkt-table-add-header',
      headerTemplate: 'headerAddTemplate',
      template: 'actionTemplate',
      sortable: 'disabled',
      width: viewHelper.BUTTON_COLUMN_WIDTH
    }];

    this.handleAddKey = () => {
      const newName = utils.generateNewName(this.keys,'key', 'new-key');
      const key = {
        uid: utils.getShortUuid(),
        key: newName,
        value: ''
      };
      this.keys.push(key);
    };

    this.handleDeleteKey = (event, context) => {
      const key = context.item.data;
      this.keys.remove(key);
    };

    this.originalSecret = args.secret;
    this.newName = ko.observable();
    this.keys = ko.observableArray();
    this.errorMessage = ko.observable();

    if(this.originalSecret) {
      this.newName(this.originalSecret.name);

      // make copies of each key
      this.originalSecret.keys.forEach(key => {
        this.keys.push({...key});
      });
    }

    this.dialogTitle = this.originalSecret ?
      this.labelMapper('secret-dialog-edit-title', {name: this.originalSecret.name}) :
      this.labelMapper('secret-dialog-add-title');

    const sortComparators = viewHelper.getSortComparators(this.keyColumns);

    this.secretKeysTableData = new BufferingDataProvider(new ArrayDataProvider(
      this.keys, {keyAttributes: 'uid', sortComparators: sortComparators}));

    this.deleteInput = () => {
      this.dialogContainer.close();
      args.setValue({delete: true});
    };

    this.okInput = () => {
      let isValid = true;
      this.errorMessage(null);

      let tracker = document.getElementById('secretTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        isValid = false;
      }

      if(this.keys().length === 0) {
        this.errorMessage(this.labelMapper('secret-no-keys-message'));
        isValid = false;
      }

      if(!isValid) {
        return;
      }

      const newSecret = {
        uid: utils.getShortUuid(),
        name: this.newName(),
        keys: this.keys()
      };

      this.dialogContainer.close();
      args.setValue({newSecret: newSecret});
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return SecretEditDialogModel;
});
