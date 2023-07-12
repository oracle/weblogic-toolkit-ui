/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'models/wkt-project', 'utils/common-utilities', 'ojs/ojtreeview', 'ojs/ojcorerouter',
  'ojs/ojmodulerouter-adapter', 'ojs/ojtable', 'ojs/ojbutton', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function (accUtils, ko, i18n, viewHelper, ArrayDataProvider, BufferingDataProvider, project, utils) {
  function ModelPropertiesViewModel() {

    this.connected = () => {
      accUtils.announce('Ingress Design View page loaded.', 'assertive');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`model-properties-${labelId}`);
    };

    // this is dynamic to allow i18n fields to load correctly
    this.columnData = [
      {
        headerText: this.labelMapper('name-header'),
        sortProperty: 'Name',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('value-header'),
        sortProperty: 'Value'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      }];

    this.theObservableArray = project.wdtModel.getModelPropertiesObject().observable;

    this.project = project;

    const sortComparators = viewHelper.getSortComparators(this.columnData);

    // use unique ID (uid) as key in the UI only, in case name changes
    this.propertiesDataProvider = new BufferingDataProvider(new ArrayDataProvider(
      this.theObservableArray, {keyAttributes: 'uid', sortComparators: sortComparators}));

    // add a new row with an unused unique ID and unused name
    this.handleAddRow = () => {
      const propertyToAdd = {
        uid: utils.getShortUuid(),
        Name: utils.generateNewName(project.wdtModel.getModelPropertiesObject().observable,
          'Name', 'new-property'),
      };
      project.wdtModel.getModelPropertiesObject().addNewItem(propertyToAdd);
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelPropertiesViewModel;
});
