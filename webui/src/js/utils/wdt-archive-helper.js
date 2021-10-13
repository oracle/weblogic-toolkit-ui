/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An helper for WDT archive operations.
 * Returns a singleton.
 */

define([],
  function () {
    function WdtArchiveHelper() {

      // select the entry of the specified type to be added.
      // update the archive tree, and add an archive update entry to the model.
      this.chooseArchiveEntry = async (fileType) => {
        return window.api.ipc.invoke('choose-archive-entry', fileType);
      };

      // return available archive entry types and names
      this.getEntryTypes = async () => {
        return window.api.ipc.invoke('get-archive-entry-types');
      };
    }

    return new WdtArchiveHelper();
  });
