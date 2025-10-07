/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/**
 * A top-level require call executed by the Application.
 * Although 'ojcore' and 'knockout' would be loaded in any case (they are specified as dependencies
 * by the modules themselves), we are listing them explicitly to get the references to the 'oj' and 'ko'
 * objects in the callback
 */
require(['ojs/ojbootstrap', 'knockout', './appController', 'windowStateUtils', 'ojs/ojlogger', 'ojs/ojknockout',
  'ojs/ojmodule', 'ojs/ojrouter', 'ojs/ojnavigationlist', 'ojs/ojbutton', 'ojs/ojtoolbar'],
function (Bootstrap, ko, app) { // this callback gets executed when all required modules are loaded

  // windowStateUtils was initialized by this function's require, but is not used directly

  Bootstrap.whenDocumentReady().then(
    function() {
      function init() {
        // Bind your ViewModel for the content of the whole page body.
        ko.applyBindings(app, document.getElementById('globalBody'));
      }
      // If running in a hybrid (e.g. Cordova) environment, we need to wait for the deviceready
      // event before executing any code that might interact with Cordova APIs or plugins.
      if (document.body.classList.contains('oj-hybrid')) {
        document.addEventListener('deviceready', init);
      } else {
        init();
      }
    });
});
