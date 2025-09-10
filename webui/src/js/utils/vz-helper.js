/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

const VZ_ALPHA1_INSTALL_API_VERSION = 'install.verrazzano.io/v1alpha1';
const VZ_ALPHA1_COMPONENT_API_VERSION = 'core.oam.dev/v1alpha2';
const VZ_ALPHA1_WORKLOAD_API_VERSION = 'oam.verrazzano.io/v1alpha1';
const VZ_ALPHA1_APPLICATION_API_VERSION = 'core.oam.dev/v1alpha2';
const VZ_ALPHA1_MULTI_CLUSTER_APPLICATION_API_VERSION = 'clusters.verrazzano.io/v1alpha1';
const VZ_ALPHA1_INGRESS_TRAIT_API_VERSION = 'oam.verrazzano.io/v1alpha1';
const VZ_ALPHA1_LOGGING_TRAIT_API_VERSION = 'oam.verrazzano.io/v1alpha1';
const VZ_ALPHA1_MANUAL_SCALER_TRAIT_API_VERSION = 'core.oam.dev/v1alpha2';
const VZ_ALPHA1_METRICS_TRAIT_API_VERSION = 'oam.verrazzano.io/v1alpha1';
const VZ_ALPHA1_PROJECT_API_VERSION = 'clusters.verrazzano.io/v1alpha1';

const VZ_CR_BETA1_SWITCH_VERSION = '1.4.0';

const VZ_BETA1_INSTALL_API_VERSION = 'install.verrazzano.io/v1beta1';

define([],
  function() {
    class VerrazzanoHelper {
      constructor(verrazzanoVersion) {
        this.verrazzanoVersion = verrazzanoVersion;
      }

      static getVersionFromTag(tag) {
        return tag.slice(1);
      }

      static getTagFromVersion(version) {
        return `v${version}`;
      }

      getInstallApiVersion() {
        if (window.api.utils.compareVersions(this.verrazzanoVersion, VZ_CR_BETA1_SWITCH_VERSION) < 0) {
          return VZ_ALPHA1_INSTALL_API_VERSION;
        } else {
          return VZ_BETA1_INSTALL_API_VERSION;
        }
      }

      getComponentApiVersion() {
        return VZ_ALPHA1_COMPONENT_API_VERSION;
      }

      getWorkloadApiVersion() {
        return VZ_ALPHA1_WORKLOAD_API_VERSION;
      }

      getApplicationApiVersion() {
        return VZ_ALPHA1_APPLICATION_API_VERSION;
      }

      getMultiClusterApplicationApiVersion() {
        return VZ_ALPHA1_MULTI_CLUSTER_APPLICATION_API_VERSION;
      }

      getProjectApiVersion() {
        return VZ_ALPHA1_PROJECT_API_VERSION;
      }

      getIngressTraitApiVersion() {
        return VZ_ALPHA1_INGRESS_TRAIT_API_VERSION;
      }

      getLoggingTraitApiVersion() {
        return VZ_ALPHA1_LOGGING_TRAIT_API_VERSION;
      }

      getManualScalerTraitApiVersion() {
        return VZ_ALPHA1_MANUAL_SCALER_TRAIT_API_VERSION;
      }

      getMetricsTraitApiVersion() {
        return VZ_ALPHA1_METRICS_TRAIT_API_VERSION;
      }
    }

    return VerrazzanoHelper;
  }
);
