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

      document.getElementById('wkt-servers-table').addEventListener('click', this.clickHandler);
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-server-${labelId}`, payload);
    };

    this.clickHandler = (event) => {
      if (event.target.matches('a')) {
        event.preventDefault();
        const serverId = event.target.getAttribute('data-server-id');
        this.nav.selectServer(serverId);
      }
    };

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

    this.serversTableProvider = new ArrayDataProvider(this.servers,
      { keyAttributes: 'id', sortComparators: sortComparators });

    this.handleAddRow = () => {
      this.nav.addNewServer();
    };

    this.handleDeleteRow = (event, context) => {
      const index = context.item.index;
      this.nav.deleteServer(this.servers()[index]);
    };
  }

  return ServersView;
});
