/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider',
  'ojs/ojtable', 'ojs/ojbutton'],
function(accUtils, ko, i18n, viewHelper, ArrayDataProvider) {

  function ServersView(args) {
    this.nav = args.nav;
    this.servers = this.nav.servers;

    this.connected = () => {
      accUtils.announce('Servers design view loaded.', 'assertive');

      this.updateServersTable(this.servers());
      this.servers.subscribe(servers => {
        this.updateServersTable(servers);
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-server-${labelId}`, payload);
    };

    this.observableServers = ko.observableArray();

    this.columnData = [
      {
        headerText: this.labelMapper('name-header'),
        resizable: 'enabled',
        sortable: 'disable'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      }
    ];

    const sortComparators = viewHelper.getSortComparators(this.columnData);

    this.serversTableProvider = new ArrayDataProvider(this.observableServers,
      { keyAttributes: 'uid', sortComparators: sortComparators });

    this.updateServersTable = servers => {
      let uid = 0;
      const serverList = [];
      servers.forEach(server => {
        serverList.push({ uid: uid, name: server.name });
        uid++;
      });
      this.observableServers(serverList);
    };

    this.handleAddRow = () => {
      this.nav.addNewServer();
    };

    this.handleDeleteRow = (event, context) => {
      const index = context.item.index;
      this.nav.deleteServer(this.servers()[index]);
    };

    this.showServerFunction = (navId) => {
      return () => {
        this.nav.selectServer(navId);
      };
    };
  }

  return ServersView;
});
