/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/ingress-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/k8s-helper', 'utils/i18n',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/helm-helper'],
function(IngressActionsBase, project, wktConsole, k8sHelper, i18n, dialogHelper, validationHelper, helmHelper) {
  class IngressControllerInstaller extends IngressActionsBase {
    constructor() {
      super();
    }

    async startInstallIngressController() {
      await this.executeAction(this.callInstallIngressController);
    }

    async callInstallIngressController(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('ingress-installer-aborted-error-title');
      let errPrefix = 'ingress-installer';
      if (this.project.ingress.installIngressController.value === false) {
        const message = i18n.t('ingress-installer-not-install-message');
        await window.api.ipc.invoke('show-info-message', errTitle, message);
        return Promise.resolve(true);
      }

      // Check data

      const validatableObject = this.getValidatableObject('flow-install-ingress-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 9.0;
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

        busyDialogMessage = i18n.t('flow-validate-helm-exe-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        const helmExe = k8sHelper.getHelmExe();
        if (!options.skipHelmExeValidation) {
          if (! await this.validateHelmExe(helmExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
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

        const ingressControllerName = this.project.ingress.ingressControllerName.value;
        const ingressControllerNamespace = this.project.ingress.ingressControllerNamespace.value;
        const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;
        const voyagerProvider = this.project.ingress.voyagerProviderMappedValue(this.project.ingress.voyagerProvider.value);
        const helmOptions = helmHelper.getHelmOptions();

        busyDialogMessage = i18n.t('ingress-installer-checking-already-installed-in-progress',
          { name: ingressControllerName, namespace: ingressControllerNamespace });
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        if (!options.skipCheckAlreadyInstalled) {
          const isInstalledResults = await this.isIngressControllerInstalled(helmExe, helmOptions,
            ingressControllerProvider, ingressControllerName, ingressControllerNamespace, errTitle, errPrefix);
          if (isInstalledResults) {
            if (isInstalledResults.isInstalled) {
              dialogHelper.closeBusyDialog();
              const errMessage = i18n.t('ingress-installer-already-installed-error-message',
                {
                  ingressProvider: ingressControllerProvider,
                  chartName: isInstalledResults['chart'],
                  namespace: isInstalledResults['namespace'],
                  installedName: isInstalledResults['name'],
                  status: isInstalledResults['status']
                });
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          } else {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('ingress-installer-create-ns-in-progress', { namespace: ingressControllerNamespace });
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        if (!options.skipCreateIngressNamespace) {
          if (! await this.createKubernetesNamespace(kubectlExe, kubectlOptions, ingressControllerNamespace, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('ingress-installer-add-repo-in-progress', { name: ingressControllerName });
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
        if (!options.skipCheckAlreadyInstalled) {
          if (! await this.addIngressControllerHelmChart(helmExe, helmOptions, ingressControllerProvider, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('ingress-installer-create-pull-secret-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
        let secretName;
        if (this.project.ingress.specifyDockerRegSecret.value) {
          secretName = this.project.ingress.dockerRegSecretName.value;
          if (ingressControllerProvider === 'traefik' || ingressControllerProvider === 'voyager' ) {
            // create image pull secret for pulling Traefik or Voyager images.
            if (this.project.ingress.createDockerRegSecret.value === true && secretName) {
              const credentials =
                this.getImageRegistryCredential(this.project.ingress.dockerRegImageCredentialReference.value);
              const secretData = {
                server: credentials.address || 'docker.io',
                username: credentials.username,
                email: credentials.email,
                password: credentials.password
              };
              const secretStatus = await this.createPullSecret(kubectlExe, kubectlOptions, ingressControllerNamespace,
                secretName, secretData, errTitle, errPrefix);
              if (!secretStatus) {
                return Promise.resolve(false);
              }
            }
          }
        }

        busyDialogMessage = i18n.t('ingress-installer-install-in-progress', { name: ingressControllerName });
        dialogHelper.updateBusyDialog(busyDialogMessage, 8 / totalSteps);

        const ingressChartName = this.getIngressControllerHelmChartName(ingressControllerProvider);
        const helmChartValues =
          this.getHelmChartValues(ingressControllerProvider, ingressControllerNamespace, voyagerProvider, secretName);

        const installResults = await window.api.ipc.invoke('helm-install-ingress-controller',
          helmExe, ingressControllerName, ingressChartName, ingressControllerNamespace, helmChartValues, helmOptions);
        dialogHelper.closeBusyDialog();
        if (installResults.isSuccess) {
          // Traefik and Nginx has fixed loadbalancer, Voyager is in each ingress object

          const title = i18n.t('ingress-installer-install-complete-title');
          const message = i18n.t('ingress-installer-install-complete-message',
            { name: ingressControllerName, namespace: ingressControllerNamespace });

          await window.api.ipc.invoke('show-info-message', title, message);
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('ingress-installer-install-failed-title');
          const errMessage = i18n.t('ingress-installer-install-failed-error-message',
            {
              name: ingressControllerName,
              namespace: ingressControllerNamespace,
              error: installResults.reason
            });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
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

      if (this.project.ingress.installIngressController.value === true) {
        validationObject.addField('ingress-design-ingress-namespace-label',
          this.project.ingress.ingressControllerNamespace.validate(true), ingressFormConfig);
        validationObject.addField('ingress-design-ingress-name-label',
          this.project.ingress.ingressControllerName.validate(true), ingressFormConfig);

        const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;
        if (ingressControllerProvider === 'traefik' || ingressControllerProvider === 'voyager' ) {
          if (this.project.ingress.specifyDockerRegSecret.value === true) {
            validationObject.addField('ingress-design-ingress-docker-reg-secret-name',
              this.project.ingress.dockerRegSecretName.validate(true), ingressFormConfig);

            if (this.project.ingress.createDockerRegSecret.value === true) {
              validationObject.addField('ingress-design-image-registry-pull-credentials-label',
                validationHelper.validateRequiredField(this.project.ingress.dockerRegImageCredentialReference.value),
                ingressFormConfig);

              const credentials =
                this.getImageRegistryCredential(this.project.ingress.dockerRegImageCredentialReference.value);
              if (credentials) {
                const projectSettingsFormConfig = validationObject.getDefaultConfigObject();
                projectSettingsFormConfig.formName = 'project-settings-form-name';
                validationObject.addField('project-settings-container-image-registries-credentials-email-heading',
                  validationHelper.validateRequiredField(credentials.email), projectSettingsFormConfig);
                validationObject.addField('project-settings-container-image-registries-credentials-username-heading',
                  validationHelper.validateRequiredField(credentials.username), projectSettingsFormConfig);
                validationObject.addField('project-settings-container-image-registries-credentials-password-heading',
                  validationHelper.validateRequiredField(credentials.password), projectSettingsFormConfig);
              }
            }
          }
        }
      }
      return validationObject;
    }

    getHelmChartValues(ingressControllerProvider, ingressControllerNamespace, voyagerProvider, secretName) {
      let helmChartData = {};
      if (ingressControllerProvider === 'voyager') {
        helmChartData['cloudProvider'] = voyagerProvider;
        helmChartData['apiserver.healthcheck.enabled'] = false;
        helmChartData['apiserver.enableValidatingWebhook'] = false;
        if (secretName) {
          helmChartData['imagePullSecrets[0].name'] = secretName;
        }
      }

      if (ingressControllerProvider === 'traefik' && secretName) {
        helmChartData['deployment.imagePullSecrets[0].name'] = secretName;
      }
      if (ingressControllerProvider === 'traefik' || ingressControllerProvider === 'nginx') {
        helmChartData['kubernetes.namespaces'] =
          `{${ingressControllerNamespace},${this.project.k8sDomain.kubernetesNamespace.value}}`;
      }
      if (ingressControllerProvider === 'nginx' && this.project.ingress.allowNginxSSLPassThrough.value) {
        helmChartData['controller.extraArgs.enable-ssl-passthrough'] = true;
      }

      if (this.project.ingress.ingressServiceType.hasValue()) {
        if (ingressControllerProvider === 'traefik') {
          helmChartData['service.type'] = this.project.ingress.ingressServiceType.value;
        } else if (ingressControllerProvider === 'nginx') {
          helmChartData['controller.service.type'] = this.project.ingress.ingressServiceType.value;
        }
      }

      if (this.project.ingress.helmTimeoutMinutes.hasValue()) {
        helmChartData['timeout'] = this.project.ingress.helmTimeoutMinutes.value;
      }
      return helmChartData;
    }
  }

  return new IngressControllerInstaller();
});

