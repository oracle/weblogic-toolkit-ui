/**
 * @license
 * Copyright (c) 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project'],
  function(project) {
    function AuxImageHelper() {

      this.supportsDomainCreationImages = () => {
        return project.settings.targetDomainLocation.value === 'pv' && this.wkoVersion41OrHigher();
      };

      this.wkoVersion41OrHigher = () => {
        // If the actual installed version is not known, assume true.
        let result = true;
        if (project.wko.installedVersion.hasValue() &&
          window.api.utils.compareVersions(project.wko.installedVersion.value, '4.1.0') < 0) {
          result = false;
        }
        return result;
      };

      this.domainUsesJRF = () => {
        return project.image.useAuxImage.value && project.k8sDomain.domainType.value !== 'WLS' &&
          project.k8sDomain.domainType.value !== 'RestrictedJRF';
      };

      this.projectUsesModel = () => {
        if (project.settings.targetDomainLocation.observable() === 'pv') {
          return this.supportsDomainCreationImages() && project.image.useAuxImage.observable();
        }
        return true;
      };

      this.isCreatingAuxImage = () => {
        if (project.settings.targetDomainLocation.observable() === 'mii' ||
          this.supportsDomainCreationImages()) {
          return project.image.useAuxImage.observable() && project.image.createAuxImage.observable();
        }
        return false;
      };
    }

    return new AuxImageHelper();
  }
);
