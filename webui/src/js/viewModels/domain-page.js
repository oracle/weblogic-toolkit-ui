/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojarraydataprovider',
  'utils/k8s-domain-deployer', 'utils/k8s-domain-status-checker', 'utils/k8s-domain-undeployer', 'utils/i18n',
  'utils/wdt-preparer', 'utils/aux-image-helper', 'models/wkt-project', 'ojs/ojarraytreedataprovider', 'ojs/ojtreeview'
],
function(accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider, k8sDomainDeployer,
  k8sDomainStatusChecker, k8sDomainUndeployer, i18n, wdtPreparer, auxImageHelper, project) {
  function DomainViewModel(args) {
    this.project = project;

    this.connected = () => {
      accUtils.announce('WebLogic Domain page loaded.', 'assertive');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`domain-page-${labelId}`);
    };

    this.anyLabelMapper = (labelId) => {
      return i18n.t(labelId);
    };

    this.disableDeployDomain = ko.observable(false);
    this.disableGetDomainStatus = ko.observable(false);
    this.disableUndeployDomain = ko.observable(false);

    this.showPrepareModel = ko.computed(auxImageHelper.projectUsesModel);

    this.prepareModel = () => {
      wdtPreparer.startPrepareModel().then();
    };

    this.deployDomain = async () => {
      await k8sDomainDeployer.startDeployDomain();
    };

    this.getDomainStatus = async () => {
      await k8sDomainStatusChecker.startCheckDomainStatus();
    };

    this.undeployDomain = async () => {
      await k8sDomainUndeployer.startUndeployDomain();
    };

    // Setup for Design / Code View tab selection.

    let navData = [
      { path: '', redirect: 'domain-design-view' },
      { path: 'domain-design-view', detail: { label: i18n.t('page-design-view') } },
      { path: 'domain-code-view', detail: { label: i18n.t('page-code-view') } }
    ];

    // the oj-tab-bar references these variables

    this.selectedItem = ko.observable('domain-design-view');
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
  return DomainViewModel;
});
