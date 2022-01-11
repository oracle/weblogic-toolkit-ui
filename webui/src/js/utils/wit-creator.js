/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wit-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/wdt-preparer', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/common-utilities', 'utils/wkt-logger'],
function (WitActionsBase, project, wktConsole, wdtModelPreparer, i18n, projectIo, dialogHelper, validationHelper, utils, wktLogger) {
  class WitImageCreator extends WitActionsBase {
    constructor() {
      super();
    }

    async startCreateImage() {
      await this.executeAction(this.callCreateImage);
    }

    async callCreateImage(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wit-creator-aborted-error-title');
      const errPrefix = 'wit-creator';
      if (!this.project.image.createPrimaryImage.value) {
        const errMessage = i18n.t('wit-creator-image-not-create-message');
        await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      const validatableObject = this.getValidatableObject('flow-create-image-name');
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
          if (! await this.validateJavaHome(javaHome, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
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
            if (! await this.validateModelFiles(projectDirectory, modelFiles, errTitle, errPrefix)) {
              return Promise.resolve(false);
            }
          }

          // This is a little tricky because the variables file(s) may or may not exist at this point.
          //
          busyDialogMessage = i18n.t('flow-validate-variable-files-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
          let variableFiles = this.project.wdtModel.propertiesFiles.value;
          const variableFileCountBeforePrepare = this.getVariableFilesCount();
          if (! await this.validateVariableFiles(projectDirectory, variableFiles, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }

          busyDialogMessage = i18n.t('flow-validate-archive-files-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
          const archiveFiles = this.project.wdtModel.archiveFiles.value;
          if (!options.skipArchiveFileValidation) {
            if (! await this.validateArchiveFiles(projectDirectory, archiveFiles, errTitle, errPrefix)) {
              return Promise.resolve(false);
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
          if (! await this.runPrepareModel(options, errPrefix, i18n.t('flow-create-image-name'))) {
            return Promise.resolve(false);
          }

          // If there were previously no variable files and prepareModel was run, validate the variable files again...
          //
          busyDialogMessage = i18n.t('wit-creator-validate-variable-file-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
          if (variableFileCountBeforePrepare === 0 && this.getVariableFilesCount() > 0) {
            variableFiles = this.project.wdtModel.propertiesFiles.value;
            if (! await this.validateVariableFiles(projectDirectory, variableFiles, errTitle, errPrefix)) {
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

          if (! await this.validateJdkInstaller(projectDirectory, jdkInstaller, errTitle, errPrefix)) {
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

          if (! await this.validateOracleInstaller(projectDirectory, oracleInstaller, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        let wdtInstaller;
        let wdtInstallerVersion;
        if (this.requiresInstaller('wdtHome')) {
          const wdtInstallerResult = await this.downloadOrValidateWdtInstaller(projectDirectory,
            9 / totalSteps, errTitle, errPrefix);
          if (wdtInstallerResult) {
            wdtInstaller = wdtInstallerResult.wdtInstaller;
            wdtInstallerVersion = wdtInstallerResult.wdtInstallerVersion;
          } else {
            return Promise.resolve(false);
          }
        }

        const imageBuilderType = this.project.settings.builderType.value;
        busyDialogMessage = i18n.t('wit-creator-validate-image-builder-exe-in-progress',
          {builderName: imageBuilderType});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10/ totalSteps);
        // Validate the image builder executable
        const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
        if (! await this.validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix)) {
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
        if (! await this.addInstallersToCache(cacheConfig, errTitle, errPrefix)) {
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
          if (! await this.loginToImageRegistry(imageBuilderExe, loginConfig, errTitle, errPrefix)) {
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
        const imageToolResult = await this.runImageTool(false, createConfig, errPrefix);
        return Promise.resolve(imageToolResult);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
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
    }

    async validateJdkInstaller(projectDirectory, jdkInstaller, errTitle, errPrefix) {
      try {
        const jdkInstallerIsValid =
          await this.validateFile(projectDirectory, jdkInstaller, errTitle, `${errPrefix}-invalid-jdk-installer-file-message`);
        if (!jdkInstallerIsValid) {
          dialogHelper.closeBusyDialog();
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateOracleInstaller(projectDirectory, oracleInstaller, errTitle, errPrefix) {
      try {
        const oracleInstallerIsValid = await this.validateFile(projectDirectory, oracleInstaller,
          errTitle, `${errPrefix}-invalid-oracle-installer-file-message`);
        if (!oracleInstallerIsValid) {
          dialogHelper.closeBusyDialog();
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    buildCreateConfigObject(projectDirectory, javaHome, imageBuilderExe, jdkInstallerVersion,
      oracleInstallerType, oracleInstallerVersion, wdtInstallerVersion) {
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
    }

    addPatchingConfigForCreate(createConfig) {
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
    }

    addWdtConfigForCreate(projectDirectory, createConfig) {
      createConfig.modelFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.modelFiles.value);
      createConfig.variableFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.propertiesFiles.value);
      createConfig.archiveFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.archiveFiles.value);
      createConfig.domainHome = this.project.image.domainHomePath.value;
      createConfig.targetDomainType = this.project.image.targetDomainType.value;

      if (this.project.image.modelHomePath.hasValue()) {
        createConfig.modelHome = this.project.image.modelHomePath.value;
      }
    }

    requiresInstaller(type) {
      let result = true;
      if (type === 'wdtHome') {
        switch (this.project.settings.targetDomainLocation.value) {
          case 'mii':
            result = !this.project.image.useAuxImage.value;
            break;

          case 'dii':
            result = true;
            break;

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
    }

    usingWdt() {
      return !this.project.image.useAuxImage.value && this.requiresInstaller('wdtHome');
    }

    supportsPatching() {
      // We are currently not allowing users to patch a base image with an Oracle Home since we want to encourage
      // them to patch the Oracle Home while creating the image with the Oracle Home to keep the size down.
      return this.requiresInstaller('oracleHome');
    }
  }

  return new WitImageCreator();
});
