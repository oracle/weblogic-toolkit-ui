/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'utils/i18n', 'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/wkt-logger'],
  function (project, i18n, projectIo, dialogHelper, validationHelper, wktLogger) {
    function WktImageInspector() {
      this.project = project;

      this.startInspectImage = async () => {
        return this.callInspectImage();
      };

      this.callInspectImage = async (options) => {
        if (!options) {
          options = {};
        }

        let errTitle = i18n.t('wit-inspector-aborted-error-title');
        const validatableObject = this.getValidatableObject('flow-inspect-base-image-name');
        if (validatableObject.hasValidationErrors()) {
          const validationErrorDialogConfig = validationObject.getValidationErrorDialogConfig(errTitle);
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
            let errContext = i18n.t('wit-inspector-invalid-java-home-error-prefix');
            const javaHomeValidationResult =
              await window.api.ipc.invoke('validate-java-home', javaHome, errContext);
            if (!javaHomeValidationResult.isValid) {
              const errMessage = javaHomeValidationResult.reason;
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          const imageBuilderType = this.project.settings.builderType.value;
          busyDialogMessage = i18n.t('flow-validate-image-builder-exe-in-progress',
            {builderName: imageBuilderType});
          dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);
          // Validate the image builder executable
          const imageBuilderExe = this.project.settings.builderExecutableFilePath.value;
          const imageBuilderExeResults =
            await window.api.ipc.invoke('validate-image-builder-exe', imageBuilderExe);
          if (!imageBuilderExeResults.isValid) {
            const errMessage = i18n.t('wit-inspector-image-builder-invalid-error-message',
              {fileName: imageBuilderExe, error: imageBuilderExeResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }

          busyDialogMessage = i18n.t('flow-save-project-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
          if (!options.skipProjectSave) {
            const saveResult = await projectIo.saveProject();
            if (!saveResult.saved) {
              const errMessage =
                i18n.t('wit-inspector-project-not-saved-error-message', {error: saveResult.reason});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

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
            const loginResults = await window.api.ipc.invoke('do-image-registry-login', imageBuilderExe, loginConfig);
            if (!loginResults.isSuccess) {
              const imageRegistry = loginConfig.host || i18n.t('docker-hub');
              const errMessage = i18n.t('flow-registry-login-failed-error-message', {
                host: imageRegistry,
                error: loginResults.reason
              });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }

          const baseImageTag = this.project.image.baseImage.value;
          wktLogger.debug('baseImageTag = %s', baseImageTag);
          busyDialogMessage = i18n.t('wit-inspector-inspect-in-process', {imageTag: baseImageTag});
          dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
          const inspectResults = await window.api.ipc.invoke('get-image-contents', javaHome, baseImageTag,
            { imageBuilder: imageBuilderExe });
          dialogHelper.closeBusyDialog();
          if (inspectResults.isSuccess) {
            this.project.image.setBaseImageContents(inspectResults.contents);
            const title = i18n.t('wit-inspector-inspect-complete-title');
            const message = getInspectSuccessMessage(baseImageTag, inspectResults.contents);
            await window.api.ipc.invoke('show-info-message', title, message);
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
      };

      this.getValidatableObject = (flowNameKey) => {
        const validationObject = validationHelper.createValidatableObject(flowNameKey);
        const settingsFormConfig = validationObject.getDefaultConfigObject();
        settingsFormConfig.formName = 'project-settings-title';

        validationObject.addField('project-settings-java-home-label',
          validationHelper.validateRequiredField(this.project.settings.javaHome.value), settingsFormConfig);

        const settingsFormBuilderConfig = validationObject.getDefaultConfigObject();
        settingsFormBuilderConfig.formName = 'project-settings-title';
        settingsFormBuilderConfig.fieldNamePayload = { toolName: this.project.settings.builderType.value };
        validationObject.addField('project-settings-build-tool-label',
          validationHelper.validateRequiredField(this.project.settings.builderExecutableFilePath.value),
          settingsFormBuilderConfig);

        validationObject.addField('image-design-custom-base-image-label',
          this.project.image.baseImage.validate(true));

        if (this.project.image.baseImagePullRequiresAuthentication.value) {
          // skip validating the host portion of the base image tag since it may be empty for Docker Hub...
          validationObject.addField('image-design-base-image-pull-username-label',
            validationHelper.validateRequiredField(this.project.image.baseImagePullUsername.value));
          validationObject.addField('image-design-base-image-pull-password-label',
            validationHelper.validateRequiredField(this.project.image.baseImagePullPassword.value));
        }

        return validationObject;
      };

      function getInspectSuccessMessage(imageTag, imageContents) {
        const hasJdk = 'javaHome' in imageContents;
        const jdkPath = imageContents.javaHome;
        const jdkVersion = imageContents.javaVersion;
        const hasFmw = 'oracleHome' in imageContents;
        const fmwPath = imageContents.oracleHome;
        const fmwVersion = imageContents.wlsVersion;

        const fmwMessage = getMessage('wit-inspector-fmw', hasFmw, fmwPath, fmwVersion);
        const javaMessage = getMessage('wit-inspector-java', hasJdk, jdkPath, jdkVersion);

        let message;
        if (fmwMessage) {
          message = i18n.t('wit-inspect-results-fmw-message',
            { imageTag: imageTag, javaMessage: javaMessage, fmwMessage: fmwMessage });
        } else if (javaMessage) {
          message = i18n.t('wit-inspect-results-java-message',
            { imageTag: imageTag, javaMessage: javaMessage });
        } else {
          message = i18n.t('wit-inspector-empty-contents-message', { imageTag: imageTag });
        }
        return message;
      }

      function getMessage(i18nPrefix, isInstalled, path, version) {
        let message;
        if (isInstalled) {
          if (version) {
            message = i18n.t(`${i18nPrefix}-version-message`, { path: path, version: version });
          } else {
            message = i18n.t(`${i18nPrefix}-message`, { path: path });
          }
        }
        return message;
      }
    }
    return new WktImageInspector();
  }
);
