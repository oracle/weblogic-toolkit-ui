/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/observable-properties'],
  function (props) {

    return function(name) {
      function ProjectSettingsModel() {
        // Question-related fields
        this.credentialStorePolicy = props.createProperty('native');

        this.targetDomainLocation = props.createProperty('mii');
        this.wdtTargetType = props.createProperty('wko');

        window.api.ipc.send('set-target-type', this.wdtTargetType.value);
        this.wdtTargetType.observable.subscribe(targetType => {
          window.api.ipc.send('set-target-type', targetType);
        });

        this.javaHome = props.createProperty(window.api.ipc.invoke('get-java-home'));
        this.oracleHome = props.createProperty(window.api.ipc.invoke('get-oracle-home'));

        this.builderType = props.createProperty('docker');
        this.builderExecutableFilePath = props.createProperty((builderType) => {
          switch (builderType()) {
            case 'docker':
              return window.api.k8s.getDockerFilePath();

            case 'podman':
              return window.api.k8s.getPodmanFilePath();

            default:
              return undefined;
          }
        }, this.builderType.observable);

        this.readFrom = function(json) {
          props.createGroup(name, this).readFrom(json);
        };

        this.writeTo = function (json) {
          props.createGroup(name, this).writeTo(json);
        };

        this.isChanged = () => {
          return props.createGroup(name, this).isChanged();
        };

        this.setNotChanged = () => {
          props.createGroup(name, this).setNotChanged();
        };
      }
      return new ProjectSettingsModel();
    };
  }
);
