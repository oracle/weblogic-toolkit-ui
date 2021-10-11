/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define([],
  function() {
    class WktLogger {
      constructor() { /* nothing to do */ }

      error(message, ...args) {
        console.error(message, ...args);
        this._log('error', message, ...args);
      }

      warn(message, ...args) {
        console.warn(message, ...args);
        this._log('warn', message, ...args);
      }

      info(message, ...args) {
        console.info(message, ...args);
        this._log('info', message, ...args);
      }

      debug(message, ...args) {
        console.debug(message, ...args);
        this._log('debug', message, ...args);
      }

      log(message, ...args) {
        console.log(message, ...args);
        this._log('info', message, ...args);
      }

      _log(level, message, ...args) {
        window.api.ipc.send('log-remote-message', level, message, ...args);
      }
    }

    return new WktLogger();
  }
);
