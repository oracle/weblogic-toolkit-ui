/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which defines creation of Mii images to be used by the WebLogic Kubernetes Operator.
 *
 * Returns a constructor for the object.
 */
const ADMIN_SECRET_INTERNAL_NAME = '__weblogic-credentials__';
define(['knockout', 'utils/observable-properties', 'js-yaml', 'utils/validation-helper', 'utils/wkt-logger'],
  function (ko, props, jsYaml, validationHelper, wktLogger) {
    /**
     * The object constructor.
     */
    return function (name) {
      const ID = '[A-Za-z0-9_.-]*';
      const PROPERTY_PATTERN = new RegExp(`@@PROP:(@@ENV:(?<envvar>${ID})@@)?(?<name>${ID})@@`, 'g');
      const SECRET_PATTERN = new RegExp(`@@SECRET:(@@ENV:(?<envvar>${ID})@@)?(?<name>${ID}):(?<field>${ID})@@`, 'g');
      function WdtModel() {
        const defaultDomainName = 'base_domain';

        /** The locations of the model files. */
        this.modelFiles = props.createArrayProperty();

        /** The locations of the properties files. */
        this.propertiesFiles = props.createArrayProperty();

        /** The locations of the archive files. */
        this.archiveFiles = props.createArrayProperty();

        /** The contents of the first model file. */
        this.modelContent = ko.observable('');

        /** The contents of the first model file. */
        this.domainName = ko.observable(defaultDomainName);

        // internal values that are implemented as properties, but are excluded from default serialization

        this.internal = {
          wlRemoteConsolePort: ko.observable(),
          wlRemoteConsoleHome: props.createProperty(window.api.ipc.invoke('wrc-get-home-default-value')),
          propertiesContent: createPropertiesObject({})
        };

        this.archiveRoots = ko.observableArray();

        this.archiveUpdates = [];

        // true if the model text has changed since the last open or save
        this.modelTextChanged = false;

        // notify listeners when model content changes.
        // this will include changes to any file when there are multiple files.
        this.modelContentChanged = ko.observable();
        this.modelContentChanged.extend({ notify: 'always' });

        // Placeholder for model validation
        //
        this.validateModel = (isRequired = true) => {
          let errors = [];
          if (isRequired) {
            const emptyFieldError = validationHelper.validateRequiredField(this.modelContent());
            if (emptyFieldError) {
              errors.push(emptyFieldError);
            } else {
              try {
                jsYaml.load(this.modelContent());
              } catch (err) {
                errors.push(err.toString());
              }
            }
          }
          if (errors.length === 0) {
            errors = undefined;
          }
          return errors;
        };

        // Placeholder for when multiple property files are supported so that the domain page can get the merged table.
        //
        this.getMergedPropertiesContent = () => {
          return this.internal.propertiesContent;
        };

        // Placeholder for when multiple property files are supported so that the domain page can set the
        // override values in the properties data structure so that they will be available in the merged table.
        //
        this.setPropertyOverrideValue = (propertyName, overrideValue) => {
          let found;
          for (const entry of this.internal.propertiesContent.observable()) {
            if (entry.Name === propertyName) {
              entry.Override = overrideValue;
              found = true;
              break;
            }
          }
          if (!found) {
            wktLogger.warn('Failed to find model property %s to set its override value to %s', propertyName, overrideValue);
          }
        };

        this.getModelPropertiesReferenceCounts = () => {
          const propertiesMap = new Map();

          [...this.modelContent().matchAll(PROPERTY_PATTERN)].forEach(matches => {
            const propertyName = matches.groups.name;
            const propertyEnvVar = matches.groups.envvar;

            // While this key is never used outside this function, we need the key to
            // match the resolved property name.  For example, if the DOMAIN_UID is mydomain,
            // the following two fields should refer to the same property:
            //
            //   field1: '@@PROP:@@ENV:DOMAIN_UID@@-value@@'
            //   field2: '@@PROP:mydomain-value@@'
            //
            let propertyKey = propertyName;
            if (propertyEnvVar) {
              propertyKey = propertyName.startsWith('-') ? `${propertyEnvVar}${propertyName}` : `${propertyEnvVar}-${propertyName}`;
            }

            let propertyData;
            if (propertiesMap.has(propertyKey)) {
              propertyData = propertiesMap.get(propertyKey);
              propertyData.referenceCount++;
            } else {
              propertyData ={ name: propertyName, referenceCount: 1 };
              if (propertyEnvVar) {
                propertyData.envVar = propertyEnvVar;
              }
            }
            propertiesMap.set(propertyKey, propertyData);
          });
          return [...propertiesMap.values()];
        };

        // Placeholder for when multiple model files are supported so that the domain page can reliably get all
        // secrets in the models.
        //
        this.getModelSecretsData = (includeWebLogicCredentials) => {
          const secretsMap = new Map();

          [...this.modelContent().matchAll(SECRET_PATTERN)].forEach(matches => {
            if (matches.groups.name !== ADMIN_SECRET_INTERNAL_NAME || includeWebLogicCredentials) {
              const secretName = matches.groups.name;
              const secretEnvVar = matches.groups.envvar;
              const secretField = matches.groups.field;
              wktLogger.debug('found matching secret %s with envVar = %s and field = %s', secretName, secretEnvVar, secretField);

              // While this key is never used outside this function, we need the key to
              // match the resolved secret name.  For example, if the DOMAIN_UID is mydomain,
              // the following two secret fields should be part of the same secret:
              //
              //                 JDBCDriverParams:
              //                     URL: '@@PROP:JDBC.myds.URL@@'
              //                     PasswordEncrypted: '@@SECRET:@@ENV:DOMAIN_UID@@-jdbc-myds:password@@'
              //                     DriverName: com.mysql.cj.jdbc.Driver
              //                     Properties:
              //                         user:
              //                             Value: '@@SECRET:mydomain-jdbc-myds:username@@'
              //
              let secretKey = secretName;
              if (secretEnvVar) {
                secretKey = secretName.startsWith('-') ? `${secretEnvVar}${secretName}` : `${secretEnvVar}-${secretName}`;
              }

              let secretData;
              if (secretsMap.has(secretKey)) {
                secretData = secretsMap.get(secretKey);
              } else {
                secretData = { name: secretName };
                if (secretEnvVar) {
                  secretData.envVar = secretEnvVar;
                }
              }
              secretData[secretField] = '';
              secretsMap.set(secretKey, secretData);
            } else {
              wktLogger.debug('skipping matching secret %s', matches.groups.name);
            }
          });
          return [...secretsMap.values()];
        };

        /** Returns a property for editing the model properties */
        this.getModelPropertiesObject = function() {
          return this.internal.propertiesContent;
        };

        this.addPropertiesSubscriber = function(subscriber) {
          this.getModelPropertiesObject().observable.subscribe(subscriber);
        };

        this.getPropertyFileName = function() {
          return this.propertiesFiles.value.length > 0 ? this.propertiesFiles.value[0] : undefined;
        };

        /** Returns the model properties, ready to be persisted. */
        this.getPropertyFileContents = function() {
          const result = {};
          if (this.propertiesFiles.value.length > 0)
            result[this.getPropertyFileName()] = this.modelProperties();
          return result;
        };

        /** The name of the first archive file. */
        this.archiveFile = ko.observable();

        this.modelFileContents = {};
        this.propertyFileContents = {};

        this.projectFilePrefix = null;

        this.archiveFiles.observable.subscribe(() => {
          this.archiveFile(this.archiveFiles.value[0] || '');
        });

        this.modelContent.subscribe(newValue => {
          const fileName = this.modelFiles.value[0];
          if(fileName) {
            this.modelFileContents[fileName] = newValue;
          }

          this.updateFromModel(newValue);
          this.modelTextChanged = true;
        });

        // get the value at the path within the specified object
        function getElement(root, path) {
          let result = root;

          path.split('.').forEach(pathElement => {
            if (!result) return undefined;
            result = result[pathElement];
          });

          return result;
        }

        // parse the model and update any dependent fields
        this.updateFromModel = modelContent => {
          this.modelContentChanged(true);

          try {
            const yaml = jsYaml.load(modelContent);

            const modelName = getElement(yaml, 'topology.Name');
            const domainName = (modelName && (typeof modelName === 'string')) ? modelName : defaultDomainName;
            this.domainName(domainName);

          } catch (e) {
            // unable to parse model, don't update any fields
          }
        };

        this.recordModelFile = (modelFileName, yaml) => {
          this.modelFileContents[modelFileName] = yaml;
        };

        function createPropertiesObject(propertiesMap) {
          let uid = 0;
          const result = [];
          for (const [Name, Value] of Object.entries(propertiesMap)) {
            result.push({uid, Name, Value, undefined});
            uid++;
          }
          result.sort();

          // uid is unique ID for each list entry in the UI only, in case Name changes
          return props.createListProperty(['uid', 'Name', 'Value', 'Override']).withDefaultValue(result);
        }

        this.recordPropertyFile = (propertiesFileName, propertiesMap) => {
          this.propertyFileContents[propertiesFileName] = createPropertiesObject(propertiesMap);
        };

        // used to provide default names for model files
        this.setProjectFilePrefix = (prefix) => {
          this.projectFilePrefix = prefix;
        };

        // set the model file assignments and content based on the project's model content.
        // clear any existing file assignments that are not in the content.
        this.setModelFiles = (modelContent) => {
          let modelFiles = modelContent['models'];
          modelFiles = modelFiles ? modelFiles : {};
          this.modelFiles.value = Object.keys(modelFiles);
          this.setModelFileContents(modelContent);

          let propertiesFiles = modelContent['properties'];
          propertiesFiles = propertiesFiles ? propertiesFiles : {};
          this.propertiesFiles.value = Object.keys(propertiesFiles);
          this.setVariableContents(modelContent);

          let archiveFiles = modelContent['archives'];
          archiveFiles = archiveFiles ? archiveFiles : {};
          this.archiveFiles.value = Object.keys(archiveFiles);
          this.setArchiveContents(modelContent);
        };

        // set the model file assignments and content based on the project's model content.
        // leave unspecified file assignments unchanged.
        // examples: load only a new archive file, or prepare model without changing archive.
        this.setSpecifiedModelFiles = (modelContent) => {
          let modelFiles = modelContent['models'];
          if(modelFiles) {
            this.modelFiles.value = Object.keys(modelFiles);
            this.setModelFileContents(modelContent);
          }

          let propertiesFiles = modelContent['properties'];
          if(propertiesFiles) {
            this.propertiesFiles.value = Object.keys(propertiesFiles);
            this.setVariableContents(modelContent);
          }

          let archiveFiles = modelContent['archives'];
          if(archiveFiles) {
            this.archiveFiles.value = Object.keys(archiveFiles);
            this.setArchiveContents(modelContent);
          }
        };

        /**
         * Clear the model file names (model, properties, and archive) so they will revert to default names.
         * This is useful when saving a project and its files with a different name.
         */
        this.clearModelFileNames = () => {
          this.modelFileContents = {};
          this.modelFiles.value = [];
          this.propertiesFiles.value = [];
          this.archiveFiles.value = [];
        };

        /**
         * Update the model, variable, and archive contents from the project's model content.
         * Assume that the modelFile attributes were already set from createGroup() in project load.
         * This should happen when a new project is loaded.
         * @param modelContent the project's model content
         */
        this.setModelContents = modelContent => {
          this.setModelFileContents(modelContent);
          this.setVariableContents(modelContent);
          this.setArchiveContents(modelContent);
        };

        /**
         * Update the model file assignment and content from the project's model content.
         * @param modelContent the project's model content
         */
        this.setModelFileContents = modelContent => {
          this.modelFileContents = {};

          const models = modelContent['models'];
          if (models) {
            for (const [file, contents] of Object.entries(models)) {
              this.recordModelFile(file, contents);
            }
            this.modelContent(this.getCurrentModelFileContents() || '');
          } else {
            // Only empty the model content where explicitly told to do so
            // since setting this field generates an event that triggers
            // other code to run (e.g., k8s-domain-definition.updateSecrets()).
            //
            this.modelContent('');
          }
        };

        /**
         * Update the variable file assignment and content from the project's model content.
         * @param modelContent the project's model content
         */
        this.setVariableContents = modelContent => {
          this.propertyFileContents = {};
          this.internal.propertiesContent.value = [];

          const properties = modelContent['properties'];
          if(properties) {
            for (const [file, contents] of Object.entries(properties)) {
              this.recordPropertyFile(file, contents);
            }
            this.internal.propertiesContent.value = this.getCurrentPropertiesFileContents().value;

            // this shouldn't be necessary, but duplicate entries will show in the properties table
            // if a project with properties is opened while the model page is displayed.
            this.internal.propertiesContent.observable.sort();
          }
        };

        /**
         * Update the archive file assignment and content from the project's model content.
         * @param modelContent the project's model content
         */
        this.setArchiveContents = modelContent => {
          this.archiveRoots.removeAll();
          this.archiveUpdates = [];

          let archiveFiles = modelContent['archives'];
          if(archiveFiles) {
            let archiveFile = this.archiveFiles.value[0];
            if (archiveFile in archiveFiles) {
              let sourceNode = archiveFiles[archiveFile];
              _addArchiveNodes(sourceNode, this.archiveRoots, '');
            }
          }
        };

        // recursively add child nodes from sourceNode (JSON) to parentNode (tree data provider).
        // the title is the child node's key, and the ID is that key appended to the parent path.
        function _addArchiveNodes(sourceNode, parentNode, path) {
          for (let sourceKey in sourceNode) {
            if (sourceNode.hasOwnProperty(sourceKey)) {
              const sourceValue = sourceNode[sourceKey];
              const isFolder = typeof sourceValue === 'object';
              let newPath = path + sourceKey;
              if(isFolder) {
                // this is the key passed for archive update, directories must end in slash
                newPath += '/';
              }

              let targetValues = {'title': sourceKey, 'id': newPath};
              if(isFolder) {
                targetValues['children'] = ko.observableArray();
                _addArchiveNodes(sourceValue, targetValues['children'], newPath);
              }

              parentNode.push(targetValues);
            }
          }
        }

        /**
         * Build the model contents structure for a save operation.
         * Archive operations are added, but not archive content.
         */
        this.getModelContents = () => {
          const modelContents = {};
          modelContents['models'] = this.modelFileContents;
          modelContents['properties'] = this.getPropertyFileContents();

          if(this.archiveFiles.value.length && this.archiveUpdates.length) {
            const archiveFile = this.archiveFiles.value[0];
            modelContents['archiveUpdates'] = {[archiveFile]: this.archiveUpdates };
          }

          return modelContents;
        };

        this.getCurrentModelFileContents = () => {
          return this.modelFileContents[this.modelFiles.value[0]];
        };

        this.getCurrentPropertiesFileContents = () => {
          return this.propertyFileContents[this.propertiesFiles.value[0]];
        };

        /** The contents of the first properties file. Returns a map of names to values. */
        this.modelProperties = function() {
          const result = {};
          const propertiesList = this.getModelPropertiesObject();
          if (propertiesList) propertiesList.value.forEach(p => {result[p.Name] = p.Value;});
          return result;
        };

        this.readFrom = (projectContent) => {
          props.createGroup(name, this).readFrom(projectContent);
        };

        // write the model file names to the project structure for save.
        // establish model, properties, archive file names before createGroup if needed.
        this.writeTo = (projectContent) => {

          // if there is content in the model editor, but no model file name,
          // use the file prefix to create a default file location.
          const modelText = this.modelContent();
          if(modelText && modelText.length && (this.modelFiles.value.length < 1)) {
            let defaultPath = this.getDefaultModelFile();

            // for the project content
            this.modelFiles.value = [defaultPath];

            // for the model content
            this.recordModelFile(defaultPath, modelText);
          }

          // if there are properties present, but no properties file name,
          // use the file prefix to create a default file location.
          const properties = this.getModelPropertiesObject().value;
          const files = this.propertiesFiles.value;
          if(properties.length && (files.length < 1)) {
            let defaultPath = this.getDefaultPropertiesFile();
            this.propertiesFiles.value = [defaultPath];
          }

          // if there are archive roots present, but no archive file name,
          // use the file prefix to create a default file location.
          if(this.archiveRoots().length && (this.archiveFiles.value.length < 1)) {
            let defaultPath = this.getDefaultArchiveFile();
            this.archiveFiles.value = [defaultPath];
          }

          props.createGroup(name, this).writeTo(projectContent);
        };

        this.isChanged = () => {
          // check object-level observable properties
          let isChanged = props.createGroup(name, this).isChanged();

          // properties content is managed internally
          if (this.internal.propertiesContent.isChanged()) {
            wktLogger.debug('model properties content has changed');
            isChanged = true;
          }

          // check flag indicating model text changes
          if (this.modelTextChanged) {
            wktLogger.debug('model content has changed');
            isChanged = true;
          }

          // any outstanding archive updates indicate a change
          if (this.archiveUpdates.length > 0) {
            wktLogger.debug('model archive content has changed');
            isChanged = true;
          }

          return isChanged;
        };

        this.setNotChanged = () => {
          props.createGroup(name, this).setNotChanged();

          // properties content is managed internally
          this.internal.propertiesContent.setNotChanged();

          // clear model text changed flag
          this.modelTextChanged = false;
        };

        this.getModelTextFor = modelFile => {
          return this.modelFileContents[modelFile];
        };

        this.getModelText = () => {
          return this.getModelTextFor(this.modelFiles.value[0]);
        };

        this.addArchiveUpdate = function (operation, path, filePath) {
          this.archiveUpdates.push({op: operation, path: path, filePath: filePath});
        };

        this.getDefaultModelDirectory = () => {
          let directory = 'models';
          if(this.projectFilePrefix) {
            directory = this.projectFilePrefix + '-' + directory;
          }
          return directory;
        };

        // default locations for model files, if they are in the project directory

        this.getDefaultModelFile = () => {
          return this.getDefaultModelDirectory() + '/model.yaml';
        };

        this.getDefaultPropertiesFile = () => {
          return this.getDefaultModelDirectory() + '/variables.properties';
        };

        this.getDefaultArchiveFile = () => {
          return this.getDefaultModelDirectory() + '/archive.zip';
        };
      }

      return new WdtModel();
    };
  });
