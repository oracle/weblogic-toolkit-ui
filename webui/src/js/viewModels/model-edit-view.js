/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/navigation-helper',
  'utils/modelEdit/message-helper', 'utils/screen-utils', 'utils/wkt-logger',
  'ojs/ojmodule-element-utils'],
function(accUtils, ko, ModelEditHelper, AliasHelper, MetaHelper, NavigationHelper, MessageHelper,
  ScreenUtils, wktLogger, ModuleElementUtils) {

  function ModelEditViewModel() {
    const subscriptions = [];

    this.viewInfo = NavigationHelper.viewInfo;

    this.connected = () => {
      accUtils.announce('Model Edit Page loaded.', 'assertive');

      this.updateView();
      subscriptions.push(this.viewInfo.subscribe(() => {
        this.updateView();
      }));

      const hSlider = document.getElementById('wkt-model-edit-slider');
      const leftPane  = document.getElementById('wkt-model-editor-nav-container');
      const rightPane = document.getElementById('wkt-model-editor-content-container');
      ScreenUtils.sliderPane(hSlider, leftPane, rightPane, 'modelEdit', false);

      // subscribing to wkt-model-definition.propertiesContent won't fire on value changes.
      // update on page load, but may be out of sync if new project is loaded.
      ModelEditHelper.updateVariableMap();
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.aliasDataLoaded = ko.computed(() => {
      return AliasHelper.aliasDataLoaded();
    });

    this.aliasDataError = ko.computed(() => {
      if(AliasHelper.aliasDataError()) {
        return MessageHelper.t('alias-load-error');
      }
      return null;
    });

    // Setup for nav module
    this.navModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/navigation',
      params: {}
    });

    this.editPage = ko.observable(ModuleElementUtils.createConfig({ name: 'empty-view' }));

    this.updateView = () => {
      const viewInfo = this.viewInfo();
      if(viewInfo) {
        let pageView = viewInfo.page;
        const modelPath = viewInfo.modelPath;
        if(modelPath) {
          const aliasPath = AliasHelper.getAliasPath(modelPath);
          let metaView = MetaHelper.getMetadata(aliasPath)['page'];
          pageView = pageView || metaView;  // navigation page takes precedence
          pageView = pageView || (AliasHelper.isMultiplePath(modelPath) ? 'instances-page' : 'folder-page');
        }

        pageView = pageView || '../empty-view';

        this.editPage(
          ModuleElementUtils.createConfig({
            name: `modelEdit/${pageView}`,
            params: {
              modelPath: modelPath
            }
          })
        );

      } else {
        this.editPage(ModuleElementUtils.createConfig({ name: 'empty-view' }));
      }
    };
  }

  return ModelEditViewModel;
});
