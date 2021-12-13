/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/image-registry-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper'],
function(ImageRegistryActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper) {
  class AuxImagePusher extends ImageRegistryActionsBase {
    constructor() {
      super();
    }

    async startPushAuxImage() {
      return this.callPushAuxImage();
    }

    async callPushAuxImage(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('aux-image-pusher-push-aborted-title');
      const errPrefix = 'aux-image-pusher';
      let abortErrorMessage;
      if (this.project.settings.targetDomainLocation.value !== 'mii') {
        abortErrorMessage = i18n.t('aux-image-pusher-image-not-mii-message');
      } else if (!this.project.image.useAuxImage.value) {
        abortErrorMessage = i18n.t('aux-image-pusher-image-not-use-message');
      } else if (!this.project.image.createAuxImage.value) {
        abortErrorMessage = i18n.t('aux-image-pusher-image-not-create-message');
      }
      if (abortErrorMessage) {
        await window.api.ipc.invoke('show-info-message', errTitle, abortErrorMessage);
        return Promise.resolve(false);
      }


      const validatableObject = this.getValidatableObject('flow-push-aux-image-name');
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
          if (! await this.validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('aux-image-pusher-image-exists-in-progress', {imageTag: imageTag});
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        if (!options.skipLocalImageExistsValidation) {
          if (! await this.validateImageExistsLocally(imageBuilderExe, imageTag, errTitle, errPrefix)) {
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
          requiresLogin: this.project.image.auxImageRegistryPushRequireAuthentication.value,
          host: this.project.image.internal.auxImageRegistryAddress.value,
          username: this.project.image.auxImageRegistryPushUser.value,
          password: this.project.image.auxImageRegistryPushPassword.value
        };
        const imagePushResult =
          await this.pushImage(imageBuilderExe, imageTag, pushOptions, errTitle, errPrefix, options.skipCompleteDialog);
        return Promise.resolve(imagePushResult);
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
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
    }
  }

  return new AuxImagePusher();
});
