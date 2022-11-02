/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/vz-application-resource-generator',
  'utils/vz-application-project-generator', 'utils/wkt-logger'],
function(VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper,
  VerrazzanoApplicationResourceGenerator, VerrazzanoProjectResourceGenerator, wktLogger) {
  class VzApplicationDeployer extends VzActionsBase {
    constructor() {
      super();
    }

    async startDeployApplication() {
      await this.executeAction(this.callDeployApplication);
    }

    async callDeployApplication(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('vz-application-deployer-aborted-error-title');
      const errPrefix = 'vz-application-deployer';
      const validatableObject = this.getValidatableObject('flow-verrazzano-deploy-application-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const createProject = this.project.vzApplication.useMultiClusterApplication.value && this.project.vzApplication.createProject.value;

      const totalSteps = createProject ? 7.0 : 6.0;
      const kubectlExe = this.getKubectlExe();
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);

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

        // Apply the Kubernetes context, if needed.
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

        /// Make sure Verrazzano is installed
        busyDialogMessage = i18n.t('flow-checking-vz-already-installed-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        if (!options.skipVzInstallCheck) {
          const result = await this.isVerrazzanoInstalled(kubectlExe, kubectlOptions, errTitle, errPrefix);
          if (!result) {
            return Promise.resolve(false);
          }
          if (!result.isInstalled) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('vz-application-deployer-not-installed-error-message');
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // Verify that all referenced components are already deployed in the namespace.
        const namespace = this.project.k8sDomain.kubernetesNamespace.value;
        busyDialogMessage = i18n.t('flow-checking-vz-app-components-deployed-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);
        if (!options.skipVzComponentsDeployedCheck) {
          const appComponentNames = this.getApplicationComponentNames();
          wktLogger.debug('appComponentNames = %s', appComponentNames);
          const result = await window.api.ipc.invoke('verify-verrazzano-components-exist',
            kubectlExe, appComponentNames, namespace, kubectlOptions);
          if (!result.isSuccess) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('vz-application-deployer-verify-components-error-message',
              { namespace: namespace, error: result.reason });
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        let step = 5;
        if (createProject) {
          const vzProjectGenerator = new VerrazzanoProjectResourceGenerator();
          const projectSpec = vzProjectGenerator.generate().join('\n');

          busyDialogMessage = i18n.t('vz-application-deployer-deploy-project-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, step/totalSteps);
          const result = await window.api.ipc.invoke('deploy-verrazzano-project', kubectlExe, projectSpec, kubectlOptions);
          if (!result) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('vz-application-deployer-deploy-project-error-message',
              { projectName: this.project.vzApplication.projectName.value, error: result.reason });
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
          step++;
        }

        const vzResourceGenerator = new VerrazzanoApplicationResourceGenerator();
        const appSpec = vzResourceGenerator.generate().join('\n');

        busyDialogMessage = i18n.t('vz-application-deployer-deploy-application-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, step/totalSteps);
        const deployResult = await window.api.ipc.invoke('deploy-verrazzano-application', kubectlExe, appSpec, kubectlOptions);
        dialogHelper.closeBusyDialog();
        if (deployResult.isSuccess) {
          const title = i18n.t('vz-application-deployer-deploy-application-success-title');
          const message = i18n.t('vz-application-deployer-deploy-application-success-message',
            { name: this.project.vzApplication.applicationName.value, namespace: this.project.k8sDomain.kubernetesNamespace.value });
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          const title = i18n.t('vz-application-deployer-deploy-failed-title');
          const message = i18n.t('vz-application-deployer-deploy-failed-message', {
            name: this.project.vzApplication.applicationName.value,
            namespace: this.project.k8sDomain.kubernetesNamespace.value,
            error: deployResult.reason
          });
          await window.api.ipc.invoke('show-error-message', title, message);
        }
        return Promise.resolve(deployResult.isSuccess);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = this.getValidationObject(flowNameKey);
      const vzApplicationFormConfig = validationObject.getDefaultConfigObject();
      vzApplicationFormConfig.formName = 'vz-application-design-form-name';

      validationObject.addField('vz-application-design-name-label',
        this.project.vzApplication.applicationName.validate(true), vzApplicationFormConfig);
      validationObject.addField('vz-application-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), vzApplicationFormConfig);
      validationObject.addField('vz-component-design-installed-version-label',
        validationHelper.validateRequiredField(this.project.vzInstall.actualInstalledVersion.value), vzApplicationFormConfig);

      const createProject = this.project.vzApplication.useMultiClusterApplication.value &&
        this.project.vzApplication.createProject.value;
      if (createProject) {
        validationObject.addField('vz-application-design-project-name-label',
          this.project.vzApplication.projectName.validate(true), vzApplicationFormConfig);
      }

      // Don't allow an application with zero components...
      validationObject.addField('vz-application-design-components-label',
        validationHelper.validateRequiredField(this.project.vzApplication.components.value), vzApplicationFormConfig);

      return validationObject;
    }

    getApplicationComponentNames() {
      return this.project.vzApplication.components.value.map(component => component.name);
    }
  }
  return new VzApplicationDeployer();
});
