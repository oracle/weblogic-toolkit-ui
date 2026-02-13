/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper',
  'ojs/ojformlayout', 'ojs/ojbutton', 'ojs/ojinputtext'],
function(accUtils, ko, i18n, ViewHelper) {
  function AppUpdateDialogModel(updateInfo) {
    const DIALOG_SELECTOR = '#wktAppUpdateDialog';

    this.connected = () => {
      accUtils.announce('Application update dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });

      this.dialogContainer.addEventListener('click', this.clickHandler);
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.labelMapper = (labelId, args) => {
      return i18n.t(`app-update-${labelId}`, args);
    };

    this.releaseText = this.labelMapper('new-release', {releaseName: updateInfo.releaseName});
    this.releaseNotes = updateInfo.releaseNotes;

    this.installNow = () => {
      updateInfo.setValue('now');
      this.dialogContainer.close();
    };

    this.installOnExit = () => {
      updateInfo.setValue('onExit');
      this.dialogContainer.close();
    };

    this.closeDialog = () => {
      updateInfo.setValue('ignore');
      this.dialogContainer.close();
    };

    this.clickHandler = (event) => {
      if (event.target.matches('.wkt-app-update-notes a')) {
        event.preventDefault();
        let link = event.target.href;
        if (link) {
          window.api.ipc.invoke('open-external-link', link).then();
        }
      }
    };
  }

  return AppUpdateDialogModel;
});
