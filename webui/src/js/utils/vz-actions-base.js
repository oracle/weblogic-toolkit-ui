/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/k8s-domain-actions-base', 'utils/validation-helper', 'utils/dialog-helper', 'utils/i18n'],
  function (K8sDomainActionsBase, validationHelper, dialogHelper, i18n) {
    class VzActionsBase extends K8sDomainActionsBase {
      constructor() {
        super();
      }

      getValidationObject(flowNameKey) {
        const validationObject = validationHelper.createValidatableObject(flowNameKey);
        const kubectlFormConfig = validationObject.getDefaultConfigObject();
        kubectlFormConfig.formName = 'kubectl-form-name';

        validationObject.addField('kubectl-exe-file-path-label',
          validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);

        return validationObject;
      }

      async isVerrazzanoInstalled(kubectlExe, kubectlOptions, errTitle, errPrefix) {
        const result = await window.api.ipc.invoke('is-verrazzano-installed', kubectlExe, kubectlOptions);
        if (result.reason) {
          const errMessage = i18n.t(`${errPrefix}-install-check-failed-error-message`, {error: result.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
        return Promise.resolve(result);
      }

      async validateApplicationExists(kubectlExe, kubectlOptions, errTitle, errPrefix) {
        try {
          const validationResults = await window.api.ipc.invoke('validate-vz-application-exist', kubectlExe,
            kubectlOptions, this.project.vzApplication.applicationName.value, this.project.k8sDomain.kubernetesNamespace.value);
          if (!validationResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-validate-application-failed-error-message`, {
              application: this.project.vzApplication.applicationName.value,
              error: validationResults.reason
            });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else if (!validationResults.isValid) {
            const errMessage = i18n.t(`${errPrefix}-application-not-exist-error-message`,
              { application: this.project.vzApplication.applicationName.value });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } catch (err) {
          return Promise.reject(err);
        }
        return Promise.resolve(true);
      }

      openBusyDialog(options, message) {
        if (!options.skipBusyDialog) {
          dialogHelper.openBusyDialog(message, 'bar', 0.0);
        }
      }

      updateBusyDialog(options, message, progress) {
        if (!options.skipBusyDialog) {
          dialogHelper.updateBusyDialog(message, progress);
        }
      }

      closeBusyDialog(options) {
        if (!options.skipBusyDialog) {
          dialogHelper.closeBusyDialog();
        }
      }
    }

    return VzActionsBase;
  }
);
