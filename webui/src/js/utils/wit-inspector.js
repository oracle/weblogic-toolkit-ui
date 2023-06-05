/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wit-actions-base', 'models/wkt-project', 'utils/i18n', 'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/wkt-logger'],
  function (WitActionsBase, project, i18n, projectIo, dialogHelper, validationHelper, wktLogger) {
    class WktImageInspector extends WitActionsBase {
      constructor() {
        super();
      }

      async startInspectBaseImage() {
        await this.executeAction(this.callInspectBaseImage);
      }

      async startInspectPrimaryImage() {
        await this.executeAction(this.callInspectPrimaryImage);
      }

      async startInspectAuxiliaryImage() {
        await this.executeAction(this.callInspectAuxiliaryImage);
      }

      async callInspectBaseImage(options) {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('wit-inspector-aborted-error-title');
        const errPrefix = 'wit-inspector';
        const validatableObject = this.getValidatableObjectForBaseImageInspection('flow-inspect-base-image-name');
        if (validatableObject.hasValidationErrors()) {
          const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
          dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
          return Promise.resolve(false);
        }

        const totalSteps = 5.0;
        try {
          const registryLoginRequired = this.project.image.useCustomBaseImage.value
            && this.project.image.baseImage.value
            && this.project.image.baseImagePullRequiresAuthentication.value;
          const registryLoginConfig = registryLoginRequired ?
            {
              requiresLogin: this.project.image.baseImagePullRequiresAuthentication.value,
              host: window.api.k8s.getRegistryAddressFromImageTag(this.project.image.baseImage.value),
              username: this.project.image.baseImagePullUsername.value,
              password: this.project.image.baseImagePullPassword.value
            }: {};
          const validationStepsStatus = await this._callCommonValidationSteps(options, totalSteps,
            registryLoginRequired, registryLoginConfig, errTitle, errPrefix);
          if (!validationStepsStatus) {
            return Promise.resolve(false);
          }

          const baseImageTag = this.project.image.baseImage.value;
          wktLogger.debug('baseImageTag = %s', baseImageTag);
          const inspectResults = await this._inspectImage(baseImageTag, 4, totalSteps);
          dialogHelper.closeBusyDialog();
          if (inspectResults.isSuccess) {
            this.project.image.setBaseImageContents(inspectResults.contents);
            const title = i18n.t('wit-inspector-inspect-complete-title');
            const message = this.getInspectBaseImageSuccessMessage(baseImageTag, inspectResults.contents);
            const dialogOptions = {
              title: title,
              message: message,
              contents: inspectResults.contents
            };
            dialogHelper.openDialog('inspect-dialog', dialogOptions);
            return Promise.resolve(true);
          } else {
            errTitle = i18n.t('wit-inspector-inspect-failed-title');
            const errMessage = i18n.t('wit-inspector-inspect-failed-error-message',
              {imageTag: baseImageTag, error: inspectResults.reason});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } catch (err) {
          dialogHelper.closeBusyDialog();
          throw err;
        } finally {
          dialogHelper.closeBusyDialog();
        }
      }

      async callInspectPrimaryImage(options) {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('wit-inspector-wdt-primary-aborted-error-title');
        const errPrefix = 'wit-inspector';
        const validatableObject =
          this.getValidatableObjectForPrimaryImageInspection('flow-inspect-primary-image-name');
        if (validatableObject.hasValidationErrors()) {
          const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
          dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
          return Promise.resolve(false);
        }

        const totalSteps = 5.0;
        try {
          const registryLoginRequired = !this.project.image.createPrimaryImage.value
            && this.project.image.useAuxImage.value
            && this.project.image.imageTag.value
            && this.project.k8sDomain.imageRegistryPullRequireAuthentication.value;
          const registryLoginConfig = registryLoginRequired ?
            {
              requiresLogin: this.project.k8sDomain.imageRegistryPullRequireAuthentication.value,
              host: window.api.k8s.getRegistryAddressFromImageTag(this.project.image.imageTag.value),
              username: this.project.k8sDomain.imageRegistryPullUser.value,
              password: this.project.k8sDomain.imageRegistryPullPassword.value
            }: {};
          const validationStepsStatus = await this._callCommonValidationSteps(options, totalSteps,
            registryLoginRequired, registryLoginConfig, errTitle, errPrefix);
          if (!validationStepsStatus) {
            return Promise.resolve(false);
          }

          const imageTag = this.project.image.imageTag.value;
          wktLogger.debug('imageTag = %s', imageTag);
          const inspectResults = await this._inspectImage(imageTag, 4, totalSteps);
          dialogHelper.closeBusyDialog();
          if (inspectResults.isSuccess) {
            const applyResults = this.applyPrimaryImageWdtLocations(inspectResults.contents);

            const title = i18n.t('wit-inspector-inspect-complete-title');
            const message = applyResults.message;
            const dialogOptions = {
              title: title,
              message: message,
              contents: inspectResults.contents
            };
            dialogHelper.openDialog('inspect-dialog', dialogOptions);
            return Promise.resolve(true);
          } else {
            errTitle = i18n.t('wit-inspector-inspect-failed-title');
            const errMessage = i18n.t('wit-inspector-inspect-failed-error-message',
              {imageTag: imageTag, error: inspectResults.reason});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } catch (err) {
          dialogHelper.closeBusyDialog();
          throw err;
        } finally {
          dialogHelper.closeBusyDialog();
        }
      }

      async callInspectAuxiliaryImage(options) {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('wit-inspector-wdt-auxiliary-aborted-error-title');
        const errPrefix = 'wit-inspector';
        const validatableObject =
          this.getValidatableObjectForAuxiliaryImageInspection('flow-inspect-auxiliary-image-name');
        if (validatableObject.hasValidationErrors()) {
          const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
          dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
          return Promise.resolve(false);
        }

        const totalSteps = 5.0;
        try {
          const registryLoginRequired = this.project.image.useAuxImage.value
            && !this.project.image.createAuxImage.value
            && this.project.image.auxImageTag.value
            && this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value;
          const registryLoginConfig = registryLoginRequired ?
            {
              requiresLogin: this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value,
              host: window.api.k8s.getRegistryAddressFromImageTag(this.project.image.auxImageTag.value),
              username: this.project.k8sDomain.auxImageRegistryPullUser.value,
              password: this.project.k8sDomain.auxImageRegistryPullPassword.value
            }: {};
          const validationStepsStatus = await this._callCommonValidationSteps(options, totalSteps,
            registryLoginRequired, registryLoginConfig, errTitle, errPrefix);
          if (!validationStepsStatus) {
            return Promise.resolve(false);
          }

          const imageTag = this.project.image.auxImageTag.value;
          wktLogger.debug('auxImageTag = %s', imageTag);
          const inspectResults = await this._inspectImage(imageTag, 4, totalSteps);
          dialogHelper.closeBusyDialog();
          if (inspectResults.isSuccess) {
            const applyResults = this.applyAuxiliaryImageWdtLocations(inspectResults.contents);

            const title = i18n.t('wit-inspector-inspect-complete-title');
            const message = applyResults.message;
            const dialogOptions = {
              title: title,
              message: message,
              contents: inspectResults.contents
            };
            dialogHelper.openDialog('inspect-dialog', dialogOptions);
            return Promise.resolve(true);
          } else {
            errTitle = i18n.t('wit-inspector-inspect-failed-title');
            const errMessage = i18n.t('wit-inspector-inspect-failed-error-message',
              {imageTag: imageTag, error: inspectResults.reason});
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        } catch (err) {
          dialogHelper.closeBusyDialog();
          throw err;
        } finally {
          dialogHelper.closeBusyDialog();
        }
      }

      getValidatableObjectForBaseImageInspection(flowNameKey) {
        const validationObject = this._getCommonValidatableObject(flowNameKey);
        const imageFormConfig = validationObject.getDefaultConfigObject();
        imageFormConfig.formName = 'image-design-form-name';
        validationObject.addField('image-design-custom-base-image-label',
          this.project.image.baseImage.validate(true), imageFormConfig);

        if (this.project.image.baseImagePullRequiresAuthentication.value) {
          // skip validating the host portion of the base image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-base-image-pull-username-label',
            validationHelper.validateRequiredField(this.project.image.baseImagePullUsername.value), imageFormConfig);
          validationObject.addField('image-design-base-image-pull-password-label',
            validationHelper.validateRequiredField(this.project.image.baseImagePullPassword.value), imageFormConfig);
        }

        return validationObject;
      }

      getValidatableObjectForPrimaryImageInspection(flowNameKey) {
        const validationObject = this._getCommonValidatableObject(flowNameKey);
        const domainFormConfig = this._getDomainDesignFormConfig(validationObject);
        validationObject.addField('domain-design-image-tag-label',
          this.project.image.imageTag.validate(true), domainFormConfig);

        if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value) {
          // skip validating the host portion of the image tag since it may be empty for Docker Hub...
          validationObject.addField('domain-design-image-registry-pull-username-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.imageRegistryPullUser.value),
            domainFormConfig);
          validationObject.addField('domain-design-image-registry-pull-password-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.imageRegistryPullPassword.value),
            domainFormConfig);
        }

        return validationObject;
      }

      getValidatableObjectForAuxiliaryImageInspection(flowNameKey) {
        const validationObject = this._getCommonValidatableObject(flowNameKey);
        const domainFormConfig = this._getDomainDesignFormConfig(validationObject);
        validationObject.addField('domain-design-aux-image-tag-label',
          this.project.image.auxImageTag.validate(true), domainFormConfig);

        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value) {
          // skip validating the host portion of the image tag since it may be empty for Docker Hub...
          validationObject.addField('domain-design-aux-image-registry-pull-username-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullUser.value),
            domainFormConfig);
          validationObject.addField('domain-design-aux-image-registry-pull-password-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullPassword.value),
            domainFormConfig);
        }

        return validationObject;
      }

      _getCommonValidatableObject(flowNameKey) {
        const validationObject = validationHelper.createValidatableObject(flowNameKey);
        const settingsFormConfig = validationObject.getDefaultConfigObject();
        settingsFormConfig.formName = 'project-settings-form-name';

        validationObject.addField('project-settings-java-home-label',
          validationHelper.validateRequiredField(this.project.settings.javaHome.value), settingsFormConfig);

        const settingsFormBuilderConfig = validationObject.getDefaultConfigObject();
        settingsFormBuilderConfig.formName = 'project-settings-form-name';
        settingsFormBuilderConfig.fieldNamePayload = { toolName: this.project.settings.builderType.value };
        validationObject.addField('project-settings-build-tool-label',
          validationHelper.validateRequiredField(this.project.settings.builderExecutableFilePath.value),
          settingsFormBuilderConfig);

        return validationObject;
      }

      _getDomainDesignFormConfig(validationObject) {
        const domainFormConfig = validationObject.getDefaultConfigObject();
        domainFormConfig.formName = 'domain-design-form-name';
        return domainFormConfig;
      }

      async _callCommonValidationSteps(options, totalSteps, registryLoginRequired, registryLoginConfig,
        errTitle, errPrefix) {
        let busyDialogMessage = i18n.t('flow-validate-java-home-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

        const javaHome = project.settings.javaHome.value;
        if (!options.skipJavaHomeValidation) {
          if (!await this.validateJavaHome(javaHome, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        const imageBuilderType = this.project.settings.builderType.value;
        busyDialogMessage = i18n.t('flow-validate-image-builder-exe-in-progress',
          {builderName: imageBuilderType});
        dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);
        // Validate the image builder executable
        const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
        if (!await this.validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
        if (!options.skipProjectSave) {
          if (!await this.saveProject(errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        const imageBuilderOptions = this.getImageBuilderOptions();
        busyDialogMessage = i18n.t('flow-image-builder-login-in-progress', {builderName: imageBuilderType});
        dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
        if (registryLoginRequired) {
          if (!await this.loginToImageRegistry(imageBuilderOptions, registryLoginConfig, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }
        return Promise.resolve(true);
      }

      async _inspectImage(imageTag, stepNumber, totalSteps) {
        const javaHome = this.project.settings.javaHome.value;
        const busyDialogMessage = i18n.t('wit-inspector-inspect-in-process', {imageTag: imageTag});
        dialogHelper.updateBusyDialog(busyDialogMessage, stepNumber / totalSteps);
        return window.api.ipc.invoke('get-image-contents', javaHome, imageTag, this.getImageBuilderOptions());
      }

      getInspectBaseImageSuccessMessage(imageTag, imageContents) {
        let key;
        if ('oracleHome' in imageContents) {
          key = 'wit-inspect-results-fmw-message';
        } else if ('javaHome' in imageContents) {
          key = 'wit-inspect-results-java-message';
        } else {
          key = 'wit-inspector-empty-contents-message';
        }
        return i18n.t(key, { imageTag: imageTag });
      }

      applyPrimaryImageWdtLocations(inspectResultsContents) {
        const result = {
          isSuccess: true
        };

        if (inspectResultsContents.wdtHome) {
          result.wdtInstallHome =
            window.api.path.joinAndConvertToUnixPath(inspectResultsContents.wdtHome, 'weblogic-deploy');
        } else {
          result.isSuccess = false;
        }

        if (inspectResultsContents.wdtModelHome) {
          result.wdtModelHome = inspectResultsContents.wdtModelHome;
        } else {
          result.isSuccess = false;
        }

        if (result.isSuccess) {
          this.project.k8sDomain.imageWDTInstallHome.value = result.wdtInstallHome;
          this.project.k8sDomain.imageModelHome.value = result.wdtModelHome;
          result.message = i18n.t('wit-inspect-primary-results-success-message');
        } else {
          if (!result.wdtInstallHome && !result.wdtModelHome) {
            result.message = i18n.t('wit-inspect-primary-results-no-wdt-or-models-message');
          } else if (!result.wdtInstallHome) {
            result.message = i18n.t('wit-inspect-primary-results-no-wdt-message',
              { wdtModelHome: result.wdtModelHome });
          } else if (!result.wdtModelHome) {
            result.message = i18n.t('wit-inspect-primary-results-no-models-message',
              { wdtInstallHome: result.wdtInstallHome });
          }
        }
        return result;
      }

      applyAuxiliaryImageWdtLocations(inspectResultsContents) {
        const result = this._populateInspectResult(inspectResultsContents);

        if (result.isSuccess) {
          this.project.k8sDomain.auxImageSourceWDTInstallHome.value = result.wdtInstallHome;
          this.project.k8sDomain.auxImageSourceModelHome.value = result.wdtModelHome;
          result.message = i18n.t('wit-inspect-auxiliary-results-success-message');
        } else {
          if (!result.wdtInstallHome && !result.wdtModelHome) {
            result.message = i18n.t('wit-inspect-auxiliary-results-no-wdt-or-models-message');
          } else if (!result.wdtInstallHome) {
            result.message = i18n.t('wit-inspect-auxiliary-results-no-wdt-message',
              { wdtModelHome: result.wdtModelHome });
          } else if (!result.wdtModelHome) {
            result.message = i18n.t('wit-inspect-auxiliary-results-no-models-message',
              { wdtInstallHome: result.wdtInstallHome });
          }
        }
        return result;
      }

      _populateInspectResult(inspectResultsContents) {
        const result = {
          isSuccess: true
        };

        if (inspectResultsContents.wdtHome) {
          result.wdtInstallHome =
            window.api.path.joinAndConvertToUnixPath(inspectResultsContents.wdtHome, 'weblogic-deploy');
        } else {
          result.isSuccess = false;
        }

        if (inspectResultsContents.wdtModelHome) {
          result.wdtModelHome = inspectResultsContents.wdtModelHome;
        } else {
          result.isSuccess = false;
        }
        return result;
      }
    }

    return new WktImageInspector();
  }
);
