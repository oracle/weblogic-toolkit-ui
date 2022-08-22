/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter',
  'ojs/ojarraydataprovider'],
function(i18n, accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider) {
  function VerrazzanoInstallViewModel(args) {

    this.connected = () => {
      accUtils.announce('Verrazzano Install page loaded.', 'assertive');
      // Implement further logic if needed
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`v8o-install-page-${labelId}`);
    };

    // Setup for Design / Code View tab selection.

    const navData = [
      { path: '', redirect: 'v8o-install-design-view' },
      { path: 'v8o-install-design-view', detail: { label: i18n.t('page-design-view') } },
      { path: 'v8o-install-code-view', detail: { label: i18n.t('page-code-view') } }
    ];

    this.selectedItem = ko.observable('v8o-install-design-view');
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
