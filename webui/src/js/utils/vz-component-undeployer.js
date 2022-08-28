/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper'],
function(VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper) {
  class VzComponentUndeployer extends VzActionsBase {
    constructor() {
      super();
    }

    async startUndeployComponent() {
      await this.executeAction(this.callUndeployComponent);
    }

    async callUndeployComponent(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('vz-component-undeployer-aborted-error-title');
      const errPrefix = 'vz-component-undeployer';
      const validatableObject = this.getValidatableObject('flow-verrazzano-deploy-component-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      // Prompt user to remove just the domain or the entire domain namespace.
      const componentName = this.project.vzComponent.componentName.value;
      const componentNamespace = this.project.k8sDomain.kubernetesNamespace.value;
      const configMapName = this.project.vzComponent.configMapIsEmpty() ? undefined : this.project.k8sDomain.modelConfigMapName.value;

      const promptTitle = i18n.t('vz-component-undeployer-remove-namespace-prompt-title');
      const promptQuestion = this._getPromptQuestion(componentName, componentNamespace, configMapName);
      const promptDetails = i18n.t('vz-component-undeployer-remove-namespace-prompt-details', { componentNamespace });
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
            const errMessage = i18n.t('vz-component-undeployer-not-installed-error-message');
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        if (removeNamespace) {
          busyDialogMessage = i18n.t('vz-component-undeployer-undeploy-namespace-in-progress', { componentNamespace });
          dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);

          const result = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            null, 'namespace', componentNamespace, errTitle, errPrefix);
          dialogHelper.closeBusyDialog();
          if (!result) {
            return Promise.resolve(false);
          }
          const title = i18n.t('vz-component-undeployer-undeploy-complete-title');
          const message = configMapName ?
            i18n.t('vz-component-undeployer-undeploy-namespace-2-components-complete-message',
              { componentName, configMapComponentName: configMapName, componentNamespace }) :
            i18n.t('vz-component-undeployer-undeploy-namespace-1-component-complete-message', { componentName, componentNamespace});
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          const componentNames = configMapName ? [ componentName, configMapName ] : [ componentName ];
          busyDialogMessage = configMapName ?
            i18n.t('vz-component-undeployer-undeploy-components-in-progress', { componentName, configMapComponentName: configMapName }) :
            i18n.t('vz-component-undeployer-undeploy-component-in-progress', { componentName });
          dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);

          const result = await window.api.ipc.invoke('undeploy-verrazzano-components', kubectlExe,
            componentNames, componentNamespace, kubectlOptions);
          dialogHelper.closeBusyDialog();
          if (!result.isSuccess) {
            const title = i18n.t('vz-component-undeployer-undeploy-failed-title');
            const errMessage = configMapName ?
              i18n.t('vz-component-undeployer-undeploy-2-components-failed-error-message',
                { componentName, configMapComponentName: configMapName, componentNamespace, error: result.reason }) :
              i18n.t('vz-component-undeployer-undeploy-1-component-failed-error-message',
                { componentName, componentNamespace, error: result.reason });
            await window.api.ipc.invoke('show-error-message', title, errMessage);
            return Promise.resolve(false);
          }
          const title = i18n.t('vz-component-undeployer-undeploy-complete-title');
          const message = configMapName ?
            i18n.t('vz-component-undeployer-undeploy-2-components-complete-message',
              { componentName, configMapComponentName: configMapName, componentNamespace }) :
            i18n.t('vz-component-undeployer-undeploy-1-component-complete-message', { componentName, componentNamespace});
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
      const vzComponentFormConfig = validationObject.getDefaultConfigObject();
      vzComponentFormConfig.formName = 'vz-component-design-form-name';

      validationObject.addField('vz-component-design-name-label',
        this.project.vzComponent.componentName.validate(true), vzComponentFormConfig);
      validationObject.addField('vz-component-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), vzComponentFormConfig);

      return validationObject;
    }

    _getPromptQuestion(componentName, componentNamespace, configMapComponentName) {
      let result;
      if (configMapComponentName) {
        result = i18n.t('vz-component-undeployer-remove-namespace-2-component-prompt-question',
          { componentName, componentNamespace, configMapComponentName });
      } else {
        result = i18n.t('vz-component-undeployer-remove-namespace-1-component-prompt-question',
          { componentName, componentNamespace });
      }
      return result;
    }
  }
  return new VzComponentUndeployer();
});
