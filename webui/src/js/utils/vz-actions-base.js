/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'utils/validation-helper', 'utils/dialog-helper', 'utils/i18n'],
  function (WktActionsBase, validationHelper, dialogHelper, i18n) {
    class WdtActionsBase extends WktActionsBase {
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

    return WdtActionsBase;
  }
);
