/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define([],
  function () {
    function ModelPageImpl(args, accUtils, ko, i18n, ModuleRouterAdapter, ArrayDataProvider, preparer) {

      this.connected = () => {
        accUtils.announce('Model page loaded.', 'assertive');
      };

      // Setup for Design / Code tab selection.

      let navData = [
        {path: '', redirect: 'model-design-view'},
        {path: 'model-design-view', detail: {label: i18n.t('page-design-view')}},
        {path: 'model-code-view', detail: {label: i18n.t('page-code-view')}}
      ];

      this.labelMapper = (labelId) => {
        return i18n.t(`model-page-${labelId}`);
      };

      this.disablePrepare = ko.observable(false);
      this.prepareModel = () => {
        preparer.startPrepareModel().then();
      };

      this.selectedItem = ko.observable('model-design-view');
      this.dataProvider = new ArrayDataProvider(navData.slice(1), {keyAttributes: 'path'});

      let router = args.parentRouter.createChildRouter(navData, {history: 'skip'});
      router.sync();

      this.moduleAdapter = new ModuleRouterAdapter(router);

      this.selectedItem.subscribe((newValue) => {
        router.go({path: newValue});
      });
    }

    /*
     * Returns a constructor for the ViewModel.
     */
    return ModelPageImpl;
  });
