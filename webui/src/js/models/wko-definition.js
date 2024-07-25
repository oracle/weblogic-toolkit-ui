/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/observable-properties', 'utils/validation-helper'],
  function (props, validationHelper) {

    return function (name) {
      function WkoModel() {
        this.wkoDeployName = props.createProperty('weblogic-operator');

        this.k8sNamespace = props.createProperty('weblogic-operator-ns');
        this.k8sNamespace.addValidator(...validationHelper.getK8sNameValidators());

        this.k8sServiceAccount = props.createProperty('weblogic-operator-sa');
        this.k8sServiceAccount.addValidator(...validationHelper.getK8sNameValidators());

        this.versionTag = props.createProperty(window.api.ipc.invoke('get-latest-wko-version-number'));
        this.operatorImage = props.createProperty();
        const operatorImageValidators = validationHelper.getImageTagValidators();
        this.operatorImage.addValidator(...operatorImageValidators);

        this.operatorImagePullRequiresAuthentication = props.createProperty(false);
        this.operatorImagePullSecretName = props.createProperty();
        this.operatorImagePullSecretName.addValidator(...validationHelper.getK8sNameValidators());

        this.operatorImagePullUseExistingSecret = props.createProperty(true);

        this.operatorImagePullRegistryEmailAddress = props.createProperty();
        this.operatorImagePullRegistryEmailAddress.addValidator(...validationHelper.getEmailAddressValidators());

        this.operatorImagePullRegistryUsername = props.createProperty().asCredential();
        this.operatorImagePullRegistryPassword = props.createProperty().asCredential();
        this.operatorDomainNamespaceSelectionStrategy = props.createProperty('LabelSelector');
        // Note that this is only relevant if the strategy is set to 'LabelSelector'
        this.operatorDomainNamespaceSelector = props.createProperty('weblogic-operator=enabled');
        // Note this is only relevant if the strategy is set to 'List'
        this.operatorDomainNamespacesList = props.createArrayProperty([ 'default' ]);
        // Note that this is only relevant if the strategy is set to "RegExp'
        this.operatorDomainNamespaceRegex = props.createProperty('');
        this.operatorImagePullPolicy = props.createProperty('IfNotPresent');
        this.enableClusterRoleBinding = props.createProperty(false);
        this.externalRestEnabled = props.createProperty(false);

        this.externalRestHttpsPort = props.createProperty(31001);
        this.externalRestHttpsPort.addValidator(...validationHelper.getPortNumberValidators());

        this.externalRestIdentitySecret = props.createProperty();
        this.externalRestIdentitySecret.addValidator(...validationHelper.getK8sNameValidators());

        this.elkIntegrationEnabled = props.createProperty(false);
        this.logStashImage = props.createProperty('logstash:6.6.0');
        this.logStashImage.addValidator(...validationHelper.getImageTagValidators());

        this.elasticSearchHost = props.createProperty('elasticsearch.default.svc.cluster.local');
        this.elasticSearchHost.addValidator(...validationHelper.getHostNameValidators());

        this.elasticSearchPort = props.createProperty(9200);
        this.elasticSearchPort.addValidator(...validationHelper.getPortNumberValidators());

        this.javaLoggingLevel = props.createProperty('INFO');
        this.javaLoggingFileSizeLimit = props.createProperty(20000000);
        this.javaLoggingFileCount = props.createProperty(10);

        // Jet tables do not work if you allow changing the value used as the primary key so always add a uid...
        //
        this.nodeSelector = props.createListProperty(['uid', 'name', 'value']);

        this.helmTimeoutMinutes = props.createProperty(5);

        this.installedVersion = props.createProperty();

        // internal fields that should not be read or written to the project file.
        this.internal = {
          operatorImagePullRegistryAddress: props.createProperty()
        };

        // operatorImagePullRegistryAddress is always derived from operatorImage
        this.operatorImage.observable.subscribe(value => {
          let host;
          if (value && value.length > 0) {
            host = window.api.k8s.getRegistryAddressFromImageTag(value);
          }
          this.internal.operatorImagePullRegistryAddress.observable(host);
        });

        this.readFrom = function (json) {
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

      return new WkoModel();
    };
  }
);
