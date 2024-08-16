/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/alias-helper', 'utils/wkt-logger',
  'ojs/ojarraytreedataprovider', 'ojs/ojknockouttemplateutils', 'ojs/ojmodule-element-utils'],
function(accUtils, i18n, ko, ModelEditHelper, AliasHelper, wktLogger,
  ArrayTreeDataProvider, KnockoutTemplateUtils, moduleElementUtils) {

  function ModelEditViewModel() {
    this.i18n = i18n;
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Model Edit Page loaded.', 'assertive');

      this.updateFromModel();
      subscriptions.push(ModelEditHelper.modelObject.subscribe(() => {
        this.updateFromModel();
      }));

      this.updateView();
      subscriptions.push(this.navSelection.subscribe(() => {
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

    this.navSelection = ModelEditHelper.navSelection;
    this.navExpanded = ModelEditHelper.navExpanded;

    this.servers = ko.observableArray();
    this.clusters = ko.observableArray();
    this.datasources = ko.observableArray();
    this.applications = ko.observableArray();
    this.libraries = ko.observableArray();

    this.updateFromModel = () => {
      this.updateFolderFromModel('topology/Server', this.servers, 'server', 'topology/server');
      this.updateFolderFromModel('topology/Cluster', this.clusters, 'cluster', 'topology/cluster');
      this.updateFolderFromModel('resources/JDBCSystemResource', this.datasources, 'datasource',
        'resources/datasource');
      this.updateFolderFromModel('appDeployments/Application', this.applications, 'application',
        'deployments/application');
      this.updateFolderFromModel('appDeployments/Library', this.libraries, 'library',
        'deployments/library');
    };

    // take extra care to leave current existing entries alone
    this.updateFolderFromModel = (path, folderList, key, page) => {
      const folderKeys = [];
      folderList().forEach(folder => folderKeys.push(folder.name));

      // add model folders that aren't in navigation
      const modelKeys = [];
      const pathArray = path.split('/');  // safe, no name folders here
      const modelFolder = ModelEditHelper.getFolder(pathArray);
      Object.keys(modelFolder).forEach((name) => {
        if(!folderKeys.includes(name)) {
          folderList.push({
            name: name,
            id: key + '-' + name,
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

    this.navData = ko.observableArray([
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
            name: this.labelMapper('server-list-label'),
            id: 'folder-server',  // folder-<key>
            icon: 'oj-ux-ico-list',
            page: 'topology/servers',
            children: this.servers
          },
          { name: this.labelMapper('cluster-list-label'),
            id: 'folder-cluster',
            icon: 'oj-ux-ico-list',
            page: 'topology/clusters',
            children: this.clusters
          },
          { name: this.labelMapper('machine-list-label'),
            id: 'folder-machine',
            icon: 'oj-ux-ico-list',
            disabled: ko.computed(() => {
              return true;
            })
          }
        ]
      },
      {
        name: this.labelMapper('resources-nav-label'),
        id: 'resources-id',
        icon: 'oj-ux-ico-folder',
        children: [
          {
            name: this.labelMapper('datasource-list-label'),
            id: 'folder-datasource',  // folder-<key>
            icon: 'oj-ux-ico-list',
            page: 'resources/datasources',
            children: this.datasources
          }
        ]
      },
      {
        name: this.labelMapper('deployments-nav-label'),
        id: 'deployments-id',
        icon: 'oj-ux-ico-folder',
        children: [
          {
            name: this.labelMapper('application-list-label'),
            id: 'folder-application',  // folder-<key>
            icon: 'oj-ux-ico-list',
            page: 'deployments/applications',
            children: this.applications
          },
          { name: this.labelMapper('library-list-label'),
            id: 'folder-library',
            icon: 'oj-ux-ico-list',
            page: 'deployments/libraries',
            children: this.libraries
          }
        ]
      }
    ]);

    this.navDataProvider = new ArrayTreeDataProvider(this.navData, {
      keyAttributes: 'id'
    });

    this.editPage = ko.observable(moduleElementUtils.createConfig({ name: 'empty-view' }));

    this.updateView = () => {
      const selectedKey = this.navSelection();

      if(selectedKey) {
        this.navDataProvider.fetchByKeys({keys: [selectedKey]}).then(result => {
          const keyResult = result.results.get(selectedKey);
          if (keyResult) {
            const entry = keyResult.data;
            const viewName = entry.page ? `modelEdit/${entry.page}` : 'empty-view';

            this.editPage(
              moduleElementUtils.createConfig({
                name: viewName,
                params: {name: entry.name}
              })
            );
          } else {
            this.editPage(moduleElementUtils.createConfig({ name: 'empty-view' }));
          }
        });

      } else {
        this.editPage(moduleElementUtils.createConfig({ name: 'empty-view' }));
      }
    };
  }

  return ModelEditViewModel;
});
