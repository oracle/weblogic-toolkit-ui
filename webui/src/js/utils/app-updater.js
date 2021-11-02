/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/i18n', 'utils/dialog-helper'],
  function(i18n, dialogHelper) {
    function AppUpdater() {
      const busyMessage = i18n.t('app-update-downloading');

      // Promise resolves to true if the app will quit and install now
      this.updateApplication = async (updateInfo) => {
        const result = await dialogHelper.promptDialog('app-update-dialog', updateInfo);

        if (['now', 'onExit'].includes(result)) {
          dialogHelper.openBusyDialog(busyMessage, 'bar', 0);
          // any errors will be logged in electron call
          await window.api.ipc.invoke('install-app-update', result);
          dialogHelper.closeBusyDialog();
        }

        return result === 'now';
      };

      this.updateProgress = percent => {
        dialogHelper.updateBusyDialog(busyMessage, percent / 100.0);
      };

      // show the update application dialog and/or the quickstart dialog,
      // based on contents of startupInformation.
      this.showStartupDialogs = async(startupInformation) => {
        console.debug('showStartupDialogs: ' + JSON.stringify(startupInformation));

        let quitAndInstall = false;
        if(startupInformation.update) {
          quitAndInstall = await this.updateApplication(startupInformation.update);
        }

        if(!quitAndInstall && !startupInformation.skipQuickstart) {
          dialogHelper.openDialog('quickstart-dialog');
        }
      };
    }

    return new AppUpdater();
  });
