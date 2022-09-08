/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper'],
function(VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper) {
  class VzApplicationUndeployer extends VzActionsBase {
    constructor() {
      super();
    }

    async startUndeployApplication() {
      await this.executeAction(this.callUndeployApplication);
    }

    async callUndeployApplication(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('vz-application-undeployer-aborted-error-title');
      const errPrefix = 'vz-application-undeployer';
      const validatableObject = this.getValidatableObject('flow-verrazzano-undeploy-application-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      // Prompt user to remove just the domain or the entire domain namespace.
      const applicationName = this.project.vzApplication.applicationName.value;
      const applicationNamespace = this.project.k8sDomain.kubernetesNamespace.value;
      const isMultiClusterApplication = this.project.vzApplication.useMultiClusterApplication.value;

      const promptTitle = i18n.t('vz-application-undeployer-remove-namespace-prompt-title');
      const promptQuestion = i18n.t('vz-application-undeployer-remove-namespace-prompt-question',
        { name: applicationName, namespace: applicationNamespace });
      const promptDetails = i18n.t('vz-application-undeployer-remove-namespace-prompt-details', { namespace: applicationNamespace });
      const removeNamespacePromptResult = await this.removeNamespacePrompt(promptTitle, promptQuestion, promptDetails);
      if (removeNamespacePromptResult === 'cancel') {
        return Promise.resolve(false);
      }
      const removeNamespace = removeNamespacePromptResult === 'yes';

      const totalSteps = 5.0;
      const kubectlExe = this.getKubectlExe();
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);

        if (!options.skipKubectlExeValidation) {
          if (! await this.validateKubectlExe(kubectlExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // While technically not required, we force saving the project for Go Menu item behavior consistency.
        //
        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // Apply the Kubernetes context, if needed.
        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          const status = await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        /// Make sure Verrazzano is installed
        busyDialogMessage = i18n.t('flow-checking-vz-already-installed-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        if (!options.skipVzInstallCheck) {
          const result = await this.isVerrazzanoInstalled(kubectlExe, kubectlOptions, errTitle, errPrefix);
          if (!result) {
            return Promise.resolve(false);
          }
          if (!result.isInstalled) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('vz-application-undeployer-not-installed-error-message');
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        if (removeNamespace) {
          busyDialogMessage = i18n.t('vz-application-undeployer-undeploy-namespace-in-progress', { namespace: applicationNamespace });
          dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);

          const result = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            null, 'namespace', applicationNamespace, errTitle, errPrefix);
          dialogHelper.closeBusyDialog();
          if (!result) {
            return Promise.resolve(false);
          }
          const title = i18n.t('vz-application-undeployer-undeploy-complete-title');
          const message = i18n.t('vz-application-undeployer-undeploy-namespace-complete-message',
            { name: applicationName, namespace: applicationNamespace });
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          busyDialogMessage = i18n.t('vz-application-undeployer-undeploy-application-in-progress', { name: applicationName });
          dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);

          const result = await window.api.ipc.invoke('undeploy-verrazzano-application', kubectlExe,
            isMultiClusterApplication, applicationName, applicationNamespace, kubectlOptions);
          dialogHelper.closeBusyDialog();
          if (!result.isSuccess) {
            const title = i18n.t('vz-application-undeployer-undeploy-failed-title');
            const errMessage = i18n.t('vz-application-undeployer-undeploy-failed-error-message',
              { name: applicationName, namespace: applicationNamespace, error: result.reason });
            await window.api.ipc.invoke('show-error-message', title, errMessage);
            return Promise.resolve(false);
          }
          const title = i18n.t('vz-application-undeployer-undeploy-complete-title');
          const message = i18n.t('vz-application-undeployer-undeploy-complete-message',
            { name: applicationName, namespace: applicationNamespace });
          await window.api.ipc.invoke('show-info-message', title, message);
        }
        return Promise.resolve(true);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = this.getValidationObject(flowNameKey);
      const vzApplicationFormConfig = validationObject.getDefaultConfigObject();
      vzApplicationFormConfig.formName = 'vz-application-design-form-name';

      validationObject.addField('vz-application-design-name-label',
        this.project.vzApplication.applicationName.validate(true), vzApplicationFormConfig);
      validationObject.addField('vz-application-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), vzApplicationFormConfig);

      return validationObject;
    }
  }
  return new VzApplicationUndeployer();
});
