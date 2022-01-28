/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper'],
function(WktActionsBase, project, wktConsole, i18n, projectIo, dialogHelper) {
  class ImageRegistryActionsBase extends WktActionsBase {
    constructor() {
      super();
    }

    async validateImageExistsLocally(imageBuilderOptions, imageTag, errTitle, errPrefix) {
      try {
        const imageExistsResults =
          await window.api.ipc.invoke('validate-image-exists-locally', imageBuilderOptions, imageTag);
        let errMessage;
        if (imageExistsResults.isSuccess && !imageExistsResults.imageExists) {
          errMessage = i18n.t(`${errPrefix}-image-not-exists-error-message`, {imageTag: imageTag});
        } else if (!imageExistsResults.isSuccess) {
          errMessage = i18n.t(`${errPrefix}-image-exists-failed-error-message`,
            {imageTag: imageTag, error: imageExistsResults.reason});
        }
        if (errMessage) {
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async pushImage(imageBuilderOptions, imageTag, pushOptions, errTitle, errPrefix, skipCompleteDialog) {
      try {
        let pushResults = await window.api.ipc.invoke('do-push-image', imageBuilderOptions, imageTag, pushOptions);
        dialogHelper.closeBusyDialog();
        if (pushResults.isSuccess) {
          if (!skipCompleteDialog) {
            const title = i18n.t(`${errPrefix}-create-complete-title`);
            const message = i18n.t(`${errPrefix}-create-complete-message`, {imageTag: imageTag});
            await window.api.ipc.invoke('show-info-message', title, message);
          }
        } else {
          const failedTitle = i18n.t(`${errPrefix}-push-failed-title`);
          const failedMessage = i18n.t(`${errPrefix}-push-failed-error-message`, {error: pushResults.reason});
          await window.api.ipc.invoke('show-error-message', failedTitle, failedMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }
  }

  return ImageRegistryActionsBase;
});
