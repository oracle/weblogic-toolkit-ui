/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define([],
  function () {
    function ModelPageImpl(args, accUtils, ko, i18n, ModuleRouterAdapter, ArrayDataProvider, validator, preparer, viewHelper, project, wktLogger) {

      let subscriptions = [];

      this.connected = () => {
        accUtils.announce('Model page loaded.', 'assertive');
        if (project.wdtModel.internal.displayNewModelEditorTab.observable() === undefined) {
          wktLogger.debug('displayNewModelEditorTab.observable() is undefined so creating a subscription');
          subscriptions.push(project.wdtModel.internal.displayNewModelEditorTab.observable.subscribe((newValue) => {
            wktLogger.debug('displayNewModelEditorTab.observable() value changed to %s', newValue);
            if (newValue === false) {
              this.navData.pop();
            }
          }));
        } else if (project.wdtModel.internal.displayNewModelEditorTab.observable() === false) {
          wktLogger.debug('displayNewModelEditorTab.observable() is false so popping the tab');
          this.navData.pop();
        }
      };

      this.disconnected = () => {
        subscriptions.forEach((subscription) => {
          subscription.dispose();
        });
      };

      // Setup for Design / Code tab selection.

      const _navData = [
        {path: '', redirect: 'model-design-view'},
        {path: 'model-design-view', detail: {label: i18n.t('page-design-view')}},
        {path: 'model-code-view', detail: {label: i18n.t('page-code-view')}},
        {path: 'model-edit-view', detail: {label: i18n.t('model-edit-view')}}
      ];

      this.navData = ko.observableArray(_navData.slice(1));

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

      this.dataProvider = new ArrayDataProvider(this.navData, {keyAttributes: 'path'});

      let router = args.parentRouter.createChildRouter(_navData, {history: 'skip'});
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
