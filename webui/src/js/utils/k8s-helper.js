/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper'],
function(WktActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper) {
  class KubernetesHelper extends WktActionsBase {
    constructor() {
      super();
    }

    async startVerifyClusterConnectivity() {
      return this.callVerifyClusterConnectivity();
    }

    async callVerifyClusterConnectivity(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('kubectl-helper-verify-connect-aborted-title');
      const errPrefix = 'kubectl-helper';
      const validatableObject = this.getValidatableObject('flow-verify-kubectl-connectivity-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 4.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

        const kubectlExe = this.project.kubectl.executableFilePath.value;
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

        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
        const kubectlContext = this.project.kubectl.kubeConfigContextToUse.value;
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          if (! await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('kubectl-helper-verify-connect-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        const verifyConnectivityResult = await this.verifyConnectivity(kubectlExe, kubectlOptions);
        return Promise.resolve(verifyConnectivityResult);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    async verifyConnectivity(kubectlExe, kubectlOptions) {
      try {
        const verifyResult = await window.api.ipc.invoke('kubectl-verify-connection', kubectlExe, kubectlOptions);
        dialogHelper.closeBusyDialog();
        if (verifyResult.isSuccess) {
          const title = i18n.t('kubectl-helper-verify-connect-success-title');
          const message = i18n.t('kubectl-helper-verify-connect-success-message',
            {clientVersion: verifyResult.clientVersion, serverVersion: verifyResult.serverVersion});
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          const errTitle = i18n.t('kubectl-helper-verify-connect-failed-title');
          const errMessage = i18n.t('kubectl-helper-verify-connect-failed-error-message', {error: verifyResult.reason});
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-form-name';

      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);

      return validationObject;
    }
  }

  return new KubernetesHelper();
});
