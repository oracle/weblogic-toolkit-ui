/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/navigation-helper', 'utils/modelEdit/message-helper',
  'utils/wkt-logger',
  'ojs/ojknockouttemplateutils', 'ojs/ojarraytreedataprovider'],
function(accUtils, ko, ModelEditHelper, AliasHelper, NavigationHelper, MessageHelper, wktLogger,
  KnockoutTemplateUtils, ArrayTreeDataProvider) {

  function NavigationViewModel() {
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.navData = NavigationHelper.navData;
    this.menuExpanded = NavigationHelper.menuExpanded;
    this.menuKey = NavigationHelper.menuKey;
    this.selectedPath = NavigationHelper.selectedPath;

    const subscriptions = [];

    this.connected = () => {
      // initialize provider after connected, to ensure alias data is loaded
      this.initializeNavList(this.navData);
      this.navDataProvider = new ArrayTreeDataProvider(this.navData, {
        keyAttributes: 'id'
      });

      this.updateFromModel();
      subscriptions.push(ModelEditHelper.modelObject.subscribe(() => {
        this.updateFromModel();
      }));

      this.selectMenuItem();
      subscriptions.push(NavigationHelper.menuKey.subscribe(() => {
        this.selectMenuItem();
      }));

      if(!NavigationHelper.menuKey()) {  // if no previous selection, select first nav entry
        const firstNavEntry = this.navData[0];
        NavigationHelper.navigateToElement(firstNavEntry.modelPath);
      }
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.t = (labelId, payload) => {
      return MessageHelper.t(labelId, payload);
    };

    // set the selected path when menu selection changes
    this.selectMenuItem = () => {
      const menuKey = this.menuKey();
      if(menuKey) {
        this.navDataProvider.fetchByKeys({keys: [menuKey]})
          .then(result => {
            const keyResult = result.results.get(menuKey);
            if (keyResult) {
              const entry = keyResult.data;
              this.selectedPath(entry.modelPath);
            } else {
              this.selectedPath(null);
            }
          });
      } else {
        this.selectedPath(null);
      }
    };

    // assign IDs and names based on model path, add child observables, ...
    this.initializeNavList = navList => {
      navList.forEach(navEntry => {
        navEntry.label = navEntry.name ? this.t(navEntry.name) : null;

        if(navEntry.modelPath) {
          const aliasPath = AliasHelper.getAliasPath(navEntry.modelPath);
          navEntry.id = navEntry.id || navEntry.modelPath.join('/');
          navEntry.label = navEntry.label || MessageHelper.getFolderLabel(aliasPath);

          if(AliasHelper.isMultiplePath(navEntry.modelPath)) {
            navEntry.children = navEntry.children || ko.observableArray();
            navEntry.page = navEntry.page || 'instances-page';
            navEntry.childPage = navEntry.childPage || 'folder-page';
          }
        }

        navEntry.page = navEntry.page || 'folder-page';

        if(Array.isArray(navEntry.children)) {
          this.initializeNavList(navEntry.children);
        }
      });
    };

    this.updateFromModel = () => {
      this.updateNavList(this.navData);
    };

    this.updateNavList = navList => {
      navList.forEach(navEntry => {
        if(navEntry.modelPath && AliasHelper.isMultiplePath(navEntry.modelPath)) {
          this.updateChildFoldersFromModel(navEntry.modelPath, navEntry.children, navEntry.childPage);

        } else if(Array.isArray(navEntry.children)) {
          this.updateNavList(navEntry.children);
        }
      });
    };

    // take extra care to leave current existing entries alone
    this.updateChildFoldersFromModel = (modelPath, folderList, page) => {
      const folderKeys = [];
      folderList().forEach(folder => folderKeys.push(folder.name));

      // add model folders that aren't in navigation
      const modelKeys = [];
      const modelFolder = ModelEditHelper.getFolder(modelPath);
      Object.keys(modelFolder).forEach((name) => {
        const id = modelPath.join('/') + '/' + name;
        if(!folderKeys.includes(name)) {
          folderList.push({
            modelPath: [...modelPath, name],
            name: name,
            label: name,
            id: id,
            page: page,
            icon: 'oj-ux-ico-page-template'
          });
        }
        modelKeys.push(name);
      });

      // remove navigation folders that aren't in model
      const folderListCopy = [...folderList()];  // prevent concurrent modification
      folderListCopy.forEach(folder => {
        const folderName = folder.name;
        if(!modelKeys.includes(folderName)) {
          const index = folderList.indexOf(folder);
          folderList.splice(index, 1);
        }
      });

      // needed to prevent duplicate entries from displaying
      folderList.sort(function(a, b) {
        return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0);
      });
    };
  }

  return NavigationViewModel;
});
