/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojarraydataprovider', 'utils/wko-installer'],
  function(i18n, accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider, wkoInstaller) {
    function OperatorViewModel(args) {

      this.connected = () => {
        accUtils.announce('WebLogic Operator page loaded.', 'assertive');
        // Implement further logic if needed
      };

      this.labelMapper = (labelId) => {
        return i18n.t(`wko-page-${labelId}`);
      };

      this.disableInstallOperator = ko.observable(false);

      this.installOperator = async () => {
        await wkoInstaller.startInstallOperator();
      };

      // Setup for Design / Code View tab selection.

      const navData = [
        { path: '', redirect: 'operator-design-view' },
        { path: 'operator-design-view', detail: { label: i18n.t('page-design-view') } },
        { path: 'operator-code-view', detail: { label: i18n.t('page-code-view') } }
      ];

      this.selectedItem = ko.observable('operator-design-view');
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
    return OperatorViewModel;
  }
);
