/**
 * @license
 * Copyright (c) 2023, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['models/wkt-project', 'accUtils', 'knockout', 'utils/i18n', 'ojs/ojarraytreedataprovider',
  'ojs/ojflattenedtreedataproviderview', 'ojs/ojkeyset', 'utils/dialog-helper', 'utils/view-helper',
  'utils/aux-image-helper', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojtable', 'ojs/ojrowexpander'],
function (project, accUtils, ko, i18n,  ArrayTreeDataProvider, FlattenedTreeDataProviderView, KeySet,
  dialogHelper, viewHelper, auxImageHelper) {
  function SecretsTableViewModel() {

    this.connected = () => {
      accUtils.announce('Secrets Table View loaded.', 'assertive');
    };

    this.project = project;
    this.i18n = i18n;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`domain-design-${labelId}`, payload);
    };

    const mainColumns = [{
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
    }];

    const editColumn = {
      className: 'wkt-table-delete-cell',
      headerClassName: 'wkt-table-add-header',
      headerTemplate: 'headerAddTemplate',
      template: 'actionTemplate',
      sortable: 'disabled',
      width: viewHelper.BUTTON_COLUMN_WIDTH
    };

    this.canEdit = ko.computed(() => {
      return auxImageHelper.projectUsingExternalImageContainingModel();
    });

    this.columns = ko.computed(() => {
      const columns = [...mainColumns];
      if(this.canEdit()) {
        columns.push(editColumn);
      }
      return columns;
    });

    this.disableSecretAddRemove = ko.computed(() => {
      return !this.canEdit();
    });

    this.handleAddSecret = () => {
      const options = {secret: null};

      dialogHelper.promptDialog('secret-edit-dialog', options).then(result => {
        if (result) {
          const newSecret = result.newSecret;
          this.project.k8sDomain.secrets.observable.push(newSecret);
        }
      });
    };

    this.handleEditSecret = (event, context) => {
      const existingSecret = context.item.data;
      const options = {secret: existingSecret};

      dialogHelper.promptDialog('secret-edit-dialog', options).then(result => {
        if (result) {
          if(result.delete) {
            this.project.k8sDomain.secrets.observable.remove(existingSecret);
          } else {
            const newSecret = result.newSecret;
            this.project.k8sDomain.secrets.observable.replace(existingSecret, newSecret);
          }
        }
      });
    };

    this.noSecretsMessage = () => {
      let secretsMessage = '<no-message>';
      if (auxImageHelper.projectHasModel()) {
        secretsMessage = this.labelMapper('no-secrets-message');
      } else if (auxImageHelper.projectUsingExternalImageContainingModel()) {
        secretsMessage = this.labelMapper('no-secrets-add-remove-message');
      }
      return secretsMessage;
    };

    this.dataprovider = new ArrayTreeDataProvider(this.project.k8sDomain.secrets.observable, {
      keyAttributes: 'uid',
      childrenAttribute: 'keys'
    });

    this.expanded = new KeySet.AllKeySetImpl();
    this.flattenedTreeDataProviderView = new FlattenedTreeDataProviderView(this.dataprovider, {
      expanded: this.expanded
    });

    this.setRowEditable = (item) => {
      if (item.metadata.treeDepth === 0) {
        return 'off';
      }
      return 'on';
    };

    this.setRowSelectable = (item) => {
      if (item.metadata.treeDepth === 0) {
        return 'off';
      }
      return 'on';
    };

    this.setRowSticky = (item) => {
      if (item.metadata.treeDepth === 0) {
        return 'on';
      }
      return 'off';
    };
  }

  return SecretsTableViewModel;
});
