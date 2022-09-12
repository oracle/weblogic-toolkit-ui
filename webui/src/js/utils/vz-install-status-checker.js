/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/wkt-logger'],
function(VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper) {
  class VzInstallStatusChecker extends VzActionsBase {
    constructor() {
      super();
    }

    async startVerrazzanoInstallStatusCheck() {
      await this.executeAction(this.callVerrazzanoInstallStatusCheck);
    }

    async callVerrazzanoInstallStatusCheck(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('vz-install-status-checker-aborted-error-title');
      const errPrefix = 'vz-install-status-checker';
      const validatableObject = this.getValidatableObject('flow-verrazzano-install-status-check-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 5;
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
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          const status = await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('vz-install-status-checker-checking-vz-is-installed-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        if (!options.skipVzInstallCheck) {
          const result = await this.isVerrazzanoInstalled(kubectlExe, kubectlOptions, errTitle, errPrefix);
          if (!result) {
            return Promise.resolve(false);
          }
          if (!result.isInstalled) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('vz-install-status-checker-install-check-not-installed-error-message');
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('vz-install-status-checker-checking-status-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);
        const vzOptions = {
          name: project.vzInstall.installationName.value,
          tag: project.vzInstall.versionTag.value,
          profile: project.vzInstall.installationProfile.value,
        };
        const status = await window.api.ipc.invoke('verify-verrazzano-install-status', kubectlExe, kubectlOptions, vzOptions);
        dialogHelper.closeBusyDialog();
        if (status.isSuccess) {
          if (status.isComplete) {
            this.project.vzInstall.actualInstalledVersion.value = status.version;
            const title = i18n.t('vz-install-status-checker-status-complete-title');
            const message = i18n.t('vz-install-status-checker-status-complete-message', { name: vzOptions.name });
            await window.api.ipc.invoke('show-info-message', title, message);
          } else {
            const title = i18n.t('vz-install-status-checker-status-incomplete-title');
            const message = i18n.t('vz-install-status-checker-status-incomplete-message',
              { name: vzOptions.name, message: status.payload?.message, status: status.payload?.status });
            await window.api.ipc.invoke('show-info-message', title, message);
          }
        } else {
          const title = i18n.t('vz-install-status-checker-status-failed-title');
          const message = i18n.t('vz-install-status-checker-status-failed-error-message',
            { name: vzOptions.name, error: status.reason });
          await window.api.ipc.invoke('show-error-message', title, message);
          return Promise.resolve(false);
        }
      } catch (err) {
        dialogHelper.closeBusyDialog();
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    getValidatableObject(flowNameKey) {
      return this.getValidationObject(flowNameKey);
    }
  }
  return new VzInstallStatusChecker();
});
