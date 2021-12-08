/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

    return function(name, wdtModel, imageDomainHomePathProperty, imageDomainTypeProperty) {
      function asLegalK8sName(observable) {
        return utils.toLegalK8sName(observable());
      }

      function K8sDomainModel() {
        this.uid = props.createProperty(asLegalK8sName, wdtModel.domainName);
        this.uid.addValidator(...validationHelper.getK8sNameValidators());

        this.kubernetesNamespace = props.createProperty('${1}-ns', this.uid.observable);
        this.kubernetesNamespace.addValidator(...validationHelper.getK8sNameValidators());
        this.domainHome = imageDomainHomePathProperty;
        this.domainType = imageDomainTypeProperty;

        this.domainPersistentVolumeName = props.createProperty('weblogic-domain-storage-volume');
        this.domainPersistentVolumeMountPath = props.createProperty('/shared');
        this.domainPersistentVolumeClaimName = props.createProperty();
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

        this.clusterKeys = [
          'name', 'maxServers', 'replicas', 'minHeap', 'maxHeap', 'cpuRequest', 'cpuLimit', 'memoryRequest',
          'memoryLimit', 'disableDebugStdout', 'disableFan', 'useUrandom', 'additionalArguments'
        ];
        this.clusters = props.createListProperty(this.clusterKeys).persistByKey('name');

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

        this.secrets = props.createListProperty(['uid', 'name', 'username', 'password']).persistByKey('uid');

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

        // update the secrets list when the uid changes.
        this.uid.observable.subscribe(() => {
          this.updateSecrets();
        });

        // update the secrets list when any model content changes.
        wdtModel.modelContentChanged.subscribe(() => {
          this.updateSecrets();
        });

        this.configMapIsEmpty = () => {
          let result = true;
          for (const entry of wdtModel.getMergedPropertiesContent().observable()) {
            if (entry.Override) {
              result = false;
              break;
            }
          }
          return result;
        };

        this.readFrom = (json) => {
          props.createGroup(name, this).readFrom(json);
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
          if (this.secrets.value.length > 0) {
            if (!json.credentialPaths) {
              json.credentialPaths = [];
            }
            for (const secret of this.secrets.value) {
              if (secret.username) {
                json.credentialPaths.push(`${name}.secrets.${secret.uid}.username`);
              }
              if (secret.password) {
                json.credentialPaths.push(`${name}.secrets.${secret.uid}.password`);
              }
            }
          }
        };

        this.writeTo = (json) => {
          this.setCredentialPathsForSecretsTable(json);
          props.createGroup(name, this).writeTo(json);

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
          return props.createGroup(name, this).isChanged();
        };

        this.setNotChanged = () => {
          props.createGroup(name, this).setNotChanged();
        };

        this.loadPrepareModelResults = (prepareModelResults) => {
          this.handlePrepareModelTopology(prepareModelResults.domain);
          this.handlePrepareModelSecrets(prepareModelResults.secrets);
        };

        this.handlePrepareModelTopology = (domain) => {
          if (domain && Array.isArray(domain.clusters)) {
            domain.clusters.forEach(cluster => this.setClusterRow(cluster));
          }
        };

        this.setClusterRow = (prepareModelCluster) => {
          let found;
          for (const row of this.clusters.observable()) {
            if (row.name === prepareModelCluster.clusterName) {
              row.maxServers = prepareModelCluster.replicas;
              if (row.replicas === undefined || row.replicas > row.maxServers) {
                row.replicas = row.maxServers;
              }
              found = true;
              break;
            }
          }
          if (!found) {
            this.clusters.addNewItem({
              name: prepareModelCluster.clusterName,
              maxServers: prepareModelCluster.replicas,
              replicas: prepareModelCluster.replicas
            });
          }
        };

        this.handlePrepareModelSecrets = (secrets) => {
          if (secrets && secrets.secrets && secrets.secrets.length) {
            for (const secret of secrets.secrets) {
              const existingSecretObject = findSecretByName(secret.name, this.secrets.observable());
              updateSecretFromPrepareModelResults(existingSecretObject, secret.keys);
            }
          }
        };

        this.getSecretsEnvVarMap = () => {
          return {
            DOMAIN_UID: this.uid.value
          };
        };

        this.getFieldValueFromExistingSecrets = (uid, fieldName, defaultValue) => {
          let result = defaultValue;
          for (const domainSecret of this.secrets.value) {
            if (domainSecret.uid === uid) {
              if (domainSecret[fieldName]) {
                result = domainSecret[fieldName];
              }
              break;
            }
          }
          return result;
        };

        this.updateSecrets = () => {
          const modelSecretsData = wdtModel.getModelSecretsData();

          const modelSecrets = new Map();
          const envVarMap = this.getSecretsEnvVarMap();
          for (const modelSecretData of modelSecretsData) {
            const key = modelSecretData.envVar ? `${modelSecretData.envVar}${modelSecretData.name}` : modelSecretData.name;
            const uid = utils.hashIt(key);

            modelSecrets.set(uid, {
              uid: uid,
              name: computeSecretNameFromModelData(modelSecretData, envVarMap),
              username: this.getFieldValueFromExistingSecrets(uid, 'username', modelSecretData.username),
              password: this.getFieldValueFromExistingSecrets(uid, 'password', modelSecretData.password)
            });
          }
          this.secrets.value = [...modelSecrets.values()];
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

      function findSecretByName(secretName, secretsList) {
        let result;
        for (const secret of secretsList) {
          if (secret.name === secretName) {
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
