/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */

define(['viewModels/ingress-design-view-impl','utils/i18n', 'accUtils', 'knockout', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'models/wkt-project', 'utils/dialog-helper',  'utils/view-helper', 'utils/k8s-helper',
  'ojs/ojtreeview', 'ojs/ojformlayout', 'ojs/ojinputtext',
  'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojswitch', 'ojs/ojtable', 'ojs/ojcheckboxset'
],
function(IngressDesignViewModel, i18n, accUtils, ko, ArrayDataProvider, BufferingDataProvider, project, dialogHelper,
  viewHelper, k8sHelper) {

  return function() {
    return new IngressDesignViewModel(i18n, accUtils, ko,  ArrayDataProvider, BufferingDataProvider, project,
      dialogHelper, viewHelper, k8sHelper);
  };
});
