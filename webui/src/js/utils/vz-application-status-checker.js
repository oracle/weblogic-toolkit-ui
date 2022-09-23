/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/k8s-domain-resource-generator', 'utils/k8s-domain-configmap-generator',
  'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function (VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, K8sDomainResourceGenerator,
  K8sDomainConfigMapGenerator, validationHelper) {
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

      const totalSteps = 8.0;
      try {
        const kubectlExe = this.getKubectlExe();
        const kubectlOptions = this.getKubectlOptions();
        const kubectlContext = this.getKubectlContext();
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

      const componentFormConfig = validationObject.getDefaultConfigObject();
      componentFormConfig.formName = 'vz-component-design-form-name';
      validationObject.addField('domain-design-uid-label',
        this.project.k8sDomain.uid.validate(true), componentFormConfig);

      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-title';
      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);
      validationObject.addField('kubectl-helm-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.helmExecutableFilePath.value), kubectlFormConfig);

      return validationObject;
    }
  }

  return new VerrazzanoApplicationStatusChecker();
});
