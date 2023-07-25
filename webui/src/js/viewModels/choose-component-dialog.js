/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/observable-properties', 'utils/validation-helper',
  'ojs/ojarraydataprovider', 'utils/wkt-logger', 'ojs/ojselectsingle', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton',
  'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, props, validationHelper, ArrayDataProvider) {
  function ChooseComponentDialogModel(args) {
    const DIALOG_SELECTOR = '#chooseComponentDialog';

    this.i18n = i18n;
    this.availableComponentNames = args.availableComponentNames;
    this.selectedComponentNames = ko.observableArray();

    this.availableComponentNamesDP = new ArrayDataProvider(this.availableComponentNames, { keyAttributes: 'value' });

    this.connected = () => {
      accUtils.announce('Choose Component dialog loaded.', 'assertive');
      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $(DIALOG_SELECTOR)[0].open();
      }, 1);
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-application-design-choose-component-${labelId}`);
    };

    this.okInput = () => {
      let tracker = document.getElementById('chooseComponentTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      $(DIALOG_SELECTOR)[0].close();

      const result = {componentNames: this.selectedComponentNames()};
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
  return ChooseComponentDialogModel;
});
