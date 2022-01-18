/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'utils/validation-helper', 'utils/dialog-helper', 'utils/wkt-logger','knockout' ],
  function (WktActionsBase, validationHelper, dialogHelper) {
    class WdtActionsBase extends WktActionsBase {
      constructor() {
        super();
      }

      getValidationObject(flowNameKey) {
        const validationObject = validationHelper.createValidatableObject(flowNameKey);
        const settingsFormConfig = validationObject.getDefaultConfigObject();
        settingsFormConfig.formName = 'project-settings-form-name';

        validationObject.addField('project-settings-java-home-label',
          validationHelper.validateRequiredField(this.project.settings.javaHome.value), settingsFormConfig);
        validationObject.addField('project-settings-oracle-home-label',
          validationHelper.validateRequiredField(this.project.settings.oracleHome.value), settingsFormConfig);

        const modelFormConfig = validationObject.getDefaultConfigObject();
        modelFormConfig.formName = 'model-design-form-name';
        validationObject.addField('model-page-model-editor-contents',
          this.project.wdtModel.validateModel(true), modelFormConfig);

        return validationObject;
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
