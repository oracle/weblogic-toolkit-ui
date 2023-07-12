/**
 * @license
 * Copyright (c) 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'utils/wkt-logger'],
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

      this.projectHasModel = () => {
        if (project.settings.targetDomainLocation.observable() === 'pv') {
          // PV - if not creating the domain creation image then no model.
          return this.supportsDomainCreationImages() && project.image.useAuxImage.observable() &&
            project.image.createAuxImage.observable();
        } else if (project.settings.targetDomainLocation.observable() === 'mii') {
          if (project.image.useAuxImage.observable()) {
            // MII w/ aux image - if not creating the aux image then no model.
            return project.image.createAuxImage.observable();
          }
        }
        // MII w/o aux image - if not creating the primary image, then no model.
        // DII - if not creating the primary image, then no model.
        return project.image.createPrimaryImage.observable();
      };

      this.projectUsingExternalImageContainingModel = () => {
        if (this.supportsDomainCreationImages() || project.settings.targetDomainLocation.observable() === 'mii') {
          return project.image.useAuxImage.observable() && !project.image.createAuxImage.observable();
        }
        // Old PV and DII never has a model in the image
        return false;
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
