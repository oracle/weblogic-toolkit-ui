/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which controls display of the main dialog.
 * Returns a singleton.
 */
define(['knockout', 'utils/i18n', 'utils/wkt-logger'],
  function (ko, i18n, wktLogger) {
    function DialogHelper() {

      // put empty-view in the slot for startup, but keep it hidden.
      this.showDialog = ko.observable({
        viewName: 'empty-view',
        viewOptions: { hide: true }
      });
      this.showDialog.extend({ notify: 'always' });

      this.openDialog = (viewName, viewOptions) => {
        let options = {
          'viewName': viewName,
          'viewOptions': viewOptions
        };

        this.showDialog(options);
      };

      this.busyMessage = ko.observable('');
      this.busyPercent = ko.observable(-1);

      // show the busy dialog with the specified title.
      // the title should have been translated.
      this.openBusyDialog = (title, indicatorType, percent) => {
        const args = {
          indicatorType: indicatorType,
        };
        this.openDialog('busy-dialog', args);
        this.updateBusyDialog(title, percent);
      };

      this.updateBusyDialog = (message, percent) => {
        percent = (percent === undefined) ? -1 : percent;
        percent = (percent === -1) ? percent : Math.round(percent * 100);

        this.busyMessage(message);
        this.busyPercent(percent);
      };

      this.closeBusyDialog = () => {
        const dialog = $('#busyDialog')[0];
        if (dialog)
          dialog.close();
      };

      // show a dialog, and wait for the viewOptions.setValue method to be called.
      this.promptDialog = async (viewName, viewOptions) => {
        return new Promise(resolve => {
          viewOptions.setValue = (value) => {
            resolve(value);
          };

          let options = {
            'viewName': viewName,
            'viewOptions': viewOptions
          };

          this.showDialog(options);
        });
      };

      this.displayCatchAllError = async(i18nPrefix, err) => {
        return new Promise(resolve => {
          const errTitle = i18n.t(`${i18nPrefix}-failed-title`);
          const errMessage = i18n.t(`${i18nPrefix}-catch-all-error-message`,
            { error: err.message ? err.message : err});
          wktLogger.error(err);
          window.api.ipc.invoke('show-error-message', errTitle, errMessage).then(() => {
            resolve();
          }).catch(displayErr => {
            // best effort to display the error
            wktLogger.warn(displayErr);
            resolve();
          });
        });
      };
    }

    return new DialogHelper();
  });
