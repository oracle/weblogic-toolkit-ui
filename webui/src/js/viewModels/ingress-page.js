/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */

define(['accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojarraydataprovider', 'utils/i18n', 'utils/ingress-controller-installer', 'utils/ingress-routes-helper'],
  function(accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider, i18n, ingressControllerInstaller, ingressRouteHelper) {
    function IngressViewModel(args) {

      this.connected = () => {
        accUtils.announce('Ingress Controller page loaded.', 'assertive');
      };

      // Setup for Design / Code View tab selection.
      this.labelMapper = (labelId) => {
        return i18n.t(`ingress-page-${labelId}`);
      };

      this.disableInstallIngress = ko.observable(false);
      this.disableUpdateRouting = ko.observable(false);

      this.installIngress = async () => {
        await ingressControllerInstaller.startInstallIngressController();
      };

      this.updateRouting = async () => {
        await ingressRouteHelper.startIngressRoutesUpdate();
      };

      // WKT: match names to page type, such as "ingress"
      // WKT: there should be an HMTL file for each path, such as "ingress-design-view.html"
      // WKT: there should be a JS file for each path, such as "ingress-design-view.js"

      let navData = [
        { path: '', redirect: 'ingress-design-view' },
        { path: 'ingress-design-view', detail: { label: i18n.t('page-design-view') } },
        { path: 'ingress-code-view', detail: { label: i18n.t('page-code-view') } }
      ];

      // the oj-tab-bar references these variables

      this.selectedItem = ko.observable('ingress-design-view');
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
    return IngressViewModel;
  });
