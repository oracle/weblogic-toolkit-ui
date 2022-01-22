/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/image-registry-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper'],
function(ImageRegistryActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper) {
  class ImagePusher extends ImageRegistryActionsBase {
    constructor() {
      super();
    }

    async startPushImage() {
      await this.executeAction(this.callPushImage);
    }

    async callPushImage(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('image-pusher-push-aborted-title');
      const errPrefix = 'image-pusher';
      if (!this.project.image.createPrimaryImage.value) {
        const errMessage = i18n.t('image-pusher-image-not-create-message');
        await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      const validatableObject = this.getValidatableObject('flow-push-image-name');
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
          if (! await this.validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('image-pusher-image-exists-in-progress', {imageTag: imageTag});
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        const imageBuilderOptions = this.getImageBuilderOptions();
        if (!options.skipLocalImageExistsValidation) {
          if (! await this.validateImageExistsLocally(imageBuilderOptions, imageTag, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
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
        const imagePushResult =
          await this.pushImage(imageBuilderOptions, imageTag, pushOptions, errTitle, errPrefix, options.skipCompleteDialog);
        return Promise.resolve(imagePushResult);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    };

    getValidatableObject(flowNameKey) {
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
    }
  }

  return new ImagePusher();
});
