/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
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
          'ojL10n': 'libs/oj/19.0.0/ojL10n',
          'ojtranslations': 'libs/oj/19.0.0/resources',
          'knockout': 'libs/knockout/knockout-3.5.1.debug',
          'jquery': 'libs/jquery/jquery-3.7.1',
          'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.14.1',
          'text': 'libs/require/text',
          'hammerjs': 'libs/hammer/hammer-2.0.8',
          'signals': 'libs/js-signals/signals',
          'ojdnd': 'libs/dnd-polyfill/dnd-polyfill-1.0.2',
          'css': 'libs/require-css/css.min',
          'css-builder': 'libs/require-css/css-builder',
          'normalize': 'libs/require-css/normalize',
          '@oracle/oraclejet-preact': 'libs/oraclejet-preact/amd',
          'preact': 'libs/preact/dist/preact.umd',
          'preact/hooks': 'libs/preact/hooks/dist/hooks.umd',
          'preact/compat': 'libs/preact/compat/dist/compat.umd',
          'preact/jsx-runtime': 'libs/preact/jsx-runtime/dist/jsxRuntime.umd',
          'proj4': 'libs/proj4js/dist/proj4-src',
          'touchr': 'libs/touchr/touchr',
          'chai': 'libs/chai/chai-4.5.0',
          'ace': 'libs/ace/ace',
          'wrc-translations': 'resources',
          'wrc-frontend': 'jet-composites/wrc-frontend/1.0.0',
          'wdt-model-designer': 'jet-composites/wdt-model-designer/1.0.0',
          'cfe-navtree': 'jet-composites/cfe-navtree/1.0.0',
          'cfe-multi-select': 'jet-composites/cfe-multi-select/1.0.0',
          'cfe-property-list-editor': 'jet-composites/cfe-property-list-editor/1.0.0',
          'cfe-policy-editor': 'jet-composites/cfe-policy-editor/1.0.0'
      }
      // endinjector

      // This is required for the wrc-jet-pack to resolve its i18n labels...
      , config: {
          ojL10n: {
              merge: {
                  'ojtranslations/nls/ojtranslations': 'resources/nls/frontend'
              }
          }
      }
    }
  );
}());

/**
 * Load the application's entry point file
 */
require(['./root']);
