/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, ModuleElementUtils) {
  function DatasourcesEditViewModel(args) {
    this.i18n = i18n;
    this.modelObject = args.modelObject;

    const DATASOURCES_PATH = 'resources/JDBCSystemResource';

    this.connected = () => {
      accUtils.announce('Datasources Page loaded.', 'assertive');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`model-edit-datasource-${labelId}`);
    };

    this.getElementsModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/elements-table',
        params: {
          key: 'datasource',
          path: DATASOURCES_PATH,
          attributes: {
            DeploymentOrder: {
              key: 'DeploymentOrder'
            }
          }
        }
      });
    };
  }

  return DatasourcesEditViewModel;
});
