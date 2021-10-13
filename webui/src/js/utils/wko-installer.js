/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/k8s-helper', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function(project, wktConsole, k8sHelper, i18n, projectIo, dialogHelper, validationHelper, helmHelper, wktLogger) {
  function WkoInstaller() {
    this.project = project;

    this.startInstallOperator = async () => {
      return this.callInstallOperator();
    };

    this.callInstallOperator = async (options) => {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wko-installer-aborted-error-title');
      const validatableObject = this.getValidatableObject('flow-install-operator-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 11.0;
      try {
        const helmReleaseName = this.project.wko.wkoDeployName.value;
        const operatorNamespace = this.project.wko.k8sNamespace.value;
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);

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
            dialogHelper.closeBusyDialog();
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

        busyDialogMessage = i18n.t('wko-installer-checking-already-installed-in-progress',
          {operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        if (!options.skipCheckOperatorAlreadyInstalled) {
          const isInstalledResults = await window.api.ipc.invoke('is-wko-installed', kubectlExe, helmReleaseName, operatorNamespace, kubectlOptions);

          if (isInstalledResults.isInstalled) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('wko-installer-already-installed-error-message',
              {
                operatorNamespace: operatorNamespace,
                image: isInstalledResults.image,
                version: isInstalledResults.version
              });
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else if (isInstalledResults.reason) {
            // There should only be a reason if the backend error didn't match the expected "not found" error condition!
            const errMessage = i18n.t('wko-installer-already-installed-check-failed-error-message',
              {operatorNamespace: operatorNamespace, error: isInstalledResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // If using the List selection strategy, validate any namespaces the user may have entered.
        //
        busyDialogMessage = i18n.t('wko-installer-validating-namespaces-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        if (!options.skipValidateMonitoredNamespacesExist) {
          if (this.project.wko.operatorDomainNamespaceSelectionStrategy.value === 'List'
            && this.project.wko.operatorDomainNamespacesList.value.length > 0) {
            const validationResults = await window.api.ipc.invoke('validate-k8s-namespaces-exist', kubectlExe,
              kubectlOptions, ...this.project.wko.operatorDomainNamespacesList.value);

            if (!validationResults.isSuccess) {
              const errMessage = i18n.t('wko-installer-validate-ns-error-message', {
                namespaces: this.project.wko.operatorDomainNamespacesList.value.join(', '),
                error: validationResults.reason
              });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            } else if (!validationResults.isValid) {
              const missingNamespaces = validationResults.missingNamespaces;
              // Prompt the user to see if they want to create them.
              // If so, create the namespaces for them
              // If not, abort installation...
              //
              const title = i18n.t('wko-installer-namespaces-do-not-exist-title');
              const question = i18n.t('wko-installer-namespaces-do-not-exist-question', {
                namespaces: missingNamespaces.join(', ')
              });
              const response = await window.api.ipc.invoke('yes-or-no-prompt', title, question);
              if (response) {
                const nsCreateResponse = await window.api.ipc.invoke('k8s-create-namespaces', kubectlExe,
                  kubectlOptions, ...missingNamespaces);
                if (!nsCreateResponse.isSuccess) {
                  const errMessage = i18n.t('wko-installer-create-namespaces-failed-error', {
                    namespaces: missingNamespaces.join(', '),
                    error: nsCreateResponse.reason
                  });
                  dialogHelper.closeBusyDialog();
                  await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                  return Promise.resolve(false);
                }
              } else {
                // user chose to not create the missing namespaces so abort the installation
                const errMessage = i18n.t('wko-installer-namespaces-do-not-exist-error', {
                  namespaces: missingNamespaces.join(', ')
                });
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }
          }
        }

        busyDialogMessage = i18n.t('wko-installer-create-ns-in-progress', {operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
        if (!options.skipCreateOperatorNamespace) {
          const createNsResults = await window.api.ipc.invoke('k8s-create-namespace', kubectlExe, operatorNamespace, kubectlOptions);
          if (!createNsResults.isSuccess) {
            const errMessage = i18n.t('wko-installer-create-ns-error-message',
              {operatorNamespace: operatorNamespace, error: createNsResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('wko-installer-create-sa-in-progress', {operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
        const operatorServiceAccount = this.project.wko.k8sServiceAccount.value;
        if (!options.skipCreateOperatorServiceAccount) {
          const createSaResults = await window.api.ipc.invoke('k8s-create-service-account', kubectlExe, operatorNamespace, operatorServiceAccount, kubectlOptions);

          if (!createSaResults.isSuccess) {
            const errMessage = i18n.t('wko-installer-create-sa-error-message',
              {
                operatorServiceAccount: operatorServiceAccount,
                operatorNamespace: operatorNamespace,
                error: createSaResults.reason
              });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        const operatorPullSecretName = this.project.wko.operatorImagePullSecretName.value;
        busyDialogMessage = i18n.t('wko-installer-create-pull-secret-in-progress', {secretName: operatorPullSecretName});
        dialogHelper.updateBusyDialog(busyDialogMessage, 8 / totalSteps);
        if (!options.skipCreateOperatorPullSecret) {
          if (this.project.wko.operatorImagePullRequiresAuthentication.value && !this.project.wko.operatorImagePullUseExistingSecret.value) {
            const secretData = {
              server: this.project.wko.internal.operatorImagePullRegistryAddress.value,
              username: this.project.wko.operatorImagePullRegistryUsername.value,
              email: this.project.wko.operatorImagePullRegistryEmailAddress.value,
              password: this.project.wko.operatorImagePullRegistryPassword.value
            };

            const createPullSecretResults = await window.api.ipc.invoke('k8s-create-pull-secret', kubectlExe,
              operatorNamespace, operatorPullSecretName, secretData, kubectlOptions);
            if (!createPullSecretResults.isSuccess) {
              const errMessage = i18n.t('wko-installer-create-pull-secret-error-message',
                {
                  secretName: operatorPullSecretName,
                  operatorNamespace: operatorNamespace,
                  error: createPullSecretResults.reason
                });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }
        }

        dialogHelper.updateBusyDialog(i18n.t('wko-installer-add-chart-in-progress'), 9 / totalSteps);
        const helmOptions = helmHelper.getHelmOptions();
        const addChartResults = await window.api.ipc.invoke('helm-add-wko-chart', helmExe, helmOptions);
        if (!addChartResults.isSuccess) {
          const errMessage = i18n.t('wko-installer-add-chart-error-message', {error: addChartResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('wko-installer-install-in-progress', {helmReleaseName: helmReleaseName});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
        const helmChartValues = this.getWkoHelmChartValues(operatorServiceAccount);
        wktLogger.debug('helmChartValues = %s', JSON.stringify(helmChartValues, null, 2));

        const installResults = await window.api.ipc.invoke('helm-install-wko', helmExe, helmReleaseName,
          operatorNamespace, helmChartValues, helmOptions);

        dialogHelper.closeBusyDialog();

        if (installResults.isSuccess) {
          const title = i18n.t('wko-installer-install-complete-title');
          const message = i18n.t('wko-installer-install-complete-message',
            { operatorName: helmReleaseName, operatorNamespace: operatorNamespace });
          await window.api.ipc.invoke('show-info-message', title, message);
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('wko-installer-install-failed-title');
          const errMessage = i18n.t('wko-installer-install-failed-error-message',
            { operatorName: helmReleaseName, operatorNamespace: operatorNamespace, error: installResults.reason });
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

      } catch(err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    };

    function isValueEmpty(value) {
      return value === undefined || value === null || value === '';
    }

    function addHelmChartValueIfSet(helmChartValues, chartPropertyName, modelProperty) {
      if (modelProperty.hasValue() && !isValueEmpty(modelProperty.value)) {
        helmChartValues[chartPropertyName] = modelProperty.value;
      }
    }

    this.getWkoHelmChartValues = (operatorServiceAccount) => {
      const helmChartValues = {
        // Only put the values in here where the UI is not following the operator helm chart's default values.
        //
        serviceAccount: operatorServiceAccount,
        domainNamespaceSelectionStrategy: this.project.wko.operatorDomainNamespaceSelectionStrategy.value
      };

      switch (helmChartValues.domainNamespaceSelectionStrategy) {
        case 'LabelSelector':
          helmChartValues.domainNamespaceLabelSelector = this.project.wko.operatorDomainNamespaceSelector.value;
          break;

        case 'List':
          if (this.project.wko.operatorDomainNamespacesList.hasValue()) {
            helmChartValues.domainNamespaces =
              this.convertArrayToSliceSyntax(this.project.wko.operatorDomainNamespacesList.value);
          }
          break;

        case 'Regexp':
          helmChartValues.domainNamespaceRegExp = this.project.wko.operatorDomainNamespaceRegex.value;
          break;
      }

      // Now, add other values if they are not the default;
      //
      addHelmChartValueIfSet(helmChartValues, 'enableClusterRoleBinding', this.project.wko.enableClusterRoleBinding);
      addHelmChartValueIfSet(helmChartValues, 'image', this.project.wko.operatorImage);
      addHelmChartValueIfSet(helmChartValues, 'imagePullPolicy', this.project.wko.operatorImagePullPolicy);

      if (this.project.wko.operatorImagePullRequiresAuthentication.value) {
        const imagePullSecret = this.project.wko.operatorImagePullSecretName.value;
        if (imagePullSecret) {
          helmChartValues.imagePullSecrets = [{name: imagePullSecret}];
        }
      }

      if (this.project.wko.externalRestEnabled.hasValue()) {
        helmChartValues.externalRestEnabled = this.project.wko.externalRestEnabled.value;
        if (helmChartValues.externalRestEnabled) {
          addHelmChartValueIfSet(helmChartValues, 'externalRestHttpsPort', this.project.wko.externalRestHttpsPort);
          addHelmChartValueIfSet(helmChartValues, 'externalRestIdentitySecret', this.project.wko.externalRestIdentitySecret);
        }
      }

      if (this.project.wko.elkIntegrationEnabled.hasValue()) {
        helmChartValues.elkIntegrationEnabled = this.project.wko.elkIntegrationEnabled.value;
        if (helmChartValues.elkIntegrationEnabled) {
          addHelmChartValueIfSet(helmChartValues, 'logStashImage', this.project.wko.logStashImage);
          addHelmChartValueIfSet(helmChartValues, 'elasticSearchHost', this.project.wko.elasticSearchHost);
          addHelmChartValueIfSet(helmChartValues, 'elasticSearchPort', this.project.wko.elasticSearchPort);
        }
      }

      addHelmChartValueIfSet(helmChartValues, 'javaLoggingLevel', this.project.wko.javaLoggingLevel);
      addHelmChartValueIfSet(helmChartValues, 'javaLoggingFileSizeLimit', this.project.wko.javaLoggingFileSizeLimit);
      addHelmChartValueIfSet(helmChartValues, 'javaLoggingFileCount', this.project.wko.javaLoggingFileCount);

      return helmChartValues;
    };

    this.getValidatableObject = (flowNameKey) => {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-title';

      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);
      validationObject.addField('kubectl-helm-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.helmExecutableFilePath.value), kubectlFormConfig);

      validationObject.addField('wko-design-wko-deploy-name-label',
        validationHelper.validateRequiredField(this.project.wko.wkoDeployName.value));
      validationObject.addField('wko-design-k8s-namespace-label',
        validationHelper.validateRequiredField(this.project.wko.k8sNamespace.value));
      validationObject.addField('wko-design-k8s-service-account-label',
        validationHelper.validateRequiredField(this.project.wko.k8sServiceAccount.value));
      validationObject.addField('wko-design-image-tag-title',
        this.project.wko.operatorImage.validate(true));

      if (this.project.wko.operatorImagePullRequiresAuthentication.value) {
        validationObject.addField('wko-design-image-pull-secret-title',
          this.project.wko.operatorImagePullSecretName.validate(true));
        if (!this.project.wko.operatorImagePullUseExistingSecret.value) {
          validationObject.addField('wko-design-image-registry-username-label',
            validationHelper.validateRequiredField(this.project.wko.operatorImagePullRegistryUsername.value));
          validationObject.addField('wko-design-image-registry-email-label',
            validationHelper.validateRequiredField(this.project.wko.operatorImagePullRegistryEmailAddress.value));
          validationObject.addField('wko-design-image-registry-password-label',
            validationHelper.validateRequiredField(this.project.wko.operatorImagePullRegistryPassword.value));
        }
      }

      switch(this.project.wko.operatorDomainNamespaceSelectionStrategy.value) {
        case 'LabelSelector':
          validationObject.addField('wko-design-k8s-namespace-selection-selector-label',
            validationHelper.validateRequiredField(this.project.wko.operatorDomainNamespaceSelector.value));
          break;

        case 'Regexp':
          validationObject.addField('wko-design-k8s-namespace-selection-regexp-label',
            validationHelper.validateRequiredField(this.project.wko.operatorDomainNamespaceRegex.value));
          break;

        case 'List':
          // Allow an empty list since operator cannot handle non-existent namespaces anyway...
          //
          // If there are namespaces, make sure that they are valid Kubernetes names.
          //
          for (const namespace of this.project.wko.operatorDomainNamespacesList.value) {
            const listConfig = validationObject.getDefaultConfigObject();
            listConfig.fieldNamePayload = { namespace: namespace };
            validationObject.addField('wko-design-k8s-namespace-selection-list-label-ns',
              validationHelper.validateK8sName(namespace, false), listConfig);
          }
          break;
      }

      if (this.project.wko.externalRestEnabled.value) {
        validationObject.addField('wko-design-external-rest-port-label',
          this.project.wko.externalRestHttpsPort.validate(false));
        validationObject.addField('wko-design-external-rest-secret-label',
          this.project.wko.externalRestIdentitySecret.validate(false));
      }

      if (this.project.wko.elkIntegrationEnabled.value) {
        validationObject.addField('wko-design-3rd-party-logstash-image-label',
          this.project.wko.logStashImage.validate(false));
        validationObject.addField('wko-design-3rd-party-elastic-host-label',
          this.project.wko.elasticSearchHost.validate(false));
        validationObject.addField('wko-design-3rd-party-elastic-port-label',
          this.project.wko.elasticSearchPort.validate(false));
      }

      return validationObject;
    };

    this.convertArrayToSliceSyntax = (array) => {
      let results = '{}';
      if (array && Array.isArray(array) && array.length > 0) {
        results = `{${array.join(',')}}`;
      }
      return results;
    };
  }

  return new WkoInstaller();
});
