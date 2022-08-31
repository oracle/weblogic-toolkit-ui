/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/observable-properties', 'utils/validation-helper', 'utils/wkt-logger'],
  function(props, validationHelper, wktLogger) {
    return function (name, k8sDomain, image, settings) {
      function VerrazzanoApplicationModel() {
        this.applicationName = props.createProperty('${1}-app', k8sDomain.uid.observable);
        this.applicationName.addValidator(...validationHelper.getK8sNameValidators());
        this.useMultiClusterApplication = props.createProperty(false);
        this.placementClusters = props.createArrayProperty(['local']);

        this.computeDefaultSecrets = () => {
          const defaultSecretNames = [];
          if (k8sDomain.imageRegistryPullRequireAuthentication.value && k8sDomain.imageRegistryPullSecretName.value) {
            defaultSecretNames.push(k8sDomain.imageRegistryPullSecretName.value);
          }

          if (image.useAuxImage && k8sDomain.auxImageRegistryPullRequireAuthentication.value && k8sDomain.auxImageRegistryPullSecretName.value) {
            defaultSecretNames.push(k8sDomain.auxImageRegistryPullSecretName.value);
          }

          if (k8sDomain.credentialsSecretName.value) {
            defaultSecretNames.push(k8sDomain.credentialsSecretName.value);
          }

          if (settings.targetDomainLocation.value === 'mii') {
            if (k8sDomain.runtimeSecretName.value) {
              defaultSecretNames.push(k8sDomain.runtimeSecretName.value);
            }

            const domainSecrets = k8sDomain.secrets.value;
            if (Array.isArray(domainSecrets) && domainSecrets.length > 0) {
              const domainSecretNames = domainSecrets.map(domainSecret => domainSecret.name);
              defaultSecretNames.push(...domainSecretNames);
            }
          }

          return defaultSecretNames;
        };

        this.secrets = props.createArrayProperty(this.computeDefaultSecrets());

        this.componentKeys = [ 'name', 'ingressTraitEnabled', 'ingressTraitSecretName, ingressTraitRules',
          'manualScalerTraitEnabled', 'manualScalerTraitReplicaCount', 'metricsTraitEnabled',
          'metricsTraitHttpPort', 'metricsTraitHttpPath', 'metricsTraitSecret', 'metricsTraitDeployment',
          'loggingTraitEnabled', 'loggingTraitImage', 'loggingTraitConfiguration' ];
        this.components = props.createListProperty(this.componentKeys).persistByKey('name');

        this.readFrom = (json) => {
          props.createGroup(name, this).readFrom(json);
        };

        this.writeTo = (json) => {
          wktLogger.debug('writeTo sees components = %s', JSON.stringify(this.components.value));
          props.createGroup(name, this).writeTo(json);
          wktLogger.debug('writeTo returning json = %s', JSON.stringify(json));
        };

        this.isChanged = () => {
          return props.createGroup(name, this).isChanged();
        };

        this.setNotChanged = () => {
          props.createGroup(name, this).setNotChanged();
        };
      }

      return new VerrazzanoApplicationModel();
    };
  }
);
