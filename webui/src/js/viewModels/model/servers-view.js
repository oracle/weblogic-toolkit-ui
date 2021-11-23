/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils'],
  function(accUtils) {
    function ServersView(args) {
      this.model = args.routerState.detail.model;
      this.servers = args.routerState.detail.servers;

      this.connected = () => {
        accUtils.announce('Servers design view loaded.', 'assertive');
      };

      this.showServerFunction = (key) => {
        return () => {
          console.log('show server: ' + key);
        };
      };
    }

    return ServersView;
  });
