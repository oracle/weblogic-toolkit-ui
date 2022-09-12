/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which defines installation of Verrazzano.
 *
 * Returns a constructor for the object.
 */
define(['utils/observable-properties'],
  function(props) {
    return function (name) {
      function VerrazzanoInstallModel() {
        this.versionTag = props.createProperty();
        this.installationName = props.createProperty('example-verrazzano');
        this.installationProfile = props.createProperty('dev');
        this.actualInstalledVersion = props.createProperty();
        this.installJaeger = props.createProperty(false);
        this.istioSamplingRate = props.createProperty(1);

        this.readFrom = (json) => {
          props.createGroup(name, this).readFrom(json);
        };

        this.writeTo = (json) => {
          props.createGroup(name, this).writeTo(json);
        };

        this.isChanged = () => {
          return props.createGroup(name, this).isChanged();
        };

        this.setNotChanged = () => {
          props.createGroup(name, this).setNotChanged();
        };
      }
      return new VerrazzanoInstallModel();
    };
  }
);
