/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/wkt-logger', 'models/wkt-project', 'utils/modelEdit/navigation/all-navigation',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/alias-helper', 'utils/modelEdit/meta-helper',
  'utils/modelEdit/message-helper', 'ojs/ojarraytreedataprovider'],
function (ko, WktLogger, WktProject, allNavigation, ModelEditHelper, AliasHelper, MetaHelper, MessageHelper,
  ArrayTreeDataProvider) {

  function NavigationHelper() {
    // maintain and update the navigation state

    const SINGLE_ICON = 'oj-ux-ico-file';
    const MULTIPLE_ICON = 'oj-ux-ico-list';

    const navObservable = ko.observableArray();
    let overrideContentPath;  // navigateToElement may have a content path that is not a nav entry
    let initialized = false;

    this.navDataProvider = new ArrayTreeDataProvider(navObservable, { keyAttributes: 'id' });
    this.menuKeys = ko.observable().extend({notify: 'always'});  // a keySet with navigation menu keys
    this.menuExpanded = ko.observable();   // a keySet with all the expanded menu nodes
    this.viewInfo = ko.observable();  // the content path of the selected item (may not be a nav item)

    this.initialize = () => {
      // initialize once, after alias data is loaded
      if(initialized || !ModelEditHelper.dataLoaded()) {
        return;
      }

      this.initializeNavList(allNavigation, []);

      allNavigation.forEach(navEntry => {
        navObservable.push(navEntry);
      });

      this.menuItemSelected();
      this.menuKeys.subscribe(this.menuItemSelected);

      this.updateFromModel();
      ModelEditHelper.modelObject.subscribe(this.updateFromModel);

      if(!this.menuKeys()) {  // if no previous selection, select first nav entry
        this.selectDefault();
      }

      // if a new project is loaded, go to default menu item
      WktProject.postOpen.subscribe(() => {
        this.selectDefault();
      });

      initialized = true;
    };

    this.initialize();
    ModelEditHelper.dataLoaded.subscribe(() => {
      this.initialize();
    });

    this.selectDefault = () => {
      const firstNavEntry = allNavigation[0];
      this.navigateToElement(firstNavEntry.modelPath).then();
    };

    // set the content path when menu selection changes
    this.menuItemSelected = () => {
      const menuKeys = this.menuKeys();  // KeySetImpl
      const values = menuKeys ? [...menuKeys.values()] : [];
      const menuKey = values.length ? values[0] : null;
      if (menuKey) {
        this.navDataProvider.fetchByKeys({keys: [menuKey]})
          .then(result => {
            const keyResult = result.results.get(menuKey);
            if (keyResult) {
              const entry = keyResult.data;
              const modelPath = overrideContentPath ? overrideContentPath : entry.modelPath;
              overrideContentPath = null;
              this.viewInfo({
                page: entry.page,
                modelPath
              });
            } else {
              this.viewInfo(null);
            }
          });

      } else {
        this.viewInfo(null);
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
      this.menuKeys([navigationKey]);
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

    // initialize the static parts of the navigation.
    // if model path is specified, assign IDs, labels, icons, child arrays/observables, etc.
    this.initializeNavList = (navList, parentPath) => {
      const invalidEntries = [];

      navList.forEach(navEntry => {
        navEntry.label = navEntry.name ? MessageHelper.t(navEntry.name) : null;

        if (navEntry.path) {
          const relativePath = navEntry.path.split('/');
          navEntry.modelPath = [...parentPath, ...relativePath];

          try {
            const aliasPath = AliasHelper.getAliasPath(navEntry.modelPath);
            navEntry.id = navEntry.id || navEntry.modelPath.join('/');
            navEntry.label = navEntry.label || MessageHelper.getFolderLabel(aliasPath);
            navEntry.noSelect = navEntry.noSelect || MetaHelper.hasNoSelect(aliasPath);

            let defaultIcon = SINGLE_ICON;
            if(AliasHelper.isMultiplePath(navEntry.modelPath)) {
              defaultIcon = MULTIPLE_ICON;
              navEntry.children = navEntry.children || ko.observableArray();
            }

            navEntry.icon = navEntry.icon || defaultIcon;

          } catch(error) {
            // this can happen with WDT version mismatch
            WktLogger.error('Error initializing nav entry: ' + error);
            invalidEntries.push(navEntry);
          }
        }

        if(Array.isArray(navEntry.children)) {
          this.initializeNavList(navEntry.children, navEntry.modelPath);
        }
      });

      invalidEntries.forEach(entry => {
        const index = navList.indexOf(entry);
        navList.splice(index, 1);
      });
    };

    this.updateFromModel = () => {
      this.updateNavList(allNavigation);
    };

    // update only multiple instance lists on model change
    this.updateNavList = navList => {
      navList.forEach(navEntry => {
        if(navEntry.modelPath && AliasHelper.isMultiplePath(navEntry.modelPath)) {
          this.updateChildFoldersFromModel(navEntry);
          this.updateNavList(navEntry.children());

        } else if(Array.isArray(navEntry.children)) {
          this.updateNavList(navEntry.children);
        }
      });
    };

    // take extra care to leave current existing entries alone
    this.updateChildFoldersFromModel = navEntry => {
      const modelPath = navEntry.modelPath;
      const folderList = navEntry.children;
      const page = navEntry.childPage;
      const instanceChildren = navEntry.instanceChildren || [];

      const folderKeys = [];
      folderList().forEach(folder => folderKeys.push(folder.name));

      // add instance folders that aren't in navigation files
      const modelKeys = [];
      const modelFolder = ModelEditHelper.getFolder(modelPath);
      Object.keys(modelFolder).forEach(name => {
        if(!folderKeys.includes(name)) {
          const instanceModelPath = [...modelPath, name];
          const id = instanceModelPath.join('/');
          const isMultiple = AliasHelper.isMultiplePath(instanceModelPath);
          let icon = isMultiple ? MULTIPLE_ICON : SINGLE_ICON;
          icon = navEntry.instanceIcon ? navEntry.instanceIcon : icon;

          // this named instance may have its own children
          let children = null;
          if(instanceChildren.length) {
            children = [];
            instanceChildren.forEach(instanceChild => {
              const eachInstanceChild = structuredClone(instanceChild);
              children.push(eachInstanceChild);
            });
            this.initializeNavList(children, instanceModelPath);
          }

          folderList.push({
            path: name,
            modelPath: instanceModelPath,
            name,
            label: name,
            children,
            id,
            page,
            icon
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

      // give every folderList element a sortIndex
      folderList().forEach(folder => {
        folder.sortIndex = modelKeys.indexOf(folder.name);
      });

      // sort by model order.
      // also needed to prevent duplicate entries from displaying
      folderList.sort(function(a, b) {
        return (a.sortIndex < b.sortIndex) ? -1 : ((a.sortIndex > b.sortIndex) ? 1 : 0);
      });
    };

    this.getModelPath = key => {
      return this.findModelPath(key, allNavigation);
    };

    this.findModelPath = (key, navList) => {
      navList = ko.isObservable(navList) ? navList() : navList;
      for(const navEntry of navList) {
        if(navEntry.id === key) {
          return navEntry.modelPath;
        }
        if(navEntry.children) {
          const childPath = this.findModelPath(key, navEntry.children);
          if(childPath) {
            return childPath;
          }
        }
      }
      return null;
    };
  }

  return new NavigationHelper();
});
