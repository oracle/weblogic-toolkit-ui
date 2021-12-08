/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
/**
 * The modelView for the image design panel.
 *
 * Returns a constructor for the object.
 */
define(['viewModels/image-design-view-impl', 'accUtils', 'utils/i18n', 'models/wkt-project', 'knockout',
  'utils/dialog-helper', 'ojs/ojarraydataprovider', 'utils/wit-inspector', 'ojs/ojformlayout',
  'ojs/ojinputtext', 'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojswitch', 'ojs/ojradioset',
  'ojs/ojswitcher', 'ojs/ojknockout'
],
function (ImageDesignViewModel, accUtils, i18n, project, ko,
  dialogHelper, ArrayDataProvider, WktImageInspector) {
  return function() {
    return new ImageDesignViewModel(i18n, project, accUtils, ko, dialogHelper, ArrayDataProvider, WktImageInspector);
  };
});
