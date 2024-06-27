/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'js-yaml', 'models/wkt-project', 'utils/modelEdit/model-edit-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ko, jsYaml, project, ModelEditHelper) {
  function ServerEditViewModel(args) {
    this.i18n = i18n;
    this.name = args.name;
    this.modelObject = args.modelObject;

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
        key: 'cluster',
        attribute: 'Cluster',
        path: SERVER_PATH
      },
      {
        key: 'defaultIiopUser',
        attribute: 'DefaultIIOPUser',
        path: SERVER_PATH
      },
      {
        key: 'listenPort',
        attribute: 'ListenPort',
        path: SERVER_PATH
      },
      {
        key: 'notes',
        attribute: 'Notes',
        path: SERVER_PATH
      },
      {
        key: 'ssl-enabled',
        attribute: 'Enabled',
        path: SSL_PATH
      },
      {
        key: 'ssl-listenPort',
        attribute: 'ListenPort',
        path: SSL_PATH
      }
    ];

    this.att = ModelEditHelper.createVariables(fields, this.modelObject, subscriptions);
  }

  return ServerEditViewModel;
});
