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
          const aliasPath = AliasHelper.getAliasPath(navEntry.modelPath);
          navEntry.id = navEntry.id || navEntry.modelPath.join('/');
          navEntry.name = navEntry.name || MessageHelper.getFolderLabel(aliasPath);

          if(AliasHelper.isMultiplePath(navEntry.modelPath)) {
            navEntry.children = navEntry.children || ko.observableArray();
            navEntry.page = navEntry.page || 'elements-page';
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

    this.navData = [
      {
        modelPath: ['domainInfo'],
        icon: 'oj-ux-ico-folder',
        page: 'domainInfo/domainInfo',
        children: [
          {
            modelPath: ['domainInfo', 'OPSSInitialization'],
            icon: 'oj-ux-ico-file',
            page: '../empty-view',
            children: [
              {
                icon: 'oj-ux-ico-list',
                modelPath: ['domainInfo', 'OPSSInitialization', 'Credential']
              },
            ]
          },
          {
            modelPath: ['domainInfo', 'RCUDbInfo'],
            icon: 'oj-ux-ico-file',
            page: 'domainInfo/rcu-db-info'
          },
          {
            modelPath: ['domainInfo', 'WLSUserPasswordCredentialMappings'],
            icon: 'oj-ux-ico-file',
            page: '../empty-view',
            children: [
              {
                icon: 'oj-ux-ico-list',
                modelPath: ['domainInfo', 'WLSUserPasswordCredentialMappings', 'CrossDomain']
              },
              {
                icon: 'oj-ux-ico-list',
                modelPath: ['domainInfo', 'WLSUserPasswordCredentialMappings', 'RemoteResource']
              }
            ]
          },
          {
            modelPath: ['domainInfo', 'WLSPolicies'],
            icon: 'oj-ux-ico-file'
          },
          {
            modelPath: ['domainInfo', 'WLSRoles'],
            icon: 'oj-ux-ico-file'
          }
        ]
      },
      {
        name: this.labelMapper('topology-nav-label'),
        id: 'topology-id',
        icon: 'oj-ux-ico-folder',
        page: '../empty-view',
        children: [
          {
            icon: 'oj-ux-ico-list',
            childPage: 'topology/server',
            modelPath: ['topology', 'Server']
          },
          {
            icon: 'oj-ux-ico-list',
            childPage: 'topology/cluster',
            modelPath: ['topology', 'Cluster']
          }
        ]
      },
      {
        name: this.labelMapper('resources-nav-label'),
        id: 'resources-id',
        icon: 'oj-ux-ico-folder',
        page: '../empty-view',
        children: [
          {
            icon: 'oj-ux-ico-list',
            childPage: 'resources/datasource',
            modelPath: ['resources', 'JDBCSystemResource']
          }
        ]
      },
      {
        name: this.labelMapper('deployments-nav-label'),
        id: 'deployments-id',
        icon: 'oj-ux-ico-folder',
        page: '../empty-view',
        children: [
          {
            icon: 'oj-ux-ico-list',
            childPage: 'deployments/application',
            modelPath: ['appDeployments', 'Application']
          },
          {
            icon: 'oj-ux-ico-list',
            childPage: 'deployments/library',
            modelPath: ['appDeployments', 'Library']
          }
        ]
      }
    ];
  }

  return NavigationViewModel;
});
