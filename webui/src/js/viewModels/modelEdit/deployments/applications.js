/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, ModuleElementUtils) {
  function ApplicationsEditViewModel(args) {
    this.i18n = i18n;
    this.modelObject = args.modelObject;

    const APPLICATIONS_PATH = 'appDeployments/Application';

    this.connected = () => {
      accUtils.announce('Applications Page loaded.', 'assertive');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`model-edit-application-${labelId}`);
    };

    this.getElementsModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/elements-table',
        params: {
          key: 'application',
          path: APPLICATIONS_PATH,
          attributes: {
            SourcePath: {
              key: 'SourcePath'
            }
          }
        }
      });
    };
  }

  return ApplicationsEditViewModel;
});
