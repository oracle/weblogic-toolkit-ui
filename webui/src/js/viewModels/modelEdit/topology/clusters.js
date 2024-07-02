/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, ModuleElementUtils) {
  function ClustersEditViewModel(args) {
    this.i18n = i18n;
    this.modelObject = args.modelObject;

    const CLUSTERS_PATH = 'topology/Cluster';

    this.connected = () => {
      accUtils.announce('Clusters Page loaded.', 'assertive');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`model-edit-cluster-${labelId}`);
    };

    this.getElementsModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/elements-table',
        params: {
          key: 'cluster',
          path: CLUSTERS_PATH,
          attributes: {
            ClusterAddress: {
              key: 'ClusterAddress'
            },
            ClusterMessagingMode: {
              key: 'ClusterMessagingMode',
            }
          }
        }
      });
    };
  }

  return ClustersEditViewModel;
});
