/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'js-yaml'],
  function(project, jsYaml) {
    class K8sDomainConfigMapGenerator {
      constructor() {
        this.project = project;
      }

      shouldCreateConfigMap() {
        return this.project.settings.targetDomainLocation.value === 'mii';
      }

      generate(generateYaml = true) {
        if (!this.shouldCreateConfigMap()) {
          return generateYaml ? [] : undefined;
        }

        const configMap = {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          metadata: {
            name: this.project.k8sDomain.modelConfigMapName.value,
            namespace: this.project.k8sDomain.kubernetesNamespace.value
          },
          data: {}
        };
        configMap.data[`${this.project.k8sDomain.uid.value}-overrides.properties`] =
          getConfigMapValues(this.project.wdtModel.getMergedPropertiesContent().observable());

        return generateYaml ? jsYaml.dump(configMap).split('\n') : configMap;
      }
    }

    function getConfigMapValues(mergedProperties) {
      const result = [];
      for (const entry of mergedProperties) {
        if (entry.Override) {
          result.push(`${entry.Name}=${entry.Override}`);
        }
      }
      return result.join('\n');
    }

    return K8sDomainConfigMapGenerator;
  }
);
