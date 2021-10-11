/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

function getErrorMessage(err) {
  let results = '';
  if (err) {
    if (err.message) {
      results = err.message;
    } else {
      results = err.toString().trim();
    }
  }
  return results;
}

module.exports = {
  getErrorMessage
};
