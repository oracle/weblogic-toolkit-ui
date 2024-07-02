/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ko, ModelEditHelper) {
  function ServerEditViewModel(args) {
    this.i18n = i18n;
    this.name = args.name;

    const subscriptions = [];

    const SERVER_PATH = 'topology/Server/' + args.name;
    const SSL_PATH = SERVER_PATH + '/SSL';

    this.connected = () => {
      accUtils.announce(`Server Page for ${this.name} loaded.`, 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-server-${labelId}`, payload);
    };

    const fields = [
      {
        key: 'Cluster',
        attribute: 'Cluster',
        path: SERVER_PATH
      },
      {
        key: 'DefaultIIOPUser',
        attribute: 'DefaultIIOPUser',
        path: SERVER_PATH
      },
      {
        key: 'ListenPort',
        attribute: 'ListenPort',
        path: SERVER_PATH
      },
      {
        key: 'Notes',
        attribute: 'Notes',
        path: SERVER_PATH
      },
      {
        key: 'SSL-Enabled',
        attribute: 'Enabled',
        path: SSL_PATH
      },
      {
        key: 'SSL-ListenPort',
        attribute: 'ListenPort',
        path: SSL_PATH
      }
    ];

    this.att = ModelEditHelper.createVariables(fields, subscriptions);
  }

  return ServerEditViewModel;
});
