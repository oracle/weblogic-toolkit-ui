/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-domain-v9-resource-generator', 'utils/vz-helper', 'js-yaml', 'utils/i18n',
  'utils/wkt-logger'],
function(project, K8sDomainV9ResourceGenerator, VerrazzanoHelper, jsYaml) {

  class VerrazzanoComponentWkoV9ResourceGenerator {
    constructor() {
      this.project = project;
      this.k8sDomainResourceGenerator = new K8sDomainV9ResourceGenerator();
      this._vzHelper = undefined;
    }

    generate() {
      const { domainResource, clusters } = this.k8sDomainResourceGenerator.generate(false);

      const component = {
        apiVersion: this._getComponentApiVersion(),
        kind: 'Component',
        metadata: {
          name: this.project.vzComponent.componentName.value,
          namespace: this.project.k8sDomain.kubernetesNamespace.value,
        },
        spec: {
          workload: {
            apiVersion: this._getWorkloadApiVersion(),
            kind: 'VerrazzanoWebLogicWorkload',
            spec: {
              template: domainResource,
              clusters: clusters
            }
          }
        }
      };
      return jsYaml.dump(component).split('\n');
    }

    _getComponentApiVersion() {
      let result = '<UNKNOWN>';

      const vzHelper = this._getVerrazzanoHelper();
      if (vzHelper) {
        result = vzHelper.getComponentApiVersion();
      }
      return result;
    }

    _getWorkloadApiVersion() {
      let result = '<UNKNOWN>';

      const vzHelper = this._getVerrazzanoHelper();
      if (vzHelper) {
        result = vzHelper.getWorkloadApiVersion();
      }
      return result;
    }

    _getVerrazzanoHelper() {
      if (!this._vzHelper) {
        const vzVersion = this.project.vzInstall.actualInstalledVersion.value;
        if (vzVersion) {
          this._vzHelper = new VerrazzanoHelper(vzVersion);
        }
      }
      return this._vzHelper;
    }
  }
  return VerrazzanoComponentWkoV9ResourceGenerator;
});
