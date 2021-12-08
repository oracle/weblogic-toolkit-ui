/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper'],
  function(project, wktConsole, i18n, projectIo, dialogHelper, validationHelper) {
    function ImagePusher() {
      this.project = project;

      this.startPushImage = async () => {
        return this.callPushImage();
      };

      this.startPushAuxImage = async () => {
        return this.callPushAuxImage();
      };

      this.callPushImage = async (options) => {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('image-pusher-push-aborted-title');
        if (!this.project.image.createPrimaryImage.value) {
          const errMessage = i18n.t('image-pusher-image-not-create-message');
          await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        const validatableObject = this.getValidatableObjectForPrimary('flow-push-image-name');
        if (validatableObject.hasValidationErrors()) {
          const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
          dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
          return Promise.resolve(false);
        }

        const totalSteps = 4.0;
        const imageTag = this.project.image.imageTag.value;

        let busyDialogMessage = i18n.t('flow-image-builder-validation-in-progress', {imageTag: imageTag});
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);
        try {
          const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
          if (!options.skipImageBuilderValidation) {
            const imageBuilderExeResults =
              await window.api.ipc.invoke('validate-image-builder-exe', imageBuilderExe);
            if (!imageBuilderExeResults.isValid) {
              const errMessage = i18n.t('image-pusher-image-builder-invalid-error-message',
                {fileName: imageBuilderExe, error: imageBuilderExeResults.reason});
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          busyDialogMessage = i18n.t('image-pusher-image-exists-in-progress', {imageTag: imageTag});
          dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
          if (!options.skipLocalImageExistsValidation) {
            const imageExistsResults =
              await window.api.ipc.invoke('validate-image-exists-locally', imageBuilderExe, imageTag);
            let errMessage;
            if (imageExistsResults.isSuccess && !imageExistsResults.imageExists) {
              errMessage = i18n.t('image-pusher-image-not-exists-error-message', {imageTag: imageTag});
            } else if (!imageExistsResults.isSuccess) {
              errMessage = i18n.t('image-pusher-image-exists-failed-error-message',
                {imageTag: imageTag, error: imageExistsResults.reason});
            }
            if (errMessage) {
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          busyDialogMessage = i18n.t('flow-save-project-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
          if (!options.skipProjectSave) {
            const saveResult = await projectIo.saveProject();
            if (!saveResult.saved) {
              const errMessage = `${i18n.t('image-pusher-project-not-saved-error-prefix')}: ${saveResult.reason}`;
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          if (!options.skipClearAndShowConsole) {
            wktConsole.clear();
            wktConsole.show(true);
          }

          busyDialogMessage = i18n.t('image-pusher-push-in-progress', {imageTag: imageTag});
          dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
          const pushOptions = {
            requiresLogin: this.project.image.imageRegistryPushRequireAuthentication.value,
            host: this.project.image.internal.imageRegistryAddress.value,
            username: this.project.image.imageRegistryPushUser.value,
            password: this.project.image.imageRegistryPushPassword.value
          };
          let pushResults = await window.api.ipc.invoke('do-push-image', imageBuilderExe, imageTag, pushOptions);
          dialogHelper.closeBusyDialog();
          if (pushResults.isSuccess) {
            if (!options.skipCompleteDialog) {
              const title = i18n.t('image-pusher-create-complete-title');
              const message = i18n.t('image-pusher-create-complete-message', {imageTag: imageTag});
              await window.api.ipc.invoke('show-info-message', title, message);
            }
            return Promise.resolve(true);
          } else {
            const failedTitle = i18n.t('image-pusher-push-failed-title');
            const failedMessage = i18n.t('image-pusher-push-failed-error-message', {error: pushResults.reason});
            await window.api.ipc.invoke('show-error-message', failedTitle, failedMessage);
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
        const imageFormConfig = validationObject.getDefaultConfigObject();
        imageFormConfig.formName = 'image-design-form-name';
        imageFormConfig.tabName = 'image-design-form-primary-tab-name';

        validationObject.addField('image-design-image-tag-label',
          this.project.image.imageTag.validate(true), imageFormConfig);

        const settingsFormConfig = validationObject.getDefaultConfigObject();
        settingsFormConfig.formName = 'project-settings-title';
        settingsFormConfig.fieldNamePayload = { toolName: this.project.settings.builderType.value };
        validationObject.addField('project-settings-build-tool-label',
          validationHelper.validateRequiredField(this.project.settings.builderExecutableFilePath.value),
          settingsFormConfig);

        if (this.project.image.imageRegistryPushRequireAuthentication.value) {
          // skip validating the host portion of the image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-image-registry-push-username-label',
            validationHelper.validateRequiredField(this.project.image.imageRegistryPushUser.value),
            imageFormConfig);
          validationObject.addField('image-design-image-registry-push-password-label',
            validationHelper.validateRequiredField(this.project.image.imageRegistryPushPassword.value),
            imageFormConfig);
        }

        return validationObject;
      };

      this.callPushAuxImage = async (options) => {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('image-pusher-push-aborted-title');
        let abortErrorMessage;
        if (this.project.settings.targetDomainLocation.value !== 'mii') {
          abortErrorMessage = i18n.t('image-pusher-aux-image-not-mii-message');
        } else if (!this.project.image.useAuxImage.value) {
          abortErrorMessage = i18n.t('image-pusher-aux-image-not-use-message');
        } else if (!this.project.image.createAuxImage.value) {
          abortErrorMessage = i18n.t('image-pusher-aux-image-not-create-message');
        }
        if (abortErrorMessage) {
          await window.api.ipc.invoke('show-info-message', errTitle, abortErrorMessage);
          return Promise.resolve(false);
        }


        const validatableObject = this.getValidatableObjectForAux('flow-push-aux-image-name');
        if (validatableObject.hasValidationErrors()) {
          const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
          dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
          return Promise.resolve(false);
        }

        const totalSteps = 4.0;
        const imageTag = this.project.image.auxImageTag.value;

        let busyDialogMessage = i18n.t('flow-image-builder-validation-in-progress', {imageTag: imageTag});
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);
        try {
          const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
          if (!options.skipImageBuilderValidation) {
            const imageBuilderExeResults =
              await window.api.ipc.invoke('validate-image-builder-exe', imageBuilderExe);
            if (!imageBuilderExeResults.isValid) {
              const errMessage = i18n.t('image-pusher-image-builder-invalid-error-message',
                {fileName: imageBuilderExe, error: imageBuilderExeResults.reason});
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          busyDialogMessage = i18n.t('image-pusher-image-exists-in-progress', {imageTag: imageTag});
          dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
          if (!options.skipLocalImageExistsValidation) {
            const imageExistsResults =
              await window.api.ipc.invoke('validate-image-exists-locally', imageBuilderExe, imageTag);
            let errMessage;
            if (imageExistsResults.isSuccess && !imageExistsResults.imageExists) {
              errMessage = i18n.t('image-pusher-image-not-exists-error-message', {imageTag: imageTag});
            } else if (!imageExistsResults.isSuccess) {
              errMessage = i18n.t('image-pusher-image-exists-failed-error-message',
                {imageTag: imageTag, error: imageExistsResults.reason});
            }
            if (errMessage) {
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          busyDialogMessage = i18n.t('flow-save-project-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
          if (!options.skipProjectSave) {
            const saveResult = await projectIo.saveProject();
            if (!saveResult.saved) {
              const errMessage = `${i18n.t('image-pusher-project-not-saved-error-prefix')}: ${saveResult.reason}`;
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          if (!options.skipClearAndShowConsole) {
            wktConsole.clear();
            wktConsole.show(true);
          }

          busyDialogMessage = i18n.t('image-pusher-push-in-progress', {imageTag: imageTag});
          dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
          const pushOptions = {
            requiresLogin: this.project.image.auxImageRegistryPushRequireAuthentication.value,
            host: this.project.image.internal.auxImageRegistryAddress.value,
            username: this.project.image.auxImageRegistryPushUser.value,
            password: this.project.image.auxImageRegistryPushPassword.value
          };
          let pushResults = await window.api.ipc.invoke('do-push-image', imageBuilderExe, imageTag, pushOptions);
          dialogHelper.closeBusyDialog();
          if (pushResults.isSuccess) {
            if (!options.skipCompleteDialog) {
              const title = i18n.t('image-pusher-create-complete-title');
              const message = i18n.t('image-pusher-create-complete-message', {imageTag: imageTag});
              await window.api.ipc.invoke('show-info-message', title, message);
            }
            return Promise.resolve(true);
          } else {
            const failedTitle = i18n.t('image-pusher-push-failed-title');
            const failedMessage = i18n.t('image-pusher-push-failed-error-message', {error: pushResults.reason});
            await window.api.ipc.invoke('show-error-message', failedTitle, failedMessage);
            return Promise.resolve(false);
          }
        } catch (err) {
          dialogHelper.closeBusyDialog();
          throw err;
        } finally {
          dialogHelper.closeBusyDialog();
        }
      };

      this.getValidatableObjectForAux = (flowNameKey) => {
        const validationObject = validationHelper.createValidatableObject(flowNameKey);
        const imageFormConfig = validationObject.getDefaultConfigObject();
        imageFormConfig.formName = 'image-design-form-name';
        imageFormConfig.tabName = 'image-design-form-auxiliary-tab-name';

        validationObject.addField('image-design-image-tag-label',
          this.project.image.auxImageTag.validate(true), imageFormConfig);

        const settingsFormConfig = validationObject.getDefaultConfigObject();
        settingsFormConfig.formName = 'project-settings-form-name';
        settingsFormConfig.fieldNamePayload = { toolName: this.project.settings.builderType.value };
        validationObject.addField('project-settings-build-tool-label',
          validationHelper.validateRequiredField(this.project.settings.builderExecutableFilePath.value),
          settingsFormConfig);

        if (this.project.image.auxImageRegistryPushRequireAuthentication.value) {
          // skip validating the host portion of the image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-aux-image-registry-push-username-label',
            validationHelper.validateRequiredField(this.project.image.auxImageRegistryPushUser.value), imageFormConfig);
          validationObject.addField('image-design-aux-image-registry-push-password-label',
            validationHelper.validateRequiredField(this.project.image.auxImageRegistryPushPassword.value), imageFormConfig);
        }

        return validationObject;
      };
    }

    return new ImagePusher();
  }
);
