/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wit-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/wdt-preparer', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/common-utilities',
  'utils/aux-image-helper', 'utils/wkt-logger'],
function (WitActionsBase, project, wktConsole, wdtModelPreparer, i18n, projectIo, dialogHelper, validationHelper, utils,
  auxImageHelper) {
  class WitAuxImageCreator extends WitActionsBase {
    constructor() {
      super();
      this.usingPv = auxImageHelper.supportsDomainCreationImages();
    }

    async startCreateAuxImage() {
      await this.executeAction(this.callCreateAuxImage);
    }

    async callCreateAuxImage(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t(this._getMiiPvMessageKey('wit-aux-creator-aborted-error-title'));
      const errPrefix = this._getMiiPvMessageKey('wit-aux-creator');
      const abortErrorMessage = this._getAbortErrorMessage();
      if (abortErrorMessage) {
        await window.api.ipc.invoke('show-info-message', errTitle, abortErrorMessage);
        return Promise.resolve(false);
      }

      let flowKey = this.usingPv ? 'flow-create-domain-creation-image-name' : 'flow-create-aux-image-name';
      const validatableObject = this.getValidatableObject(flowKey);
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
        if (! await this.runPrepareModel(options, errPrefix,
          i18n.t(this.usingPv ? 'flow-create-domain-creation-image-name' : 'flow-create-aux-image-name'))) {
          return Promise.resolve(false);
        }

        // If there were previously no variable files and prepareModel was run, validate the variable files again...
        //
        busyDialogMessage = i18n.t(this._getMiiPvMessageKey('wit-aux-creator-validate-variable-file-in-progress'));
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
        busyDialogMessage = i18n.t(
          this._getMiiPvMessageKey('wit-aux-creator-validate-image-builder-exe-in-progress'),
          {builderName: imageBuilderType});
        dialogHelper.updateBusyDialog(busyDialogMessage, 8/ totalSteps);
        const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
        if (! await this.validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t(this._getMiiPvMessageKey('wit-aux-creator-cache-installers-in-progress'));
        dialogHelper.updateBusyDialog(busyDialogMessage, 9 / totalSteps);
        // Populate the cache
        //
        const cacheConfig = {
          javaHome: javaHome,
          wdtInstaller: wdtInstaller,
          wdtInstallerVersion: wdtInstallerVersion,
          architecture: this.project.settings.imageTargetArchitecture.value,
        };
        if (! await this.addInstallersToCache(cacheConfig, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        const imageBuilderOptions = this.getImageBuilderOptions();
        busyDialogMessage = i18n.t(this._getMiiPvMessageKey('wit-aux-creator-builder-login-in-progress'),
          {builderName: imageBuilderType, imageTag: this.project.image.auxBaseImage.value});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
        if (this.project.image.auxUseCustomBaseImage.value &&
          this.project.image.auxBaseImagePullRequiresAuthentication.value) {
          // if using custom base image and requires authentication, do build-tool login.
          const credentials = this.getImageRegistryCredential(this.project.image.auxBaseImagePullCredentialsReference.value);
          const loginConfig = {
            requiresLogin: this.project.image.auxBaseImagePullRequiresAuthentication.value,
            host: (credentials) ? credentials.address : undefined,
            username: (credentials) ? credentials.username : undefined,
            password: (credentials) ? credentials.password : undefined
          };
          if (! await this.loginToImageRegistry(imageBuilderOptions, loginConfig, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        } else if (!this.project.image.auxUseCustomBaseImage.value &&
          this.project.image.auxDefaultBaseImagePullRequiresAuthentication.value) {
          // if using default base image and requires authentication, do build-tool login to Docker Hub.
          const credentials = this.getImageRegistryCredential(this.project.image.auxDefaultBaseImagePullCredentialsReference.value);
          const loginConfig = {
            requiresLogin: this.project.image.auxDefaultBaseImagePullRequiresAuthentication.value,
            host: (credentials) ? credentials.address : undefined,
            username: (credentials) ? credentials.username : undefined,
            password: (credentials) ? credentials.password : undefined
          };
          if (! await this.loginToImageRegistry(imageBuilderOptions, loginConfig, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // run the image tool
        busyDialogMessage = i18n.t(this._getMiiPvMessageKey('wit-aux-creator-create-in-progress'));
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
      imageFormConfig.tabName =
        this.usingPv ? 'image-design-form-domain-creation-tab-name' : 'image-design-form-auxiliary-tab-name';

      validationObject.addField(this._getMiiPvImageFormKey('image-design-aux-image-tag-label'),
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
          validationObject.addField('image-design-aux-base-image-pull-credentials-label',
            validationHelper.validateRequiredField(this.project.image.auxBaseImagePullCredentialsReference.value),
            imageFormConfig);

          const credentials =
            this.getImageRegistryCredential(this.project.image.auxBaseImagePullCredentialsReference.value);
          if (credentials) {
            // skip validating the host portion of the image tag since it may be empty for Docker Hub...
            validationObject.addField('image-design-aux-base-image-pull-credentials-username-label',
              validationHelper.validateRequiredField(credentials.username), imageFormConfig);
            validationObject.addField('image-design-aux-base-image-pull-credentials-password-label',
              validationHelper.validateRequiredField(credentials.password), imageFormConfig);
          }
        }
      } else if (this.project.image.auxDefaultBaseImagePullRequiresAuthentication.value) {
        validationObject.addField('image-design-aux-default-base-image-pull-credentials-label',
          validationHelper.validateRequiredField(this.project.image.auxDefaultBaseImagePullCredentialsReference.value),
          imageFormConfig);

        const credentials =
          this.getImageRegistryCredential(this.project.image.auxDefaultBaseImagePullCredentialsReference.value);
        if (credentials) {
          // skip validating the host portion of the image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-aux-default-base-image-pull-credentials-username-label',
            validationHelper.validateRequiredField(credentials.username), imageFormConfig);
          validationObject.addField('image-design-aux-default-base-image-pull-credentials-password-label',
            validationHelper.validateRequiredField(credentials.password), imageFormConfig);
        }
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
        architecture: this.project.settings.imageTargetArchitecture.value
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
      const variableFiles = this.project.wdtModel.propertiesFiles.value;
      const nonEmptyVariableFiles = [];
      if (Array.isArray(variableFiles) && variableFiles.length > 0) {
        // This code currently supports a single variable file.
        const variableFileContent = this.project.wdtModel.getPropertyFileContents();
        for (const [file, contents] of Object.entries(variableFileContent)) {
          if (Object.getOwnPropertyNames(contents).length > 0) {
            nonEmptyVariableFiles.push(file);
          }
        }
      }

      const archiveFiles = this.project.wdtModel.archiveFiles.value;
      const nonEmptyArchiveFiles = [];
      if (Array.isArray(archiveFiles) && archiveFiles.length > 0) {
        // This code currently supports a single archive file.
        const archiveRoots = this.project.wdtModel.archiveRoots();
        if (Array.isArray(archiveRoots) && archiveRoots.length > 0) {
          nonEmptyArchiveFiles.push(archiveFiles[0]);
        }
      }

      createConfig.modelFiles = this.getAbsoluteModelFiles(projectDirectory, this.project.wdtModel.modelFiles.value);
      createConfig.variableFiles = this.getAbsoluteModelFiles(projectDirectory, nonEmptyVariableFiles);
      createConfig.archiveFiles = this.getAbsoluteModelFiles(projectDirectory, nonEmptyArchiveFiles);
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

    _getMiiPvMessageKey(key) {
      if (this.usingPv) {
        return key.replace(/^wit-aux-/, 'wit-dci-');
      }
      return key;
    }

    _getMiiPvImageFormKey(key) {
      if (this.usingPv) {
        return key.replace(/^image-design-aux-/, 'image-design-domain-creation-');
      }
      return key;
    }

    _getAbortErrorMessage() {
      let abortErrorMessage;
      if (this.project.settings.targetDomainLocation.value === 'mii' || this.usingPv) {
        if (!this.project.image.useAuxImage.value) {
          abortErrorMessage = i18n.t(this._getMiiPvMessageKey('wit-aux-creator-image-not-use-message'));
        } else if (!this.project.image.createAuxImage.value) {
          abortErrorMessage = i18n.t(this._getMiiPvMessageKey('wit-aux-creator-image-not-create-message'));
        }
      } else if (this.project.settings.targetDomainLocation.value === 'pv') {
        if (this.project.wko.installedVersion.hasValue()) {
          abortErrorMessage = i18n.t('wit-dci-creator-image-not-supported-message',
            { wkoInstalledVersion: this.project.wko.installedVersion.value });
        } else {
          abortErrorMessage = i18n.t('wit-dci-creator-image-not-supported-no-version-message');
        }
      } else {
        abortErrorMessage = i18n.t('wit-aux-creator-image-not-mii-message');
      }
      return abortErrorMessage;
    }
  }

  return WitAuxImageCreator;
});
