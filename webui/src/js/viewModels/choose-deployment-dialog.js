/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/observable-properties', 'utils/validation-helper',
  'ojs/ojarraydataprovider', 'utils/wkt-logger', 'ojs/ojselectsingle', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton',
  'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, props, validationHelper, ArrayDataProvider) {
  function ChooseDeploymentDialogModel(args) {
    const DIALOG_SELECTOR = '#chooseDeploymentDialog';

    this.i18n = i18n;
    this.availableDeploymentNames = args.availableDeploymentNames;
    this.selectedDeploymentName = ko.observable(args.selectedDeploymentName);

    this.availableDeploymentNamesDP = new ArrayDataProvider(this.availableDeploymentNames, { keyAttributes: 'name' });

    this.connected = () => {
      accUtils.announce('Choose Deployment dialog loaded.', 'assertive');
      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $(DIALOG_SELECTOR)[0].open();
      }, 1);
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-application-design-choose-deployment-${labelId}`);
    };

    this.okInput = () => {
      $(DIALOG_SELECTOR)[0].close();

      const result = { deploymentName: this.selectedDeploymentName() };
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
  return ChooseDeploymentDialogModel;
});
