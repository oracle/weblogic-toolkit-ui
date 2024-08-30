/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout'],
  function (ko) {

    function NavigationHelper() {
      // maintain and update the navigation state

      this.navSelection = ko.observable();
      this.navExpanded = ko.observable();
      this.navSelectedItem = ko.observable();

      // **************************************
      // access the model edit navigation menu
      // **************************************

      this.navigateToElement = (modelPath, name) => {
        const navigationKey = modelPath.join('/') + '/' + name;
        this.navSelection(navigationKey);
      };

      this.openNavigation = (modelPath) => {
        const navigationKey = modelPath.join('/');
        const keySet = this.navExpanded();
        this.navExpanded(keySet.add([navigationKey]));
      };
    }

    return new NavigationHelper();
  }
);
