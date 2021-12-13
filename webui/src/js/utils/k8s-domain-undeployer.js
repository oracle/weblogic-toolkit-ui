/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/k8s-domain-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/k8s-domain-resource-generator', 'utils/k8s-domain-configmap-generator',
  'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function (K8sDomainActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, K8sDomainResourceGenerator,
  K8sDomainConfigMapGenerator, validationHelper, helmHelper, wktLogger) {
  class K8sDomainUndeployer extends K8sDomainActionsBase {
    constructor() {
      super();
    }

    async startUndeployDomain() {
      return this.callUndeployDomain();
    }

    async callUndeployDomain(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('k8s-domain-undeployer-aborted-error-title');
      const errPrefix = 'k8s-domain-undeployer';

      // Prompt user to remove just the domain or the entire domain namespace.
      const domainUid = this.project.k8sDomain.uid.value;
      const domainNamespace = this.project.k8sDomain.kubernetesNamespace.value;

      // Only prompt if the UID and namespace are provided.
      // Otherwise, let it fall through for validation to detect
      // and alert the user to all missing required fields.
      //
      let promptResult = 'cancel';
      if (domainUid && domainNamespace) {
        const promptTitle = i18n.t('k8s-domain-undeployer-scope-prompt-title');
        const promptQuestion = i18n.t('k8s-domain-undeployer-scope-prompt-question',
          { domainUid: domainUid, domainNamespace: domainNamespace });
        const promptDetails = i18n.t('k8s-domain-undeployer-scope-prompt-details',
          { domainUid: domainUid, domainNamespace: domainNamespace });

        promptResult = await window.api.ipc.invoke('domain-undeploy-scope-prompt',
          promptTitle, promptQuestion, promptDetails);

        // If the user chose to cancel, then simply return.
        if (promptResult === 'cancel') {
          return Promise.resolve('false');
        }
      }

      const validatableObject = this.getValidatableObject('flow-undeploy-domain-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      // This is a sanity check.  It should never be true!
      if (promptResult === 'cancel') {
        const errMessage = i18n.t('k8s-domain-undeployer-prompt-result-assertion-error-message');
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      const totalSteps = 4.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

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

        // Set the Kubernetes context, if needed
        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          if (! await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        let deleteResult;
        if (promptResult === 'domain') {
          busyDialogMessage = i18n.t('flow-undeploy-domain-in-progress', { domainUid: domainUid });
          dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
          deleteResult = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            domainNamespace, 'domain', domainUid, errTitle, errPrefix);
        } else {
          busyDialogMessage = i18n.t('flow-undeploy-namespace-in-progress', { domainNamespace: domainNamespace });
          dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
          deleteResult = await this.deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions,
            null, 'namespace', domainNamespace, errTitle, errPrefix);
        }

        wktLogger.debug('deleteResult = %s', deleteResult);
        if (deleteResult) {
          dialogHelper.closeBusyDialog();
          const title = i18n.t('k8s-domain-undeployer-undeploy-complete-title');
          let message;
          if (promptResult === 'domain') {
            message = i18n.t('k8s-domain-undeployer-undeploy-domain-complete-message',
              {domainName: domainUid, domainNamespace: domainNamespace});
          } else {
            message = i18n.t('k8s-domain-undeployer-undeploy-namespace-complete-message',
              {domainName: domainUid, domainNamespace: domainNamespace});
          }
          await window.api.ipc.invoke('show-info-message', title, message);
        }
        return Promise.resolve(deleteResult);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const domainFormConfig = validationObject.getDefaultConfigObject();
      domainFormConfig.formName = 'domain-design-form-name';

      validationObject.addField('domain-design-uid-label', this.project.k8sDomain.uid.validate(true), domainFormConfig);
      validationObject.addField('domain-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), domainFormConfig);

      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-form-name';
      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);

      return validationObject;
    }
  }

  return new K8sDomainUndeployer();
});
