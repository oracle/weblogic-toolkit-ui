/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'knockout', 'utils/modelEdit/model-edit-helper', 'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, ko, ModelEditHelper, ModuleElementUtils) {

  function ServersEditViewModel() {
    this.i18n = i18n;

    const SERVERS_PATH = 'topology/Server';

    this.connected = () => {
      accUtils.announce('Servers page loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-edit-server-${labelId}`, payload);
    };

    const getSslListenPort = (modelFolder) => {
      const sslFolder = ModelEditHelper.getChildFolder(modelFolder, 'SSL');
      return sslFolder['ListenPort'];
    };

    this.getElementsModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/elements-table',
        params: {
          key: 'server',
          path: SERVERS_PATH,
          attributes: {
            Cluster: {
              key: 'Cluster'
            },
            ListenPort: {
              key: 'ListenPort',
            },
            'SSL-ListenPort': {  // this attribute is outside Server folder
              attribute: 'ListenPort',
              typeKey: 'server-ssl',
              getter: getSslListenPort
            }
          }
        }
      });
    };
  }

  return ServersEditViewModel;
});
