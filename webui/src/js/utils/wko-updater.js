/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wko-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function(WkoActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper, helmHelper, wktLogger) {
  class WkoUpdater extends WkoActionsBase {
    constructor() {
      super();
    }

    async startUpdateOperator() {
      await this.executeAction(this.callUpdateOperator);
    }

    async callUpdateOperator(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wko-updater-aborted-error-title');
      const errPrefix = 'wko-updater';
      const validatableObject = this.getValidatableObject('flow-update-operator-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 11.0;
      try {
        const helmReleaseName = this.project.wko.wkoDeployName.value;
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

        busyDialogMessage = i18n.t('wko-updater-checking-installed-in-progress',
          {operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        if (!options.skipCheckOperatorAlreadyInstalled) {
          const status = await this.checkOperatorIsInstalled(kubectlExe, kubectlOptions, helmReleaseName,
            operatorNamespace, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        // If using the List selection strategy, validate any namespaces the user may have entered.
        //
        busyDialogMessage = i18n.t('wko-updater-validating-namespaces-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        if (!options.skipValidateMonitoredNamespacesExist) {
          if (!await this.validateOperatorNamespaces(kubectlExe, kubectlOptions, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('wko-updater-create-ns-in-progress', {operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
        if (!options.skipCreateOperatorNamespace) {
          if (! await this.createKubernetesNamespace(kubectlExe, kubectlOptions, operatorNamespace, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        const operatorServiceAccount = this.project.wko.k8sServiceAccount.value;
        busyDialogMessage = i18n.t('wko-updater-create-sa-in-progress',
          { operatorServiceAccount: operatorServiceAccount, operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
        if (!options.skipCreateOperatorServiceAccount) {
          const status = await this.createOperatorServiceAccount(kubectlExe, kubectlOptions, operatorNamespace,
            operatorServiceAccount, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        const operatorPullSecretName = this.project.wko.operatorImagePullSecretName.value;
        busyDialogMessage = i18n.t('wko-updater-create-pull-secret-in-progress', {secretName: operatorPullSecretName});
        dialogHelper.updateBusyDialog(busyDialogMessage, 8 / totalSteps);
        if (!options.skipCreateOperatorPullSecret) {
          const status = await this.createOperatorPullSecret(kubectlExe, kubectlOptions, operatorNamespace,
            operatorPullSecretName, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        dialogHelper.updateBusyDialog(i18n.t('wko-updater-add-chart-in-progress'), 9 / totalSteps);
        const helmOptions = helmHelper.getHelmOptions();
        if (! await this.addOperatorHelmChart(helmExe, helmOptions, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('wko-updater-update-in-progress', {helmReleaseName: helmReleaseName});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
        const helmChartValues = this.getWkoHelmChartValues(operatorServiceAccount);
        wktLogger.debug('helmChartValues = %s', JSON.stringify(helmChartValues, null, 2));

        const updateResults = await window.api.ipc.invoke('helm-update-wko', helmExe, helmReleaseName,
          operatorNamespace, helmChartValues, helmOptions, kubectlExe, kubectlOptions);

        dialogHelper.closeBusyDialog();
        if (updateResults.isSuccess) {
          const title = i18n.t('wko-updater-update-complete-title');
          const message = i18n.t('wko-updater-update-complete-message',
            { operatorName: helmReleaseName, operatorNamespace: operatorNamespace });
          this.project.wko.installedVersion.value = updateResults.version;
          await window.api.ipc.invoke('show-info-message', title, message);
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('wko-updater-update-failed-title');
          const errMessage = i18n.t('wko-updater-update-failed-error-message',
            { operatorName: helmReleaseName, operatorNamespace: operatorNamespace, error: updateResults.reason });
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

    async checkOperatorIsInstalled(kubectlExe, kubectlOptions, helmReleaseName, operatorNamespace, errTitle, errPrefix) {
      try {
        const isInstalledResults =
          await window.api.ipc.invoke('is-wko-installed', kubectlExe, operatorNamespace, kubectlOptions);

        if (!isInstalledResults.isInstalled) {
          // There should only be a reason if the backend error didn't match the expected "not found" error condition!
          let errMessage;
          if (isInstalledResults.reason) {
            errMessage = i18n.t('wko-updater-installed-check-failed-error-message',
              {operatorNamespace: operatorNamespace, error: isInstalledResults.reason});
          } else {
            errMessage = i18n.t('wko-updater-not-installed-error-message', { operatorNamespace: operatorNamespace });
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

  return new WkoUpdater();
});
