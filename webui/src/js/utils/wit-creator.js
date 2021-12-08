/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/wdt-preparer', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/common-utilities', 'utils/wkt-logger'],
function (project, wktConsole, wktModelPreparer, i18n, projectIo, dialogHelper, validationHelper, utils, wktLogger) {
  function WktImageCreator() {
    this.project = project;

    this.startCreateImage = async () => {
      return this.callCreateImage();
    };

    this.startCreateAuxImage = async () => {
      return this.callCreateAuxImage();
    };

    this.callCreateImage = async (options) => {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wit-creator-aborted-error-title');
      if (!this.project.image.createPrimaryImage.value) {
        const errMessage = i18n.t('wit-creator-image-not-create-message');
        await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      const validatableObject = this.getValidatableObjectForPrimary('flow-create-image-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 14.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-java-home-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar', 0/totalSteps);

        const javaHome = project.settings.javaHome.value;
        if (!options.skipJavaHomeValidation) {
          let errContext = i18n.t('wit-creator-invalid-java-home-error-prefix');
          const javaHomeValidationResult =
            await window.api.ipc.invoke('validate-java-home', javaHome, errContext);
          if (!javaHomeValidationResult.isValid) {
            const errMessage = javaHomeValidationResult.reason;
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        if (!options.skipProjectSave) {
          const saveResult = await projectIo.saveProject();
          if (!saveResult.saved) {
            const errMessage = `${i18n.t('wit-creator-project-not-saved-error-prefix')}: ${saveResult.reason}`;
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // after save, in case model path was not established
        const projectDirectory = window.api.path.dirname(this.project.getProjectFileName());
        let consoleOpen = options.skipClearAndShowConsole;
        if (this.usingWdt()) {
          wktLogger.debug('Create Image is using WDT');
          busyDialogMessage = i18n.t('flow-validate-model-files-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
          const modelFiles = this.project.wdtModel.modelFiles.value;
          if (!options.skipModelFileValidation) {
            if (!modelFiles || modelFiles.length === 0) {
              const errMessage = i18n.t('wit-creator-no-model-to-use-message', {projectFile: this.project.getProjectFileName()});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
              return Promise.resolve(false);
            } else {
              const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...modelFiles);
              if (!existsResult.isValid) {
                const invalidFiles = existsResult.invalidFiles.join(', ');
                const errMessage = i18n.t('wit-creator-invalid-model-file-message',
                  {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }
          }

          // This is a little tricky because the variables file(s) may or may not exist at this point.
          //
          busyDialogMessage = i18n.t('flow-validate-variable-files-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
          let variableFiles = this.project.wdtModel.propertiesFiles.value;
          const variableValidationResult = await this.validateVariableFiles(projectDirectory, variableFiles, options, errTitle);
          if (!variableValidationResult.isSuccess) {
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }

          busyDialogMessage = i18n.t('flow-validate-archive-files-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
          const archiveFiles = this.project.wdtModel.archiveFiles.value;
          if (!options.skipArchiveFileValidation) {
            if (archiveFiles && archiveFiles.length > 0) {
              const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...archiveFiles);
              if (!existsResult.isValid) {
                const invalidFiles = existsResult.invalidFiles.join(', ');
                const errMessage = i18n.t('wit-creator-invalid-archive-file-message',
                  {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }
          }

          if (!consoleOpen) {
            wktConsole.clear();
            wktConsole.show(true);
            consoleOpen = true;
          }

          // Prompt user for running inline prepare model flow.
          busyDialogMessage = i18n.t('wdt-preparer-prepare-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
          const promptTitle = i18n.t('wit-creator-run-prepare-model-prompt-title');
          const promptQuestion = i18n.t('wit-creator-run-prepare-model-prompt-question');
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
              wktLogger.error('Create Primary Image failed because nested Prepare Model call returned a failure.');
              dialogHelper.closeBusyDialog();
              return Promise.resolve(false);
            } else {
              wktLogger.info('Create Primary Image continuing after nested Prepare Model call returned success.');
            }
          }

          // If there were previously no variable files and prepareModel was run, validate the variable files again...
          //
          busyDialogMessage = i18n.t('wit-creator-validate-variable-file-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
          if (runPrepareModelPromptResult && variableValidationResult.noVariableFiles) {
            variableFiles = this.project.wdtModel.propertiesFiles.value;
            const newVariableValidationResult =
              await this.validateVariableFiles(projectDirectory, variableFiles, options, errTitle);
            if (!newVariableValidationResult.isSuccess) {
              dialogHelper.closeBusyDialog();
              return Promise.resolve(false);
            }
          }
        } else {
          wktLogger.debug('Create Image is not using WDT');
        }

        // Validate the installers
        //
        busyDialogMessage = i18n.t('wit-creator-validate-jdk-installer-file-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 7/ totalSteps);
        let jdkInstaller;
        let jdkInstallerVersion;
        if (this.requiresInstaller('javaHome')) {
          jdkInstaller = this.project.image.jdkInstaller.value;
          jdkInstallerVersion = this.project.image.jdkInstallerVersion.value;

          const jdkInstallerIsValid =
            await this.validateFile(projectDirectory, jdkInstaller, errTitle, 'wit-creator-invalid-jdk-installer-file-message');
          if (!jdkInstallerIsValid) {
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('wit-creator-validate-oracle-installer-file-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 8 / totalSteps);
        let oracleInstaller;
        let oracleInstallerVersion;
        let oracleInstallerType;
        if (this.requiresInstaller('oracleHome')) {
          oracleInstaller = this.project.image.oracleInstaller.value;
          oracleInstallerVersion = this.project.image.oracleInstallerVersion.value;
          oracleInstallerType = this.project.image.oracleInstallerType.value;

          const oracleInstallerIsValid =
            await this.validateFile(projectDirectory, oracleInstaller, errTitle, 'wit-creator-invalid-oracle-installer-file-message');
          if (!oracleInstallerIsValid) {
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }
        }

        let wdtInstaller;
        let wdtInstallerVersion;
        if (this.requiresInstaller('wdtHome')) {
          if (this.project.image.useLatestWdtVersion.value) {
            busyDialogMessage = i18n.t('wit-creator-download-wdt-installer-in-progress');
            dialogHelper.updateBusyDialog(busyDialogMessage, 9 / totalSteps);
            // download the installer
            //
            try {
              const latestWdtInstallerResult = await window.api.ipc.invoke('get-latest-wdt-installer');
              wdtInstaller = latestWdtInstallerResult.fileName;
              wdtInstallerVersion = latestWdtInstallerResult.version;
            } catch (err) {
              const errMessage = i18n.t('wit-creator-wdt-download-error-message', {error: err.message || err});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          } else {
            busyDialogMessage = i18n.t('wit-creator-validate-wdt-installer-file-in-progress');
            dialogHelper.updateBusyDialog(busyDialogMessage, 9 / totalSteps);
            wdtInstaller = this.project.image.wdtInstaller.value;
            wdtInstallerVersion = this.project.image.wdtInstallerVersion.value;

            const wdtInstallerIsValid =
              await this.validateFile(projectDirectory, wdtInstaller, errTitle, 'wit-creator-invalid-wdt-installer-file-message');
            if (!wdtInstallerIsValid) {
              dialogHelper.closeBusyDialog();
              return Promise.resolve(false);
            }
          }
        }

        const imageBuilderType = this.project.settings.builderType.value;
        busyDialogMessage = i18n.t('wit-creator-validate-image-builder-exe-in-progress',
          {builderName: imageBuilderType});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10/ totalSteps);
        // Validate the image builder executable
        const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
        const imageBuilderExeResults =
          await window.api.ipc.invoke('validate-image-builder-exe', imageBuilderExe);
        if (!imageBuilderExeResults.isValid) {
          const errMessage = i18n.t('wit-creator-image-builder-invalid-error-message',
            {fileName: imageBuilderExe, error: imageBuilderExeResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('wit-creator-cache-installers-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 11 / totalSteps);
        // Populate the cache
        //
        const cacheConfig = {
          javaHome: javaHome,
          jdkInstaller: jdkInstaller,
          jdkInstallerVersion: jdkInstallerVersion,
          oracleInstaller: oracleInstaller,
          oracleInstallerVersion: oracleInstallerVersion,
          oracleInstallerType: oracleInstallerType,
          wdtInstaller: wdtInstaller,
          wdtInstallerVersion: wdtInstallerVersion
        };
        const cacheResult = await window.api.ipc.invoke('wit-cache-installers', cacheConfig);
        if (!cacheResult.isSuccess) {
          const errMessage = i18n.t('wit-creator-cache-installers-error-message', {error: cacheResult.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        // if using custom base image and requires authentication, do build-tool login.
        busyDialogMessage = i18n.t('wit-creator-builder-login-in-progress',
          {builderName: imageBuilderType, imageTag: this.project.image.baseImage.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 12 / totalSteps);
        if (this.project.image.useCustomBaseImage.value && this.project.image.baseImage.value && this.project.image.baseImagePullRequiresAuthentication.value) {
          const loginConfig = {
            requiresLogin: this.project.image.baseImagePullRequiresAuthentication.value,
            host: this.project.image.internal.baseImageRegistryAddress.value,
            username: this.project.image.baseImagePullUsername.value,
            password: this.project.image.baseImagePullPassword.value
          };
          const loginResults = await window.api.ipc.invoke('do-image-registry-login', imageBuilderExe, loginConfig);
          if (!loginResults.isSuccess) {
            const imageRegistry = loginConfig.host || i18n.t('docker-hub');
            const errMessage = i18n.t('wit-creator-registry-login-failed-error-message', {
              host: imageRegistry,
              error: loginResults.reason
            });
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }
        }

        if (!consoleOpen) {
          wktConsole.clear();
          wktConsole.show(true);
        }

        // run the image tool
        busyDialogMessage = i18n.t('wit-creator-create-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 13 / totalSteps);
        const createConfig = this.buildCreateConfigObject(projectDirectory, javaHome, imageBuilderExe,
          jdkInstallerVersion, oracleInstallerType, oracleInstallerVersion, wdtInstallerVersion);
        let createResult = await window.api.ipc.invoke('wit-create-image', createConfig);
        dialogHelper.closeBusyDialog();
        if (createResult.isSuccess) {
          const title = i18n.t('wit-creator-create-complete-title');
          const message = i18n.t('wit-creator-create-complete-message', {imageTag: createConfig.imageTag});
          await window.api.ipc.invoke('show-info-message', title, message);
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('wit-creator-create-failed-title');
          const errMessage = i18n.t('wit-creator-create-failed-error-message',
            {imageTag: createConfig.imageTag, error: createResult.reason});
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    };

    this.callCreateAuxImage = async (options) => {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wit-creator-aborted-error-title');
      let abortErrorMessage;
      if (this.project.settings.targetDomainLocation.value !== 'mii') {
        abortErrorMessage = i18n.t('wit-creator-aux-image-not-mii-message');
      } else if (!this.project.image.useAuxImage.value) {
        abortErrorMessage = i18n.t('wit-creator-aux-image-not-use-message');
      } else if (!this.project.image.createAuxImage.value) {
        abortErrorMessage = i18n.t('wit-creator-aux-image-not-create-message');
      }
      if (abortErrorMessage) {
        await window.api.ipc.invoke('show-info-message', errTitle, abortErrorMessage);
        return Promise.resolve(false);
      }

      const validatableObject = this.getValidatableObjectForAuxiliary('flow-create-aux-image-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 12.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-java-home-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar', 0/totalSteps);

        const javaHome = project.settings.javaHome.value;
        if (!options.skipJavaHomeValidation) {
          let errContext = i18n.t('wit-creator-invalid-java-home-error-prefix');
          const javaHomeValidationResult =
            await window.api.ipc.invoke('validate-java-home', javaHome, errContext);
          if (!javaHomeValidationResult.isValid) {
            const errMessage = javaHomeValidationResult.reason;
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        if (!options.skipProjectSave) {
          const saveResult = await projectIo.saveProject();
          if (!saveResult.saved) {
            const errMessage = `${i18n.t('wit-creator-project-not-saved-error-prefix')}: ${saveResult.reason}`;
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // after save, in case model path was not established
        const projectDirectory = window.api.path.dirname(this.project.getProjectFileName());

        busyDialogMessage = i18n.t('flow-validate-model-files-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
        const modelFiles = this.project.wdtModel.modelFiles.value;
        if (!options.skipModelFileValidation) {
          if (!modelFiles || modelFiles.length === 0) {
            const errMessage = i18n.t('wit-creator-no-model-to-use-message', {projectFile: this.project.getProjectFileName()});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else {
            const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...modelFiles);
            if (!existsResult.isValid) {
              const invalidFiles = existsResult.invalidFiles.join(', ');
              const errMessage = i18n.t('wit-creator-invalid-model-file-message',
                {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }
        }

        // This is a little tricky because the variables file(s) may or may not exist at this point.
        //
        busyDialogMessage = i18n.t('flow-validate-variable-files-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
        let variableFiles = this.project.wdtModel.propertiesFiles.value;
        const variableValidationResult = await this.validateVariableFiles(projectDirectory, variableFiles, options, errTitle);
        if (!variableValidationResult.isSuccess) {
          dialogHelper.closeBusyDialog();
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-validate-archive-files-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        const archiveFiles = this.project.wdtModel.archiveFiles.value;
        if (!options.skipArchiveFileValidation) {
          if (archiveFiles && archiveFiles.length > 0) {
            const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...archiveFiles);
            if (!existsResult.isValid) {
              const invalidFiles = existsResult.invalidFiles.join(', ');
              const errMessage = i18n.t('wit-creator-invalid-archive-file-message',
                {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }
        }

        if (!options.skipClearAndShowConsole) {
          wktConsole.clear();
          wktConsole.show(true);
        }

        // Prompt user for running inline prepare model flow.
        busyDialogMessage = i18n.t('wdt-preparer-prepare-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        const promptTitle = i18n.t('wit-creator-run-prepare-model-prompt-title');
        const promptQuestion = i18n.t('wit-creator-run-prepare-model-prompt-question');
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
            wktLogger.error('Create Auxiliary Image failed because nested Prepare Model call returned a failure.');
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          } else {
            wktLogger.info('Create Auxiliary Image continuing after nested Prepare Model call returned success.');
          }
        }

        // If there were previously no variable files and prepareModel was run, validate the variable files again...
        //
        busyDialogMessage = i18n.t('wit-creator-validate-variable-file-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
        if (runPrepareModelPromptResult && variableValidationResult.noVariableFiles) {
          variableFiles = this.project.wdtModel.propertiesFiles.value;
          const newVariableValidationResult =
            await this.validateVariableFiles(projectDirectory, variableFiles, options, errTitle);
          if (!newVariableValidationResult.isSuccess) {
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }
        }

        let wdtInstaller;
        let wdtInstallerVersion;
        if (this.project.image.useLatestWdtVersion.value) {
          busyDialogMessage = i18n.t('wit-creator-download-wdt-installer-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
          // download the installer
          //
          try {
            const latestWdtInstallerResult = await window.api.ipc.invoke('get-latest-wdt-installer');
            wdtInstaller = latestWdtInstallerResult.fileName;
            wdtInstallerVersion = latestWdtInstallerResult.version;
          } catch (err) {
            const errMessage = i18n.t('wit-creator-wdt-download-error-message', {error: err.message || err});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } else {
          busyDialogMessage = i18n.t('wit-creator-validate-wdt-installer-file-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
          wdtInstaller = this.project.image.wdtInstaller.value;
          wdtInstallerVersion = this.project.image.wdtInstallerVersion.value;

          const wdtInstallerIsValid =
            await this.validateFile(projectDirectory, wdtInstaller, errTitle, 'wit-creator-invalid-wdt-installer-file-message');
          if (!wdtInstallerIsValid) {
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }
        }

        const imageBuilderType = this.project.settings.builderType.value;
        busyDialogMessage = i18n.t('wit-creator-validate-image-builder-exe-in-progress',
          {builderName: imageBuilderType});
        dialogHelper.updateBusyDialog(busyDialogMessage, 8/ totalSteps);
        // Validate the image builder executable
        const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
        const imageBuilderExeResults =
          await window.api.ipc.invoke('validate-image-builder-exe', imageBuilderExe);
        if (!imageBuilderExeResults.isValid) {
          const errMessage = i18n.t('wit-creator-image-builder-invalid-error-message',
            {fileName: imageBuilderExe, error: imageBuilderExeResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('wit-creator-cache-installers-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 9 / totalSteps);
        // Populate the cache
        //
        const cacheConfig = {
          wdtInstaller: wdtInstaller,
          wdtInstallerVersion: wdtInstallerVersion
        };
        const cacheResult = await window.api.ipc.invoke('wit-cache-installers', cacheConfig);
        if (!cacheResult.isSuccess) {
          const errMessage = i18n.t('wit-creator-cache-installers-error-message', {error: cacheResult.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        // if using custom base image and requires authentication, do build-tool login.
        busyDialogMessage = i18n.t('wit-creator-builder-login-in-progress',
          {builderName: imageBuilderType, imageTag: this.project.image.auxBaseImage.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
        if (this.project.image.auxUseCustomBaseImage.value &&
          this.project.image.auxBaseImage.value && this.project.image.auxBaseImagePullRequiresAuthentication.value) {
          const loginConfig = {
            requiresLogin: this.project.image.auxBaseImagePullRequiresAuthentication.value,
            host: this.project.image.internal.auxBaseImageRegistryAddress.value,
            username: this.project.image.auxBaseImagePullUsername.value,
            password: this.project.image.auxBaseImagePullPassword.value
          };
          const loginResults = await window.api.ipc.invoke('do-image-registry-login', imageBuilderExe, loginConfig);
          if (!loginResults.isSuccess) {
            const imageRegistry = loginConfig.host || i18n.t('docker-hub');
            const errMessage = i18n.t('wit-creator-registry-login-failed-error-message', {
              host: imageRegistry,
              error: loginResults.reason
            });
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            dialogHelper.closeBusyDialog();
            return Promise.resolve(false);
          }
        }

        // run the image tool
        busyDialogMessage = i18n.t('wit-creator-create-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 11 / totalSteps);
        const createConfig = this.buildCreateAuxImageConfigObject(projectDirectory, javaHome, imageBuilderExe, wdtInstallerVersion);
        let createResult = await window.api.ipc.invoke('wit-create-aux-image', createConfig);
        dialogHelper.closeBusyDialog();
        if (createResult.isSuccess) {
          const title = i18n.t('wit-creator-create-complete-title');
          const message = i18n.t('wit-creator-create-complete-message', {imageTag: createConfig.imageTag});
          await window.api.ipc.invoke('show-info-message', title, message);
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('wit-creator-create-failed-title');
          const errMessage = i18n.t('wit-creator-create-failed-error-message',
            {imageTag: createConfig.imageTag, error: createResult.reason});
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    };

    this.getValidatableObjectForPrimary = (flowNameKey) => {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const settingsFormConfig = validationObject.getDefaultConfigObject();
      settingsFormConfig.formName = 'project-settings-form-name';

      validationObject.addField('project-settings-java-home-label',
        validationHelper.validateRequiredField(this.project.settings.javaHome.value), settingsFormConfig);
      validationObject.addField('project-settings-build-tool-type-label',
        validationHelper.validateRequiredField(this.project.settings.builderType.value), settingsFormConfig);

      const settingsFormBuilderConfig = validationObject.getDefaultConfigObject();
      settingsFormBuilderConfig.formName = 'project-settings-form-name';
      settingsFormBuilderConfig.fieldNamePayload =
        { toolName: utils.capitalizeFirstLetter(this.project.settings.builderType.value) };
      validationObject.addField('project-settings-build-tool-label',
        validationHelper.validateRequiredField(this.project.settings.builderExecutableFilePath.value),
        settingsFormBuilderConfig);

      const imageFormConfig = validationObject.getDefaultConfigObject();
      imageFormConfig.formName = 'image-design-form-name';
      imageFormConfig.tabName = 'image-design-form-primary-tab-name';

      validationObject.addField('image-design-image-tag-label',
        this.project.image.imageTag.validate(true), imageFormConfig);
      if (this.requiresInstaller('javaHome')) {
        validationObject.addField('image-design-jdk-installer-title',
          validationHelper.validateRequiredField(this.project.image.jdkInstaller.value), imageFormConfig);
        validationObject.addField('image-design-jdk-installer-version-label',
          validationHelper.validateRequiredField(this.project.image.jdkInstallerVersion.value), imageFormConfig);
      }
      if (this.requiresInstaller('oracleHome')) {
        validationObject.addField('image-design-fmw-installer-title',
          validationHelper.validateRequiredField(this.project.image.oracleInstaller.value), imageFormConfig);
        validationObject.addField('image-design-fmw-installer-type-label',
          validationHelper.validateRequiredField(this.project.image.oracleInstallerType.value), imageFormConfig);
        validationObject.addField('image-design-fmw-installer-version-label',
          validationHelper.validateRequiredField(this.project.image.oracleInstallerVersion.value), imageFormConfig);
      }
      if (this.requiresInstaller('wdtHome')) {
        if (!this.project.image.useLatestWdtVersion.value) {
          validationObject.addField('image-design-wdt-installer-label',
            validationHelper.validateRequiredField(this.project.image.wdtInstaller.value), imageFormConfig);
          validationObject.addField('image-design-wdt-installer-version-label',
            validationHelper.validateRequiredField(this.project.image.wdtInstallerVersion.value), imageFormConfig);
        }
      }

      if (this.project.image.useCustomBaseImage.value) {
        validationObject.addField('image-design-custom-base-image-label',
          this.project.image.baseImage.validate(true), imageFormConfig);

        if (this.project.image.baseImagePullRequiresAuthentication.value) {
          // skip validating the host portion of the base image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-base-image-pull-username-label',
            validationHelper.validateRequiredField(this.project.image.baseImagePullUsername.value), imageFormConfig);
          validationObject.addField('image-design-base-image-pull-password-label',
            validationHelper.validateRequiredField(this.project.image.baseImagePullPassword.value), imageFormConfig);
        }
      }

      if (this.supportsPatching()) {
        if (this.project.image.applyOraclePatches.value) {
          validationObject.addField('image-design-support-username-label',
            validationHelper.validateRequiredField(this.project.image.oracleSupportUserName.value), imageFormConfig);
          validationObject.addField('image-design-support-password-label',
            validationHelper.validateRequiredField(this.project.image.oracleSupportPassword.value), imageFormConfig);
        }
      }
      return validationObject;
    };

    this.getValidatableObjectForAuxiliary = (flowNameKey) => {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const settingsFormConfig = validationObject.getDefaultConfigObject();
      settingsFormConfig.formName = 'project-settings-form-name';

      validationObject.addField('project-settings-java-home-label',
        validationHelper.validateRequiredField(this.project.settings.javaHome.value), settingsFormConfig);
      validationObject.addField('project-settings-build-tool-type-label',
        validationHelper.validateRequiredField(this.project.settings.builderType.value), settingsFormConfig);

      const settingsFormBuilderConfig = validationObject.getDefaultConfigObject();
      settingsFormBuilderConfig.formName = 'project-settings-form-name';
      settingsFormBuilderConfig.fieldNamePayload =
        { toolName: utils.capitalizeFirstLetter(this.project.settings.builderType.value) };
      validationObject.addField('project-settings-build-tool-label',
        validationHelper.validateRequiredField(this.project.settings.builderExecutableFilePath.value),
        settingsFormBuilderConfig);

      const imageFormConfig = validationObject.getDefaultConfigObject();
      imageFormConfig.formName = 'image-design-form-name';
      imageFormConfig.tabName = 'image-design-form-auxiliary-tab-name';

      validationObject.addField('image-design-aux-image-tag-label',
        this.project.image.auxImageTag.validate(true), imageFormConfig);
      if (!this.project.image.useLatestWdtVersion.value) {
        validationObject.addField('image-design-wdt-installer-label',
          validationHelper.validateRequiredField(this.project.image.wdtInstaller.value), imageFormConfig);
        validationObject.addField('image-design-wdt-installer-version-label',
          validationHelper.validateRequiredField(this.project.image.wdtInstallerVersion.value), imageFormConfig);
      }

      if (this.project.image.auxUseCustomBaseImage.value) {
        validationObject.addField('image-design-custom-base-image-label',
          this.project.image.auxBaseImage.validate(true), imageFormConfig);

        if (this.project.image.auxBaseImagePullRequiresAuthentication.value) {
          // skip validating the host portion of the base image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-aux-base-image-pull-username-label',
            validationHelper.validateRequiredField(this.project.image.auxBaseImagePullUsername.value), imageFormConfig);
          validationObject.addField('image-design-aux-base-image-pull-password-label',
            validationHelper.validateRequiredField(this.project.image.auxBaseImagePullPassword.value), imageFormConfig);
        }
      }
      return validationObject;
    };

    this.validateVariableFiles = async (projectDirectory, variableFiles, options, errTitle) => {
      let noVariableFiles = true;
      if (!options.skipVariableFileValidation) {
        if (variableFiles && variableFiles.length > 0) {
          noVariableFiles = false;
          const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...variableFiles);
          if (!existsResult.isValid) {
            const invalidFiles = existsResult.invalidFiles.join(', ');
            const errMessage = i18n.t('wit-creator-invalid-variable-file-message',
              {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve({isSuccess: false, noVariableFiles: noVariableFiles});
          }
        }
      }
      return Promise.resolve({isSuccess: true, noVariableFiles: noVariableFiles});
    };

    this.validateFile = async (projectDirectory, file, errTitle, errMessageKey) => {
      const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, file);
      if (!existsResult.isValid) {
        const errMessage = i18n.t(errMessageKey, {projectFile: this.project.getProjectFileName(), invalidFile: file});
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    };

    this.buildCreateConfigObject = (projectDirectory, javaHome, imageBuilderExe, jdkInstallerVersion,
      oracleInstallerType, oracleInstallerVersion, wdtInstallerVersion) => {
      const createConfig = {
        javaHome: javaHome,
        imageBuilderExe: imageBuilderExe,
        imageTag: this.project.image.imageTag.value,
        jdkInstallerVersion: jdkInstallerVersion,
        oracleInstallerType: oracleInstallerType,
        oracleInstallerVersion: oracleInstallerVersion,
        targetDomainLocation: this.project.settings.targetDomainLocation.value,
        additionalBuildCommandsFile: this.project.image.additionalBuildCommandsFile.value,
        additionalBuildFiles: this.project.image.additionalBuildFiles.value,
        buildNetwork: this.project.image.builderNetworkName.value,
        alwaysPullBaseImage: this.project.image.alwaysPullBaseImage.value,
      };

      // If using aux image, remove the targetDomainLocation so that --wdtModelOnly flag is not added
      if (this.project.settings.targetDomainLocation.value === 'mii' && this.project.image.useAuxImage.value) {
        delete createConfig.targetDomainLocation;
      }

      if (this.project.image.useCustomBaseImage.value) {
        createConfig.baseImage = this.project.image.baseImage.value;
      }

      if (this.project.image.targetOpenShift.value) {
        createConfig.target = 'OpenShift';
      }

      if (this.project.image.fileOwner.hasValue() || this.project.image.fileGroup.hasValue()) {
        createConfig.chownOwner = this.project.image.fileOwner.value;
        createConfig.chownGroup = this.project.image.fileGroup.value;
      }

      this.addPatchingConfigForCreate(createConfig);
      if (this.usingWdt()) {
        createConfig.wdtInstallerVersion = wdtInstallerVersion;
        createConfig.domainHome = this.project.image.domainHomePath.value;
        this.addWdtConfigForCreate(projectDirectory, createConfig);
      }
      return createConfig;
    };

    this.buildCreateAuxImageConfigObject = (projectDirectory, javaHome, imageBuilderExe, wdtInstallerVersion) => {
      const createConfig = {
        javaHome: javaHome,
        imageBuilderExe: imageBuilderExe,
        imageTag: this.project.image.auxImageTag.value,
        wdtInstallerVersion: wdtInstallerVersion,
        additionalBuildCommandsFile: this.project.image.auxAdditionalBuildCommandsFile.value,
        additionalBuildFiles: this.project.image.auxAdditionalBuildFiles.value,
        buildNetwork: this.project.image.auxBuilderNetworkName.value,
        chownOwner: undefined,
        chownGroup: undefined,
        alwaysPullBaseImage: this.project.image.auxAlwaysPullBaseImage.value,
      };

      if (this.project.image.auxUseCustomBaseImage.value) {
        createConfig.baseImage = this.project.image.auxBaseImage.value;
      }

      if (this.project.image.auxTargetOpenShift.value) {
        createConfig.target = 'OpenShift';
      }

      if (this.project.image.auxFileOwner.hasValue() || this.project.image.auxFileGroup.hasValue()) {
        createConfig.chownOwner = this.project.image.auxFileOwner.value;
        createConfig.chownGroup = this.project.image.auxFileGroup.value;
      }

      this.addWdtConfigForCreateAuxImage(projectDirectory, createConfig);
      return createConfig;
    };

    this.addPatchingConfigForCreate = (createConfig) => {
      if (this.supportsPatching()) {
        if (this.project.image.applyOraclePatches.value) {
          createConfig.username = this.project.image.oracleSupportUserName.value;
          createConfig.password = this.project.image.oracleSupportPassword.value;
          createConfig.patches = this.project.image.oraclePatchesToApply.value;
          switch (this.project.image.oraclePatchOptions.value) {
            case 'recommended':
              createConfig.recommended = true;
              break;

            case 'psu':
              createConfig.latestPsu = true;
              break;

            default:
              break;
          }
        }
      }
    };

    this.addWdtConfigForCreate = (projectDirectory, createConfig) => {
      createConfig.modelFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.modelFiles.value);
      createConfig.variableFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.propertiesFiles.value);
      createConfig.archiveFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.archiveFiles.value);
      createConfig.domainHome = this.project.image.domainHomePath.value;
      createConfig.targetDomainType = this.project.image.targetDomainType.value;

      if (this.project.image.modelHomePath.hasValue()) {
        createConfig.modelHome = this.project.image.modelHomePath.value;
      }
    };

    this.addWdtConfigForCreateAuxImage = (projectDirectory, createConfig) => {
      createConfig.modelFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.modelFiles.value);
      createConfig.variableFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.propertiesFiles.value);
      createConfig.archiveFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.archiveFiles.value);
      // Because we are overriding the defaults for these next two options,
      // we should always include them if they have a value.
      //
      if (this.project.image.wdtHomePath.value) {
        createConfig.wdtHome = this.project.image.wdtHomePath.value;
      }
      if (this.project.image.modelHomePath.value) {
        createConfig.modelHome = this.project.image.modelHomePath.value;
      }
    };

    this.requiresInstaller = (type) => {
      let result = true;
      if (type === 'wdtHome') {
        switch (this.project.settings.targetDomainLocation.value) {
          case 'mii':
            result = !this.project.image.useAuxImage.value;
            break;

          // dii case is always true

          case 'pv':
            result = false;
            break;
        }
      } else if (this.project.image.useCustomBaseImage.observable()) {
        if (this.project.image.customBaseImageContents.value &&
          this.project.image.customBaseImageContents.value.includes(type)) {
          result = false;
        }
      }
      return result;
    };

    this.usingWdt = () => {
      return !this.project.image.useAuxImage.value && this.requiresInstaller('wdtHome');
    };

    this.supportsPatching = () => {
      // We are currently not allowing users to patch a base image with an Oracle Home since we want to encourage
      // them to patch the Oracle Home while creating the image with the Oracle Home to keep the size down.
      return this.requiresInstaller('oracleHome');
    };

    this.getAbsoluteModelFiles = (projectDirectory, modelFiles) => {
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
    };
  }

  return new WktImageCreator();
});
