/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * Utilities to navigate and update the model object.
 */
define(['js-yaml', 'utils/observable-properties', 'models/wkt-project'],
  function (jsYaml, props, project) {
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
        // probably a more efficient way to clone this
        const writeModel = JSON.parse(JSON.stringify(model));
        this.cleanFolder(writeModel);

        const textModel = jsYaml.dump(writeModel, {
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

      // create properties on the viewModel for each field in the fields object.
      // set the initial values for the properties from the model object.
      this.createUpdateProperties = (viewModel, modelObject, fields) => {
        for (let field in fields) {
          let values = fields[field];
          viewModel[field] = this.createUpdateProperty(values.attribute, values.defaultValue, modelObject,
            ...values.folderPath);

          const folder = this.getFolder(modelObject, ...values.folderPath);
          if (folder[values.attribute]) {
            viewModel[field].value = folder[values.attribute];
          }
        }
      };

      // create a property based on a field object entry.
      // this property will update the text model when its value changes.
      this.createUpdateProperty = (attribute, defaultValue, modelObject, ...folderPath) => {
        const updateProperty = props.createProperty(defaultValue);
        updateProperty.observable.subscribe(value => {
          const domainFolder = this.addFolder(modelObject, ...folderPath);
          if(value === defaultValue) {
            delete domainFolder[attribute];
          } else {
            domainFolder[attribute] = value;
          }
          this.updateTextModel(modelObject);
        });
        return updateProperty;
      };
    }

    return new ModelHelper();
  });
