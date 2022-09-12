/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/vz-helper', 'js-yaml', 'utils/i18n', 'utils/wkt-logger'],
  function(project, VerrazzanoHelper, jsYaml) {
    class VerrazzanoProjectResourceGenerator {
      constructor() {
        this.project = project;
        this._vzHelper = undefined;
      }

      generate() {
        const isMultiCluster = this.project.vzApplication.useMultiClusterApplication.value;
        const isCreateProject = this.project.vzApplication.createProject.value;

        if (isMultiCluster && isCreateProject) {
          const projectSpec = {
            apiVersion: this._getProjectApiVersion(),
            kind: 'VerrazzanoProject',
            metadata: {
              name: this.project.vzApplication.projectName.value,
              namespace: 'verrazzano-mc',
            },
            spec: {
              template: {
                namespaces: [
                  {
                    metadata: {
                      name: this.project.k8sDomain.kubernetesNamespace.value,
                    },
                  },
                ],
              },
              placement: {
                clusters: []
              }
            }
          };

          for (const clusterName of this.project.vzApplication.placementClusters.value) {
            projectSpec.spec.placement.clusters.push({ name: clusterName });
          }

          return jsYaml.dump(projectSpec).split('\n');
        } else {
          return [];
        }
      }

      _getProjectApiVersion() {
        let result = '<UNKNOWN>';

        const vzHelper = this._getVerrazzanoHelper();
        if (vzHelper) {
          result = vzHelper.getProjectApiVersion();
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

    return VerrazzanoProjectResourceGenerator;
  });
