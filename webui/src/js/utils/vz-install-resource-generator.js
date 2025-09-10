/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'js-yaml', 'utils/vz-helper', 'utils/i18n', 'utils/wkt-logger'],
  function(project, jsYaml, VerrazzanoHelper) {
    class VerrazzanoInstallResourceGenerator {
      constructor() {
        this.project = project;
      }

      generate() {
        const data = {
          apiVersion: this._getVerrazzanoApiVersion(),
          kind: 'Verrazzano',
          metadata: {
            name: this.project.vzInstall.installationName.value,
          },
          spec: {
            profile: this.project.vzInstall.installationProfile.value,
          },
        };

        if (this.project.vzInstall.installJaeger.value) {
          data.spec.components = {
            jaegerOperator: {
              enabled: true
            },
            istio: {
              istioInstallArgs: [
                {
                  name: 'meshConfig.enableTracing',
                  value: 'true'
                }
              ]
            }
          };

          if (this.project.vzInstall.istioSamplingRate.hasValue()) {
            data.spec.components.istio.istioInstallArgs.push({
              name: 'meshConfig.defaultConfig.tracing.sampling',
              value: String(this.project.vzInstall.istioSamplingRate.value),
            });
          }
        }

        const vzVersionTag = this.project.vzInstall.versionTag.value;
        let isArgoAvailable = false;
        if (vzVersionTag) {
          const vzVersionToInstall = vzVersionTag.slice(1);
          isArgoAvailable = window.api.utils.compareVersions(vzVersionToInstall, '1.5.0') >= 0;
        }

        if (isArgoAvailable && this.project.vzInstall.installArgoCD.value) {
          if (!data.spec.components) {
            data.spec.components = {};
          }
          data.spec.components.argoCD = {
            enabled: true
          };
        }
        return jsYaml.dump(data).split('\n');
      }

      _getVerrazzanoApiVersion() {
        let result = '<UNKNOWN>';
        if (project.vzInstall.versionTag.value) {
          const version = VerrazzanoHelper.getVersionFromTag(project.vzInstall.versionTag.value);
          const vzHelper = new VerrazzanoHelper(version);
          result = vzHelper.getInstallApiVersion();
        }
        return result;
      }
    }

    return VerrazzanoInstallResourceGenerator;
  }
);
