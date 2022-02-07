/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/ingress-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/k8s-helper', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/ingress-resource-generator',
  'utils/wkt-logger'],
function(IngressActionsBase, project, wktConsole, k8sHelper, i18n, projectIo, dialogHelper, validationHelper,
  IngressResourceGenerator, wktLogger) {
  class IngressRoutesUpdater extends IngressActionsBase {
    constructor() {
      super();
      this.ingressResourceGenerator = new IngressResourceGenerator();
    }

    async startIngressRoutesUpdate() {
      await this.executeAction(this.callIngressRoutesUpdate);
    }

    async callIngressRoutesUpdate(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('ingress-routes-updater-update-aborted-error-title');
      let errPrefix = 'ingress-routes-updater';
      const creatingRoutes = this.project.ingress.ingressRoutes.value.length > 0;
      const creatingTlsSecret = this.project.ingress.specifyIngressTLSSecret.value &&
        this.project.ingress.createTLSSecret.value;

      if (!creatingRoutes && !creatingTlsSecret) {
        const message = i18n.t('ingress-routes-updater-not-update-message');
        await window.api.ipc.invoke('show-info-message', errTitle, message);
        return Promise.resolve(true);
      }

      const validatableObject = this.getValidatableObject('flow-update-ingress-route-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = creatingRoutes ? 8.0 + this.project.ingress.ingressRoutes.value.length : 6.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);

        const kubectlExe = k8sHelper.getKubectlExe();
        if (!options.skipKubectlExeValidation) {
          if (! await this.validateKubectlExe(kubectlExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        const openSSLExe = this.project.ingress.opensslExecutableFilePath.value;
        if (creatingTlsSecret) {
          if (this.project.ingress.generateTLSFiles.value) {
            // If generating the TLS certificate and key files, validate openssl executable.
            busyDialogMessage = i18n.t('flow-validate-openssl-exe-in-progress');
            dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
            if (!options.skipOpenSSLValidation) {
              if (!await this.validateOpenSSLExe(openSSLExe, errTitle, errPrefix)) {
                return Promise.resolve(false);
              }
            }
          } else {
            // If not generating the TLS certificate and key files, validate that the certificate and key files exist.
            busyDialogMessage = i18n.t('flow-validate-tls-secret-files-in-progress');
            dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
            if (! await this.validateTLSFiles(errTitle)) {
              return Promise.resolve(false);
            }
          }
        }

        // While technically not required, we force saving the project for Go Menu item behavior consistency.
        //
        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        const kubectlContext = k8sHelper.getKubectlContext();
        const kubectlOptions = k8sHelper.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          if (! await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // Best effort sanity check to see if ingress controller has been installed
        // If user install their own ingress controller then we are not going to scan all namespaces for
        // controller to verify it.
        //
        busyDialogMessage = i18n.t('ingress-routes-updater-check-ingress-service-exists');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);
        if (this.project.ingress.installIngressController.value === true) {
          if (!options.skipIngressControllerValidation) {
            const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;
            const ingressControllerName = this.project.ingress.ingressControllerName.value;
            const ingressControllerNamespace = this.project.ingress.ingressControllerNamespace.value;

            const results = await this.doesIngressServiceExist(kubectlExe, kubectlOptions, ingressControllerProvider,
              ingressControllerName, ingressControllerNamespace, errTitle);
            if (!results) {
              return Promise.resolve(false);
            }
          }
        }

        busyDialogMessage = i18n.t('ingress-routes-updater-create-tls-secret-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 5/totalSteps);
        if (creatingTlsSecret) {
          const generating = this.project.ingress.generateTLSFiles.value;
          const tlsKeyFile = generating ? 'tls1.key' : this.project.ingress.ingressTLSKeyFile.value;
          const tlsCertFile = generating ? 'tls1.crt' : this.project.ingress.ingressTLSCertFile.value;

          if (generating) {
            // Generate TLS files with openssl
            const subject = this.project.ingress.ingressTLSSubject.value;
            if (! await this.generateTLSFiles(openSSLExe, tlsCertFile, tlsKeyFile, subject, errTitle)) {
              return Promise.resolve(false);
            }
          }

          const tlsSecretName = this.project.ingress.ingressTLSSecretName.value;
          const domainNamespace = this.project.k8sDomain.kubernetesNamespace.value;
          const result = await this.createTLSSecret(kubectlExe, kubectlOptions, tlsSecretName, domainNamespace,
            tlsCertFile, tlsKeyFile, errTitle, errPrefix);
          if (!result) {
            return Promise.resolve(false);
          }
        }

        if (creatingRoutes) {
          busyDialogMessage = i18n.t('ingress-routes-updater-check-existing-routes-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 6/totalSteps);

          const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;
          const ingressControllerNamespace = this.project.ingress.ingressControllerNamespace.value;
          const routes = this.project.ingress.ingressRoutes.observable();

          let overlappingRoutes;
          let k8sClusterAddress;
          try {
            k8sClusterAddress = await this._getK8sClusterAddress(kubectlExe, kubectlOptions);
            overlappingRoutes = await this.getOverlappingRoutes(kubectlExe, kubectlOptions,
              ingressControllerProvider, this.project.k8sDomain.kubernetesNamespace.value, routes);
          } catch (err) {
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, err.message);
            return Promise.resolve(false);
          }

          if (overlappingRoutes) {
            const promptTitle = i18n.t('ingress-routes-updater-already-exists-title');
            const promptQuestion = i18n.t('ingress-routes-updater-routes-prompt-question', { routes: overlappingRoutes });
            dialogHelper.closeBusyDialog();
            const promptOverwriteRoutes =
              await window.api.ipc.invoke('yes-or-no-prompt', promptTitle, promptQuestion);
            if (!promptOverwriteRoutes) {
              return Promise.resolve(true);
            }
            dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
            dialogHelper.updateBusyDialog(busyDialogMessage, 6/totalSteps);
          }

          // Check for routes that incorrectly specify the target service/port.
          busyDialogMessage = i18n.t('ingress-routes-updater-check-route-target-service-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 7/totalSteps);
          for (const route of routes) {
            if (! await this.checkTargetService(kubectlExe, route, kubectlOptions)) {
              return Promise.resolve(false);
            }
          }

          let step = 8;
          for (const route of routes) {

            // Potentially we can make the TLSSecretName part of the ingressRoutes data instead of TLSEnabled
            // Currently UI for tls secret is created/assumed in the same namespace of the domain to avoid too many
            // inputs and handling another table.  Once we moved to dialog format, then this can be accomplished.
            //
            if (route['tlsOption'] === 'ssl_terminate_ingress') {
              route['tlsSecretName'] = this.project.ingress.ingressTLSSecretName.value;
            }
            let ingressRouteData = {};

            switch (ingressControllerProvider) {
              case 'traefik':
                ingressRouteData = this.ingressResourceGenerator.createTraefikRoutesAsYaml(route);
                break;

              case 'nginx':
                ingressRouteData = this.ingressResourceGenerator.createNginxRoutesAsYaml(route);
                break;

              case 'voyager':
                // This creates a one to one corresponding service with each ingress.
                // The node port is randomly generated and can be looked up in k get services.
                // note:  Each route can specify a unique node port value in the rule (per route)
                // but it's not in the annotations and this is only specific to voyager.
                // User can change the annotations. It is added to the annotations in the UI
                // by default.
                //
                // ingress.appscode.com/type: NodePort
                ingressRouteData = this.ingressResourceGenerator.createVoyagerRoutesAsYaml(route);
                break;
            }

            busyDialogMessage = i18n.t('ingress-routes-updater-update-route-in-progress', { routeName: route['name']});
            dialogHelper.updateBusyDialog(busyDialogMessage, step/totalSteps);
            const ingressRouteResult =
              await (window.api.ipc.invoke('k8s-apply', kubectlExe, ingressRouteData, kubectlOptions));
            if (ingressRouteResult.isSuccess) {
              // When the provider is voyager then each ingress route has its own service.
              // In other case when the namespace is not defined (e.g. user env already had the controller installed)
              // then we don't know which namespace to query the nginx/traefik singleton service to determine the
              // access point.
              if (ingressControllerNamespace !== '' || ingressControllerProvider === 'voyager') {
                const serviceDetail = await this.getIngressServiceDetails(kubectlExe, ingressControllerProvider,
                  this.project.ingress.ingressControllerNamespace.value,
                  route, k8sClusterAddress, kubectlOptions);

                if (serviceDetail.isSuccess) {
                  route['accessPoint'] = serviceDetail.accessPoint;
                  this.project.ingress.ingressRoutes.observable.replace(route, route);
                } else {
                  route['accessPoint'] = 'Route has been created but cannot determine access point at the moment';
                }
              }
            } else {
              errTitle = i18n.t('ingress-routes-updater-update-route-failed-title');
              const errMessage = i18n.t('ingress-routes-updater-update-route-failed-error-message',
                { routeName: route['name'], error:ingressRouteResult.reason });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
            step++;
          }
          dialogHelper.closeBusyDialog();

          const title = i18n.t('ingress-routes-updater-update-routes-complete-title');
          const message = i18n.t('ingress-routes-updater-update-routes-complete-message');
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          dialogHelper.closeBusyDialog();
        }
        return Promise.resolve(true);
      } catch(err) {
        dialogHelper.closeBusyDialog();
        return Promise.reject(err);
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const ingressFormConfig = validationObject.getDefaultConfigObject();
      ingressFormConfig.formName = 'ingress-design-form-name';

      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-form-name';
      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);
      validationObject.addField('kubectl-helm-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.helmExecutableFilePath.value), kubectlFormConfig);

      validationObject.addField('ingress-design-ingress-provider-label',
        validationHelper.validateRequiredField(this.project.ingress.ingressControllerProvider.value), ingressFormConfig);

      if (this.project.ingress.specifyIngressTLSSecret.value === true) {
        validationObject.addField('ingress-design-tls-secret-name-label',
          this.project.ingress.ingressTLSSecretName.validate(true), ingressFormConfig);

        if (this.project.ingress.createTLSSecret.value === true) {
          if (this.project.ingress.generateTLSFiles.value === true) {
            validationObject.addField('ingress-design-openssl-exe-file-path-label',
              validationHelper.validateRequiredField(this.project.ingress.opensslExecutableFilePath.value), ingressFormConfig);
            validationObject.addField('ingress-design-generate-tls-subject-label',
              validationHelper.validateRequiredField(this.project.ingress.ingressTLSSubject.value), ingressFormConfig);
          } else {
            validationObject.addField('ingress-design-ingress-tlskeyfile-label',
              validationHelper.validateRequiredField(this.project.ingress.ingressTLSKeyFile.value), ingressFormConfig);
            validationObject.addField('ingress-design-ingress-tlscertfile-label',
              validationHelper.validateRequiredField(this.project.ingress.ingressTLSCertFile.value), ingressFormConfig);
          }
        }
      }

      for (const route of this.project.ingress.ingressRoutes.value) {
        this._checkIngressData(route, validationObject, this.project.ingress.specifyIngressTLSSecret.value);
      }
      return validationObject;
    }

    async validateTLSFiles(errTitle) {
      const tlsCertFile = this.project.ingress.ingressTLSCertFile.value;
      const tlsKeyFile = this.project.ingress.ingressTLSKeyFile.value;

      try {
        if (!await this._validateTLSFile(tlsCertFile)) {
          const errMessage = i18n.t('ingress-routes-updater-tls-cert-invalid-error-message', {file: tlsCertFile});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        } else if (!await this._validateTLSFile(tlsKeyFile)) {
          const errMessage = i18n.t('ingress-routes-updater-tls-key-invalid-error-message', {file: tlsKeyFile});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async doesIngressServiceExist(kubectlExe, kubectlOptions, provider, name, namespace, errTitle) {
      try {
        const serviceName = provider === 'nginx' ? `${name}-ingress-nginx-controller` : name;
        const result = await window.api.ipc.invoke('k8s-get-service-details', kubectlExe, namespace,
          serviceName, kubectlOptions);
        if (!result.isSuccess) {
          const errMessage = i18n.t('ingress-routes-updater-service-not-installed-error-message', {
            error: result.reason,
            serviceName: serviceName,
            name: name,
            namespace: namespace
          });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async generateTLSFiles(openSSLExe, tlsCertFile, tlsKeyFile, subject, errTitle) {
      try {
        const results =
          await window.api.ipc.invoke('openssl-generate-certs', openSSLExe, tlsKeyFile, tlsCertFile, subject);
        if (!results.isSuccess) {
          const errMessage = i18n.t('ingress-routes-updater-generate-tls-files-error-message', { error: results.reason });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async getOverlappingRoutes(kubectlExe, kubectlOptions, provider, namespace, routes) {
      try {
        let existingRouteList = [];
        const results =
          await this.getIngresses(kubectlExe, provider, namespace, kubectlOptions);
        if (!results.isSuccess) {
          const errMessage = i18n.t('ingress-routes-updater-get-ingresses-error-message',
            { namespace: namespace, error: results.reason});
          throw new Error(errMessage);
        }
        for (const route of routes) {
          results.serviceDetails.items.map( item => {
            if (item.metadata.name === route['name']) {
              existingRouteList.push(route['name']);
            }
          });
          if (results.serviceTCPDetails) {
            results.serviceTCPDetails.items.map( item => {
              if (item.metadata.name === route['name']) {
                existingRouteList.push(route['name']);
              }
            });
          }
        }
        return Promise.resolve(existingRouteList.length > 0 ? existingRouteList : false);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    async _getK8sClusterAddress(kubectlExe, kubectlOptions) {
      let clusterAddress;
      const results = await window.api.ipc.invoke('k8s-get-k8s-cluster-info', kubectlExe, kubectlOptions);
      if (results.isSuccess) {
        // Get the first line of kubectl cluster-info and parse the control pane url
        const controlPaneLine = results.clusterInfo.split('\n', 1)[0];
        const tokens = controlPaneLine.split(' ');
        clusterAddress = tokens[tokens.length - 1].split(':')[1];
      } else {
        const errMessage =
          i18n.t('ingress-routes-updater-get-k8s-cluster-address-error-message', { error: results.reason });
        return Promise.reject(new Error(errMessage));
      }
      return Promise.resolve(clusterAddress);
    }

    async getIngressServiceDetails(kubectlExe, ingressControllerProvider, ingressControllerNamespace,
      ingressDefinition, k8sCluster, kubectlOptions) {
      // serviceName == '' for Nginx and Traefik for all ingress routes created by the UI
      // serviceName = 'voyager-<ingress route name>' for each ingress route if it's provider is
      // voyagerProviderMappedValue is baremetal

      let serviceName = '';
      if (ingressControllerProvider === 'voyager') {
        serviceName = 'voyager-' + ingressDefinition.name;
        ingressControllerNamespace = ingressDefinition.targetServiceNameSpace;
      }

      const results = await window.api.ipc.invoke('k8s-get-service-details',
        kubectlExe, ingressControllerNamespace, serviceName, kubectlOptions);
      wktLogger.debug('k8s-get-service-details for service %s returned: %s', serviceName,
        JSON.stringify(results, 0, null));
      if (results.isSuccess) {
        let ingressPlainPort = 80;
        let ingressSSLPort = 443;
        let useNodePort = false;
        let externalLoadBalancerHost = '';
        let serviceDetail;
        if (ingressControllerProvider === 'voyager') {
          serviceDetail = results.serviceDetails;
        } else {
          // For traefik and nginx since we use get services without a name,
          // find the service that has type load balancer to determine the standard ports
          //
          let found = false;
          for (const item of results.serviceDetails.items) {
            if (item.spec['type'] === 'LoadBalancer') {
              serviceDetail = item;
              found = true;
              break;
            }
          }
          if (!found) {
            results['accessPoint'] = 'Cannot be determined at the moment';
            return Promise.resolve(results);
          }
        }
        // For Voyager it may be a nodepot service if the voyagerProvider is 'baremetal'
        if (serviceDetail.spec['type'] === 'LoadBalancer' ||
          (ingressControllerProvider === 'voyager' && serviceDetail.spec['type'] === 'NodePort')) {
          if ('loadBalancer' in serviceDetail.status) {
            if (JSON.stringify(serviceDetail.status.loadBalancer) === '{}') {
              useNodePort = true;
              if (typeof k8sCluster === 'undefined' || k8sCluster === '') {
                externalLoadBalancerHost = '//<k8s cluster address>';
              } else {
                externalLoadBalancerHost = k8sCluster;
              }
            } else {
              let foundIngress = false;
              if ('ingress' in serviceDetail.status.loadBalancer) {
                const ing0 = serviceDetail.status.loadBalancer.ingress[0];
                if ('hostname' in ing0 ) {
                  externalLoadBalancerHost = '//' + ing0.hostname;
                  foundIngress = true;
                } else if ('ip' in ing0) {
                  externalLoadBalancerHost = '//' + ing0.ip;
                  foundIngress = true;
                }
              }

              if (!foundIngress) {
                // should never happen, just incase.
                if (typeof k8sCluster === 'undefined' || k8sCluster === '') {
                  externalLoadBalancerHost = '//<k8s cluster address>';
                } else {
                  externalLoadBalancerHost = k8sCluster;
                }
              }
            }
          }

          if (useNodePort === true) {
            serviceDetail.spec['ports'].forEach((port) => {
              // use standard ports to decide what it is
              // if user has its own ingress installed and not using standard ports then
              // it will fail
              if (port.port === 80) {
                ingressPlainPort = port['nodePort'];
              }
              if (port.port === 443) {
                ingressSSLPort = port['nodePort'];
              }
            });
          }
        }

        if (ingressDefinition['virtualHost']) {
          externalLoadBalancerHost = '//' + ingressDefinition['virtualHost'];
        }

        if (useNodePort) {
          if (ingressDefinition['tlsOption'] !== 'plain') {
            results['accessPoint'] = 'https:' + externalLoadBalancerHost + ':' + ingressSSLPort  + ingressDefinition.path;
          } else {
            results['accessPoint'] = 'http:' + externalLoadBalancerHost + ':' + ingressPlainPort  + ingressDefinition.path;
          }
        } else {
          if (ingressDefinition['tlsOption'] !== 'plain') {
            results['accessPoint'] = 'https:' + externalLoadBalancerHost + ingressDefinition.path;
          } else {
            results['accessPoint'] = 'http:' + externalLoadBalancerHost +  ingressDefinition.path;
          }
        }
        wktLogger.debug('getIngressServiceDetails() returning accessPoint: %s', results['accessPoint']);
      }
      return Promise.resolve(results);
    }

    async getIngresses(kubectlExe, ingressControllerProvider, namespace, kubectlOptions) {
      let serviceType = 'Ingress';
      if (ingressControllerProvider === 'traefik') {
        serviceType = 'IngressRoute';
      }

      const results = await window.api.ipc.invoke('k8s-get-ingresses',
        kubectlExe, namespace, serviceType, kubectlOptions);

      if (results.isSuccess && ingressControllerProvider === 'traefik') {
        serviceType = 'IngressRouteTCP';
        const resultsTCP = await window.api.ipc.invoke('k8s-get-ingresses',
          kubectlExe, namespace, serviceType, kubectlOptions);
        if (resultsTCP.isSuccess) {
          results.serviceTCPDetails = resultsTCP.serviceDetails;
        } else {
          return Promise.resolve(resultsTCP);
        }

      }

      return Promise.resolve(results);
    }

    async checkTargetService(kubectlExe, ingressDefinition, kubectlOptions, errTitle) {
      const results = await window.api.ipc.invoke('k8s-get-service-details',
        kubectlExe, ingressDefinition.targetServiceNameSpace, ingressDefinition.targetService, kubectlOptions);

      if (results.isSuccess) {
        const serviceDetail = results.serviceDetails;
        let found = false;
        serviceDetail.spec['ports'].forEach((port) => {
          if (Number(port.port) === Number(ingressDefinition.targetPort)) {
            found = true;
          }
        });

        if (!found) {
          const errMessage = i18n.t('ingress-routes-updater-route-target-port-not-exists-error-message', {
            name: ingressDefinition['name'],
            targetPort: ingressDefinition['targetPort']
          });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } else {
        const errMessage = i18n.t('ingress-routes-updater-route-target-service-not-exists-error-message', {
          name: ingressDefinition['name'],
          targetService: ingressDefinition['targetService'],
          error:results.reason
        });
        dialogHelper.closeBusyDialog();
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    }

    async _validateTLSFile(file) {
      let exists = false;
      try {
        if (file) {
          exists = await window.api.ipc.invoke('verify-file-exists', file);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(exists);
    }

    _checkIngressData(data, validationObject, tlsSecretSpecified) {
      const routeConfig = validationObject.getDefaultConfigObject();
      routeConfig.formName = 'ingress-design-form-name';
      routeConfig.fieldNameIsKey = false;

      const items = ['name', 'targetServiceNameSpace', 'targetService', 'targetPort', 'path', 'virtualHost'];
      let errFieldMessage;

      items.forEach(attribute => {
        let validators;
        let isRequired = true;
        switch (attribute) {
          case 'name':
            errFieldMessage = i18n.t('ingress-design-ingress-route-name-field-validation-error', { routeName: data['name'] });
            validators = this.project.ingress.validators.k8sNameValidator;
            break;

          case 'targetServiceNameSpace':
            errFieldMessage = i18n.t('ingress-design-ingress-route-field-validation-error', {
              routeName: data['name'],
              fieldName: i18n.t('ingress-design-ingress-route-targetservicenamespace-label')
            });
            validators = this.project.ingress.validators.k8sNameValidator;
            break;

          case 'targetService':
            errFieldMessage = i18n.t('ingress-design-ingress-route-field-validation-error', {
              routeName: data['name'],
              fieldName: i18n.t('ingress-design-ingress-route-targetservice-label')
            });
            validators = this.project.ingress.validators.k8sNameValidator;
            break;

          case 'targetPort':
            errFieldMessage = i18n.t('ingress-design-ingress-route-field-validation-error', {
              routeName: data['name'],
              fieldName: i18n.t('ingress-design-ingress-route-targetport-label')
            });
            validators = this.project.ingress.validators.targetPortValidator;
            break;

          case 'path':
            errFieldMessage = i18n.t('ingress-design-ingress-route-field-validation-error', {
              routeName: data['name'],
              fieldName: i18n.t('ingress-design-ingress-route-path-label')
            });
            validators = this.project.ingress.validators.ingressPathValidator;
            break;

          case 'virtualHost':
            errFieldMessage = i18n.t('ingress-design-ingress-route-field-validation-error', {
              routeName: data['name'],
              fieldName: i18n.t('ingress-design-ingress-route-virtualhost-label')
            });
            validators = this.project.ingress.validators.virtualHostNameValidator;
            isRequired = false;
            break;
        }
        validationObject.addField(errFieldMessage,
          validationHelper.validateField(validators, data[attribute], isRequired), routeConfig);
      });

      if (data['tlsOption'] === 'ssl_terminate_ingress' && !tlsSecretSpecified) {
        errFieldMessage = i18n.t('ingress-design-ingress-route-field-validation-error', {
          routeName: data['name'],
          fieldName: i18n.t('ingress-design-ingress-route-tls-label')
        });
        const errMessage = i18n.t('ingress-design-ingress-route-field-tls-config-error', {
          routeName: data['name'],
          tlsOption: i18n.t('ingress-design-ingress-route-tlsoption-ssl-terminate-ingress'),
          fieldName: i18n.t('ingress-design-ingress-route-tls-label'),
          specifyTlsSecretFieldName: i18n.t('ingress-design-specify-tls-secret-label')
        });
        validationObject.addField(errFieldMessage, errMessage, routeConfig);
      }

      if (data['tlsOption'] === 'ssl_passthrough' && !data['virtualHost']) {
        errFieldMessage = i18n.t('ingress-design-ingress-route-field-validation-error', {
          routeName: data['name'],
          fieldName: i18n.t('ingress-design-ingress-route-virtualhost-label')
        });
        const errMessage = i18n.t('ingress-design-ingress-route-field-tls-config-passthrough-error', {
          routeName: data['name'],
          tlsOption: i18n.t('ingress-design-ingress-route-tlsoption-ssl-passthrough'),
          fieldName: i18n.t('ingress-design-ingress-route-virtualhost-label'),
          virtualHostFieldName: i18n.t('ingress-design-ingress-route-virtualhost-label')
        });
        validationObject.addField(errFieldMessage, errMessage, routeConfig);
      }

    }
  }

  return new IngressRoutesUpdater();
});
