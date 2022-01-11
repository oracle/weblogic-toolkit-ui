/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wko-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function(WkoActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper, helmHelper) {
  class WkoUninstaller extends WkoActionsBase {
    constructor() {
      super();
    }

    async startUninstallOperator() {
      await this.executeAction(this.callUninstallOperator);
    }

    async callUninstallOperator(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wko-uninstaller-aborted-error-title');
      const errPrefix = 'wko-uninstaller';
      const validatableObject = this.getValidatableObject('flow-uninstall-operator-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const helmReleaseName = this.project.wko.wkoDeployName.value;
      const operatorNamespace = this.project.wko.k8sNamespace.value;

      const promptTitle = i18n.t('wko-uninstaller-remove-namespace-prompt-title');
      const promptQuestion = i18n.t('wko-uninstaller-remove-namespace-prompt-question',
        { name: helmReleaseName, namespace: operatorNamespace });
      const promptDetails = i18n.t('wko-uninstaller-remove-namespace-prompt-details',
        { name: helmReleaseName, namespace: operatorNamespace });
      const removeNamespacePromptResult = await this.removeNamespacePrompt(promptTitle, promptQuestion, promptDetails);
      if (removeNamespacePromptResult === 'cancel') {
        return Promise.resolve(false);
      }
      const removeNamespace = removeNamespacePromptResult === 'yes';

      const totalSteps = removeNamespace ? 8.0 : 7.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);

        const kubectlExe = this.getKubectlExe();
        if (!options.skipKubectlExeValidation) {
          if (! await this.validateKubectlExe(kubectlExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-validate-helm-exe-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        const helmExe = this.getHelmExe();
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
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          const status = await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('wko-uninstaller-checking-already-installed-in-progress',
          {operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        if (!options.skipCheckOperatorAlreadyInstalled) {
          const status = this.checkOperatorIsInstalled(kubectlExe, kubectlOptions, helmReleaseName,
            operatorNamespace, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        dialogHelper.updateBusyDialog(i18n.t('wko-uninstaller-add-chart-in-progress'), 5 / totalSteps);
        const helmOptions = helmHelper.getHelmOptions();
        if (! await this.addOperatorHelmChart(helmExe, helmOptions, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('wko-uninstaller-uninstall-in-progress', {helmReleaseName: helmReleaseName});
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);

        const installResults = await window.api.ipc.invoke('helm-uninstall-wko', helmExe, helmReleaseName,
          operatorNamespace, helmOptions);

        if (!installResults.isSuccess) {
          errTitle = i18n.t('wko-uninstaller-uninstall-failed-title');
          const errMessage = i18n.t('wko-uninstaller-uninstall-failed-error-message',
            { operatorName: helmReleaseName, operatorNamespace: operatorNamespace, error: installResults.reason });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        if (removeNamespace) {
          busyDialogMessage = i18n.t('wko-uninstaller-remove-namespace-in-progress', {namespace: operatorNamespace});
          dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
          const deleteResults = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            null, 'namespace', operatorNamespace, errTitle, errPrefix);
          if (!deleteResults) {
            return Promise.resolve(false);
          }
        }

        dialogHelper.closeBusyDialog();

        const title = i18n.t('wko-uninstaller-uninstall-complete-title');
        let message;
        if (removeNamespace) {
          message = i18n.t('wko-uninstaller-uninstall-with-namespace-complete-message',
            { operatorName: helmReleaseName, operatorNamespace: operatorNamespace });
        } else {
          message = i18n.t('wko-uninstaller-uninstall-complete-message',
            { operatorName: helmReleaseName, operatorNamespace: operatorNamespace });
        }
        await window.api.ipc.invoke('show-info-message', title, message);
        return Promise.resolve(true);
      } catch(err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-form-name';

      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);
      validationObject.addField('kubectl-helm-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.helmExecutableFilePath.value), kubectlFormConfig);

      const wkoFormConfig = validationObject.getDefaultConfigObject();
      wkoFormConfig.formName = 'wko-design-form-name';
      validationObject.addField('wko-design-wko-deploy-name-label',
        validationHelper.validateRequiredField(this.project.wko.wkoDeployName.value), wkoFormConfig);
      validationObject.addField('wko-design-k8s-namespace-label',
        validationHelper.validateRequiredField(this.project.wko.k8sNamespace.value), wkoFormConfig);

      return validationObject;
    }

    async checkOperatorIsInstalled(kubectlExe, kubectlOptions, helmReleaseName, operatorNamespace, errTitle, errPrefix) {
      try {
        const isInstalledResults =
          await window.api.ipc.invoke('is-wko-installed', kubectlExe, helmReleaseName, operatorNamespace, kubectlOptions);

        if (!isInstalledResults.isInstalled) {
          // There should only be a reason if the backend error didn't match the expected "not found" error condition!
          if (!isInstalledResults.reason) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('wko-uninstaller-not-installed-error-message', { operatorNamespace: operatorNamespace });
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else {
            const errMessage = i18n.t('wko-uninstaller-not-installed-check-failed-error-message',
              {operatorNamespace: operatorNamespace, error: isInstalledResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } else {
          // Best effort attempt to prevent users from trying to use pre-3.0 versions of operator with the UI.
          //
          if (! await this.isWkoInstalledVersionSupported(isInstalledResults, operatorNamespace, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }
  }

  return new WkoUninstaller();
});