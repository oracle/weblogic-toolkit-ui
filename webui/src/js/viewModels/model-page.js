/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['viewModels/model-page-impl', 'accUtils', 'knockout', 'utils/i18n',
  'ojs/ojmodulerouter-adapter', 'ojs/ojarraydataprovider', 'ojs/ojnavigationlist',
  'utils/wdt-validator', 'utils/wdt-preparer', 'utils/view-helper', 'utils/wkt-logger'],
function (impl, accUtils, ko, i18n, ModuleRouterAdapter, ArrayDataProvider, validator, preparer, viewHelper, wktLogger) {
  function ModelPage(args) {
    return new impl(args, accUtils, ko, i18n, ModuleRouterAdapter, ArrayDataProvider, validator, preparer, viewHelper, wktLogger);
  }

  return ModelPage;
});
