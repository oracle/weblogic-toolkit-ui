/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wit-actions-base', 'models/wkt-project', 'utils/i18n', 'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/wkt-logger'],
  function (WitActionsBase, project, i18n, projectIo, dialogHelper, validationHelper, wktLogger) {
    class WktImageInspector extends WitActionsBase {
      constructor() {
        super();
      }

      async startInspectImage() {
        await this.executeAction(this.callInspectImage);
      }

      async callInspectImage(options) {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('wit-inspector-aborted-error-title');
        const errPrefix = 'wit-inspector';
        const validatableObject = this.getValidatableObject('flow-inspect-base-image-name');
        if (validatableObject.hasValidationErrors()) {
          const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
          dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
          return Promise.resolve(false);
        }

        const totalSteps = 5.0;
        try {
          let busyDialogMessage = i18n.t('flow-validate-java-home-in-progress');
          dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
          dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

          const javaHome = project.settings.javaHome.value;
          if (!options.skipJavaHomeValidation) {
            if (! await this.validateJavaHome(javaHome, errTitle, errPrefix)) {
              return Promise.resolve(false);
            }
          }

          const imageBuilderType = this.project.settings.builderType.value;
          busyDialogMessage = i18n.t('flow-validate-image-builder-exe-in-progress',
            {builderName: imageBuilderType});
          dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);
          // Validate the image builder executable
          const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
          if (! await this.validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }

          busyDialogMessage = i18n.t('flow-save-project-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
          if (!options.skipProjectSave) {
            if (! await this.saveProject(errTitle, errPrefix)) {
              return Promise.resolve(false);
            }
          }

          const imageBuilderOptions = this.getImageBuilderOptions();
          busyDialogMessage = i18n.t('flow-image-builder-login-in-progress', {builderName: imageBuilderType});
          dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
          if (this.project.image.useCustomBaseImage.value &&
            this.project.image.baseImage.value &&
            this.project.image.baseImagePullRequiresAuthentication.value) {
            const loginConfig = {
              requiresLogin: this.project.image.baseImagePullRequiresAuthentication.value,
              host: window.api.k8s.getRegistryAddressFromImageTag(this.project.image.baseImage.value),
              username: this.project.image.baseImagePullUsername.value,
              password: this.project.image.baseImagePullPassword.value
            };
            if (! await this.loginToImageRegistry(imageBuilderOptions, loginConfig, errTitle, errPrefix)) {
              return Promise.resolve(false);
            }
          }

          const baseImageTag = this.project.image.baseImage.value;
          wktLogger.debug('baseImageTag = %s', baseImageTag);
          busyDialogMessage = i18n.t('wit-inspector-inspect-in-process', {imageTag: baseImageTag});
          dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
          const inspectResults = await window.api.ipc.invoke('get-image-contents', javaHome, baseImageTag,
            this.getImageBuilderOptions());
          dialogHelper.closeBusyDialog();
          if (inspectResults.isSuccess) {
            this.project.image.setBaseImageContents(inspectResults.contents);
            const title = i18n.t('wit-inspector-inspect-complete-title');
            const message = this.getInspectSuccessMessage(baseImageTag, inspectResults.contents);
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

      getValidatableObject(flowNameKey) {
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

      getInspectSuccessMessage(imageTag, imageContents) {
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
    }

    return new WktImageInspector();
  }
);
