/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'js-yaml', 'models/wkt-project'],
  function (ko, jsYaml, project) {
    function ModelEditHelper() {
      // parse, write, and maintain the model object structure.
      // maintain and update the navigation state.
      // provide convenience methods.

      let modelObject = {};

      parseModel();
      project.wdtModel.modelContentChanged.subscribe(() => {
        parseModel();
      });

      this.navSelection = ko.observable();
      this.navExpanded = ko.observable();

      this.createVariables = (fields, subscriptions) => {
        const variables = {};
        fields.forEach((field) => {
          const modelValue = this.getValue(field.path, field.attribute);
          variables[field.key] = ko.observable(modelValue);

          subscriptions.push(variables[field.key].subscribe((newValue) => {
            const folder = findOrCreatePath(modelObject, field.path);
            folder[field.attribute] = newValue;
            this.writeModel();
          }));
        });
        return variables;
      };

      this.getCurrentModel = () => {
        return modelObject;
      };

      this.writeModel = () => {
        project.wdtModel.modelContent(jsYaml.dump(modelObject, {}));
      };

      this.addElement = (path, key) => {
        const folder = findOrCreatePath(modelObject, path);
        const newElement = {};
        folder[key] = newElement;
        this.writeModel();
        return newElement;
      };

      this.deleteElement = (elementsPath, key) => {
        const elementsFolder = this.getFolder(elementsPath);
        delete elementsFolder[key];
        this.writeModel();
      };

      this.getFolder = (path) => {
        return this.getChildFolder(modelObject, path);
      };

      this.getChildFolder = (parent, path) => {
        const names = path.split('/');
        let folder = parent;
        names.forEach(name => {
          if(folder.hasOwnProperty(name) && folder[name]) {
            folder = folder[name];
          } else {
            folder = {};
          }
        });
        return folder;
      };

      this.getValue = (path, attribute) => {
        const folder = this.getFolder(path);
        return folder[attribute];
      };

      this.navigateToElement = (elementKey, name) => {
        const navigationKey = elementKey + '-' + name;
        this.navSelection(navigationKey);
      };

      // internal functions

      function parseModel() {
        const modelText = project.wdtModel.modelContent();
        modelObject = jsYaml.load(modelText, {});
        modelObject = modelObject || {};
      }

      function findOrCreatePath(parent, path) {
        const names = path.split('/');
        let folder = parent;
        names.forEach(name => {
          folder = findOrCreateFolder(folder, name);
        });
        return folder;
      }

      function findOrCreateFolder(folder, name) {
        if(!folder.hasOwnProperty(name) || !folder[name]) {
          folder[name] = {};
        }
        return folder[name];
      }
    }

    return new ModelEditHelper();
  }
);
