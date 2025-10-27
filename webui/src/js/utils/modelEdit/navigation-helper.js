/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/modeledit/navigation/all-navigation', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/message-helper', 'ojs/ojarraytreedataprovider'],
function (ko, allNavigation, ModelEditHelper, AliasHelper, MessageHelper, ArrayTreeDataProvider) {

  function NavigationHelper() {
    // maintain and update the navigation state

    const navObservable = ko.observableArray();
    let overrideContentPath;  // navigateToElement may have a content path that is not a nav entry
    let initialized = false;

    this.navDataProvider = new ArrayTreeDataProvider(navObservable, { keyAttributes: 'id' });
    this.menuKey = ko.observable().extend({ notify: 'always' });  // a string with navigation menu key
    this.menuExpanded = ko.observable();   // a keySet with all the expanded menu nodes
    this.contentPath = ko.observable();  // the content path of the selected item (may not be a nav item)

    this.initialize = () => {
      // initialize once, after alias data is loaded
      if(initialized || !AliasHelper.aliasDataLoaded()) {
        return;
      }

      this.initializeNavList(allNavigation);

      allNavigation.forEach(navEntry => {
        navObservable.push(navEntry);
      });

      this.menuItemSelected();
      this.menuKey.subscribe(this.menuItemSelected);

      this.updateFromModel();
      ModelEditHelper.modelObject.subscribe(this.updateFromModel);

      if(!this.menuKey()) {  // if no previous selection, select first nav entry
        const firstNavEntry = allNavigation[0];
        this.navigateToElement(firstNavEntry.modelPath).then();
      }

      initialized = true;
    };

    this.initialize();
    AliasHelper.aliasDataLoaded.subscribe(() => {
      this.initialize();
    });

    // set the content path when menu selection changes
    this.menuItemSelected = () => {
      const menuKey = this.menuKey();

      if(overrideContentPath) {
        this.contentPath(overrideContentPath);
        overrideContentPath = null;

      } else if(menuKey) {
        this.navDataProvider.fetchByKeys({keys: [menuKey]})
          .then(result => {
            const keyResult = result.results.get(menuKey);
            if (keyResult) {
              const entry = keyResult.data;
              this.contentPath(entry.modelPath);
            } else {
              this.contentPath(null);
            }
          });

      } else {
        this.contentPath(null);
      }
    };

    this.navigateToElement = async(modelPath, name) => {
      const contentPath = [...modelPath];
      if (name) {
        contentPath.push(name);
      }

      // find the deepest node in modelPath that is in the navigation
      const navigationPath = [...contentPath];
      while (navigationPath.length > 0) {
        const menuKey = navigationPath.join('/');
        const result = await this.navDataProvider.containsKeys({keys: [menuKey]});
        if (result.results.has(menuKey)) {
          break;
        }
        navigationPath.pop();
      }

      const parentPath = navigationPath.slice(0, -1);
      if(parentPath.length) {
        this.openNavigation(parentPath).then();
      }

      const navigationKey = navigationPath.join('/');
      overrideContentPath = contentPath;  // override what the nav would select
      this.menuKey(navigationKey);
    };

    this.openNavigation = async(modelPath) => {
      const openPath = [];
      for(const element of modelPath) {
        openPath.push(element);
        const menuKey = openPath.join('/');
        const result = await this.navDataProvider.containsKeys({keys: [menuKey]});
        if (result.results.has(menuKey)) {
          const keySet = this.menuExpanded();
          this.menuExpanded(keySet.add([menuKey]));
        }
      }
    };

    // assign IDs and names based on model path, add child observables, ...
    this.initializeNavList = navList => {
      navList.forEach(navEntry => {
        navEntry.label = navEntry.name ? MessageHelper.t(navEntry.name) : null;

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
      this.updateNavList(allNavigation);
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

  return new NavigationHelper();
});
