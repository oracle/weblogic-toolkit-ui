/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojarraydataprovider',
  'utils/vz-component-deployer', 'utils/vz-component-undeployer', 'utils/i18n',
  'utils/wdt-preparer', 'ojs/ojarraytreedataprovider', 'models/wkt-project', 'ojs/ojtreeview'],
function(accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider, vzComponentDeployer,
  vzComponentUndeployer, i18n, wdtPreparer) {
  function VerrazzanoComponentViewModel(args) {

    this.connected = () => {
      accUtils.announce('Verrazzano Component page loaded.', 'assertive');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-component-page-${labelId}`);
    };

    this.anyLabelMapper = (labelId) => {
      return i18n.t(labelId);
    };

    this.disableDeployComponent = ko.observable(false);
    this.disableUndeployComponent = ko.observable(false);

    this.prepareModel = () => {
      wdtPreparer.startPrepareModel().then();
    };

    this.deployComponent = async () => {
      await vzComponentDeployer.startDeployComponent();
    };

    this.undeployComponent = async () => {
      await vzComponentUndeployer.startUndeployComponent();
    };

    // Setup for Design / Code View tab selection.

    let navData = [
      { path: '', redirect: 'vz-component-design-view' },
      { path: 'vz-component-design-view', detail: { label: i18n.t('page-design-view') } },
      { path: 'vz-component-code-view', detail: { label: i18n.t('page-code-view') } }
    ];

    // the oj-tab-bar references these variables

    this.selectedItem = ko.observable('vz-component-design-view');
    this.dataProvider = new ArrayDataProvider(navData.slice(1), { keyAttributes: 'path' });

    // this router configuration is used to substitute the tab content

    let router = args.parentRouter.createChildRouter(navData);
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router);

    // as the selected item change, tell the router to insert the tab content

    this.selectedItem.subscribe((newValue) => {
      router.go({ path: newValue });
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return VerrazzanoComponentViewModel;
});
