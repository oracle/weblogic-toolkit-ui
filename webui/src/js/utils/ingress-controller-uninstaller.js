/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/ingress-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/k8s-helper', 'utils/i18n',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/helm-helper'],
function(IngressActionsBase, project, wktConsole, k8sHelper, i18n, dialogHelper, validationHelper, helmHelper) {
  class IngressControllerUninstaller extends IngressActionsBase {
    constructor() {
      super();
    }

    async startUninstallIngressController() {
      await this.executeAction(this.callUninstallIngressController);
    }

    async callUninstallIngressController(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('ingress-uninstaller-aborted-error-title');
      let errPrefix = 'ingress-uninstaller';
      if (this.project.ingress.installIngressController.value === false) {
        const message = i18n.t('ingress-uninstaller-not-install-message');
        await window.api.ipc.invoke('show-info-message', errTitle, message);
        return Promise.resolve(true);
      }

      const validatableObject = this.getValidatableObject('flow-uninstall-ingress-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const ingressControllerProvider = this.project.ingress.ingressControllerProvider.value;
      const ingressControllerNamespace = this.project.ingress.ingressControllerNamespace.value;
      const ingressControllerName = this.project.ingress.ingressControllerName.value;

      const providerName = i18n.t(`ingress-design-type-${ingressControllerProvider}-label`);
      const promptTitle = i18n.t('ingress-uninstaller-remove-namespace-prompt-title',
        { provider: providerName });
      const promptQuestion = i18n.t('ingress-uninstaller-remove-namespace-prompt-question',
        { provider: providerName, name: ingressControllerName, namespace: ingressControllerNamespace });
      const promptDetails = i18n.t('ingress-uninstaller-remove-namespace-prompt-details',
        { provider: providerName, name: ingressControllerName, namespace: ingressControllerNamespace });
      const removeNamespacePromptResult = await this.removeNamespacePrompt(promptTitle, promptQuestion, promptDetails);
      if (removeNamespacePromptResult === 'cancel') {
        return Promise.resolve(false);
      }
      const removeNamespace = removeNamespacePromptResult === 'yes';

      const totalSteps = removeNamespace ? 7.0 : 6.0;
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

        const helmOptions = helmHelper.getHelmOptions();

        busyDialogMessage = i18n.t('ingress-uninstaller-checking-installed-in-progress',
          { name: ingressControllerName, namespace: ingressControllerNamespace });
        dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);

        if (!options.skipIngressInstalledValidation) {
          const isInstalled = await this.isIngressControllerInstalled(helmExe, helmOptions, ingressControllerProvider,
            ingressControllerName, ingressControllerNamespace, errTitle, errPrefix);
          if (!isInstalled) {
            return Promise.resolve(false);
          } else if (isInstalled.isInstalled === false) {
            const errMessage = i18n.t('ingress-uninstaller-ingress-not-installed-error-message',
              { name: ingressControllerName, namespace: ingressControllerNamespace });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('ingress-uninstaller-uninstall-in-progress',
          { provider: providerName, name: ingressControllerName, namespace: ingressControllerNamespace });
        dialogHelper.updateBusyDialog(busyDialogMessage, 5/totalSteps);
        const uninstallResults = await window.api.ipc.invoke('helm-uninstall-ingress-controller',
          helmExe, ingressControllerName, ingressControllerNamespace, helmOptions);


        if (!uninstallResults.isSuccess) {
          errTitle = i18n.t('ingress-uninstaller-uninstall-failed-title', { provider: providerName });
          const errMessage = i18n.t('ingress-uninstaller-uninstall-failed-error-message',
            {
              provider: providerName,
              name: ingressControllerName,
              namespace: ingressControllerNamespace,
              error: uninstallResults.reason
            });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        if (removeNamespace) {
          busyDialogMessage = i18n.t('ingress-uninstaller-remove-namespace-in-progress',
            { namespace: ingressControllerNamespace });
          dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
          const deleteResults = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            null, 'namespace', ingressControllerNamespace, errTitle, errPrefix);
          if (!deleteResults) {
            return Promise.resolve(false);
          }
        }

        const title = i18n.t('ingress-uninstaller-uninstall-complete-title', { provider: providerName });
        let message;
        if (removeNamespace) {
          message = i18n.t('ingress-uninstaller-uninstall-complete-with-namespace-message',
            {provider: providerName, name: ingressControllerName, namespace: ingressControllerNamespace});
        } else {
          message = i18n.t('ingress-uninstaller-uninstall-complete-message',
            {provider: providerName, name: ingressControllerName, namespace: ingressControllerNamespace});
        }
        dialogHelper.closeBusyDialog();
        await window.api.ipc.invoke('show-info-message', title, message);
        return Promise.resolve(true);
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
      validationObject.addField('ingress-design-ingress-namespace-label',
        this.project.ingress.ingressControllerNamespace.validate(true), ingressFormConfig);
      validationObject.addField('ingress-design-ingress-name-label',
        this.project.ingress.ingressControllerName.validate(true), ingressFormConfig);

      return validationObject;
    }
  }

  return new IngressControllerUninstaller();
});
