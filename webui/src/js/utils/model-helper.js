/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * Utilities to navigate and update the model object.
 */
define([],
  function () {
    function ModelHelper() {

      // navigate to the path specified by args.
      // if the path doesn't exist, return an empty map.
      this.navigate = (map, ...args) => {
        let thisMap = map;
        for(const index in args) {
          const arg = args[index];
          // console.log('arg: ' + arg + ' ' + JSON.stringify(thisMap));
          if (!thisMap) {
            break;
          }
          thisMap = thisMap[arg];
        }
        return thisMap ? thisMap : {};
      };
    }

    return new ModelHelper();
  });
