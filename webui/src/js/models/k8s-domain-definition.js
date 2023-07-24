/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which defines creation of a domain to be used by the WebLogic Kubernetes Operator.
 *
 * Returns a constructor for the object.
 */
define(['knockout', 'utils/observable-properties', 'utils/common-utilities', 'utils/validation-helper', 'utils/wkt-logger'],
  function (ko, props, utils, validationHelper, wktLogger) {

    return function(name, wdtModel, imageDefinition) {
      function asLegalK8sName(observable) {
        return utils.toLegalK8sName(observable());
      }

      function K8sDomainModel() {
        const DEFAULT_AUX_IMAGE_WDT_INSTALL_HOME = `${imageDefinition.wdtHomePath.value}/weblogic-deploy`;
        const DEFAULT_AUX_IMAGE_WDT_MODEL_HOME = imageDefinition.modelHomePath.value;

        this.uid = props.createProperty(asLegalK8sName, wdtModel.domainName);
        this.uid.addValidator(...validationHelper.getK8sNameValidators());

        this.kubernetesNamespace = props.createProperty('${1}-ns', this.uid.observable);
        this.kubernetesNamespace.addValidator(...validationHelper.getK8sNameValidators());
        this.domainHome = imageDefinition.domainHomePath;
        this.domainType = imageDefinition.targetDomainType;

        this.domainPersistentVolumeName = props.createProperty('weblogic-domain-storage-volume');
        this.domainPersistentVolumeName.addValidator(...validationHelper.getK8sNameValidators());
        this.domainPersistentVolumeMountPath = props.createProperty('/shared');
        this.domainPersistentVolumeClaimName = props.createProperty('${1}-pvc', this.uid.observable);
        this.domainPersistentVolumeClaimName.addValidator(...validationHelper.getK8sNameValidators());
        this.domainPersistentVolumeLogHomeEnabled = props.createProperty(false);
        this.domainPersistentVolumeLogHome = props.createProperty('/shared/logs/${1}', this.uid.observable);

        this.imageRegistryPullRequireAuthentication = props.createProperty(false);
        this.imageRegistryUseExistingPullSecret = props.createProperty(true);
        this.imageRegistryPullSecretName = props.createProperty();
        this.imageRegistryPullSecretName.addValidator(...validationHelper.getK8sNameValidators());

        this.imageRegistryPullUser = props.createProperty().asCredential();
        this.imageRegistryPullPassword = props.createProperty().asCredential();

        this.imageRegistryPullEmail = props.createProperty();
        this.imageRegistryPullEmail.addValidator(...validationHelper.getEmailAddressValidators());

        this.imagePullPolicy = props.createProperty('IfNotPresent');

        // These fields are exposed to the user only when using MII w/o aux image
        //
        this.imageModelHome = props.createProperty(imageDefinition.modelHomePath.value);
        this.imageWDTInstallHome = props.createProperty(imageDefinition.wdtHomePath.value + '/weblogic-deploy');

        // Auxiliary image-related properties
        this.auxImageRegistryPullRequireAuthentication = props.createProperty(false);
        this.auxImageRegistryUseExistingPullSecret = props.createProperty(true);
        this.auxImageRegistryPullSecretName = props.createProperty();
        this.auxImageRegistryPullSecretName.addValidator(...validationHelper.getK8sNameValidators());
        this.auxImageRegistryPullUser = props.createProperty().asCredential();
        this.auxImageRegistryPullPassword = props.createProperty().asCredential();
        this.auxImageRegistryPullEmail = props.createProperty();
        this.auxImageRegistryPullEmail.addValidator(...validationHelper.getEmailAddressValidators());
        this.auxImagePullPolicy = props.createProperty('IfNotPresent');

        // These fields are exposed to the user only when using an existing Auxiliary Image or Domain Creation Image.
        //
        this.auxImageSourceModelHome = props.createProperty(DEFAULT_AUX_IMAGE_WDT_MODEL_HOME);
        this.auxImageSourceWDTInstallHome = props.createProperty(DEFAULT_AUX_IMAGE_WDT_INSTALL_HOME);

        this.clusterKeys = [
          'uid', 'name', 'maxServers', 'replicas', 'minHeap', 'maxHeap', 'cpuRequest', 'cpuLimit', 'memoryRequest',
          'memoryLimit', 'disableDebugStdout', 'disableFan', 'useUrandom', 'additionalArguments'
        ];
        this.clusters = props.createListProperty(this.clusterKeys).persistByKey('uid');

        this.serverKeys = [
          'uid', 'name'
        ];
        this.servers = props.createListProperty(this.serverKeys).persistByKey('uid');

        this.modelConfigMapName = props.createProperty('${1}-config-map', this.uid.observable);
        this.modelConfigMapName.addValidator(...validationHelper.getK8sNameValidators());

        this.credentialsSecretName = props.createProperty('${1}-weblogic-credentials', this.uid.observable);
        this.credentialsSecretName.addValidator(...validationHelper.getK8sNameValidators());
        this.credentialsUserName = props.createProperty().asCredential();
        this.credentialsPassword = props.createProperty().asCredential();
        this.runtimeSecretName = props.createProperty('${1}-runtime-encryption-secret', this.uid.observable);
        this.runtimeSecretName.addValidator(...validationHelper.getK8sNameValidators());
        this.runtimeSecretValue = props.createProperty(window.api.utils.generateUuid()).asCredential();
        this.introspectorJobActiveDeadlineSeconds = props.createProperty(900);

        const internalFields = {
          // this internal observable list property is used for JSON read/write of this.secrets
          secrets: props.createListProperty(['uid', 'name', 'keys']).persistByKey('uid')
        };

        // this.secrets supports .observable() and .value, like other observable properties.
        // it is synchronized with internalFields.secrets during JSON read/write.
        // each secret in this.secrets has flattened keys structure, like:
        //
        // uid: "YdPQBG9Y/",
        // name: "my-secret",
        // keys: [{
        //   uid: "P51SNv9WA",
        //   key: "username",
        //   value: "me"
        // }, {
        //   uid: "P51SNv9WA",
        //   key: "password",
        //   value: "welcome1"
        // }]
        this.secrets = {
          observable: ko.observableArray(),
          get value() {
            return this.observable();
          }
        };

        this.replicas = props.createProperty(2);
        // TODO - can a WebLogic server really run with 64MB?  If not, raise minimum limit...
        this.minimumHeapSize = props.createProperty('64m');
        this.minimumHeapSize.addValidator(...validationHelper.getJavaMemoryValidators());
        this.maximumHeapSize = props.createProperty('256m');
        this.maximumHeapSize.addValidator(...validationHelper.getJavaMemoryValidators());
        this.disableDebugStdout = props.createProperty(true);
        this.useUrandom = props.createProperty(true);
        this.disableFan = props.createProperty(false);
        this.additionalArguments = props.createArrayProperty();
        this.cpuRequest = props.createProperty();
        this.cpuRequest.addValidator(...validationHelper.getK8sCpuValidators());
        this.cpuLimit = props.createProperty();
        this.cpuLimit.addValidator(...validationHelper.getK8sCpuValidators());
        this.memoryRequest = props.createProperty();
        this.memoryRequest.addValidator(...validationHelper.getK8sMemoryValidators());
        this.memoryLimit = props.createProperty();
        this.memoryLimit.addValidator(...validationHelper.getK8sMemoryValidators());

        this.runRcu = props.createProperty(false);
        this.waitForPvcBind = props.createProperty(true);
        this.walletPassword = props.createProperty().asCredential();
        this.walletPasswordSecretName = props.createProperty('${1}-wallet-password-secret', this.uid.observable);
        this.walletPasswordSecretName.addValidator(...validationHelper.getK8sNameValidators());

        // TODO - currently unused, thinking to add an action to set up disaster recovery once the domain exists.
        this.walletFileSecretName = props.createProperty();

        this.createPv = props.createProperty(false);
        this.pvName = props.createProperty('${1}-pv', this.uid.observable);
        this.pvName.addValidator(...validationHelper.getK8sNameValidators());
        this.pvType = props.createProperty('storageClass');
        this.pvCapacity = props.createProperty('20Gi');
        this.pvCapacity.addValidator(...validationHelper.getK8sMemoryValidators());
        this.pvNfsServer = props.createProperty();
        this.pvNfsServer.addValidator(...validationHelper.getHostNameValidators());
        // This field is used to hold the path for both nfs and hostPath types.
        this.pvPath = props.createProperty();

        this.defaultReclaimPolicy = ko.computed(() => {
          if (this.pvType.observable() === 'storageClass') {
            return 'Delete';
          }
          return 'Retain';
        }, this);

        this.pvReclaimPolicy = props.createProperty('${1}', this.defaultReclaimPolicy);

        this.createPvc = props.createProperty(false);
        this.pvcUseDefaultStorageClass = props.createProperty(false);
        this.pvcStorageClassName = props.createProperty();
        this.pvcStorageClassName.addValidator(...validationHelper.getK8sNameValidators());

        this.pvcSizeRequest = props.createProperty('5Gi');
        this.pvcSizeRequest.addValidator(...validationHelper.getK8sMemoryValidators());
        this.pvcSizeLimit = props.createProperty();
        this.pvcSizeLimit.addValidator(...validationHelper.getK8sMemoryValidators());

        this.externalProperties = props.createListProperty(['uid', 'Name', 'Override']).persistByKey('uid');

        // Jet tables do not work if you allow changing the value used as the primary key so always add a uid...
        //
        this.domainNodeSelector = props.createListProperty(['uid', 'name', 'value']);
        this.serverPodEnvironmentVariables = props.createListProperty(['uid', 'name', 'value']).persistByKey('uid');
        this.serverPodEnvironmentVariablesOverrideOtherSettings = props.createProperty(false);

        this.validators = {
          k8sNameValidator: validationHelper.getK8sNameValidators(),
        };

        // update the secrets list when the uid changes.
        this.uid.observable.subscribe(() => {
          this.updateSecretsFromModel();
        });

        // update the secrets list when any model content changes.
        wdtModel.modelContentChanged.subscribe(() => {
          wktLogger.debug('modelContentChanged event calling updateSecrets()');
          this.updateSecretsFromModel();
        });

        this.updateFromInternalFields = (() => {
          const flattenedSecrets = [];
          internalFields.secrets.observable().forEach(secret => {
            // flatten the key map to a list
            const newKeys = [];
            for(const keyUid in secret.keys) {
              const keyData = secret.keys[keyUid];
              newKeys.push({
                uid: keyUid,
                key: keyData.key,
                value: keyData.value
              });
            }
            // Cannot use object spread operator because Jet 14 does not support it!
            // build a copy of secret, but assign the new key structure.
            const newSecret = {};
            Object.assign(newSecret, secret);
            newSecret.keys = newKeys;
            flattenedSecrets.push(newSecret);
          });
          this.secrets.observable(flattenedSecrets);
        });

        this.updateInternalFields = (() => {
          const mappedSecrets = [];
          this.secrets.observable().forEach(secret => {
            // create a map from each flattened key
            const mappedKeys = {};
            secret.keys.forEach(flatSecret => {
              mappedKeys[flatSecret.uid] = {
                key: flatSecret.key,
                value: flatSecret.value
              };
            });
            // Cannot use the object spread operator because Jet 14 does not support it.
            // build a copy of secret, but assign the new key structure.
            const newSecret = {};
            Object.assign(newSecret, secret);
            newSecret.keys = mappedKeys;
            mappedSecrets.push(newSecret);
          });
          internalFields.secrets.observable(mappedSecrets);
        });

        this.readFrom = (json) => {
          props.createGroup(name, this).readFrom(json);

          props.createGroup(name, internalFields).readFrom(json);
          this.updateFromInternalFields();
        };

        this.loadPropertyOverrideValues = (json) => {
          const k8sDomainJson = json[name];
          if (k8sDomainJson && k8sDomainJson.hasOwnProperty('modelConfigMap')) {
            const modelConfigMap = k8sDomainJson['modelConfigMap'];
            for (const [propName, override] of Object.entries(modelConfigMap)) {
              wdtModel.setPropertyOverrideValue(propName, override);
            }
          }
        };

        this.setCredentialPathsForSecretsTable = (json) => {
          const secrets = this.secrets.observable();
          wktLogger.debug('entering setCredentialPathsForSecretsTable() with secrets table length = %s', secrets.length);
          if (secrets.length > 0) {
            if (!json.credentialPaths) {
              wktLogger.debug('creating credentialPaths array');
              json.credentialPaths = [];
            }
            for (const secret of secrets) {
              wktLogger.debug('working on secret path %s', `${name}.secrets.${secret.uid}`);
              secret.keys.forEach(keyData => {
                if(keyData.value) {
                  const keyUid = keyData.uid;
                  wktLogger.debug('setting secret %s', `${name}.secrets.${secret.uid}.keys.${keyUid}.value`);
                  json.credentialPaths.push(`${name}.secrets.${secret.uid}.keys.${keyUid}.value`);
                }
              });
            }
          }
        };

        this.writeTo = (json) => {
          this.setCredentialPathsForSecretsTable(json);
          props.createGroup(name, this).writeTo(json);

          this.updateInternalFields();
          props.createGroup(name, internalFields).writeTo(json);

          // Force the generated runtime secret to be written to the project.
          // This will allow us to keep the same generated password for the life
          // of the project (assuming the user doesn't intentionally change it).
          // See JIRA WKTUI-300 for details.
          //
          if (!json[name]) {
            json[name] = {
              runtimeSecretValue: this.runtimeSecretValue.value
            };
          } else if (!json[name].runtimeSecretValue) {
            json[name].runtimeSecretValue = this.runtimeSecretValue.value;
          }

          const modelConfigMap = {};
          for (const entry of wdtModel.getMergedPropertiesContent().value) {
            if (entry.Override) {
              modelConfigMap[entry.Name] = entry.Override;
            }
          }
          if (Object.keys(modelConfigMap).length > 0) {
            if (!json[name]) {
              json[name] = {};
            }
            json[name]['modelConfigMap'] = modelConfigMap;
          }
        };

        this.isChanged = () => {
          this.updateInternalFields();
          if(props.createGroup(name, internalFields).isChanged()) {
            return true;
          }

          return props.createGroup(name, this).isChanged();
        };

        this.setNotChanged = () => {
          this.updateInternalFields();
          props.createGroup(name, internalFields).setNotChanged();

          props.createGroup(name, this).setNotChanged();
        };

        this.loadPrepareModelResults = (prepareModelResults) => {
          wktLogger.debug('loadPrepareModelResults received: %s', JSON.stringify(prepareModelResults, null, 2));
          this.handlePrepareModelTopology(prepareModelResults.domain);
          this.handlePrepareModelSecrets(prepareModelResults.secrets);
        };

        this.handlePrepareModelTopology = (domain) => {
          if (domain && Array.isArray(domain.clusters)) {
            domain.clusters.forEach(cluster => this.setClusterRow(cluster));
            // Remove any clusters that are no longer in the model
            //
            this.clusters.observable.remove(cluster => {
              let remove = true;
              for (const prepareModelCluster of domain.clusters) {
                if (prepareModelCluster.clusterName === cluster.name) {
                  remove = false;
                  break;
                }
              }
              return remove;
            });
          }

          if (domain && Array.isArray(domain.servers)) {
            domain.servers.forEach(server => this.setServerRow(server));
            // Remove any servers that are no longer in the model
            this.servers.observable.remove(server => {
              let remove = true;
              for (const prepareModelServer of domain.servers) {
                if (prepareModelServer.serverName === server.name) {
                  remove = false;
                  break;
                }
              }
              return remove;
            });
          }
        };

        this.setClusterRow = (prepareModelCluster) => {
          let cluster;
          for (const row of this.clusters.observable()) {
            if (row.name === prepareModelCluster.clusterName) {
              row.maxServers = prepareModelCluster.replicas;
              if (row.replicas === undefined || row.replicas > row.maxServers) {
                row.replicas = row.maxServers;
              }
              cluster = row;
              break;
            }
          }
          if (cluster) {
            this.clusters.observable.replace(cluster, cluster);
          } else {
            this.clusters.addNewItem({
              uid: utils.getShortUuid(),
              name: prepareModelCluster.clusterName,
              maxServers: prepareModelCluster.replicas,
              replicas: prepareModelCluster.replicas
            });
          }
        };

        this.setServerRow = (prepareModelServer) => {
          let server;
          for (const row of this.servers.observable()) {
            if (row.name === prepareModelServer.serverName) {
              server = row;
              break;
            }
          }
          if (server) {
            this.servers.observable.replace(server, server);
          } else {
            this.servers.addNewItem({
              uid: utils.getShortUuid(),
              name: prepareModelServer.serverName
            });
          }
        };

        this.handlePrepareModelSecrets = (secrets) => {
          if (secrets && secrets.length) {
            wktLogger.debug('handlePrepareModelSecrets() working on %d secrets', secrets.length);
            for (const secret of secrets) {
              wktLogger.debug('working on secret %s', secret.name);

              // The secret should always exist already because prepare model updated the model first,
              // which triggers updating the secrets ListProperty.  If not, something is broken...
              //
              const existingSecretObject = findSecretByName(this.uid.value, secret.name, this.secrets.observable());
              updateSecretFromPrepareModelResults(existingSecretObject, secret.keys);
            }
          } else {
            wktLogger.debug('handlePrepareModelSecrets() has nothing to do');
          }
        };

        this.getSecretsEnvVarMap = () => {
          return {
            DOMAIN_UID: this.uid.value
          };
        };

        // search existing secrets for an existing secret/key value
        this.getFieldValueFromExistingSecrets = (uid, fieldName, defaultValue) => {
          let result = defaultValue;
          for (const domainSecret of this.secrets.observable()) {
            if (domainSecret.uid === uid) {
              for(const keyMap of domainSecret.keys) {
                if (keyMap.key === fieldName) {
                  result = keyMap.value;
                  break;
                }
              }
            }
          }
          return result;
        };

        this.updateSecretsFromModel = () => {
          const auxImageHelper = require('utils/aux-image-helper');
          if(auxImageHelper.projectUsingExternalImageContainingModel()) {
            return;
          }

          const modelSecretsData = wdtModel.getModelSecretsData();

          const modelSecrets = new Map();
          const envVarMap = this.getSecretsEnvVarMap();
          for (const modelSecretData of modelSecretsData) {
            const key = modelSecretData.envVar ? `${modelSecretData.envVar}${modelSecretData.name}` : modelSecretData.name;
            const uid = utils.hashIt(key);

            const secretKeys = [];
            for(const secretKey in modelSecretData.keys) {
              const keyUid = utils.getShortUuid();
              const existing_value = this.getFieldValueFromExistingSecrets(uid, secretKey,
                modelSecretData.keys[secretKey]);
              secretKeys.push({uid: keyUid, key: secretKey, value: existing_value});
            }

            modelSecrets.set(uid, {
              uid: uid,
              name: computeSecretNameFromModelData(modelSecretData, envVarMap),
              keys: secretKeys
            });
          }
          this.secrets.observable([...modelSecrets.values()]);
        };

        function computeSecretNameFromModelData(modelSecretData, envVarMap) {
          let result;
          if (modelSecretData.envVar) {
            if (envVarMap[modelSecretData.envVar]) {
              result = `${envVarMap[modelSecretData.envVar]}${modelSecretData.name}`;
            } else {
              wktLogger.warn('Secret named %s contained unexpected environment variable reference %s',
                modelSecretData.name, modelSecretData.envVar);
              result = `${modelSecretData.envVar}${modelSecretData.name}`;
            }
          } else {
            result = modelSecretData.name;
          }
          return result;
        }
      }

      function findSecretByName(domainUid, secretName, secretsList) {
        let result;
        const domainQualifiedSecretName = `${domainUid}-${secretName}`;
        for (const secret of secretsList) {
          if (secret.name === domainQualifiedSecretName || secret.name === secretName) {
            result = secret;
            break;
          }
        }
        return result;
      }

      function updateSecretFromPrepareModelResults(existingSecretObject, secretKeys) {
        if (existingSecretObject && secretKeys && secretKeys.length > 0) {
          for (const secretKey of secretKeys) {
            if (secretKey.defaultValue) {
              existingSecretObject[secretKey.key] = secretKey.defaultValue;
            }
          }
        }
      }

      return new K8sDomainModel();
    };
  }
);
