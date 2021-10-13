/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/k8s-helper', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/helm-helper'],
function(project, wktConsole, k8sHelper, i18n, projectIo, dialogHelper, validationHelper, helmHelper) {
  function IngressInstaller() {
    this.project = project;

    this.startInstallIngressController = async () => {
      return this.callInstallIngressController();
    };

    this.callInstallIngressController = async (options) => {
      if (!options) {
        options = {};
      }

      if (this.project.ingress.installIngressController.value === false) {
        const title = i18n.t('ingress-installer-install-complete-title');
        const message = i18n.t('ingress-installer-install-complete-noaction-message');
        await window.api.ipc.invoke('show-info-message', title, message);
        return Promise.resolve(true);
      }

      // Check data

      const validatableObject = this.getValidatableObject('flow-ingress-controller-installation-name');
      if (validatableObject.hasValidationErrors()) {
        const errTitle = i18n.t('ingress-installer-install-controller-error-title');
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

        busyDialogMessage = i18n.t('flow-validate-helm-exe-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        const helmExe = k8sHelper.getHelmExe();
        if (!options.skipHelmExeValidation) {
          const exeResults = await window.api.ipc.invoke('validate-helm-exe', helmExe);
          if (!exeResults.isValid) {
            const errMessage = i18n.t('wko-installer-helm-exe-invalid-error-message', {error: exeResults.reason});
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

        // Start Real install here
        if (this.project.ingress.installIngressController.value === true) {
          const ingressControllerName = this.project.ingress.ingressControllerName.value;
          const ingressControllerNamespace = this.project.ingress.ingressControllerNamespace.value;
          const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;
          const voyagerProvider = this.project.ingress.voyagerProviderMappedValue(this.project.ingress.voyagerProvider.value);
          const helmOptions = this.getHelmOptions();

          busyDialogMessage = i18n.t('ingress-installer-checking-already-installed-in-progress',
            {ingressControllerName: ingressControllerName, ingressControllerNamespace: ingressControllerNamespace});
          dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
          if (!options.skipCheckAlreadyInstalled) {
            const helmListResults = await window.api.ipc.invoke('helm-list-all-namespaces', helmExe, helmOptions);

            if (!helmListResults.isSuccess) {
              const errMessage = i18n.t('ingress-installer-checking-already-installed-error-message',
                {ingressControllerName: ingressControllerName, error: helmListResults.reason});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }

            const helmChartList = JSON.parse(helmListResults.stdout);
            let ingressChartNamePrefix = 'ingress-nginx-';
            if (ingressControllerProvider === 'traefik') {
              ingressChartNamePrefix = 'traefik-';
            } else if (ingressControllerProvider === 'voyager') {
              ingressChartNamePrefix = 'voyager-';
            }

            for (const obj of helmChartList) {
              if (obj['chart'].startsWith(ingressChartNamePrefix) === true && obj['namespace'] === ingressControllerNamespace) {
                dialogHelper.closeBusyDialog();
                const errMessage = i18n.t('ingress-installer-already-installed-error-message',
                  {
                    ingressProvider: ingressControllerProvider,
                    chartName: obj['chart'],
                    namespace: obj['namespace'],
                    installedName: obj['name'],
                    status: obj['status']
                  });
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }
          }

          busyDialogMessage = i18n.t('ingress-installer-create-ns-in-progress', {ingressControllerNamespace: ingressControllerNamespace});
          dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
          if (!options.skipCreateOperatorNamespace) {
            const createNsResults = await window.api.ipc.invoke('k8s-create-namespace', kubectlExe, ingressControllerNamespace, kubectlOptions);
            if (!createNsResults.isSuccess) {
              const errMessage = i18n.t('ingress-installer-create-ns-error-message',
                {operatorNamespace: ingressControllerNamespace, error: createNsResults.reason});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          const helmChartData = helmHelper.getIngressHelmChartData(ingressControllerProvider);
          busyDialogMessage = i18n.t('ingress-installer-add-repo-in-progress',
            {ingressControllerName: ingressControllerName});
          dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
          if (!options.skipCheckAlreadyInstalled) {
            let ingressRepoName = helmChartData.repoName;
            let ingressRepoUrl = helmChartData.chartUrl;

            const helmResults = await window.api.ipc.invoke('helm-add-update-repo',
              helmExe, ingressRepoName, ingressRepoUrl, helmOptions);
            if (!helmResults.isSuccess) {
              const errMessage = i18n.t('ingress-installer-add-repo-error-message',
                {
                  repoName: ingressRepoName,
                  error: helmResults.reason
                });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          busyDialogMessage = i18n.t('ingress-installer-install-controller-in-progress',
            {ingressControllerName: ingressControllerName, ingressControllerNamespace: ingressControllerNamespace});
          dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
          if (!options.skipCheckAlreadyInstalled) {
            const secretData = {
              server: 'docker.io',
              username: this.project.ingress.dockerRegSecretUserId.value,
              email: this.project.ingress.dockerRegSecretUserEmail.value,
              password: this.project.ingress.dockerRegSecretUserPwd.value
            };

            if (ingressControllerProvider === 'traefik' || ingressControllerProvider === 'voyager' ) {
              // create image pull secret for pulling Traefik or Voyager images.
              if (this.project.ingress.createDockerRegSecret.value === true &&
                typeof this.project.ingress.dockerRegSecretName.value !== 'undefined') {
                const regSecretResult = await window.api.ipc.invoke('k8s-create-pull-secret', kubectlExe, ingressControllerNamespace,
                  this.project.ingress.dockerRegSecretName.value, secretData, kubectlOptions);

                if (!regSecretResult.isSuccess) {
                  const errMessage = i18n.t('ingress-installer-install-controller-error-message',
                    {
                      ingressControllerName: ingressControllerName,
                      error: regSecretResult.reason
                    });
                  dialogHelper.closeBusyDialog();
                  await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                  return Promise.resolve(false);
                }
              }
            }

            const ingressChartName = helmChartData.chartName;

            /// Change to setup values for chart
            let args = {};
            const dockerSecretName = this.project.ingress.dockerRegSecretName.value;
            if (ingressControllerProvider === 'voyager') {
              args['cloudProvider'] = voyagerProvider;
              args['apiserver.healthcheck.enabled'] = false;
              args['apiserver.enableValidatingWebhook'] = false;
              if (typeof dockerSecretName !== 'undefined') {
                args['imagePullSecrets[0].name'] = dockerSecretName;
              }
            }

            if (ingressControllerProvider === 'traefik' && dockerSecretName) {
              args['deployment.imagePullSecrets[0].name'] = dockerSecretName;
            }

            if (ingressControllerProvider === 'traefik' || ingressControllerProvider === 'nginx') {
              args['kubernetes.namespaces'] = '{' + ingressControllerNamespace + ',' + this.project.k8sDomain.kubernetesNamespace.value +  '}';
            }

            const installResults = await window.api.ipc.invoke('helm-install-ingress-controller',
              helmExe, ingressControllerName, ingressChartName, ingressControllerNamespace,
              '#future', args, helmOptions);
            dialogHelper.closeBusyDialog();
            if (installResults.isSuccess) {
              // Traefik and Nginx has fixed loadbalancer, Voyager is in each ingress object

              const title = i18n.t('ingress-installer-install-complete-title');
              const message = i18n.t('ingress-installer-install-complete-message',
                { ingressControllerName: ingressControllerName, ingressControllerNamespace: ingressControllerNamespace });

              await window.api.ipc.invoke('show-info-message', title, message);
              return Promise.resolve(true);
            } else {
              const errMessage = i18n.t('ingress-installer-install-controller-error-message',
                {
                  ingressControllerName: ingressControllerName,
                  error: installResults.reason
                });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }

          }


        }


      } catch(err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
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

      if (this.project.ingress.installIngressController.value === true) {

        validationObject.addField('ingress-design-ingress-namespace-label',
          validationHelper.validateRequiredField(this.project.ingress.ingressControllerNamespace.value));
        validationObject.addField('ingress-design-ingress-name-label',
          validationHelper.validateRequiredField(this.project.ingress.ingressControllerName.value));

        const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;

        if (ingressControllerProvider === 'traefik' || ingressControllerProvider === 'voyager' ) {

          if (this.project.ingress.specifyDockerRegSecret.value === true) {
            validationObject.addField('ingress-design-ingress-docker-reg-secret-name',
              validationHelper.validateRequiredField(this.project.ingress.dockerRegSecretName.value));
          }

          if (this.project.ingress.createDockerRegSecret.value == true) {
            validationObject.addField('ingress-design-ingress-docker-reg-secret-useremail',
              validationHelper.validateRequiredField(this.project.ingress.dockerRegSecretUserEmail.value));
            validationObject.addField('ingress-design-ingress-docker-reg-secret-useremail',
              validationHelper.validateEmailAddress(this.project.ingress.dockerRegSecretUserEmail.value));
            validationObject.addField('ingress-design-ingress-docker-reg-secret-userid',
              validationHelper.validateRequiredField(this.project.ingress.dockerRegSecretUserId.value));
            validationObject.addField('ingress-design-ingress-docker-reg-secret-userpwd',
              validationHelper.validateRequiredField(this.project.ingress.dockerRegSecretUserPwd.value));
          }

        }
      }

      return validationObject;
    };

  }

  return new IngressInstaller();
});

