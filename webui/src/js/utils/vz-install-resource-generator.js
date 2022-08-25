/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

const VZ_BETA1_SWITCH_VERSION = '1.4.0';

define(['models/wkt-project', 'js-yaml', 'utils/i18n', 'utils/wkt-logger'],
  function(project, jsYaml) {
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
        return jsYaml.dump(data).split('\n');
      }

      _getVerrazzanoApiVersion() {
        let result = '<UNKNOWN>';
        if (project.vzInstall.versionTag.value) {
          const version = project.vzInstall.versionTag.value.slice(1);
          if (version) {
            if (window.api.utils.compareVersions(version, VZ_BETA1_SWITCH_VERSION) < 0) {
              result = 'install.verrazzano.io/v1alpha1';
            } else {
              result = 'install.verrazzano.io/v1beta1';
            }
          }
        }
        return result;
      }
    }

    return VerrazzanoInstallResourceGenerator;
  }
);
