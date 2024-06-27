/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'js-yaml', 'models/wkt-project',
  'utils/modelEdit/model-edit-helper', 'utils/wkt-logger',
  'ojs/ojarraytreedataprovider', 'ojs/ojknockouttemplateutils', 'ojs/ojmodule-element-utils'],
function(accUtils, i18n, ko, jsYaml, project, ModelEditHelper, wktLogger,
  ArrayTreeDataProvider, KnockoutTemplateUtils, moduleElementUtils) {

  function ModelEditViewModel(args) {
    this.i18n = i18n;
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    const subscriptions = [];

    this.connected = () => {
      accUtils.announce('Model Edit Page loaded.', 'assertive');

      this.updateFromModel();
      subscriptions.push(project.wdtModel.modelContentChanged.subscribe(() => {
        this.updateFromModel();
      }));

      this.updateView();
      subscriptions.push(this.navSelection.subscribe(() => {
        this.updateView();
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

    this.navSelection = ModelEditHelper.navSelection;
    this.modelObject = {};

    this.servers = ko.observableArray();
    this.clusters = ko.observableArray();

    this.updateFromModel = () => {
      const modelText = project.wdtModel.modelContent();
      this.modelObject = jsYaml.load(modelText, {});
      this.modelObject = this.modelObject || {};

      if(this.modelObject) {
        this.updateFolderFromModel(this.modelObject, 'topology/Server', this.servers, 'server');
        this.updateFolderFromModel(this.modelObject, 'topology/Cluster', this.clusters, 'cluster');
      }
    };

    // take extra care to leave current existing entries alone
    this.updateFolderFromModel = (modelObject, path, folderList, page) => {
      const folderKeys = [];
      folderList().forEach(folder => folderKeys.push(folder.name));

      // add model folders that aren't in navigation
      const modelKeys = [];
      const modelFolder = ModelEditHelper.getFolder(modelObject, path);
      Object.keys(modelFolder).forEach((name) => {
        if(!folderKeys.includes(name)) {
          folderList.push({
            name: name,
            id: page + '-' + name,
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
        name: this.labelMapper('server-list-label'),
        id: 'servers-id',
        icon: 'oj-ux-ico-settings',
        page: 'servers',
        children: this.servers
      },
      { name: this.labelMapper('cluster-list-label'),
        id: 'clusters-id',
        icon: 'oj-ux-ico-model-change-mgmt',
        page: 'clusters',
        children: this.clusters
      },
      { name: this.labelMapper('machine-list-label'),
        id: 'machines-id',
        icon: 'oj-ux-ico-page-template',
        disabled: ko.computed(() => {
          return true;
        })
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
          console.log('key result: ' + selectedKey + ' ' + keyResult);
          if (keyResult) {
            const entry = keyResult.data;
            const viewName = entry.page ? `modelEdit/${entry.page}` : 'empty-view';

            this.editPage(
              moduleElementUtils.createConfig({
                name: viewName,
                params: {name: entry.name, modelObject: this.modelObject}
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
