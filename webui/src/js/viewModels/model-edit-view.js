/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/meta-helper', 'utils/modelEdit/navigation-helper',
  'utils/modelEdit/message-helper', 'utils/wkt-logger',
  'ojs/ojmodule-element-utils'],
function(accUtils, i18n, ko, ModelEditHelper, AliasHelper, MetaHelper, NavigationHelper, MessageHelper,
  wktLogger, ModuleElementUtils) {

  function ModelEditViewModel() {
    this.i18n = i18n;

    const subscriptions = [];

    this.contentPath = NavigationHelper.contentPath;

    this.connected = () => {
      accUtils.announce('Model Edit Page loaded.', 'assertive');

      this.updateView();
      subscriptions.push(this.contentPath.subscribe(() => {
        this.updateView();
      }));

      // subscribing to wkt-model-definition.propertiesContent won't fire on value changes.
      // update on page load, but may be out of sync if new project is loaded.
      ModelEditHelper.updateVariableMap();
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-${labelId}`, payload);
    };

    this.aliasDataLoaded = ko.computed(() => {
      return AliasHelper.aliasDataLoaded();
    });

    this.aliasDataError = ko.computed(() => {
      if(AliasHelper.aliasDataError()) {
        return this.labelMapper('alias-load-error');
      }
      return null;
    });

    // Setup for archive module
    this.navModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/navigation',
      params: {}
    });

    this.editPage = ko.observable(ModuleElementUtils.createConfig({ name: 'empty-view' }));

    this.updateView = () => {
      const modelPath = this.contentPath();
      if(modelPath) {
        const aliasPath = AliasHelper.getAliasPath(modelPath);
        let metaPage = MetaHelper.getMetadata(aliasPath)['page'];
        if(AliasHelper.isMultiplePath(modelPath)) {
          metaPage = metaPage || 'instances-page';
        }
        metaPage = metaPage || 'folder-page';

        this.editPage(
          ModuleElementUtils.createConfig({
            name: `modelEdit/${metaPage}`,
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
