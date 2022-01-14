/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/k8s-domain-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/k8s-domain-resource-generator', 'utils/k8s-domain-configmap-generator',
  'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function (K8sDomainActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, K8sDomainResourceGenerator,
  K8sDomainConfigMapGenerator, validationHelper, helmHelper, wktLogger) {
  class K8sDomainUndeployer extends K8sDomainActionsBase {
    constructor() {
      super();
    }

    async startUndeployDomain() {
      await this.executeAction(this.callUndeployDomain);
    }

    async callUndeployDomain(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('k8s-domain-undeployer-aborted-error-title');
      const errPrefix = 'k8s-domain-undeployer';

      const validatableObject = this.getValidatableObject('flow-undeploy-domain-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      // Prompt user to remove just the domain or the entire domain namespace.
      const domainUid = this.project.k8sDomain.uid.value;
      const domainNamespace = this.project.k8sDomain.kubernetesNamespace.value;

      const promptTitle = i18n.t('k8s-domain-undeployer-remove-namespace-prompt-title');
      const promptQuestion = i18n.t('k8s-domain-undeployer-remove-namespace-prompt-question',
        { name: domainUid, namespace: domainNamespace });
      const promptDetails = i18n.t('k8s-domain-undeployer-remove-namespace-prompt-details',
        { name: domainUid, namespace: domainNamespace });
      const removeNamespacePromptResult = await this.removeNamespacePrompt(promptTitle, promptQuestion, promptDetails);
      if (removeNamespacePromptResult === 'cancel') {
        return Promise.resolve(false);
      }
      const removeNamespace = removeNamespacePromptResult === 'yes';
      const updateOperatorList = removeNamespace &&
        this.project.wko.operatorDomainNamespaceSelectionStrategy.value === 'List' &&
        this.project.wko.operatorDomainNamespacesList.observable().includes(domainNamespace);

      const totalSteps = updateOperatorList ? 8.0 : 5.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

        const kubectlExe = this.getKubectlExe();
        if (!options.skipKubectlExeValidation) {
          if (! await this.validateKubectlExe(kubectlExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        let step = 1;
        const helmExe = this.getHelmExe();
        if (updateOperatorList && !options.skipHelmExeValidation) {
          busyDialogMessage = i18n.t('flow-validate-helm-exe-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
          if (! await this.validateHelmExe(helmExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
          step++;
        }

        // While technically not required, we force saving the project for Go Menu item behavior consistency.
        //
        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }
        step++;

        // Set the Kubernetes context, if needed
        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          if (! await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }
        step++;

        // Make sure that the domain or namespace exists
        if (removeNamespace) {
          busyDialogMessage = i18n.t('flow-namespace-exists-check-in-progress', { namespace: domainNamespace });
          dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
          if (!await this.validateKubernetesNamespaceExists(kubectlExe, kubectlOptions, domainNamespace, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        } else {
          busyDialogMessage = i18n.t('flow-domain-exists-check-in-progress', {domainUid: domainUid});
          dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
          if (!await this.validateDomainExists(kubectlExe, kubectlOptions, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }
        step++;

        let deleteResult;
        if (removeNamespace) {
          const operatorName = this.project.wko.wkoDeployName.value;
          const operatorNamespace = this.project.wko.k8sNamespace.value;

          let operatorInstalled;
          if (updateOperatorList) {
            busyDialogMessage = i18n.t('flow-checking-operator-installed-in-progress',
              {operatorName: operatorName, Namespace: operatorNamespace});
            dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
            if (!options.skipCheckOperatorAlreadyInstalled) {
              const isInstalledResult = await this.checkOperatorIsInstalled(kubectlExe, kubectlOptions,
                operatorName, operatorNamespace, errTitle);
              if (!isInstalledResult) {
                return Promise.resolve(false);
              }
              operatorInstalled = isInstalledResult.isInstalled;
            }
            step++;
          }

          busyDialogMessage = i18n.t('flow-undeploy-namespace-in-progress', { domainNamespace: domainNamespace });
          dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
          deleteResult = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            null, 'namespace', domainNamespace, errTitle, errPrefix);

          if (deleteResult && updateOperatorList) {
            step++;
            busyDialogMessage = i18n.t('k8s-domain-undeployer-update-operator-config-in-progress',
              {operatorName: operatorName, operatorNamespace: operatorNamespace, domainNamespace: domainNamespace});
            dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
            if (operatorInstalled) {
              const list = this.removeDomainNamespaceFromList(domainNamespace);
              const helmChartValues = {
                domainNamespaces: `{${list.join(',')}}`
              };

              const upgradeResults = await window.api.ipc.invoke('helm-update-wko', helmExe, operatorName,
                operatorNamespace, helmChartValues, helmHelper.getHelmOptions());
              if (!upgradeResults.isSuccess) {
                const errMessage = i18n.t('k8s-domain-undeployer-remove-domain-error-message',
                  {
                    domainNamespace: domainNamespace,
                    operatorName: operatorName,
                    operatorNamespace: operatorNamespace,
                    error: upgradeResults.reason
                  });
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }
          }
        } else {
          busyDialogMessage = i18n.t('flow-undeploy-domain-in-progress', { domainUid: domainUid });
          dialogHelper.updateBusyDialog(busyDialogMessage, step / totalSteps);
          deleteResult = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            domainNamespace, 'domain', domainUid, errTitle, errPrefix);
        }

        wktLogger.debug('deleteResult = %s', deleteResult);
        if (deleteResult) {
          dialogHelper.closeBusyDialog();
          const title = i18n.t('k8s-domain-undeployer-undeploy-complete-title');
          let message;
          if (removeNamespace) {
            message = i18n.t('k8s-domain-undeployer-undeploy-namespace-complete-message',
              {domainName: domainUid, domainNamespace: domainNamespace});
          } else {
            message = i18n.t('k8s-domain-undeployer-undeploy-domain-complete-message',
              {domainName: domainUid, domainNamespace: domainNamespace});
          }
          await window.api.ipc.invoke('show-info-message', title, message);
        }
        return Promise.resolve(deleteResult);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const domainFormConfig = validationObject.getDefaultConfigObject();
      domainFormConfig.formName = 'domain-design-form-name';

      validationObject.addField('domain-design-uid-label', this.project.k8sDomain.uid.validate(true), domainFormConfig);
      validationObject.addField('domain-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), domainFormConfig);

      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-form-name';
      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);

      return validationObject;
    }

    async checkOperatorIsInstalled(kubectlExe, kubectlOptions, operatorName, operatorNamespace, errTitle) {
      const results = { isInstalled: true };
      try {
        const isInstalledResults =
          await window.api.ipc.invoke('is-wko-installed', kubectlExe, operatorName, operatorNamespace, kubectlOptions);
        if (!isInstalledResults.isInstalled) {
          if (isInstalledResults.reason) {
            // error from backend
            const errMessage = i18n.t('k8s-domain-undeployer-operator-installed-check-failed-error-message',
              {operatorName: operatorName, operatorNamespace: operatorNamespace, error: isInstalledResults.reason});
            wktLogger.error(errMessage);
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else {
            results.isInstalled = false;
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(results);
    }

    removeDomainNamespaceFromList(domainNamespace) {
      const domainNamespaceList = this.project.wko.operatorDomainNamespacesList.value;
      const position = domainNamespaceList.indexOf(domainNamespace);
      if (position >= 0) {
        domainNamespaceList.splice(position, 1);
        this.project.wko.operatorDomainNamespacesList.value = domainNamespaceList;
      }
      return this.project.wko.operatorDomainNamespacesList.value;
    }
  }

  return new K8sDomainUndeployer();
});
