/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n'],
  function(accUtils, i18n) {
    function ServersView(args) {
      this.nav = args.nav;
      this.servers = this.nav.servers;

      this.connected = () => {
        accUtils.announce('Servers design view loaded.', 'assertive');
      };

      this.labelMapper = (labelId, payload) => {
        return i18n.t(`model-design-${labelId}`, payload);
      };

      this.showServerFunction = (navId) => {
        return () => {
          this.nav.selectServer(navId);
        };
      };

      this.addNewServer = () => {
        this.nav.addNewServer();
      };
    }

    return ServersView;
  });
