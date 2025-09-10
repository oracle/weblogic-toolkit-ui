/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/vz-component-wko-v8-resource-generator',
  'utils/vz-component-wko-v9-resource-generator', 'utils/wkt-logger'],
function(project, VerrazzanoComponentWkoV8ResourceGenerator, VerrazzanoComponentWkoV9ResourceGenerator, wktLogger) {

  const WKO_V9_SWITCHOVER_VERSION = '1.5.0';
  const DEFAULT_VERRAZZANO_VERSION = WKO_V9_SWITCHOVER_VERSION;

  class VerrazzanoComponentResourceGenerator {
    constructor(verrazzanoVersion = DEFAULT_VERRAZZANO_VERSION) {
      this.project = project;
      this.verrazzanoComponentResourceGenerator = _getVerrazzanoComponentResourceGenerator(verrazzanoVersion);
    }

    generate(generateYaml = true) {
      return this.verrazzanoComponentResourceGenerator.generate(generateYaml);
    }
  }

  function _getVerrazzanoComponentResourceGenerator(verrazzanoVersion) {
    let generator;
    if (window.api.utils.compareVersions(verrazzanoVersion, WKO_V9_SWITCHOVER_VERSION) < 0) {
      wktLogger.debug('Using Verrazzano version %s to create Verrazzano component WKO V8 resource generator', verrazzanoVersion);
      generator = new VerrazzanoComponentWkoV8ResourceGenerator();
    } else {
      wktLogger.debug('Using Verrazzano version %s to create Verrazzano component WKO V9 resource generator', verrazzanoVersion);
      generator = new VerrazzanoComponentWkoV9ResourceGenerator();
    }
    return generator;
  }

  return VerrazzanoComponentResourceGenerator;
});
