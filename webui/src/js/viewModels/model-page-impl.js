/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define([],
  function () {
    function ModelPageImpl(args, accUtils, ko, i18n, ModuleRouterAdapter, ArrayDataProvider, validator, preparer, viewHelper, wktLogger) {

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

      this.disableValidate = ko.observable(false);
      this.validateModel = () => {
        validator.startValidateModel().then();
      };

      this.disablePrepare = ko.observable(false);
      this.prepareModel = () => {
        preparer.startPrepareModel().then();
      };

      this.selectedItem = ko.observable('model-design-view');
      this.inDesignView = ko.computed(() => {
        return this.selectedItem() === 'model-design-view';
      });

      this.dataProvider = new ArrayDataProvider(navData.slice(1), {keyAttributes: 'path'});

      let router = args.parentRouter.createChildRouter(navData, {history: 'skip'});
      router.sync();

      this.moduleAdapter = new ModuleRouterAdapter(router);

      this.selectedItem.subscribe((newValue) => {
        router.go({path: newValue});
      });

      this.disableSearch = ko.observable(false);
      this.enterKeyPressedInSearchInput = (event) => {
        if (event.detail.originalEvent.keyCode === 13) {
          this.searchModel();
        }
      };

      this.searchModel = () => {
        const searchModelElement = document.getElementById('modelDesignSearchInput');
        if (searchModelElement && searchModelElement.value) {
          wktLogger.debug('found modelDesignSearchInput with value %s', searchModelElement.value);
          const payload = {
            bubbles: true,
            detail: {
              value: searchModelElement.value
            }
          };
          wktLogger.debug('dispatched searchModel event with payload %s', payload);
          viewHelper.dispatchEventFromRootElement(new CustomEvent('searchModel', payload));
        }
      };
    }

    /*
     * Returns a constructor for the ViewModel.
     */
    return ModelPageImpl;
  });
