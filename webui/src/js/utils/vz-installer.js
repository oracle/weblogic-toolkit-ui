/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/vz-install-resource-generator', 'utils/wkt-logger'],
function(VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper, VerrazzanoInstallResourceGenerator) {
  class VzInstaller extends VzActionsBase {
    constructor() {
      super();
    }

    async startInstallVerrazzano() {
      await this.executeAction(this.callInstallVerrazzano);
    }

    async callInstallVerrazzano(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('vz-installer-aborted-error-title');
      const errPrefix = 'vz-installer';
      const validatableObject = this.getValidatableObject('flow-install-verrazzano-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 7.0;
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

        busyDialogMessage = i18n.t('flow-checking-vz-already-installed-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        if (!options.skipVzInstallCheck) {
          const result = await this.isVerrazzanoInstalled(kubectlExe, kubectlOptions, errTitle, errPrefix);
          if (!result) {
            return Promise.resolve(false);
          }
          if (result.isInstalled) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('vz-installer-already-installed-error-message', { name: result.name, version: result.version});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('vz-installer-install-operator-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);
        const vzOptions = {
          name: project.vzInstall.installationName.value,
          tag: project.vzInstall.versionTag.value,
          profile: project.vzInstall.installationProfile.value,
          operatorRolloutCheckIterations: 3,
          operatorRolloutWaitTimeMillis: 5000
        };
        const operatorInstallResult =
          await window.api.ipc.invoke('install-verrazzano-platform-operator', kubectlExe, kubectlOptions, vzOptions);
        if (!operatorInstallResult.isSuccess) {
          dialogHelper.closeBusyDialog();
          const errMessage = i18n.t('vz-installer-operator-install-failed-error-message',
            { tag: vzOptions.tag, error: operatorInstallResult.reason });
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('vz-installer-verify-operator-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 5/totalSteps);
        const operatorRolloutStatus =
          await window.api.ipc.invoke('verify-verrazzano-platform-operator-install', kubectlExe, kubectlOptions, vzOptions);
        if (!operatorRolloutStatus.isSuccess) {
          dialogHelper.closeBusyDialog();
          const errMessage = i18n.t('vz-installer-verify-operator-failed-error-message', { error: operatorRolloutStatus.reason });
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('vz-installer-install-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 6/totalSteps);
        const vzInstallResource = (new VerrazzanoInstallResourceGenerator()).generate().join('\n');
        const vzInstallResult = await window.api.ipc.invoke('install-verrazzano', kubectlExe, kubectlOptions, vzInstallResource);
        dialogHelper.closeBusyDialog();
        if (vzInstallResult.isSuccess) {
          const title = i18n.t('vz-installer-install-started-title');
          const message = i18n.t('vz-installer-install-started-message', { name: vzOptions.name, version: vzOptions.tag.slice(1)});
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          const title = i18n.t('vz-installer-install-failed-title');
          const message = i18n.t('vz-installer-install-failed-error-message', { name: vzOptions.name, error: vzInstallResult.reason });
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
      const validatableObject = this.getValidationObject(flowNameKey);
      const vzInstallFormConfig = validatableObject.getDefaultConfigObject();
      vzInstallFormConfig.formName = 'vz-install-design-form-name';

      validatableObject.addField('vz-install-design-version-label',
        validationHelper.validateRequiredField(this.project.vzInstall.versionTag.value), vzInstallFormConfig);

      return validatableObject;
    }
  }
  return new VzInstaller();
});
