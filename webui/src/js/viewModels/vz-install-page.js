/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter',
  'ojs/ojarraydataprovider', 'utils/vz-installer', 'utils/vz-install-status-checker'],
function(i18n, accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider, vzInstaller, vzInstallStatusChecker) {
  function VerrazzanoInstallViewModel(args) {

    this.connected = () => {
      accUtils.announce('Verrazzano Install page loaded.', 'assertive');
      // Implement further logic if needed
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-install-page-${labelId}`);
    };

    this.disableInstall = ko.observable(false);
    this.installVerrazzano = () => {
      vzInstaller.startInstallVerrazzano().then();
    };

    this.disableInstallStatus = ko.observable(false);
    this.getInstallStatus = () => {
      vzInstallStatusChecker.startVerrazzanoInstallStatusCheck().then();
    };

    // Setup for Design / Code View tab selection.

    const navData = [
      { path: '', redirect: 'vz-install-design-view' },
      { path: 'vz-install-design-view', detail: { label: i18n.t('page-design-view') } },
      { path: 'vz-install-code-view', detail: { label: i18n.t('page-code-view') } }
    ];

    this.selectedItem = ko.observable('vz-install-design-view');
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
  return VerrazzanoInstallViewModel;
});
