/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout'],
  function (ko) {

    function NavigationHelper() {
      // maintain and update the navigation state

      this.menuKey = ko.observable();  // a string with navigation menu key (model path)
      this.menuExpanded = ko.observable();   // a keySet with all the expanded menu nodes

      this.selectedPath = ko.observable();  // the model path of the selected item (maybe deeper than nav)

      // **************************************
      // access the model edit navigation menu
      // **************************************

      this.navigateToElement = (modelPath, name) => {
        const fullPath = [...modelPath];
        if(name) {
          fullPath.push(name);
        }

        // TODO: find the deepest node in modelPath that is in the navigation
        const navigationPath = fullPath.slice(0, 3);

        const parentPath = navigationPath.slice(0, -1);
        if(parentPath.length) {
          this.openNavigation(parentPath);
        }

        const navigationKey = navigationPath.join('/');
        this.menuKey(navigationKey);

        this.selectedPath(fullPath);
      };

      this.openNavigation = modelPath => {
        const navigationKey = modelPath.join('/');

        // TODO: open every parent folder

        const keySet = this.menuExpanded();
        this.menuExpanded(keySet.add([navigationKey]));
      };
    }

    return new NavigationHelper();
  }
);
