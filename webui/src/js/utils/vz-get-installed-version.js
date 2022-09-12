/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/wkt-logger'],
function(VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper) {
  class VzInstallVersionChecker extends VzActionsBase {
    constructor() {
      super();
    }

    async startVerrazzanoInstallStatusCheck() {
      await this.executeAction(this.callVerrazzanoInstallVersionCheck);
    }

    async callVerrazzanoInstallVersionCheck(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('vz-get-install-version-aborted-error-title');
      const errPrefix = 'vz-get-install-version';
      const validatableObject = this.getValidatableObject('flow-verrazzano-get-install-version-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 4;
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

        busyDialogMessage = i18n.t('vz-get-install-version-get-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        const result = await this.isVerrazzanoInstalled(kubectlExe, kubectlOptions, errTitle, errPrefix);
        dialogHelper.closeBusyDialog();
        if (!result) {
          return Promise.resolve(false);
        } else if (result.isInstalled) {
          this.project.vzInstall.actualInstalledVersion.value = result.version;
          // Skip displaying a success dialog since the value is populated
          // in the field where the user pressed the button to retrieve it.
          //
          return Promise.resolve(true);
        } else  {
          const errMessage = i18n.t('vz-get-install-version-not-installed-error-message');
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        dialogHelper.closeBusyDialog();
        return Promise.reject(err);
      }
    }

    getValidatableObject(flowNameKey) {
      return this.getValidationObject(flowNameKey);
    }
  }
  return new VzInstallVersionChecker();
});
