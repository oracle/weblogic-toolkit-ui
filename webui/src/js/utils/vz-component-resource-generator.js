/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-domain-resource-generator', 'utils/vz-helper', 'js-yaml', 'utils/i18n',
  'utils/wkt-logger'],
function(project, K8sDomainResourceGenerator, VerrazzanoHelper, jsYaml) {

  // Note that the specific version number doesn't really matter.  What is important is until Verrazzano
  // starts distributing WKO 4.x, we use a 3.x version number to get the right Domain resource spec.
  //
  const WKO3_VERSION = '3.4.3';

  class VerrazzanoComponentResourceGenerator {
    constructor() {
      this.project = project;
      this.k8sDomainResourceGenerator = new K8sDomainResourceGenerator(WKO3_VERSION);
      this._vzHelper = undefined;
    }

    generate() {
      const { domainResource } = this.k8sDomainResourceGenerator.generate(false);

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
              template: domainResource
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
  return VerrazzanoComponentResourceGenerator;
});
