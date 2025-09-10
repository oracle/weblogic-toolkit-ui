/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/observable-properties', 'utils/validation-helper', 'utils/wkt-logger'],
  function(props, validationHelper) {
    return function (name, k8sDomain) {
      function VerrazzanoApplicationModel() {
        let componentChanged = false;

        this.applicationName = props.createProperty('${1}-app', k8sDomain.uid.observable);
        this.applicationName.addValidator(...validationHelper.getK8sNameValidators());
        this.applicationVersion = props.createProperty();
        this.applicationDescription = props.createProperty();

        this.useMultiClusterApplication = props.createProperty(false);
        this.createProject = props.createProperty(false);
        this.projectName = props.createProperty('${1}', this.applicationName.observable);
        this.projectName.addValidator(...validationHelper.getK8sNameValidators());

        this.placementClusters = props.createArrayProperty(['local']);
        this.secrets = props.createArrayProperty();

        this.componentKeys = [ 'name', 'ingressTraitEnabled', 'ingressTraitSecretName', 'ingressTraitRules',
          'manualScalerTraitEnabled', 'manualScalerTraitReplicaCount', 'metricsTraitEnabled',
          'metricsTraitHttpPort', 'metricsTraitHttpPath', 'metricsTraitSecretName', 'metricsTraitDeploymentName',
          'loggingTraitEnabled', 'loggingTraitImage', 'loggingTraitConfiguration' ];
        this.components = props.createListProperty(this.componentKeys).persistByKey('name');

        this.readFrom = (json) => {
          props.createGroup(name, this).readFrom(json);
        };

        this.writeTo = (json) => {
          props.createGroup(name, this).writeTo(json);
        };

        this.isChanged = () => {
          if(componentChanged) {
            return true;
          }

          return props.createGroup(name, this).isChanged();
        };

        this.setNotChanged = () => {
          componentChanged = false;
          props.createGroup(name, this).setNotChanged();
        };

        this.componentChanged = () => {
          componentChanged = true;
        };
      }

      return new VerrazzanoApplicationModel();
    };
  }
);
