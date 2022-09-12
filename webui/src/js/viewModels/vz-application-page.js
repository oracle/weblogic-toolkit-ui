/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter',
  'ojs/ojarraydataprovider', 'utils/vz-application-deployer', 'utils/vz-application-undeployer'],
function(i18n, accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider, vzApplicationDeployer,
  vzApplicationUndeployer) {
  function VerrazzanoApplicationViewModel(args) {

    this.connected = () => {
      accUtils.announce('Verrazzano Application page loaded.', 'assertive');
      // Implement further logic if needed
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-application-page-${labelId}`);
    };

    this.disableDeployApplication = ko.observable(false);
    this.disableUndeployApplication = ko.observable(false);

    this.deployApplication = () => {
      vzApplicationDeployer.startDeployApplication().then();
    };

    this.undeployApplication = () => {
      vzApplicationUndeployer.startUndeployApplication().then();
    };

    // Setup for Design / Code View tab selection.

    const navData = [
      { path: '', redirect: 'vz-application-design-view' },
      { path: 'vz-application-design-view', detail: { label: i18n.t('page-design-view') } },
      { path: 'vz-application-code-view', detail: { label: i18n.t('page-code-view') } }
    ];

    this.selectedItem = ko.observable('vz-application-design-view');
    this.dataProvider = new ArrayDataProvider(navData.slice(1), { keyAttributes: 'path' });

    let router = args.parentRouter.createChildRouter(navData);
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router);

    this.selectedItem.subscribe((newValue) => {
      router.go({ path: newValue });
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return VerrazzanoApplicationViewModel;
});
