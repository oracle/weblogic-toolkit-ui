/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'utils/dialog-helper', 'utils/view-helper',
  'ojs/ojdialog', 'ojs/ojprogress-bar', 'ojs/ojprogress-circle'],
function(accUtils, ko, i18n, dialogHelper, ViewHelper) {
  function BusyDialogModel(args) {

    this.connected = () => {
      accUtils.announce('Busy dialog loaded.', 'assertive');

      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $('#busyDialog')[0].open();
      }, 1);
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.indicatorType = args.indicatorType ? args.indicatorType : 'circle';

    this.closeDialog = () => {
      $('#busyDialog')[0].close();
    };

    this.busyMessage = dialogHelper.busyMessage;
    this.busyPercent = dialogHelper.busyPercent;
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return BusyDialogModel;
});
