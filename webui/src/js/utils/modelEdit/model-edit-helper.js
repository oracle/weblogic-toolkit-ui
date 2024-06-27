/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'js-yaml', 'models/wkt-project'],
  function (ko, jsYaml, project) {
    function ModelEditHelper() {
      this.navSelection = ko.observable();

      this.createVariables = (fields, modelObject, subscriptions) => {
        const variables = {};
        fields.forEach((field) => {
          const modelValue = this.getValue(modelObject, field.path, field.attribute);
          variables[field.key] = ko.observable(modelValue);

          subscriptions.push(variables[field.key].subscribe((newValue) => {
            const folder = findOrCreatePath(modelObject, field.path);
            folder[field.attribute] = newValue;

            project.wdtModel.modelContent(jsYaml.dump(modelObject, {}));
          }));
        });
        return variables;
      };

      this.getCurrentModel = () => {
        const modelText = project.wdtModel.modelContent();
        let modelObject = jsYaml.load(modelText, {});
        modelObject = modelObject || {};
        return modelObject;
      };

      this.saveModel = (modelObject) => {
        project.wdtModel.modelContent(jsYaml.dump(modelObject, {}));
      };

      this.getFolderNames = (path, modelObject) => {
        const folder = this.getFolder(modelObject, path);
        return Object.keys(folder);
      };

      this.addElement = (path, modelObject) => {
        const folder = findOrCreatePath(modelObject, path);
        folder['NewName'] = {};
        project.wdtModel.modelContent(jsYaml.dump(modelObject, {}));
      };

      this.getFolder = (parent, path) => {
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

      this.getValue = (parent, path, attribute) => {
        const folder = this.getFolder(parent, path);
        return folder[attribute];
      };

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
