/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'js-yaml', 'utils/aux-image-helper'],
  function(project, jsYaml, auxImageHelper) {
    class K8sDomainConfigMapGenerator {
      constructor() {
        this.project = project;
      }

      shouldCreateConfigMap() {
        if (auxImageHelper.supportsDomainCreationImages()) {
          return this.project.image.useAuxImage.value;
        } else if (this.project.settings.targetDomainLocation.value === 'mii') {
          return true;
        }
        return false;
      }

      generate(generateYaml = true) {
        if (!this.shouldCreateConfigMap()) {
          return generateYaml ? [] : undefined;
        }

        const configMapData = auxImageHelper.projectHasModel() ?
          this.project.wdtModel.getMergedPropertiesContent().observable() :
          this.project.k8sDomain.externalProperties.observable();

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
          getConfigMapValues(configMapData);

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
