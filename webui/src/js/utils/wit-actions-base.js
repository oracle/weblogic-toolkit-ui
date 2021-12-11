/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/wdt-preparer', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/common-utilities', 'utils/wkt-logger'],
function (WktActionsBase, project, wktConsole, wktModelPreparer, i18n, projectIo, dialogHelper, validationHelper, utils, wktLogger) {
  class WitActionsBase extends WktActionsBase {
    constructor() {
      super();
    }

    async validateModelFiles(projectDirectory, modelFiles, errTitle) {
      try {
        if (!modelFiles || modelFiles.length === 0) {
          const errMessage = i18n.t('wit-actions-base-no-model-to-use-message', {projectFile: this.project.getProjectFileName()});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
          return Promise.resolve(false);
        } else {
          const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...modelFiles);
          if (!existsResult.isValid) {
            const invalidFiles = existsResult.invalidFiles.join(', ');
            const errMessage = i18n.t('wit-actions-base-invalid-model-file-message',
              {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    getVariableFilesCount() {
      let count = 0;
      if (Array.isArray(this.project.wdtModel.propertiesFiles.value)) {
        count = this.project.wdtModel.propertiesFiles.value.length;
      }
      return count;
    }

    async validateVariableFiles(projectDirectory, variableFiles, errTitle) {
      try {
        if (variableFiles && variableFiles.length > 0) {
          const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...variableFiles);
          if (!existsResult.isValid) {
            const invalidFiles = existsResult.invalidFiles.join(', ');
            const errMessage = i18n.t('wit-actions-base-invalid-variable-file-message',
              {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateArchiveFiles(projectDirectory, archiveFiles, errTitle) {
      try {
        if (archiveFiles && archiveFiles.length > 0) {
          const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...archiveFiles);
          if (!existsResult.isValid) {
            const invalidFiles = existsResult.invalidFiles.join(', ');
            const errMessage = i18n.t('wit-actions-base-invalid-archive-file-message',
              {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async downloadOrValidateWdtInstaller(projectDirectory, stepPercentage, errTitle, errPrefix) {
      let wdtInstaller;
      let wdtInstallerVersion;
      try {
        if (this.project.image.useLatestWdtVersion.value) {
          const busyDialogMessage = i18n.t('wit-actions-base-download-wdt-installer-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, stepPercentage);
          // download the installer
          //
          try {
            const latestWdtInstallerResult = await window.api.ipc.invoke('get-latest-wdt-installer');
            wdtInstaller = latestWdtInstallerResult.fileName;
            wdtInstallerVersion = latestWdtInstallerResult.version;
          } catch (err) {
            const errMessage = i18n.t(`${errPrefix}-wdt-download-error-message`, {error: err.message || err});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } else {
          const busyDialogMessage = i18n.t('wit-actions-base-validate-wdt-installer-file-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, stepPercentage);
          wdtInstaller = this.project.image.wdtInstaller.value;
          wdtInstallerVersion = this.project.image.wdtInstallerVersion.value;

          const wdtInstallerIsValid =
            await this.validateFile(projectDirectory, wdtInstaller, errTitle, `${errPrefix}-invalid-wdt-installer-file-message`);
          if (!wdtInstallerIsValid) {
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve({wdtInstaller: wdtInstaller, wdtInstallerVersion: wdtInstallerVersion});
    }

    async runPrepareModel(options, errPrefix, actionName) {
      try {
        const promptTitle = i18n.t(`${errPrefix}-run-prepare-model-prompt-title`);
        const promptQuestion = i18n.t(`${errPrefix}-run-prepare-model-prompt-question`);
        const runPrepareModelPromptResult =
          await window.api.ipc.invoke('yes-or-no-prompt', promptTitle, promptQuestion);
        if (runPrepareModelPromptResult) {
          // Make a private copy of the options object that can be shared with the prepareModel flow.
          const prepareOptions = JSON.parse(JSON.stringify(options));
          prepareOptions.skipJavaHomeValidation = true;
          prepareOptions.skipProjectSave = true;
          prepareOptions.skipModelFileValidation = true;
          prepareOptions.skipVariableFileValidation = true;
          prepareOptions.skipArchiveFileValidation = true;
          prepareOptions.skipClearAndShowConsole = true;
          prepareOptions.skipCompleteDialog = true;
          prepareOptions.skipBusyDialog = true;
          const success = await wktModelPreparer.callPrepareModel(prepareOptions);
          if (!success) {
            wktLogger.error(`${actionName} failed because nested Prepare Model call returned a failure.`);
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          } else {
            wktLogger.info(`${actionName} continuing after nested Prepare Model call returned success.`);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async addInstallersToCache(cacheConfig, errTitle, errPrefix) {
      try {
        const cacheResult = await window.api.ipc.invoke('wit-cache-installers', cacheConfig);
        if (!cacheResult.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-cache-installers-error-message`, {error: cacheResult.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async runImageTool(isCreateAuxImage, createConfig, errPrefix) {
      try {
        const channel = isCreateAuxImage ? 'wit-create-aux-image' : 'wit-create-image';
        let createResult = await window.api.ipc.invoke(channel, createConfig);
        dialogHelper.closeBusyDialog();
        if (createResult.isSuccess) {
          const title = i18n.t(`${errPrefix}-create-complete-title`);
          const message = i18n.t(`${errPrefix}-create-complete-message`, {imageTag: createConfig.imageTag});
          await window.api.ipc.invoke('show-info-message', title, message);
        } else {
          const errTitle = i18n.t(`${errPrefix}-create-failed-title`);
          const errMessage = i18n.t(`${errPrefix}-create-failed-error-message`,
            {imageTag: createConfig.imageTag, error: createResult.reason});
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    getAbsoluteModelFiles(projectDirectory, modelFiles) {
      const absoluteFiles = [];
      if (modelFiles && modelFiles.length > 0) {
        for (const modelFile of modelFiles) {
          if (window.api.path.isAbsolute(modelFile)) {
            absoluteFiles.push(modelFile);
          } else {
            absoluteFiles.push(window.api.path.join(projectDirectory, modelFile));
          }
        }
      }
      return absoluteFiles;
    }
  }

  return WitActionsBase;
});
