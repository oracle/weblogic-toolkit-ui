/**
 * @license
 * Copyright (c) 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project'],
  function(project) {
    class AuxImageHelper {
      constructor() {
        this.project = project;
      }

      supportsDomainCreationImages() {
        return this.project.settings.targetDomainLocation.value === 'pv' && this.wkoVersion41OrHigher();
      }

      wkoVersion41OrHigher() {
        // If the actual installed version is not known, assume true.
        let result = true;
        if (this.project.wko.installedVersion.hasValue() &&
          window.api.utils.compareVersions(this.project.wko.installedVersion.value, '4.1.0') < 0) {
          result = false;
        }
        return result;
      }

      domainUsesJRF() {
        return this.project.image.useAuxImage.value && this.project.k8sDomain.domainType.value !== 'WLS' &&
          this.project.k8sDomain.domainType.value !== 'RestrictedJRF';
      }
    }

    return new AuxImageHelper();
  }
);
