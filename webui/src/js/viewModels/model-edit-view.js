/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'js-yaml', 'models/wkt-project', 'utils/wkt-logger',
  'ojs/ojarraytreedataprovider', 'ojs/ojknockouttemplateutils', 'ojs/ojmodule-element-utils'],
function(accUtils, i18n, ko, jsYaml, project, wktLogger,
  ArrayTreeDataProvider, KnockoutTemplateUtils, moduleElementUtils) {

  function ModelEditViewModel(args) {
    this.i18n = i18n;
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.connected = () => {
      accUtils.announce('Model Edit Page loaded.', 'assertive');

      this.updateFromModel();
      project.wdtModel.modelContentChanged.subscribe(() => {
        wktLogger.debug('MODEL EDIT: modelContentChanged event');

        this.updateFromModel();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-${labelId}`, payload);
    };

    this.updateFromModel = () => {
      wktLogger.debug('MEV: updateFromModel');

      const modelText = project.wdtModel.modelContent();

      const modelObject = jsYaml.load(modelText, {});

      wktLogger.debug('  YAML: ' + JSON.stringify(modelObject));

      this.servers.removeAll();
      this.clusters.removeAll();

      if(modelObject) {
        const modelTopology = modelObject['topology'];

        this.updateFolderFromModel(modelTopology, 'Server', this.servers, 'server');
        this.updateFolderFromModel(modelTopology, 'Cluster', this.clusters, 'cluster');

        // const modelServers = modelTopology['Server'];
        // Object.keys(modelServers).forEach((name, index) => {
        //   console.log(' SERVER: ' + name);
        //
        //   this.servers.push({
        //     name: name,
        //     id: 'server-' + index,
        //     page: 'server',
        //     icon: 'oj-ux-ico-page-template'
        //   });
        // });
      }
    };

    this.updateFolderFromModel = (parentFolder, folderName, folderList, page) => {
      const modelFolders = parentFolder[folderName];
      Object.keys(modelFolders).forEach((name, index) => {
        console.log(' ' + folderName + ': ' + name);

        const fields = modelFolders[name];

        folderList.push({
          name: name,
          id: page + '-' + index,
          page: page,
          icon: 'oj-ux-ico-page-template',
          fields: fields
        });
      });

    };

    this.servers = ko.observableArray();
    this.clusters = ko.observableArray();

    this.navData = ko.observableArray([
      {
        name: this.labelMapper('servers-label'),
        id: 'servers-id',
        icon: 'oj-ux-ico-settings',
        page: 'servers',
        children: this.servers
      },
      { name: this.labelMapper('clusters-label'),
        id: 'clusters-id',
        icon: 'oj-ux-ico-model-change-mgmt',
        children: this.clusters
      },
      { name: this.labelMapper('machines-label'),
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

    this.selection = ko.observable();
    this.editPage = ko.observable();

    this.updateView = async() => {
      const selectedKey = this.selection();

      if(selectedKey) {
        const result = await this.navDataProvider.fetchByKeys({keys: [selectedKey]});
        const entry = result.results.get(selectedKey).data;
        const viewName = entry.page ? `modelEdit/${entry.page}` : 'empty-view';

        this.editPage(
          moduleElementUtils.createConfig({
            name: viewName,
            params: { name: entry.name, fields: entry.fields }
          })
        );

      } else {
        this.editPage(moduleElementUtils.createConfig({ name: 'empty-view' }));
      }
    };

    this.updateView();
    this.selection.subscribe(() => {
      this.updateView();
    });
  }

  return ModelEditViewModel;
});
