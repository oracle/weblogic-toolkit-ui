/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-domain-configmap-generator', 'utils/vz-helper', 'js-yaml'],
  function(project, K8sDomainConfigMapGenerator, VerrazzanoHelper, jsYaml) {
    class VerrazzanoComponentConfigMapGenerator {
      constructor() {
        this.project = project;
        this.k8sDomainConfigMapGenerator = new K8sDomainConfigMapGenerator();
        this.configMapComponentName = '';
        this.configMapComponentNamespace = '';
      }

      generate() {
        const k8sDomainConfigMap = this.k8sDomainConfigMapGenerator.generate(false);

        if (!k8sDomainConfigMap) {
          return [];
        }

        this.configMapComponentName = k8sDomainConfigMap.metadata ? k8sDomainConfigMap.metadata.name : '<UNKNOWN>';
        this.configMapComponentNamespace = k8sDomainConfigMap.metadata ? k8sDomainConfigMap.metadata.namespace : '<UNKNOWN>';
        const component = {
          apiVersion: this._getApiVersion(),
          kind: 'Component',
          metadata: {
            name: this.configMapComponentName,
            namespace: this.configMapComponentNamespace,
          },
          spec: {
            workload: k8sDomainConfigMap,
          }
        };
        return jsYaml.dump(component).split('\n');
      }

      getConfigMapComponentName() {
        return this.configMapComponentName;
      }

      getConfigMapComponentNamespace() {
        return this.configMapComponentNamespace;
      }

      _getApiVersion() {
        let result = '<UNKNOWN>';

        const vzVersion = this.project.vzInstall.actualInstalledVersion.value;
        if (vzVersion) {
          const vzHelper = new VerrazzanoHelper(vzVersion);
          result = vzHelper.getComponentApiVersion();
        }
        return result;
      }
    }
    return VerrazzanoComponentConfigMapGenerator;
  }
);
