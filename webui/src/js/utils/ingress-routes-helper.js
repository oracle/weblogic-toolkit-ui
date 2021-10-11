/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/k8s-helper', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/ingress-resource-generator', 'utils/wkt-logger'],
function(project, wktConsole, k8sHelper, i18n, projectIo, dialogHelper, validationHelper, IngressResourceGenerator, wktLogger) {
  function IngressInstaller() {
    this.project = project;
    this.ingressResourceGenerator = new IngressResourceGenerator();

    this.startIngressRoutesUpdate = async () => {
      return this.startIngressRoutes();
    };

    this.startIngressRoutes = async (options) => {
      if (!options) {
        options = {};
      }
      const ingressRoutesArrayLength = this.project.ingress.ingressRoutes.value.length;

      if (ingressRoutesArrayLength === 0 && this.project.ingress.createTLSSecret.value === false) {
        const title = i18n.t('ingress-installer-routes-update-complete-title');
        const message = i18n.t('ingress-installer-routes-update-noaction-message');
        await window.api.ipc.invoke('show-info-message', title, message);
        return Promise.resolve(true);
      }

      const validatableObject = this.getValidatableObject('flow-update-ingress-route-name');
      if (validatableObject.hasValidationErrors()) {
        const errTitle = i18n.t('ingress-installer-create-ingress-route-error-title');
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 8.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);

        let errTitle = i18n.t('ingress-installer-aborted-error-title');
        const kubectlExe = k8sHelper.getKubectlExe();
        if (!options.skipKubectlExeValidation) {
          const exeResults = await window.api.ipc.invoke('validate-kubectl-exe', kubectlExe);
          if (!exeResults.isValid) {
            const errMessage = i18n.t('wko-installer-kubectl-exe-invalid-error-message', {error: exeResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-validate-openssl-exe-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        const openSSLExe = this.project.ingress.opensslExecutableFilePath.value;
        if (!options.skipOpenSSLValidation) {
          const exeResults = await window.api.ipc.invoke('validate-openssl-exe', openSSLExe);
          if (!exeResults.isValid) {
            const errMessage = i18n.t('wko-installer-openssl-exe-invalid-error-message', {error: exeResults.reason});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // While technically not required, we force saving the project for Go Menu item behavior consistency.
        //
        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
        if (!options.skipProjectSave) {
          const saveResult = await projectIo.saveProject();
          if (!saveResult.saved) {
            const errMessage = `${i18n.t('wko-installer-project-not-saved-error-prefix')}: ${saveResult.reason}`;
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        const kubectlContext = k8sHelper.getKubectlContext();
        const kubectlOptions = k8sHelper.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          if (kubectlContext) {
            const setResults =
            await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
            if (!setResults.isSuccess) {
              const errMessage = i18n.t('wko-installer-set-context-error-message', {error: setResults.reason});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }
        }

        // Best effort sanity check to see if ingress controller has been installed
        // If user install their own ingress controller then we are not going to scan all namespaces for
        // controller to verify it.

        if (this.project.ingress.installIngressController.value === true) {
          busyDialogMessage = i18n.t('ingress-installer-check-ingress-controller-service',
            {});
          dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
          let serviceName = '';
          if (this.project.ingress.ingressControllerProvider.value === 'nginx') {
            serviceName = this.project.ingress.ingressControllerName.value + '-ingress-nginx-controller';
          } else {
            serviceName = this.project.ingress.ingressControllerName.value;
          }

          const result = await this.checkIngressControllerService(kubectlExe, serviceName,
            this.project.ingress.ingressControllerNamespace.value, kubectlOptions);
          if (!result.isSuccess) {
            const errMessage = i18n.t('ingress-installer-check-ingress-controller-service-not-installed',
              {error: result.reason,
                serviceName: serviceName,
                ingressControllerName: this.project.ingress.ingressControllerName.value,
                namespace: this.project.ingress.ingressControllerNamespace.value});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }


        if (this.project.ingress.createTLSSecret.value === true) {
          busyDialogMessage = i18n.t('ingress-installer-create-tls-secret-in-progress', {});
          dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);

          let tlsKeyFile = 'tls1.key';
          let tlsCertFile = 'tls1.crt';

          if (this.project.ingress.generateTLSFiles.value === true) {
            // Generate TLS files with openssl
            const openSSLExe = this.project.ingress.opensslExecutableFilePath.value;
            const subject = this.project.ingress.ingressTLSSubject.value;

            if (typeof subject === 'undefined' || subject === '' ) {
              const errMessage = i18n.t('ingress-installer-generate-tls-files-empty-subject-error-message');
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            } else {
              const results = await window.api.ipc.invoke('openssl-generate-certs',
                openSSLExe, tlsKeyFile, tlsCertFile, subject);

              if (!results.isSuccess) {
                const errMessage = i18n.t('ingress-installer-generate-tls-files-error-message',
                  {
                    error: results.reason
                  });
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }

          } else {
            tlsKeyFile = this.project.ingress.ingressTLSKeyFile.value;
            tlsCertFile = this.project.ingress.ingressTLSCertFile.value;
          }

          if (!this.project.ingress.generateTLSFiles) {
            const tlsKeyFileExists = await this.checkTLSFileExists(this.project.ingress.ingressTLSKeyFile.value);
            const tlsCertFileExists = await this.checkTLSFileExists(this.project.ingress.ingressTLSCertFile.value);

            if (!tlsKeyFileExists || !tlsCertFileExists) {
              let files = [];
              if (!tlsKeyFileExists) {
                files.push(tlsKeyFile);
              }
              if (!tlsCertFileExists) {
                files.push(tlsCertFile);
              }

              const errMessage = i18n.t('ingress-installer-generate-tls-files-not-exists-error-message',
                {
                  files: files
                });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }

          }

          const tlsSecretName = this.project.ingress.ingressTLSSecretName.value;
          const results = await window.api.ipc.invoke('k8s-create-tls-secret',
            kubectlExe, this.project.k8sDomain.kubernetesNamespace.value, tlsSecretName, tlsKeyFile, tlsCertFile, kubectlOptions);

          if (!results.isSuccess) {
            const errMessage = i18n.t('ingress-installer-create-tls-secret-error-message',
              {
                error: results.reason
              });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }

        }


        if (ingressRoutesArrayLength > 0) {
          let k8sCluster = '';
          const k8sAddressResult = await this.getk8sClusterAddress(kubectlExe, kubectlContext, kubectlOptions);
          if (k8sAddressResult.isSuccess) {
            k8sCluster = k8sAddressResult['server'];
          }

          let existingServiceList = [];
          //let syntaxError = false;

          for (let i = 0; i < ingressRoutesArrayLength ; i++) {
            const item = this.project.ingress.ingressRoutes.value[i];
            const serviceDetail = await this.getIngressServiceDetails(kubectlExe,
              this.project.ingress.ingressControllerProvider.value,
              this.project.ingress.ingressControllerNamespace.value,
              item, k8sCluster, kubectlOptions);
            if (serviceDetail.isSuccess) {
              existingServiceList.push(item['name']);
            }
          }

          if (existingServiceList.length > 0) {
            const promptTitle = i18n.t('ingress-installer-routes-already-exists-title');
            const promptQuestion = i18n.t('ingress-installer-overwrite-routes-prompt-question', {routes: existingServiceList});
            const promptOverwriteRoutes =
              await window.api.ipc.invoke('yes-or-no-prompt', promptTitle, promptQuestion);
            if (!promptOverwriteRoutes) {
              return Promise.resolve(true);
            }
          }

          for (let i = 0; i < ingressRoutesArrayLength ; i++) {
            const item = this.project.ingress.ingressRoutes.observable()[i];

            // Potentially we can make the TLSSecretName part of the ingressRoutes data instead of TLSEnabled
            // Currently UI for tls secret is created/assumed in the same namespace of the domain to avoid too many
            // inputs and handling another table.  Once we moved to dialog format, then this can be accomplished.

            if (item['tlsEnabled'] === true) {
              item['tlsSecretName'] = this.project.ingress.ingressTLSSecretName.value;
            }
            const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;
            let ingressRouteData = {};

            // Sanity check the target service and port exists and warn user if it doesn't exist
            await this.checkTargetService(kubectlExe, item, kubectlOptions);

            if (ingressControllerProvider === 'voyager') {
              // This creates an one to one corresponding service with each ingress.
              // The nodeport is randomly generated and can be looked up in k get services.
              // note:  each route can specify a unique nodeport value in the rule (per route) but it's not in the
              // annotations
              //  and this is only specific to voyager.
              // User can change the annotations. It is added to the annotations in the UI
              // by default
              //
              // ingress.appscode.com/type: NodePort

              ingressRouteData = this.ingressResourceGenerator.createVoyagerRoutesAsYaml(item);
            } else if (ingressControllerProvider === 'traefik') {
              ingressRouteData = this.ingressResourceGenerator.createTraefikRoutesAsYaml(item);
            } else {
              ingressRouteData = this.ingressResourceGenerator.createNginxRoutesAsYaml(item);
            }

            busyDialogMessage = i18n.t('ingress-installer-create-ingress-route-in-progress',
              {ingressRoute: item['name']});
            dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);

            const ingressRouteResult = await (window.api.ipc.invoke('k8s-apply', kubectlExe, ingressRouteData,
              kubectlOptions));
            dialogHelper.closeBusyDialog();
            if (ingressRouteResult.isSuccess) {
              // When the provider is voyager then each ingress route has it's own service
              // In other case when the namespace is not defined (e.g. user env already had the controller installed)
              // then we don't know which namespace to query the nginx/traefik singleton service to determine the
              // access point.
              if (this.project.ingress.ingressControllerNamespace.value !== '' ||
                this.project.ingress.ingressControllerProvider.value === 'voyager') {
                const serviceDetail = await this.getIngressServiceDetails(kubectlExe, ingressControllerProvider,
                  this.project.ingress.ingressControllerNamespace.value,
                  item, k8sCluster, kubectlOptions);

                if (serviceDetail.isSuccess) {
                  item['accessPoint'] = serviceDetail.accessPoint;
                  this.project.ingress.ingressRoutes.observable.replace(item, item);
                } else {
                  item['accessPoint'] = 'Route has been created but cannot determine access point at the moment';
                }
              }

            } else {
              errTitle = i18n.t('ingress-installer-create-ingress-route-error-title');
              const errMessage = i18n.t('ingress-installer-create-ingress-route-error-message',
                {ingressRoute: item['name'], error:ingressRouteResult.reason});
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }

          }
          const title = i18n.t('ingress-installer-routes-update-complete-title');
          const message = i18n.t('ingress-installer-routes-update-complete-message');
          await window.api.ipc.invoke('show-info-message', title, message);

          dialogHelper.closeBusyDialog();

        } else {
          dialogHelper.closeBusyDialog();
        }

      } catch(err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }

      return Promise.resolve(true);

    };

    this.getValidatableObject = (flowNameKey) => {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const settingsFormConfig = validationObject.getDefaultConfigObject();
      settingsFormConfig.formName = 'ingress-design-title';

      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-title';
      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);
      validationObject.addField('kubectl-helm-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.helmExecutableFilePath.value), kubectlFormConfig);


      validationObject.addField('ingress-design-ingress-provider-label',
        validationHelper.validateRequiredField(this.project.ingress.ingressControllerProvider.value));

      const  ingressRoutesArrayLength = this.project.ingress.ingressRoutes.value.length;
      let hasTLSRoutes = false;
      for (let i = 0; i < ingressRoutesArrayLength ; i++) {
        const item = this.project.ingress.ingressRoutes.value[i];
        if (item['tlsEnabled'] === true) {
          hasTLSRoutes = true;
        }
        this.checkIngressData(item, validationObject, settingsFormConfig);
      }

      if (this.project.ingress.specifyIngressTLSSecret.value === true) {
        validationObject.addField('ingress-design-tls-secret-name-label',
          validationHelper.validateRequiredField(this.project.ingress.ingressTLSSecretName.value));
      }

      if (this.project.ingress.createTLSSecret.value === true && this.project.ingress.generateTLSFiles.value === false) {
        validationObject.addField('ingress-design-ingress-tlskeyfile-label',
          validationHelper.validateRequiredField(this.project.ingress.ingressTLSKeyFile.value));
        validationObject.addField('ingress-design-ingress-tlscertfile-label',
          validationHelper.validateRequiredField(this.project.ingress.ingressTLSCertFile.value));
      }

      if (hasTLSRoutes) {
        validationObject.addField('ingress-design-tls-secret-name-label',
          validationHelper.validateRequiredField(this.project.ingress.ingressTLSSecretName.value));
      }


      return validationObject;
    };

    this.checkTLSFileExists =  async (file)=> {
      if (typeof file !== 'undefined' && file !== '') {
        const result = await window.api.ipc.invoke('verify-file-exists', file);

        if (result.isValid) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      }
      return Promise.resolve(false);
    };

    this.checkIngressData =  (data, validationObject)=> {
      const items = ['name', 'targetServiceNameSpace', 'targetService', 'targetPort', 'path'];

      // if (data['tlsEnabled'] === true) {
      //   validationObject.addField(data['name'] + '.' + 'virtualHost',
      //     validationHelper.validateRequiredField(data['virtualHost']));
      // }

      items.forEach(attribute => {
        let errFieldMessage = 'route name: ';
        if (attribute === 'targetServiceNameSpace') {
          errFieldMessage += data['name'] + ' ' + i18n.t('ingress-design-ingress-route-targetservicenamespace-label');
        }
        if (attribute === 'targetService') {
          errFieldMessage += data['name'] + ' ' + i18n.t('ingress-design-ingress-route-targetservice-label');
        }
        if (attribute === 'targetPort') {
          errFieldMessage += data['name'] + ' ' + i18n.t('ingress-design-ingress-route-targetport-label');
        }
        if (attribute === 'path') {
          errFieldMessage += data['name'] + ' ' + i18n.t('ingress-design-ingress-route-targetport-label');
        }

        validationObject.addField(errFieldMessage,
          validationHelper.validateRequiredField(data[attribute]));
      });
    };

    this.getHelmOptions = () => {
      const options = {};
      if (this.project.kubectl.kubeConfig.value) {
        options.kubeConfig = this.project.kubectl.kubeConfig.value;
      }
      if (this.project.kubectl.kubeConfigContextToUse.value) {
        options.kubeContext = this.project.kubectl.kubeConfigContextToUse.value;
      }
      const extraPathDirectories = this.project.kubectl.extraPathDirectories.value;
      if (extraPathDirectories && extraPathDirectories.length > 0) {
        options.extraPathDirectories = k8sHelper.getExtraPathDirectoriesArray(extraPathDirectories);
      }
      return options;
    };

    this.checkIngressControllerService = async (kubectlExe, serviceName, namespace,
      kubectlOptions) => {
      return await window.api.ipc.invoke('k8s-get-service-details',
        kubectlExe, namespace, serviceName, kubectlOptions);
    };

    this.checkTargetService = async (kubectlExe, ingressDefinition, kubectlOptions) => {
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
          const errTitle = i18n.t('ingress-installer-create-ingress-route-warning-title');
          const errMessage = i18n.t('ingress-installer-create-ingress-route-targetport-notexists-message',
            {name: ingressDefinition['name'],
              targetService: ingressDefinition['targetService'],
              targetPort: ingressDefinition['targetPort']});
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        }

        return Promise.resolve(true);
      } else {

        const errTitle = i18n.t('ingress-installer-create-ingress-route-warning-title');
        const errMessage = i18n.t('ingress-installer-create-ingress-route-targetservice-notexists-message',
          {name: ingressDefinition['name'], targetService: ingressDefinition['targetService'],
            targetPort: ingressDefinition['targetPort'], error:results.reason});
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);

        return Promise.resolve(false);
      }
    };

    this.getk8sClusterAddress = async (kubectlExe, currentContext, kubectlOptions) => {
      const results = await window.api.ipc.invoke('k8s-get-k8s-config',
        kubectlExe, kubectlOptions);
      let cluster = '';
      let server = '';
      if (results.isSuccess) {
        const configView = results.configView;
        for (const item of configView.contexts) {
          if (item.name === configView['current-context']) {
            cluster = item.context.cluster;
            break;
          }
        }
        if (cluster !== '') {
          for (const item of configView.clusters) {
            if (item.name === cluster) {
              server = item.cluster.server;
              const address = server.split(':');
              results['server'] = address[1];
              break;
            }
          }
        }
        return Promise.resolve(results);

      } else {
        return Promise.resolve(results);
      }
    };

    this.getIngressServiceDetails = async (kubectlExe, ingressControllerProvider, ingressControllerNamespace, ingressDefinition, k8sCluster, kubectlOptions) => {
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
          for ( let i =0 ; i < results.serviceDetails.items.length; i++) {
            if (results.serviceDetails.items[i].spec['type'] === 'LoadBalancer') {
              serviceDetail = results.serviceDetails.items[0];
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
          ((ingressControllerProvider === 'voyager' && serviceDetail.spec['type'] === 'NodePort'))) {
          if ('loadBalancer' in serviceDetail.status) {
            if (JSON.stringify(serviceDetail.status['loadBalancer']) === '{}') {
              useNodePort = true;
              if (typeof k8sCluster === 'undefined' || k8sCluster === '') {
                externalLoadBalancerHost = '//<k8s cluster address>';
              } else {
                externalLoadBalancerHost = k8sCluster;
              }
            } else {
              if ('hostname' in serviceDetail.status['loadBalancer'].ingress) {
                externalLoadBalancerHost = '//' + serviceDetail.status['loadBalancer'].ingress.hostname;
              } else if ('ip' in serviceDetail.status['loadBalancer'].ingress) {
                externalLoadBalancerHost = '//' + serviceDetail.status['loadBalancer'].ingress.ip;
              } else {
                // should never be here...
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

        if (useNodePort) {
          if (ingressDefinition['tLSEnabled'] === true) {
            results['accessPoint'] = 'https:' + externalLoadBalancerHost + ':' + ingressSSLPort  + ingressDefinition.path;
          } else {
            results['accessPoint'] = 'http:' + externalLoadBalancerHost + ':' + ingressPlainPort  + ingressDefinition.path;
          }
        } else {
          if (ingressDefinition['tLSEnabled'] === true) {
            results['accessPoint'] = 'https:' + externalLoadBalancerHost + '/' + ingressDefinition.path;
          } else {
            results['accessPoint'] = 'http:' + externalLoadBalancerHost + '/' + ingressDefinition.path;
          }
        }

        return Promise.resolve(results);

      } else {
        const errMessage = i18n.t('ingress-installer-get-service-details-error-message',
          {
            namespace: ingressControllerNamespace,
            error: results.reason
          });
        wktLogger.error(errMessage);
        return Promise.resolve(results);
      }
    };
  }

  return new IngressInstaller();
});
