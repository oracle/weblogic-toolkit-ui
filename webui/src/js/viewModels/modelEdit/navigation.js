/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/navigation-helper', 'utils/modelEdit/alias-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/instance-helper',
  'utils/wkt-logger', 'ojs/ojknockouttemplateutils', 'ojs/ojmenu',
  'ojs/ojoption', 'ojs/ojdefer', 'ojs/ojtreeview'],
function(accUtils, ko, NavigationHelper, AliasHelper, MessageHelper, ModelEditHelper, InstanceHelper,
  wktLogger, KnockoutTemplateUtils) {

  function NavigationViewModel() {
    const NAV_SELECTOR = '#modelDesignNav';
    const CONTEXT_MENU_SELECTOR = '#navContextMenu';

    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.navDataProvider = NavigationHelper.navDataProvider;
    this.menuExpanded = NavigationHelper.menuExpanded;
    this.menuKeys = NavigationHelper.menuKeys;

    this.connected = () => {
      this.navigationList = $(NAV_SELECTOR)[0];
      this.contextMenu = $(CONTEXT_MENU_SELECTOR)[0];
    };

    this.t = (labelId, payload) => {
      return MessageHelper.t(labelId, payload);
    };

    this.menuItems = ko.observableArray();

    this.beforeMenu = () => {
      const menuKey = this.navigationList.currentItem;
      const modelPath = NavigationHelper.getModelPath(menuKey);

      this.menuItems.removeAll();

      if(AliasHelper.isNamedPath(modelPath)) {
        const name = modelPath[modelPath.length - 1];
        const label = MessageHelper.t('delete-label', { item: name });
        this.menuItems.push({ id: 'navDelete', label, disabled: false, value: 'delete'});
        this.contextMenu.refresh();

      } else if(AliasHelper.isMultiplePath(modelPath)) {
        const aliasPath = AliasHelper.getAliasPath(modelPath);
        const folderLabel = MessageHelper.getFolderTypeLabel(aliasPath);
        const label = MessageHelper.t('add-label', { item: folderLabel });
        this.menuItems.push({ id: 'navAdd', label, disabled: false, value: 'add'});
        this.contextMenu.refresh();

      } else {
        event.preventDefault();
      }
    };

    this.menuAction = async event => {
      const menuKey = this.navigationList.currentItem;
      const modelPath = NavigationHelper.getModelPath(menuKey);
      const selectedValue = event.detail.selectedValue;

      if(selectedValue === 'add') {
        InstanceHelper.addInstance(modelPath);
      }

      if(selectedValue === 'delete') {
        const instanceName = modelPath[modelPath.length - 1];
        const parentPath = modelPath.slice(0, -1);
        ModelEditHelper.deleteModelElement(parentPath, instanceName);
        NavigationHelper.navigateToElement(parentPath);
      }
    };

    this.isSelectable = item => {
      return !item.data['noSelect'];
    };
  }

  return NavigationViewModel;
});
