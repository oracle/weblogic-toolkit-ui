/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wit-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/wdt-preparer', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/common-utilities', 'utils/wkt-logger'],
function (WitActionsBase, project, wktConsole, wdtModelPreparer, i18n, projectIo, dialogHelper, validationHelper, utils) {
  class WitAuxImageCreator extends WitActionsBase {
    constructor() {
      super();
    }

    async startCreateAuxImage() {
      await this.executeAction(this.callCreateAuxImage);
    }

    async callCreateAuxImage(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('wit-aux-creator-aborted-error-title');
      const errPrefix = 'wit-aux-creator';
      let abortErrorMessage;
      if (this.project.settings.targetDomainLocation.value !== 'mii') {
        abortErrorMessage = i18n.t('wit-aux-creator-image-not-mii-message');
      } else if (!this.project.image.useAuxImage.value) {
        abortErrorMessage = i18n.t('wit-aux-creator-image-not-use-message');
      } else if (!this.project.image.createAuxImage.value) {
        abortErrorMessage = i18n.t('wit-aux-creator-image-not-create-message');
      }
      if (abortErrorMessage) {
        await window.api.ipc.invoke('show-info-message', errTitle, abortErrorMessage);
        return Promise.resolve(false);
      }

      const validatableObject = this.getValidatableObject('flow-create-aux-image-name');
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
        const variableFileCountBeforePrepareModel = this.getVariableFilesCount();
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

        if (!options.skipClearAndShowConsole) {
          wktConsole.clear();
          wktConsole.show(true);
        }

        // Prompt user for running inline prepare model flow.
        busyDialogMessage = i18n.t('wdt-preparer-prepare-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        if (! await this.runPrepareModel(options, errPrefix, i18n.t('flow-create-aux-image-name'))) {
          return Promise.resolve(false);
        }

        // If there were previously no variable files and prepareModel was run, validate the variable files again...
        //
        busyDialogMessage = i18n.t('wit-aux-creator-validate-variable-file-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
        if (variableFileCountBeforePrepareModel === 0 && this.getVariableFilesCount() > 0) {
          variableFiles = this.project.wdtModel.propertiesFiles.value;
          if (! await this.validateVariableFiles(projectDirectory, variableFiles, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        const wdtInstallerResults =
          await this.downloadOrValidateWdtInstaller(projectDirectory, 7 / totalSteps, errTitle, errPrefix);
        if (!wdtInstallerResults) {
          return Promise.resolve(false);
        }
        const wdtInstaller = wdtInstallerResults.wdtInstaller;
        const wdtInstallerVersion = wdtInstallerResults.wdtInstallerVersion;

        const imageBuilderType = this.project.settings.builderType.value;
        busyDialogMessage = i18n.t('wit-aux-creator-validate-image-builder-exe-in-progress',
          {builderName: imageBuilderType});
        dialogHelper.updateBusyDialog(busyDialogMessage, 8/ totalSteps);
        const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
        if (! await this.validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('wit-aux-creator-cache-installers-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 9 / totalSteps);
        // Populate the cache
        //
        const cacheConfig = {
          javaHome: javaHome,
          wdtInstaller: wdtInstaller,
          wdtInstallerVersion: wdtInstallerVersion
        };
        if (! await this.addInstallersToCache(cacheConfig, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        const imageBuilderOptions = this.getImageBuilderOptions();
        busyDialogMessage = i18n.t('wit-aux-creator-builder-login-in-progress',
          {builderName: imageBuilderType, imageTag: this.project.image.auxBaseImage.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
        if (this.project.image.auxUseCustomBaseImage.value &&
          this.project.image.auxBaseImagePullRequiresAuthentication.value) {
          // if using custom base image and requires authentication, do build-tool login.
          const loginConfig = {
            requiresLogin: this.project.image.auxBaseImagePullRequiresAuthentication.value,
            host: this.project.image.internal.auxBaseImageRegistryAddress.value,
            username: this.project.image.auxBaseImagePullUsername.value,
            password: this.project.image.auxBaseImagePullPassword.value
          };
          if (! await this.loginToImageRegistry(imageBuilderOptions, loginConfig, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        } else if (!this.project.image.auxUseCustomBaseImage.value &&
          this.project.image.auxDefaultBaseImagePullRequiresAuthentication.value) {
          // if using default base image and requires authentication, do build-tool login to Docker Hub.
          const loginConfig = {
            requiresLogin: this.project.image.auxDefaultBaseImagePullRequiresAuthentication.value,
            username: this.project.image.auxDefaultBaseImagePullUsername.value,
            password: this.project.image.auxDefaultBaseImagePullPassword.value
          };
          if (! await this.loginToImageRegistry(imageBuilderOptions, loginConfig, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // run the image tool
        busyDialogMessage = i18n.t('wit-aux-creator-create-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 11 / totalSteps);
        const createConfig =
          this.buildCreateConfigObject(projectDirectory, javaHome, wdtInstallerVersion, imageBuilderOptions);
        const imageToolStatus = await this.runImageTool(true, createConfig, errPrefix);
        return Promise.resolve(imageToolStatus);
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
      } else if (this.project.image.auxDefaultBaseImagePullRequiresAuthentication.value) {
        validationObject.addField('image-design-aux-default-base-image-pull-username-label',
          validationHelper.validateRequiredField(this.project.image.auxDefaultBaseImagePullUsername.value),
          imageFormConfig);
        validationObject.addField('image-design-aux-default-base-image-pull-password-label',
          validationHelper.validateRequiredField(this.project.image.auxDefaultBaseImagePullPassword.value),
          imageFormConfig);
      }
      return validationObject;
    }

    buildCreateConfigObject(projectDirectory, javaHome, wdtInstallerVersion, imageBuilderOptions) {
      const createConfig = Object.assign({
        javaHome: javaHome,
        imageTag: this.project.image.auxImageTag.value,
        wdtInstallerVersion: wdtInstallerVersion,
        additionalBuildCommandsFile: this.project.image.auxAdditionalBuildCommandsFile.value,
        additionalBuildFiles: this.project.image.auxAdditionalBuildFiles.value,
        buildNetwork: this.project.image.auxBuilderNetworkName.value,
        chownOwner: undefined,
        chownGroup: undefined,
        alwaysPullBaseImage: this.project.image.auxAlwaysPullBaseImage.value,
      }, imageBuilderOptions);

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

      this.addWdtConfig(projectDirectory, createConfig);
      return createConfig;
    }

    addWdtConfig(projectDirectory, createConfig) {
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
    }
  }

  return new WitAuxImageCreator();
});
