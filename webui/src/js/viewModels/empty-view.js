/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define([],
  function() {
    function EmptyModel() {

      // this serves as a placeholder for the main dialog module at startup.
      // it should not have an oj-dialog element.

      // it also serves as a router destination for folders on the navigation menu.
      // those can be inadvertently selected on page reload.
    }

    return EmptyModel;
  });
