/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

(function () {
  // JET's postMessage scheduler rejects Electron's file:// message origins.
  // Install a timer fallback before JET loads so its BusyContext can settle.
  if (window.location.protocol === 'file:' && !window.setImmediate) {
    window.setImmediate = (callback, ...args) => {
      if (typeof callback !== 'function') {
        throw new TypeError('setImmediate requires a function');
      }
      return window.setTimeout(callback, 0, ...args);
    };
    window.clearImmediate = handle => window.clearTimeout(handle);
  }

  // The "oj_whenReady" global variable enables a strategy that the busy context whenReady,
  // will implicitly add a busy state, until the application calls applicationBootstrapComplete
  // on the busy state context.
  window['oj_whenReady'] = true;

  requirejs.config(
    {
      baseUrl: 'js',

      config: {
        // set the ojL10n language to match i18n for Jet internal translations
        ojL10n: {
          locale: window.api.i18n.language,
        },
      },

      paths:
      /* DO NOT MODIFY
      ** All paths are dynamically generated from the path_mappings.json file.
      ** Add any new library dependencies in path_mappings json file
      */
      // injector:mainReleasePaths
      {
        'ojs': 'libs/oj/21.0.0/debug',
        'ojL10n': 'libs/oj/21.0.0/ojL10n',
        'ojtranslations': 'libs/oj/21.0.0/resources',
        'knockout': 'libs/knockout/knockout-3.5.3.debug',
        'jquery': 'libs/jquery/jquery-4.0.0',
        'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.14.2',
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
        'touchr': 'libs/touchr/touchr',
        'ace': 'libs/ace/ace'
      }
      // endinjector
    }
  );
}());

/**
 * Load the application's entry point file
 */
require(['./root']);
