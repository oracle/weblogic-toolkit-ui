/**
 * @license
 * Copyright (c) 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/observable-properties', 'utils/validation-helper',
  'ojs/ojarraydataprovider', 'utils/wkt-logger', 'ojs/ojselectcombobox', 'ojs/ojinputtext', 'ojs/ojlabel',
  'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, props, validationHelper, ArrayDataProvider) {
  function ChooseKubectlContextDialogModel(args) {
    const DIALOG_SELECTOR = '#chooseKubectlContextDialog';

    this.i18n = i18n;
    this.availableKubectlContextNames = args.availableKubectlContextNames;
    this.selectedKubectlContextName = ko.observable(args.selectedKubectlContextName);
    this.availableKubectlContextNamesDP =
      new ArrayDataProvider(this.availableKubectlContextNames, { keyAttributes: 'name' });

    this.connected = () => {
      accUtils.announce('Choose Kubectl Context dialog loaded.', 'assertive');
      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $(DIALOG_SELECTOR)[0].open();
      }, 1);
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`kubectl-choose-context-${labelId}`);
    };

    this.okInput = () => {
      $(DIALOG_SELECTOR)[0].close();

      const result = {};
      result.kubectlContextName = this.selectedKubectlContextName();
      args.setValue(result);
    };

    this.cancelInput = () => {
      $(DIALOG_SELECTOR)[0].close();
      args.setValue();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ChooseKubectlContextDialogModel;
});
