/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-domain-v8-resource-generator', 'utils/k8s-domain-v9-resource-generator',
  'utils/k8s-domain-configmap-generator', 'utils/wkt-logger'],
function(project, K8sDomainV8ResourceGenerator, K8sDomainV9ResourceGenerator, K8sDomainConfigMapGenerator, wktLogger) {

  const V9_SWITCHOVER_VERSION = '4.0.0';
  const DEFAULT_OPERATOR_VERSION = '4.1.0';

  class K8sDomainResourceGenerator {
    constructor(operatorVersion = DEFAULT_OPERATOR_VERSION) {
      this.project = project;
      this.operatorResourceGenerator = _getOperatorResourceGenerator(operatorVersion);
      this.k8sConfigMapGenerator = new K8sDomainConfigMapGenerator();
    }

    generate(generateYaml = true) {
      return this.operatorResourceGenerator.generate(generateYaml);
    }
  }

  function _getOperatorResourceGenerator(operatorVersion) {
    let generator;
    if (window.api.utils.compareVersions(operatorVersion, V9_SWITCHOVER_VERSION) < 0) {
      wktLogger.debug('Using operator version %s to create domain resource generator V8', operatorVersion);
      generator = new K8sDomainV8ResourceGenerator();
    } else {
      wktLogger.debug('Using operator version %s to create domain resource generator V9', operatorVersion);
      generator = new K8sDomainV9ResourceGenerator(operatorVersion);
    }
    return generator;
  }

  return K8sDomainResourceGenerator;
});
