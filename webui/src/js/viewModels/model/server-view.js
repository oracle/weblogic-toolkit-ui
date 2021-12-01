/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'ojs/ojarraydataprovider', 'ojs/ojmodule-element-utils',
  'ojs/ojbutton',  'ojs/ojnavigationlist'],
function(accUtils, ko, i18n, ArrayDataProvider, ModuleElementUtils) {
  function ServerView(args) {
    this.nav = args.nav;
    this.server = args.server;

    this.connected = () => {
      accUtils.announce('Server design view loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-server-${labelId}`, payload);
    };

    let navData = [
      { path: 'server-general-view', detail: { label: this.labelMapper('general-tab') } },
      { path: 'server-health-view', detail: { label: this.labelMapper('health-tab') } }
    ];

    this.getModuleConfig = name => {
      return ModuleElementUtils.createConfig({
        viewPath: `views/model/${name}.html`,
        viewModelPath: `viewModels/model/${name}`,
        params: { nav: this.nav, server: this.server }
      });
    };

    this.selectedItem = ko.observable(navData[0].path);
    this.selectedItem.subscribe(selection => {
      this.moduleConfig(this.getModuleConfig(selection));
    });

    this.dataProvider = new ArrayDataProvider(navData, { keyAttributes: 'path' });

    this.moduleConfig = ko.observable(this.getModuleConfig(this.selectedItem()));

    this.deleteServer = () => {
      this.nav.deleteServer(this.server);
    };
  }

  return ServerView;
});
