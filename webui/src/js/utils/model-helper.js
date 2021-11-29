/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * Utilities to navigate and update the model object.
 */
define(['js-yaml', 'models/wkt-project'],
  function (jsYaml, project) {
    function ModelHelper() {

      // navigate to the path specified by args.
      // if the path doesn't exist, return an empty map.
      this.getFolder = (map, ...args) => {
        let thisMap = map;
        for(const index in args) {
          const arg = args[index];
          if (!thisMap) {
            break;
          }
          thisMap = thisMap[arg];
        }
        return thisMap ? thisMap : {};
      };

      // add the folder at the path specified by args.
      // create any elements of the path that don't exist.
      // if the model is changed, update the text version of the model.
      // return the object value of the last folder.
      this.addFolder = (map, ...args) => {
        let changed = false;
        let thisMap = map;
        args.forEach(arg => {
          if(!thisMap[arg]) {
            // if creating the last path folder, set the value to null
            thisMap[arg] = {};
            changed = true;
          }
          thisMap = thisMap[arg];
        });

        if(changed) {
          this.updateTextModel(map);
        }

        return thisMap;
      };

      // remove the last element of the path specified by args.
      this.removeFolder = (map, ...args) => {
        let changed = false;
        let thisMap = map;
        args.forEach((arg, index) => {
          if(!thisMap) {
            // if the full path didn't exist, nothing to do
            return;
          }

          if(index === (args.length - 1)) {
            delete thisMap[arg];
            changed = true;
          }

          thisMap = thisMap[arg];
        });

        if(changed) {
          this.updateTextModel(map);
        }
      };

      // convert the model object to text, and replace the model editor content.
      this.updateTextModel = model => {
        this.cleanFolder(model);
        const textModel = jsYaml.dump(model, {
          'styles': {
            '!!null': 'empty' // dump null as nothing
          },
          'sortKeys': true
        });

        project.wdtModel.modelContent(textModel);
      };

      // recursively set any empty-map values to null to avoid PATH: {}
      this.cleanFolder = map => {
        for(let key in map) {
          const value = map[key];
          if(typeof value === 'object' && !Array.isArray(value) && value !== null) {
            if(!Object.keys(value).length) {
              map[key] = null;
            } else {
              this.cleanFolder(map[key]);
            }
          }
        }
      };
    }

    return new ModelHelper();
  });
