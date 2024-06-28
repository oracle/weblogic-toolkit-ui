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

      this.modelObject = ko.observable();

      this.parseModel = () => {
        const modelText = project.wdtModel.modelContent();
        const modelObject = jsYaml.load(modelText, {});
        this.modelObject(modelObject || {});
      };

      this.parseModel();
      project.wdtModel.modelContentChanged.subscribe(() => {
        this.parseModel();
      });

      this.navSelection = ko.observable();
      this.navExpanded = ko.observable();

      this.createVariables = (fields, subscriptions) => {
        const variables = {};
        this.addVariables(fields, subscriptions, variables);
        return variables;
      };

      this.addVariables = (fields, subscriptions, variables) => {
        fields.forEach((field) => {
          const modelValue = this.getValue(field.path, field.attribute);
          variables[field.key] = ko.observable(modelValue);

          subscriptions.push(variables[field.key].subscribe((newValue) => {
            const folder = findOrCreatePath(this.getCurrentModel(), field.path);
            folder[field.attribute] = newValue;
            this.writeModel();
          }));
        });
      };

      this.getCurrentModel = () => {
        return this.modelObject();
      };

      this.writeModel = () => {
        project.wdtModel.modelContent(jsYaml.dump(this.getCurrentModel(), {}));
      };

      this.addElement = (path, key) => {
        const folder = findOrCreatePath(this.getCurrentModel(), path);
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
        return this.getChildFolder(this.getCurrentModel(), path);
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

      this.openNavigation = (key) => {
        const keySet = this.navExpanded();
        this.navExpanded(keySet.add([key]));
      };

      // internal functions

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
