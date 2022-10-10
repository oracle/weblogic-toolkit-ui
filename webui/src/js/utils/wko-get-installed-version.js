/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wko-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/wkt-logger'],
function(WkoActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper) {
  class WkoInstallVersionChecker extends WkoActionsBase {
    constructor() {
      super();
    }

    async startOperatorInstallVersionCheck() {
      await this.executeAction(this.callOperatorInstallVersionCheck);
    }

    async callOperatorInstallVersionCheck(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wko-get-install-version-aborted-error-title');
      const errPrefix = 'wko-get-install-version';
      const validatableObject = this.getValidatableObject('flow-wko-get-install-version-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 5.0;
      try {
        const operatorNamespace = this.project.wko.k8sNamespace.value;
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
        dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          const status = await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('wko-get-install-version-checking-installed-in-progress',
          {operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
        if (!options.skipCheckOperatorAlreadyInstalled) {
          const status = await this.checkOperatorIsInstalled(kubectlExe, kubectlOptions, operatorNamespace, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('wko-get-install-version-get-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        const versionResults = await window.api.ipc.invoke('k8s-get-operator-version', kubectlExe, operatorNamespace, kubectlOptions);
        if (versionResults.isSuccess) {
          this.project.wko.installedVersion.value = versionResults.version;
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('wko-get-install-version-get-failed-title');
          const errMessage = i18n.t('wko-get-install-version-get-failed-error-message',
            { operatorNamespace: operatorNamespace, error: versionResults.reason });
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
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

      const wkoFormConfig = validationObject.getDefaultConfigObject();
      wkoFormConfig.formName = 'wko-design-form-name';
      validationObject.addField('wko-design-k8s-namespace-label',
        validationHelper.validateRequiredField(this.project.wko.k8sNamespace.value), wkoFormConfig);

      return validationObject;
    }

    async checkOperatorIsInstalled(kubectlExe, kubectlOptions, operatorNamespace, errTitle, errPrefix) {
      try {
        const isInstalledResults =
          await window.api.ipc.invoke('is-wko-installed', kubectlExe, operatorNamespace, kubectlOptions);

        if (!isInstalledResults.isInstalled) {
          // There should only be a reason if the backend error didn't match the expected "not found" error condition!
          let errMessage;
          if (isInstalledResults.reason) {
            errMessage = i18n.t('wko-get-install-version-installed-check-failed-error-message',
              {operatorNamespace: operatorNamespace, error: isInstalledResults.reason});
          } else {
            errMessage = i18n.t('wko-get-install-version-not-installed-error-message', { operatorNamespace: operatorNamespace });
          }
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        } else {
          // Best effort attempt to prevent users from trying to use pre-3.0 versions of operator with the UI.
          //
          if (! await this.isWkoInstalledVersionSupported(isInstalledResults, operatorNamespace, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
          if (! await this.isWkoImageVersionSupported(operatorNamespace, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }
  }
  return new WkoInstallVersionChecker();
});
