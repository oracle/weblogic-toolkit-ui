/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper'],
  function(project, wktConsole, i18n, projectIo, dialogHelper, validationHelper) {
    function KubernetesHelper() {
      this.project = project;

      this.startVerifyClusterConnectivity = async () => {
        return this.callVerifyClusterConnectivity();
      };

      this.callVerifyClusterConnectivity = async (options) => {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('kubectl-helper-verify-connect-aborted-title');
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
            const exeResults = await window.api.ipc.invoke('validate-kubectl-exe', kubectlExe);
            if (!exeResults.isValid) {
              const errMessage = i18n.t('kubectl-helper-kubectl-exe-invalid-error-message', {error: exeResults.reason});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          // While technically not required, we force saving the project for Go Menu item behavior consistency.
          //
          busyDialogMessage = i18n.t('flow-save-project-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
          if (!options.skipProjectSave) {
            const saveResult = await projectIo.saveProject();
            if (!saveResult.saved) {
              const errMessage = `${i18n.t('kubectl-helper-project-not-saved-error-prefix')}: ${saveResult.reason}`;
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
          const kubectlContext = this.project.kubectl.kubeConfigContextToUse.value;
          const kubectlOptions = this.getKubectlOptions();
          if (!options.skipKubectlSetContext) {
            if (kubectlContext) {
              const setResults =
                await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
              if (!setResults.isSuccess) {
                const errMessage = i18n.t('kubectl-helper-set-context-error-message', {error: setResults.reason});
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }
          }

          busyDialogMessage = i18n.t('kubectl-helper-verify-connect-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
          let verifyResult = await window.api.ipc.invoke('kubectl-verify-connection', kubectlExe, kubectlOptions);
          dialogHelper.closeBusyDialog();
          if (verifyResult.isSuccess) {
            const title = i18n.t('kubectl-helper-verify-connect-success-title');
            const message = i18n.t('kubectl-helper-verify-connect-success-message',
              {clientVersion: verifyResult.clientVersion, serverVersion: verifyResult.serverVersion});
            await window.api.ipc.invoke('show-info-message', title, message);
            return Promise.resolve(true);
          } else {
            errTitle = i18n.t('kubectl-helper-verify-connect-failed-title');
            const errMessage = i18n.t('kubectl-helper-verify-connect-failed-error-message', {error: verifyResult.reason});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } catch (err) {
          dialogHelper.closeBusyDialog();
          throw err;
        } finally {
          dialogHelper.closeBusyDialog();
        }
      };

      this.getKubectlExe = () => {
        return this.project.kubectl.executableFilePath.value;
      };

      this.getHelmExe = () => {
        return this.project.kubectl.helmExecutableFilePath.value;
      };

      this.getKubectlOptions = () => {
        return {
          kubeConfig: this.project.kubectl.kubeConfig.value,
          extraPathDirectories: this.getExtraPathDirectoriesArray(this.project.kubectl.extraPathDirectories.value)
        };
      };

      this.getKubectlContext = () => {
        return this.project.kubectl.kubeConfigContextToUse.value;
      };

      this.setKubectlContext = async (kubectlExe, kubectlContext, kubectlOptions) => {
        return window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
      };

      this.getExtraPathDirectoriesArray = (extraPathDirectoriesList) => {
        const results = [];
        if (extraPathDirectoriesList) {
          for (const item of extraPathDirectoriesList) {
            results.push(item.value);
          }
        }
        return results;
      };

      this.getValidatableObject = (flowNameKey) => {
        const validationObject = validationHelper.createValidatableObject(flowNameKey);

        validationObject.addField('kubectl-exe-file-path-label',
          validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value));

        return validationObject;
      };
    }

    return new KubernetesHelper();
  }
);
