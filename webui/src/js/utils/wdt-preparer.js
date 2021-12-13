/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wdt-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/wkt-logger'],
function(WdtActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper, wktLogger) {
  class WdtModelPreparer extends WdtActionsBase {
    constructor() {
      super();
    }

    async startPrepareModel() {
      return this.callPrepareModel();
    }

    async callPrepareModel(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wdt-preparer-aborted-error-title');
      const errPrefix = 'wdt-preparer';
      const shouldCloseBusyDialog = !options.skipBusyDialog;

      if (this.project.settings.targetDomainLocation.value === 'pv') {
        const errMessage = i18n.t('wdt-preparer-domain-in-pv-message');
        await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      const validationObject = this.getValidationObject('flow-prepare-model-name');
      if (validationObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validationObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 6.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-java-home-in-progress');
        this.openBusyDialog(options, busyDialogMessage);
        const javaHome = project.settings.javaHome.value;
        const oracleHome = project.settings.oracleHome.value;

        if (!options.skipJavaHomeValidation) {
          if (! await this.validateJavaHome(javaHome, errTitle, errPrefix, shouldCloseBusyDialog)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-validate-oracle-home-in-progress');
        this.updateBusyDialog(options, busyDialogMessage, 1/totalSteps);
        if (!options.skipOracleHomeValidation) {
          if (! await this.validateOracleHome(oracleHome, errTitle, errPrefix, shouldCloseBusyDialog)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        this.updateBusyDialog(options, busyDialogMessage, 2/totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix, shouldCloseBusyDialog)) {
            return Promise.resolve(false);
          }
        }

        // after save, in case model path was not established
        const projectDirectory = window.api.path.dirname(this.project.getProjectFileName());

        busyDialogMessage = i18n.t('flow-validate-model-files-in-progress');
        this.updateBusyDialog(options, busyDialogMessage, 3/totalSteps);
        const modelFiles = this.project.wdtModel.modelFiles.value;
        if (!options.skipModelFileValidation) {
          if (! await this.validateModelFiles(projectDirectory, modelFiles, errTitle, errPrefix, shouldCloseBusyDialog)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-validate-variable-files-in-progress');
        this.updateBusyDialog(options, busyDialogMessage, 4/totalSteps);
        const variableFiles = this.project.wdtModel.propertiesFiles.value;
        if (!options.skipVariableFileValidation) {
          if (! await this.validateVariableFiles(projectDirectory, variableFiles, errTitle, errPrefix, shouldCloseBusyDialog)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('wdt-preparer-prepare-in-progress');
        this.updateBusyDialog(options, busyDialogMessage, 5/totalSteps);
        const prepareConfig = {
          javaHome: javaHome,
          oracleHome: oracleHome,
          projectDirectory: projectDirectory,
          modelsSubdirectory: this.project.wdtModel.getDefaultModelDirectory(),
          modelFiles: modelFiles,
          variableFiles: variableFiles,
          wdtTargetType: this.project.settings.wdtTargetType.value,
          targetDomainLocation: this.project.settings.targetDomainLocation.value
        };

        if (!options.skipClearAndShowConsole) {
          wktConsole.clear();
          wktConsole.show(true);
        }
        const prepareResult = await window.api.ipc.invoke('prepare-model', prepareConfig);
        this.closeBusyDialog(options);
        if (prepareResult.isSuccess) {
          // apply the results to the project object.
          this.project.wdtModel.setSpecifiedModelFiles(prepareResult.model);

          // Currently, Verrazzano support is limited to Model and Image only, so skip this step.
          //
          if (this.project.settings.wdtTargetType.value === 'wko') {
            this.project.k8sDomain.loadPrepareModelResults(prepareResult);
          }

          if (!options.skipCompleteDialog) {
            const title = i18n.t('wdt-preparer-prepare-complete-title');
            const message = i18n.t('wdt-preparer-prepare-complete-message');
            await window.api.ipc.invoke('show-info-message', title, message);
          }
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('wdt-preparer-prepare-failed-error-title');
          const errMessage = i18n.t('wdt-preparer-prepare-failed-error-message',
            {error: prepareResult.reason});
          wktLogger.error(errMessage + (prepareResult.error ? ': ' + prepareResult.error : ''));
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        this.closeBusyDialog(options);
        throw err;
      } finally {
        this.closeBusyDialog(options);
      }
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

  return new WdtModelPreparer();
});
