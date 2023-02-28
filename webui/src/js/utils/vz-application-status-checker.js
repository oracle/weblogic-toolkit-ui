/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/k8s-domain-resource-generator', 'utils/k8s-domain-configmap-generator',
  'utils/validation-helper', 'utils/wkt-logger'],
function (VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, K8sDomainResourceGenerator,
  K8sDomainConfigMapGenerator, validationHelper, wktLogger) {
  class VerrazzanoApplicationStatusChecker extends VzActionsBase {
    constructor() {
      super();
    }

    async startCheckApplicationStatus() {
      await this.executeAction(this.callCheckApplicationStatus);
    }

    async callCheckApplicationStatus() {
      let errTitle = i18n.t('vz-application-status-checker-get-status-failed-title-message');
      let errPrefix = 'vz-application-status-checker';
      const validatableObject = this.getValidatableObject('flow-verrazzano-get-application-status-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      let clusterToCheck;
      const targetClusters = this._getTargetClusters();
      if (targetClusters.length > 1) {
        const args = [ ];
        targetClusters.forEach(targetCluster => args.push({ name:targetCluster, label: targetCluster }));
        const result = await dialogHelper.promptDialog('vz-application-status-choose-cluster-dialog',
          { targetClusters: args });
        if (result?.clusterName) {
          clusterToCheck = result.clusterName;
        } else {
          return Promise.resolve(false);
        }
      } else if (targetClusters.length === 1) {
        clusterToCheck = targetClusters[0];
      }

      const managedClusterData = this._getTargetCluster(clusterToCheck);
      const targetClusterKubeConfig = managedClusterData ? managedClusterData.kubeConfig : undefined;
      const targetClusterKubeContext = managedClusterData ? managedClusterData.kubeContext : undefined;

      const totalSteps = 8.0;
      try {
        const kubectlExe = this.getKubectlExe();
        const kubectlOptions = this.getKubectlOptions(targetClusterKubeConfig);
        const kubectlContext = targetClusterKubeContext || this.getKubectlContext();
        let operatorMajorVersion = '';

        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);
        if (! await this.validateKubectlExe(kubectlExe, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);
        if (! await this.saveProject(errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
        if (!await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-validate-vz-application-namespace-in-progress',
          {namespace: this.project.k8sDomain.kubernetesNamespace.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);

        const nsStatus = await this.validateKubernetesNamespaceExists(kubectlExe, kubectlOptions,
          this.project.k8sDomain.kubernetesNamespace.value, errTitle, errPrefix);
        if (!nsStatus) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-validate-vz-application-in-progress',
          {application: this.project.vzApplication.applicationName.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        if (! await this.validateApplicationExists(kubectlExe, kubectlOptions, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-validate-vz-domain-in-progress',
          {domain: this.project.k8sDomain.uid.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        if (! await this.validateDomainExists(kubectlExe, kubectlOptions, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-getting-vz-application-status-in-progress',
          {domain: this.project.k8sDomain.uid.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);

        const applicationStatusResult = await window.api.ipc.invoke('vz-get-application-status', kubectlExe,
          this.project.vzApplication.applicationName.value, this.project.k8sDomain.uid.value,
          this.project.k8sDomain.kubernetesNamespace.value, kubectlOptions);
        wktLogger.debug('applicationStatusResult = %s', JSON.stringify(applicationStatusResult, null, 2));
        if (!applicationStatusResult.isSuccess) {
          const errMessage = i18n.t('vz-application-status-checker-get-status-failed-error-message',
            {error: applicationStatusResult.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-checking-operator-version-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);

        const operatorVersionResult = await window.api.ipc.invoke('k8s-get-operator-version-from-domain-config-map',
          kubectlExe, this.project.k8sDomain.kubernetesNamespace.value, kubectlOptions);
        if (operatorVersionResult.isSuccess) {
          operatorMajorVersion = operatorVersionResult.operatorVersion.split('.')[0];
        }

        dialogHelper.closeBusyDialog();

        let domainStatus = applicationStatusResult.domainStatus;
        if (typeof domainStatus === 'undefined') {
          domainStatus = {};
        }
        const results = this.buildDomainStatus(domainStatus, operatorMajorVersion);
        results['domainStatus'] = domainStatus;
        const options = {
          clusterName: clusterToCheck,
          domainStatus: results.domainStatus,
          domainOverallStatus: results.domainOverallStatus,
          applicationName: this.project.vzApplication.applicationName.value,
          domainName: this.project.k8sDomain.uid.value
        };
        dialogHelper.openDialog('vz-application-status-dialog', options);

        return Promise.resolve(true);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      validationObject.addField('vz-application-design-name-label',
        this.project.vzApplication.applicationName.validate(true));
      validationObject.addField('vz-application-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true));
      if (this.project.vzApplication.useMultiClusterApplication.value) {
        validationObject.addField('vz-application-design-cluster-names-label',
          validationHelper.validateRequiredField(this.project.vzApplication.placementClusters.value));
      }

      const componentFormConfig = validationObject.getDefaultConfigObject();
      componentFormConfig.formName = 'vz-component-design-form-name';
      validationObject.addField('domain-design-uid-label',
        this.project.k8sDomain.uid.validate(true), componentFormConfig);

      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-title';
      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);

      if (this.project.vzApplication.useMultiClusterApplication.value) {
        const targetClusters = this.project.vzApplication.placementClusters.value;
        if (targetClusters.length > 0) {
          for (const targetCluster of targetClusters) {
            if (targetCluster !== 'local') {
              this._validateVerrazzanoManagedClusterConnectivityEntry(validationObject, kubectlFormConfig, targetCluster);
            }
          }
        }
      }

      return validationObject;
    }

    _getTargetClusters() {
      if (this.project.vzApplication.useMultiClusterApplication.value) {
        return this.project.vzApplication.placementClusters.value;
      } else {
        return ['local'];
      }
    }

    _getTargetCluster(clusterName) {
      if (clusterName !== 'local') {
        return this.project.kubectl.vzManagedClusters.observable().find(managedCluster =>
          managedCluster.name === clusterName);
      }
    }

    _validateVerrazzanoManagedClusterConnectivityEntry(validationObject, kubectlFormConfig, targetManagedClusterName) {
      let found = false;
      for (const managedClusterData of this.project.kubectl.vzManagedClusters.observable()) {
        if (targetManagedClusterName === managedClusterData.name) {
          found = true;
          break;
        }
      }

      if (!found) {
        const errorMessage = i18n.t('vz-application-status-checker-vz-managed-cluster-not-found-error',
          { clusterName: targetManagedClusterName});
        validationObject.addField('kubectl-vz-managed-cluster-name-heading',
          [errorMessage], kubectlFormConfig);
      }
    }
  }

  return new VerrazzanoApplicationStatusChecker();
});
