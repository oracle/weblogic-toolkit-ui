/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which defines the configuration of kubectl.
 *
 * Returns a constructor for the object.
 */
define(['utils/observable-properties'],
  function (props) {
    /**
     * The object constructor.
     */
    return function (name) {
      return {
        k8sFlavor: props.createProperty('OKE'),
        kubeConfig: props.createArrayProperty(() => {
          const kubeConfig = window.api.k8s.getKubeConfig();
          if (kubeConfig) {
            if (Array.isArray(kubeConfig)) {
              return kubeConfig;
            } else {
              return [ kubeConfig ];
            }
          }
          return [];
        }),
        executableFilePath: props.createProperty(window.api.k8s.getKubectlFilePath()),
        kubeConfigContextToUse: props.createProperty(),
        helmExecutableFilePath: props.createProperty(window.api.k8s.getHelmFilePath()),
        extraPathDirectories: props.createListProperty(['value']),

        readFrom: function(json) {
          props.createGroup(name, this).readFrom(json);
        },

        writeTo: function (json) {
          props.createGroup(name, this).writeTo(json);
        },

        isChanged: function() {
          return props.createGroup(name, this).isChanged();
        },

        setNotChanged: function() {
          props.createGroup(name, this).setNotChanged();
        }
      };
    };
  }
);
