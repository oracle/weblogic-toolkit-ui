/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/modelEdit/model-edit-helper',
  'oj-c/input-text'
],
function(accUtils, i18n, ModelEditHelper) {
  function ClusterEditViewModel(args) {
    this.i18n = i18n;
    this.name = args.name;

    const subscriptions = [];

    const CLUSTER_PATH = 'topology/Cluster/' + args.name;

    this.connected = () => {
      accUtils.announce(`Cluster Page for ${this.name} loaded.`, 'assertive');
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-cluster-${labelId}`, payload);
    };

    const fields = [
      {
        key: 'notes',
        attribute: 'Notes',
        path: CLUSTER_PATH
      },
      {
        key: 'clusterAddress',
        attribute: 'ClusterAddress',
        path: CLUSTER_PATH
      },
      {
        key: 'clusterMessagingMode',
        attribute: 'ClusterMessagingMode',
        path: CLUSTER_PATH
      }
    ];

    this.att = ModelEditHelper.createVariables(fields, subscriptions);
  }

  return ClusterEditViewModel;
});
