/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojarraydataprovider',
  'ojs/ojarraytreedataprovider', 'ojs/ojbufferingdataprovider', 'models/wkt-project', 'ojs/ojconverter-number',
  'utils/view-helper', 'utils/common-utilities', 'utils/dialog-helper', 'ojs/ojtreeview', 'ojs/ojformlayout',
  'ojs/ojinputtext', 'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojswitch', 'ojs/ojinputnumber', 'oj-c/select-single'
],
function (i18n, accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider, ArrayTreeDataProvider,
  BufferingDataProvider, project, ojConverterNumber, viewHelper, utils, dialogHelper) {
  function OperatorDesignViewModel() {

    let subscriptions = [];

    this.connected = async () => {
      accUtils.announce('Operator Design View page loaded.', 'assertive');

      subscriptions.push(project.postOpen.subscribe(() => {
        setTimeout(this.validate, 1);
      }));

      setTimeout(this.validate, 1);
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, arg) => {
      let key;
      if (labelId.startsWith('page-design-')) {
        key = labelId;
      } else {
        key = `wko-design-${labelId}`;
      }
      if (arg) {
        return i18n.t(key, arg);
      }
      return i18n.t(key);
    };

    this.imageLabelMapper = (labelId, arg) => {
      return i18n.t(`image-design-${labelId}`, arg);
    };

    this.project = project;
    this.integerConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0
    });

    this.portNumberConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0,
      useGrouping: false
    });

    this.imageRegistriesCredentialsDP = new BufferingDataProvider(new ArrayDataProvider(
      this.project.settings.containerImageRegistriesCredentials.observable, { keyAttributes: 'uid' }));
    this.getImageRegistriesCredentialsItemText = (itemContext) => {
      return itemContext.data.name;
    };

    this.imagePullPolicies = [
      {key: 'IfNotPresent', label: this.labelMapper('image-pull-if-not-present-label')},
      {key: 'Always', label: this.labelMapper('image-pull-always-label')},
      {key: 'Never', label: this.labelMapper('image-pull-never-label')}
    ];
    this.imagePullPoliciesDP = new ArrayDataProvider(this.imagePullPolicies, {keyAttributes: 'key'});

    this.domainNamespaceSelectionStrategies = [
      {key: 'List', label: this.labelMapper('k8s-namespace-selection-list-type-label')},
      {key: 'LabelSelector', label: this.labelMapper('k8s-namespace-selection-label-selector-type-label')},
      {key: 'RegExp', label: this.labelMapper('k8s-namespace-selection-regexp-type-label')},
      {key: 'Dedicated', label: this.labelMapper('k8s-namespace-selection-dedicated-type-label')},
    ];
    this.domainNamespaceSelectionStrategiesDP = new ArrayDataProvider(this.domainNamespaceSelectionStrategies, {keyAttributes: 'key'});

    this.logLevels = [
      {key: 'SEVERE', label: this.labelMapper('logging-level-severe-label')},
      {key: 'WARNING', label: this.labelMapper('logging-level-warning-label')},
      {key: 'INFO', label: this.labelMapper('logging-level-info-label')},
      {key: 'CONFIG', label: this.labelMapper('logging-level-config-label')},
      {key: 'FINE', label: this.labelMapper('logging-level-fine-label')},
      {key: 'FINER', label: this.labelMapper('logging-level-finer-label')},
      {key: 'FINEST', label: this.labelMapper('logging-level-finest-label')},
    ];
    this.logLevelsDP = new ArrayDataProvider(this.logLevels, {keyAttributes: 'key'});

    this.validate = () => {
      const controls = document.querySelectorAll('.wkt-right-pane .oj-form-control');
      controls.forEach(function (item) {
        if(item.validate && !item.classList.contains('oj-searchselect-filter')) {
          item.validate();
        }
      });
    };

    this.nodeSelectorColumnMetadata = [
      {
        headerText: this.labelMapper('node-selector-label-name-header'),
        sortProperty: 'name',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('node-selector-label-value-header'),
        sortable: 'disabled'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
    ];

    this.nodeSelectorDP = new BufferingDataProvider(
      new ArrayDataProvider(this.project.wko.nodeSelector.observable, { keyAttributes: 'uid' }));

    this.handleAddNodeSelector = () => {
      const labelToAdd = {
        uid: utils.getShortUuid(),
        name: utils.generateNewName(this.project.wko.nodeSelector.observable, 'name', 'new-label'),
        value: ''
      };
      this.project.wko.nodeSelector.addNewItem(labelToAdd);
    };

    this.wkoVersions = project.wko.wkoVersions;
    this.wkoVersionTags = new ArrayDataProvider(this.wkoVersions, {keyAttributes: 'version'});

    this.editImageRegistryCredentials = () => {
      dialogHelper.openDialog('registry-credentials-dialog', {});
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return OperatorDesignViewModel;
});
