/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'ojs/ojinputtext', 'ojs/ojlabel',
  'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n) {
  function TextInputDialogModel(args) {

    this.connected = () => {
      accUtils.announce('Text input dialog loaded.', 'assertive');

      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $('#textInputDialog')[0].open();
      }, 1);
    };

    this.anyLabelMapper = (labelId, arg) => {
      return i18n.t(labelId, arg);
    };

    this.title = args.title;
    this.label = args.label;
    this.help = args.help;

    this.textValue = ko.observable();

    this.okInput = () => {
      $('#textInputDialog')[0].close();
      args.setValue(this.textValue());
    };

    this.cancelInput = () => {
      $('#textInputDialog')[0].close();
      args.setValue();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return TextInputDialogModel;
});
