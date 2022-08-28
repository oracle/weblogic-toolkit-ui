/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which holds the Verrazzano component extra information (outside the k8s-domain-definition).
 *
 * Returns a constructor for the object.
 */
define(['utils/observable-properties', 'utils/validation-helper'],
  function(props, validationHelper) {
    return function (name, k8sDomain) {
      function VerrazzanoComponentModel() {
        this.componentName = props.createProperty('${1}', k8sDomain.uid.observable);
        this.componentName.addValidator(...validationHelper.getK8sNameValidators());

        this.configMapIsEmpty = () => {
          return k8sDomain.configMapIsEmpty();
        };

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

      return new VerrazzanoComponentModel();
    };
  }
);
