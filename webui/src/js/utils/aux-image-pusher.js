/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/image-registry-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/aux-image-helper', 'utils/wkt-logger'],
function(ImageRegistryActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper,
  auxImageHelper, wktLogger) {
  class AuxImagePusher extends ImageRegistryActionsBase {
    constructor() {
      super();
      this.usingPv = auxImageHelper.supportsDomainCreationImages();
    }

    async startPushAuxImage() {
      await this.executeAction(this.callPushAuxImage);
    }

    async callPushAuxImage(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t(this._getMiiPvMessageKey('aux-image-pusher-push-aborted-title'));
      const errPrefix = this._getMiiPvMessageKey('aux-image-pusher');
      const abortErrorMessage = this._getAbortErrorMessage();
      if (abortErrorMessage) {
        await window.api.ipc.invoke('show-info-message', errTitle, abortErrorMessage);
        return Promise.resolve(false);
      }

      const flowKey = this.usingPv ? 'flow-push-domain-creation-image-name' : 'flow-push-aux-image-name';
      const validatableObject = this.getValidatableObject(flowKey);
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

        busyDialogMessage =
          i18n.t(this._getMiiPvMessageKey('aux-image-pusher-image-exists-in-progress'), {imageTag: imageTag});
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

        busyDialogMessage =
          i18n.t(this._getMiiPvMessageKey('aux-image-pusher-push-in-progress'), {imageTag: imageTag});
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        wktLogger.info(`auxImageRegistryPushCredentialsReference = ${this.project.image.auxImageRegistryPushCredentialsReference.value}`);
        const credentials = this.getImageRegistryCredential(this.project.image.auxImageRegistryPushCredentialsReference.value);
        wktLogger.info(`credentials = ${JSON.stringify(credentials)}`);
        const host = (credentials) ? credentials.address : undefined;
        const username = (credentials) ? credentials.username : undefined;
        const password = (credentials) ? credentials.password : undefined;
        const pushOptions = {
          requiresLogin: this.project.image.auxImageRegistryPushRequireAuthentication.value,
          host: host,
          username: username,
          password: password
        };
        wktLogger.info(`pushOptions = ${JSON.stringify(pushOptions)}`);
        const imagePushResult = await this.pushImage(imageBuilderOptions, imageTag, pushOptions, errTitle,
          errPrefix, options.skipCompleteDialog);
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
      imageFormConfig.tabName =
        this.usingPv ? 'image-design-form-domain-creation-tab-name' : 'image-design-form-auxiliary-tab-name';

      validationObject.addField(this._getMiiPvImageFormKey('image-design-aux-image-tag-label'),
        this.project.image.auxImageTag.validate(true), imageFormConfig);

      const settingsFormConfig = validationObject.getDefaultConfigObject();
      settingsFormConfig.formName = 'project-settings-form-name';
      settingsFormConfig.fieldNamePayload = { toolName: this.project.settings.builderType.value };
      validationObject.addField('project-settings-build-tool-label',
        validationHelper.validateRequiredField(this.project.settings.builderExecutableFilePath.value),
        settingsFormConfig);

      if (this.project.image.auxImageRegistryPushRequireAuthentication.value) {
        validationObject.addField('image-design-aux-image-registry-push-credentials-label',
          validationHelper.validateRequiredField(this.project.image.auxImageRegistryPushCredentialsReference.value),
          imageFormConfig);

        const credentials =
          this.getImageRegistryCredential(this.project.image.auxImageRegistryPushCredentialsReference.value);
        if (credentials) {
          // skip validating the host portion of the image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-aux-image-registry-push-credentials-username-label',
            validationHelper.validateRequiredField(credentials.username), imageFormConfig);
          validationObject.addField('image-design-aux-image-registry-push-credentials-password-label',
            validationHelper.validateRequiredField(credentials.password), imageFormConfig);
        }
      }

      return validationObject;
    }

    _getMiiPvMessageKey(key) {
      if (this.usingPv) {
        return key.replace(/^aux-image-pusher-/, 'domain-creation-image-pusher-');
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
          abortErrorMessage =
            i18n.t(this._getMiiPvMessageKey('domain-creation-image-pusher-image-not-use-message'));
        } else if (!this.project.image.createAuxImage.value) {
          abortErrorMessage =
            i18n.t(this._getMiiPvMessageKey('domain-creation-image-pusher-image-not-create-message'));
        }
      } else if (this.project.settings.targetDomainLocation.value === 'pv') {
        if (this.project.wko.installedVersion.hasValue()) {
          abortErrorMessage = i18n.t('domain-creation-image-pusher-image-not-supported-message',
            { wkoInstalledVersion: this.project.wko.installedVersion.value });
        } else {
          abortErrorMessage = i18n.t('domain-creation-image-pusher-image-not-supported-no-version-message');
        }
      } else {
        abortErrorMessage = i18n.t('aux-image-pusher-image-not-mii-message');
      }
      return abortErrorMessage;
    }
  }

  return AuxImagePusher;
});
