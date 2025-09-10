/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
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
      await this.executeAction(this.callVerifyClusterConnectivity);
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

      let clusterToCheck;
      const availableClusters = this._getTargetClusters();
      if (availableClusters.length > 1) {
        const args = [ ];
        availableClusters.forEach(availableCluster => args.push({
          name: availableCluster.name,
          label: availableCluster.name
        }));
        const result = await dialogHelper.promptDialog('k8s-helper-choose-cluster-dialog',
          { availableClusters: args });
        if (result && result.clusterName) {
          clusterToCheck = result.clusterName;
        } else {
          return Promise.resolve(false);
        }
      } else if (availableClusters.length === 1) {
        clusterToCheck = availableClusters[0].name;
      }

      const { targetClusterKubeConfig, targetClusterKubeContext } = this._getTargetCluster(clusterToCheck);

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
        const kubectlContext = targetClusterKubeContext || this.project.kubectl.kubeConfigContextToUse.value;
        const kubectlOptions = this.getKubectlOptions(targetClusterKubeConfig);
        if (!options.skipKubectlSetContext) {
          if (! await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('kubectl-helper-verify-connect-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        const verifyConnectivityResult = await this.verifyConnectivity(kubectlExe, kubectlOptions, clusterToCheck);
        return Promise.resolve(verifyConnectivityResult);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    async verifyConnectivity(kubectlExe, kubectlOptions, clusterToCheck) {
      try {
        const verifyResult = await window.api.ipc.invoke('kubectl-verify-connection', kubectlExe, kubectlOptions);
        dialogHelper.closeBusyDialog();
        const clusterName = clusterToCheck || '';
        if (verifyResult.isSuccess) {
          const title = i18n.t('kubectl-helper-verify-connect-success-title', { clusterName });
          const message = i18n.t('kubectl-helper-verify-connect-success-message',
            { clientVersion: verifyResult.clientVersion, serverVersion: verifyResult.serverVersion, clusterName });
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          const errTitle = i18n.t('kubectl-helper-verify-connect-failed-title', { clusterName });
          const errMessage = i18n.t('kubectl-helper-verify-connect-failed-error-message',
            { error: verifyResult.reason, clusterName});
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

    _getTargetClusters() {
      let clusters = [];
      if (this.project.settings.wdtTargetType.value === 'vz') {
        clusters.push({
          name: 'local',
          kubeConfig: this.project.kubectl.kubeConfig.value,
          kubeContext: this.project.kubectl.kubeConfigContextToUse.value
        });
        this.project.kubectl.vzManagedClusters.observable()
          .forEach(managedClusterData => clusters.push(managedClusterData));
      }
      return clusters;
    }

    _getTargetCluster(clusterToCheck) {
      const result = {
        targetClusterKubeConfig: undefined,
        targetClusterKubeContext: undefined
      };
      if (clusterToCheck) {
        const clusterData = this._getTargetClusters().find(cluster => clusterToCheck === cluster.name);
        if (clusterData) {
          result.targetClusterKubeConfig = clusterData.kubeConfig;
          result.targetClusterKubeContext = clusterData.kubeContext;
        }
      }
      return result;
    }
  }

  return new KubernetesHelper();
});
