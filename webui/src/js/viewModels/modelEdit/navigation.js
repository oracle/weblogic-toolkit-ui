/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/alias-helper', 'utils/modelEdit/navigation-helper', 'utils/modelEdit/message-helper',
  'utils/wkt-logger',
  'ojs/ojknockouttemplateutils', 'ojs/ojarraytreedataprovider'],
function(accUtils, i18n, ko, ModelEditHelper, AliasHelper, NavigationHelper, MessageHelper, wktLogger,
  KnockoutTemplateUtils, ArrayTreeDataProvider) {

  function NavigationViewModel() {
    this.i18n = i18n;
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.navExpanded = NavigationHelper.navExpanded;
    this.navSelection = NavigationHelper.navSelection;

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

      this.updateSelectedItem();
      subscriptions.push(NavigationHelper.navSelection.subscribe(() => {
        this.updateSelectedItem();
      }));
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-${labelId}`, payload);
    };

    this.updateSelectedItem = () => {
      const selectedKey = this.navSelection();
      if(selectedKey) {
        this.navDataProvider.fetchByKeys({keys: [selectedKey]})
          .then(result => {
            const keyResult = result.results.get(selectedKey);
            if (keyResult) {
              const entry = keyResult.data;
              NavigationHelper.navSelectedItem(entry);
            } else {
              NavigationHelper.navSelectedItem(null);
            }
          });
      } else {
        NavigationHelper.navSelectedItem(null);
      }
    };

    // assign IDs and names based on model path, add child observables, ...
    this.initializeNavList = navList => {
      navList.forEach(navEntry => {
        if(navEntry.modelPath) {
          const modelPath = navEntry.modelPath.split('/');
          const aliasPath = AliasHelper.getAliasPath(modelPath);
          navEntry.id = navEntry.id || modelPath.join('/');
          navEntry.name = navEntry.name || MessageHelper.getFolderLabel(aliasPath);

          if(AliasHelper.isMultiplePath(modelPath)) {
            navEntry.children = navEntry.children || ko.observableArray();
            navEntry.childPage = navEntry.childPage || 'empty-view';
          }

        } else if(Array.isArray(navEntry.children)) {
          this.initializeNavList(navEntry.children);
        }
      });
    };

    this.updateFromModel = () => {
      this.updateNavList(this.navData);
    };

    this.updateNavList = navList => {
      navList.forEach(navEntry => {
        if(navEntry.modelPath) {
          this.updateFolderFromModel(navEntry.modelPath, navEntry.children, navEntry.aliasPath, navEntry.childPage);

        } else if(Array.isArray(navEntry.children)) {
          this.updateNavList(navEntry.children);
        }
      });
    };

    // take extra care to leave current existing entries alone
    this.updateFolderFromModel = (modelPath, folderList, key, page) => {
      const folderKeys = [];
      folderList().forEach(folder => folderKeys.push(folder.name));

      // add model folders that aren't in navigation
      const modelKeys = [];
      const pathArray = modelPath.split('/');  // safe, no name folders here
      const modelFolder = ModelEditHelper.getFolder(pathArray);
      Object.keys(modelFolder).forEach((name) => {
        if(!folderKeys.includes(name)) {
          folderList.push({
            name: name,
            id: modelPath + '/' + name,
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

    this.navData = [
      {
        name: this.labelMapper('domain-info-nav-label'),
        id: 'domain-info-id',
        icon: 'oj-ux-ico-folder',
        page: 'domainInfo/domainInfo',
        children: [
          {
            name: this.labelMapper('opss-initialization-label'),
            id: 'opss-initialization-id',
            icon: 'oj-ux-ico-file'
          },
          {
            name: this.labelMapper('rcudbinfo-label'),
            id: 'rcu-db-info-id',
            icon: 'oj-ux-ico-file',
            page: 'domainInfo/rcu-db-info'
          },
          {
            name: this.labelMapper('wls-credential-mapping-label'),
            id: 'wls-credential-mapping-id',
            icon: 'oj-ux-ico-file'
          },
          {
            name: this.labelMapper('wls-policies-label'),
            id: 'wls-policies-id',
            icon: 'oj-ux-ico-file'
          },
          {
            name: this.labelMapper('wls-roles-label'),
            id: 'wls-roles-id',
            icon: 'oj-ux-ico-file'
          }
        ]
      },
      {
        name: this.labelMapper('topology-nav-label'),
        id: 'topology-id',
        icon: 'oj-ux-ico-folder',
        children: [
          {
            icon: 'oj-ux-ico-list',
            page: 'topology/servers',
            childPage: 'topology/server',
            modelPath: 'topology/Server',
          },
          {
            icon: 'oj-ux-ico-list',
            page: 'topology/clusters',
            childPage: 'topology/cluster',
            modelPath: 'topology/Cluster',
          }
        ]
      },
      {
        name: this.labelMapper('resources-nav-label'),
        id: 'resources-id',
        icon: 'oj-ux-ico-folder',
        children: [
          {
            icon: 'oj-ux-ico-list',
            page: 'resources/datasources',
            childPage: 'resources/datasource',
            modelPath: 'resources/JDBCSystemResource',
          }
        ]
      },
      {
        name: this.labelMapper('deployments-nav-label'),
        id: 'deployments-id',
        icon: 'oj-ux-ico-folder',
        children: [
          {
            icon: 'oj-ux-ico-list',
            page: 'deployments/applications',
            childPage: 'deployments/application',
            modelPath: 'appDeployments/Application'
          },
          {
            icon: 'oj-ux-ico-list',
            page: 'deployments/libraries',
            childPage: 'deployments/library',
            modelPath: 'appDeployments/Library'
          }
        ]
      }
    ];
  }

  return NavigationViewModel;
});
