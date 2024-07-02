/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'ojs/ojmodule-element-utils'
],
function(accUtils, i18n, ModuleElementUtils) {
  function LibrariesEditViewModel(args) {
    this.i18n = i18n;
    this.modelObject = args.modelObject;

    const LIBRARIES_PATH = 'appDeployments/Library';

    this.connected = () => {
      accUtils.announce('Libraries Page loaded.', 'assertive');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`model-edit-library-${labelId}`);
    };

    this.getElementsModuleConfig = () => {
      return ModuleElementUtils.createConfig({
        name: 'modelEdit/elements-table',
        params: {
          key: 'library',
          path: LIBRARIES_PATH,
          attributes: {
            SourcePath: {
              key: 'SourcePath'
            }
          }
        }
      });
    };
  }

  return LibrariesEditViewModel;
});
