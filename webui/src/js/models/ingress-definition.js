/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which defines creation of Ingress Controller in the Kubernetes Cluster.
 *
 * Returns a constructor for the object.
 */
define(['knockout', 'utils/observable-properties', 'utils/validation-helper'],
  function (ko, props, validationHelper) {
    /**
     * The object constructor.
     */
    return function (name) {
      function Ingress() {
        this.installIngressController = props.createProperty(false);
        this.ingressControllerProvider = props.createProperty('traefik');
        this.ingressControllerNamespace = props.createProperty('${1}-ns', this.ingressControllerProvider.observable);
        this.ingressControllerNamespace.addValidator(...validationHelper.getK8sNameValidators());

        // This is the Helm release name
        this.ingressControllerName = props.createProperty('${1}-operator', this.ingressControllerProvider.observable);
        this.ingressControllerName.addValidator(...validationHelper.getK8sNameValidators());

        this.ingressTLSCertFile = props.createProperty('');
        this.ingressTLSKeyFile = props.createProperty('');
        this.dockerRegSecretName = props.createProperty('dockerhub');
        this.dockerRegSecretName.addValidator(...validationHelper.getK8sNameValidators());

        this.dockerRegSecretUserId = props.createProperty('').asCredential();
        this.dockerRegSecretUserPwd = props.createProperty('').asCredential();
        this.dockerRegSecretUserEmail = props.createProperty('');
        this.dockerRegSecretUserEmail.addValidator(...validationHelper.getEmailAddressValidators());

        this.createDockerRegSecret = props.createProperty(false);
        this.specifyDockerRegSecret = props.createProperty(false);
        this.specifyIngressTLSSecret = props.createProperty(false);

        this.helmTimeoutMinutes = props.createProperty(5);
        this.ingressServiceType = props.createProperty('LoadBalancer');

        this.ingressRouteKeys = [
          'uid', 'name', 'virtualHost', 'targetServiceNameSpace', 'targetService', 'targetPort',
          'path', 'annotations', 'accessPoint', 'tlsOption', 'markedForDeletion', 'isConsoleService'
        ];
        this.ingressRoutes = props.createListProperty(this.ingressRouteKeys).persistByKey('uid');

        this.opensslExecutableFilePath =  props.createProperty(window.api.k8s.getOpenSSLFilePath());

        this.validators = {
          targetPortValidator: validationHelper.getPortNumberValidators(),
          k8sNameValidator: validationHelper.getK8sNameValidators(),
          virtualHostNameValidator: validationHelper.getHostNameValidators(),
          ingressPathValidator: validationHelper.getIngressPathValidators()
        };

        this.voyagerProvider = props.createProperty('OKE');
        this.createTLSSecret = props.createProperty(false);
        this.ingressTLSSecretName = props.createProperty('');
        this.ingressTLSSecretName.addValidator(...validationHelper.getK8sNameValidators());
        this.allowNginxSSLPassThrough = props.createProperty(false);
        this.generateTLSFiles = props.createProperty(false);
        this.ingressTLSSubject = props.createProperty('');

        this.voyagerProviderMappedValue = (value) => {
          const map = { 'OKE': 'baremetal', 'AKS': 'aks', 'AWS': 'aws', 'GKE': 'gke', 'K8S': 'baremetal', 'MKB': 'minikube',
            'KND': 'baremetal'};
          return map[value];
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

        this.ingressRoutesConfigured = ko.computed(() => {
          return (this.ingressRoutes.observable().length > 0);
        });
      }


      return new Ingress();
    };
  });
