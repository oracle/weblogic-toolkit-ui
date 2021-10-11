/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

// The UserAgent is used to detect IE11. Only IE11 requires ES5.
(function () {
  // The "oj_whenReady" global variable enables a strategy that the busy context whenReady,
  // will implicitly add a busy state, until the application calls applicationBootstrapComplete
  // on the busy state context.
  window['oj_whenReady'] = true;

  requirejs.config(
    {
      baseUrl: 'js',

      paths:
      /* DO NOT MODIFY
      ** All paths are dynamically generated from the path_mappings.json file.
      ** Add any new library dependencies in path_mappings json file
      */
      // injector:mainReleasePaths
      {
        'knockout': 'libs/knockout/knockout-3.5.1.debug',
        'jquery': 'libs/jquery/jquery-3.5.1',
        'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.12.1',
        'hammerjs': 'libs/hammer/hammer-2.0.8',
        'ojdnd': 'libs/dnd-polyfill/dnd-polyfill-1.0.2',
        'ojs': 'libs/oj/v11.0.1/debug',
        'ojL10n': 'libs/oj/v10.0.0/ojL10n',
        'ojtranslations': 'libs/oj/v10.0.0/resources',
        'text': 'libs/require/text',
        'signals': 'libs/js-signals/signals',
        'customElements': 'libs/webcomponents/custom-elements.min',
        'proj4': 'libs/proj4js/dist/proj4-src',
        'css': 'libs/require-css/css.min',
        'touchr': 'libs/touchr/touchr',
        'corejs' : 'libs/corejs/shim',
        'chai': 'libs/chai/chai-4.2.0',
        'regenerator-runtime' : 'libs/regenerator-runtime/runtime',
        'ace': 'libs/ace/ace'
      }
      // endinjector
    }
  );
}());

/**
 * A top-level require call executed by the Application.
 * Although 'ojcore' and 'knockout' would be loaded in any case (they are specified as dependencies
 * by the modules themselves), we are listing them explicitly to get the references to the 'oj' and 'ko'
 * objects in the callback
 */
require(['ojs/ojbootstrap', 'knockout', 'appController', 'windowStateUtils', 'ojs/ojbutton', 'ojs/ojknockout',
  'ojs/ojmodule', 'ojs/ojnavigationlist', 'ojs/ojrouter', 'ojs/ojtoolbar'],
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
