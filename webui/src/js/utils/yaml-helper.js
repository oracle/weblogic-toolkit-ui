/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['js-yaml'], function (jsYaml) {
  // An empty model is valid while editing. js-yaml 5 load() requires a document,
  // so use loadAll() while retaining the single-document restriction.
  function load(text, options) {
    const documents = jsYaml.loadAll(text, options);
    if (documents.length > 1) {
      throw new jsYaml.YAMLException('expected a single document in the stream, but found more');
    }
    return documents[0];
  }

  return { load, dump: jsYaml.dump };
});
