/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-domain-configmap-generator', 'js-yaml', 'utils/i18n', 'utils/aux-image-helper',
  'utils/wkt-logger'],
function(project, K8sDomainConfigMapGenerator, jsYaml, i18n, auxImageHelper) {
  const WDT_DIR_NAME = 'weblogic-deploy';
  const DEFAULT_AUX_IMAGE_WDT_INSTALL_HOME = '/auxiliary/weblogic-deploy';
  const DEFAULT_AUX_IMAGE_WDT_MODEL_HOME = '/auxiliary/models';
  const WDT_PROPS_ENV_VAR_NAME = 'WLSDEPLOY_PROPERTIES';
  const WDT_PASSPHRASE_SECRET_PROPERTY = 'wdt.config.model.encryption.secret';

  class K8sDomainV9ResourceGenerator {
    constructor() {
      this.project = project;
      this.k8sConfigMapGenerator = new K8sDomainConfigMapGenerator();
    }

    generate(generateYaml = true) {
      const domainResource = {
        apiVersion: 'weblogic.oracle/v9',
        kind: 'Domain',
        metadata: {
          name: this.project.k8sDomain.uid.value,
          namespace: this.project.k8sDomain.kubernetesNamespace.value,
          labels: {
            'weblogic.domainUID': this.project.k8sDomain.uid.value
          }
        },
        spec: {
          domainUID: this.project.k8sDomain.uid.value,
          domainHomeSourceType: getOperatorNameForTargetDomainLocation(this.project.settings.targetDomainLocation.value),
          image: this.project.image.imageTag.value,
          imagePullPolicy: this.project.k8sDomain.imagePullPolicy.value,
          introspectVersion: Date.now().toString(),
          webLogicCredentialsSecret: {
            name: this.project.k8sDomain.credentialsSecretName.value
          }
        }
      };

      if (this.project.k8sDomain.precreateService.value) {
        domainResource.spec.serverService = {
          precreateService: true
        };
      }

      if (this.project.k8sDomain.domainHome.value) {
        domainResource.spec.domainHome = this.project.k8sDomain.domainHome.value;
      }

      if (this.project.settings.targetDomainLocation.value === 'pv') {
        if (this.project.k8sDomain.domainPersistentVolumeLogHomeEnabled.value) {
          domainResource.spec.logHomeEnabled = true;
          domainResource.spec.logHome = this.project.k8sDomain.domainPersistentVolumeLogHome.value;
        }
      }

      const serverPod = this._getDomainServerPod(this._getWDTEncryptionSecretName());
      if (serverPod) {
        domainResource.spec.serverPod = serverPod;
      }

      if (this.project.settings.targetDomainLocation.value === 'mii') {
        const wdtRelatedPaths = this._getMiiWdtRelatedPaths(domainResource);

        if (!domainResource.spec.configuration) {
          domainResource.spec.configuration = {
            model: {}
          };
        } else if (!domainResource.spec.configuration.model) {
          domainResource.spec.configuration.model = {};
        }

        if (usingAuxImage()) {
          const auxiliaryImage = {
            image: this.project.image.auxImageTag.value,
          };
          if (this.project.k8sDomain.auxImagePullPolicy.hasValue()) {
            auxiliaryImage.imagePullPolicy = this.project.k8sDomain.auxImagePullPolicy.value;
          }
          auxiliaryImage.sourceWDTInstallHome = wdtRelatedPaths.sourceWDTInstallHome;
          auxiliaryImage.sourceModelHome = wdtRelatedPaths.sourceModelHome;

          domainResource.spec.configuration.model.auxiliaryImages = [ auxiliaryImage ];
        } else {
          if (wdtRelatedPaths.wdtInstallHome) {
            domainResource.spec.configuration.model.wdtInstallHome = wdtRelatedPaths.wdtInstallHome;
          }
          if (wdtRelatedPaths.modelHome) {
            domainResource.spec.configuration.model.modelHome = wdtRelatedPaths.modelHome;
          }
        }
      } else if (this.usingDomainCreationImage()) {
        if (!domainResource.spec.configuration) {
          domainResource.spec.configuration = {
            initializeDomainOnPV: {
              domain: { }
            }
          };
        } else if (!domainResource.spec.configuration.initializeDomainOnPV) {
          domainResource.spec.configuration.initializeDomainOnPV = {
            domain: { }
          };
        } else if (!domainResource.spec.configuration.initializeDomainOnPV.domain) {
          domainResource.spec.configuration.initializeDomainOnPV.domain = { };
        }

        if (this.project.k8sDomain.waitForPvcBind.hasValue()) {
          domainResource.spec.configuration.initializeDomainOnPV.waitForPvcToBind =
            this.project.k8sDomain.waitForPvcBind.value;
        }

        if (this.project.k8sDomain.domainType.hasValue()) {
          domainResource.spec.configuration.initializeDomainOnPV.domain.domainType =
            this.project.k8sDomain.domainType.value;
        }

        // default is domain so no need to set
        if (auxImageHelper.domainUsesJRF() && this.project.k8sDomain.runRcu.value) {
          domainResource.spec.configuration.initializeDomainOnPV.domain.createIfNotExists = 'DomainAndRCU';
        }

        if (auxImageHelper.domainUsesJRF()) {
          domainResource.spec.configuration.initializeDomainOnPV.domain.opss = {
            walletPasswordSecret: this.project.k8sDomain.walletPasswordSecretName.value
          };
        }

        const domainCreationImage = {
          image: this.project.image.auxImageTag.value
        };

        if (this.project.k8sDomain.auxImagePullPolicy.hasValue()) {
          domainCreationImage.imagePullPolicy = this.project.k8sDomain.auxImagePullPolicy.value;
        }

        if (this.project.image.createAuxImage.value) {
          domainCreationImage.sourceWDTInstallHome = this.project.image.wdtHomePath.value + '/weblogic-deploy';
          domainCreationImage.sourceModelHome = this.project.image.modelHomePath.value;
        } else {
          domainCreationImage.sourceWDTInstallHome = this.project.k8sDomain.auxImageSourceWDTInstallHome.value;
          domainCreationImage.sourceModelHome = this.project.k8sDomain.auxImageSourceModelHome.value;
        }

        if (!domainResource.spec.configuration.initializeDomainOnPV.domain.domainCreationImages) {
          domainResource.spec.configuration.initializeDomainOnPV.domain.domainCreationImages = [];
        }
        domainResource.spec.configuration.initializeDomainOnPV.domain.domainCreationImages.push(domainCreationImage);
      }

      if (this.project.k8sDomain.clusters.value.length === 0) {
        domainResource.spec.replicas = this.project.k8sDomain.replicas.value;
      } else {
        domainResource.spec.clusters = this.project.k8sDomain.clusters.value.map(cluster => {
          return { name: _getClusterName(this.project.k8sDomain.uid.value, cluster.name) };
        });
      }

      const imagePullSecrets = [];
      if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value &&
        this.project.k8sDomain.imageRegistryPullSecretName.value) {
        imagePullSecrets.push({ name: this.project.k8sDomain.imageRegistryPullSecretName.value });
      }
      if (usingAuxImage() || this.usingDomainCreationImage()) {
        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value &&
          this.project.k8sDomain.auxImageRegistryPullSecretName.value) {
          const auxImagePullSecretName = this.project.k8sDomain.auxImageRegistryPullSecretName.value;

          let secretNotAlreadyAdded = true;
          for (const imagePullSecret of imagePullSecrets) {
            if (auxImagePullSecretName === imagePullSecret.name) {
              secretNotAlreadyAdded = false;
              break;
            }
          }

          if (secretNotAlreadyAdded) {
            imagePullSecrets.push({ name:  auxImagePullSecretName });
          }
        }
      }
      if (imagePullSecrets.length > 0) {
        domainResource.spec.imagePullSecrets = imagePullSecrets;
      }

      if (this.project.settings.targetDomainLocation.value === 'mii') {
        domainResource.spec.configuration.model.domainType = this.project.k8sDomain.domainType.value;
        domainResource.spec.configuration.model.runtimeEncryptionSecret =
          this.project.k8sDomain.runtimeSecretName.value;

        if (this.k8sConfigMapGenerator.shouldCreateConfigMap()) {
          domainResource.spec.configuration.model.configMap = this.project.k8sDomain.modelConfigMapName.value;
        }
      } else if (this.usingDomainCreationImage()) {
        if (this.k8sConfigMapGenerator.shouldCreateConfigMap()) {
          domainResource.spec.configuration.initializeDomainOnPV.domain.domainCreationConfigMap =
            this.project.k8sDomain.modelConfigMapName.value;
        }
      }

      if (this.project.settings.targetDomainLocation.value === 'mii' || this.usingDomainCreationImage()) {
        if (Array.isArray(this.project.k8sDomain.secrets.value) && this.project.k8sDomain.secrets.value.length > 0) {
          domainResource.spec.configuration.secrets = [];
          for (const secret of this.project.k8sDomain.secrets.value) {
            domainResource.spec.configuration.secrets.push(secret.name);
          }
        }

        const wdtEncryptionSecretName = this._getWDTEncryptionSecretName();
        if (wdtEncryptionSecretName) {
          if (!Array.isArray(domainResource.spec.configuration.secrets)) {
            domainResource.spec.configuration.secrets = [];
          }
          domainResource.spec.configuration.secrets.push(wdtEncryptionSecretName);
        }

        // The operator default value is 120 but the UI sets it to 900 so
        // set the value unless it is empty or 120.
        //
        const deadline = this.project.k8sDomain.introspectorJobActiveDeadlineSeconds.value;
        if (deadline && deadline !== 120) {
          domainResource.spec.configuration.introspectorJobActiveDeadlineSeconds =
            this.project.k8sDomain.introspectorJobActiveDeadlineSeconds.value;
        }
      }

      if (this.usingDomainCreationImage()) {
        if (this.project.k8sDomain.createPvc.value) {
          domainResource.spec.configuration.initializeDomainOnPV.persistentVolumeClaim = this._getPVC();
          if (this.project.k8sDomain.createPv.value) {
            domainResource.spec.configuration.initializeDomainOnPV.persistentVolume = this._getPV();
          }
        }
      }

      // At this point, the domainResource is complete.  Now, we need to
      // generate the Cluster resource specs, as needed.
      //
      const clusterResources = [];
      if (this.project.k8sDomain.clusters.value.length > 0) {
        for (const cluster of this.project.k8sDomain.clusters.value) {
          const clusterName = _getClusterName(this.project.k8sDomain.uid.value, cluster.name);

          const clusterResource = {
            apiVersion: 'weblogic.oracle/v1',
            kind: 'Cluster',
            metadata: {
              name: clusterName,
              namespace: this.project.k8sDomain.kubernetesNamespace.value,
              labels: {
                'weblogic.domainUID': this.project.k8sDomain.uid.value
              }
            },
            spec: {
              clusterName: cluster.name
            },
          };

          const serverPod = getServerPodForCluster(cluster);
          if (serverPod) {
            clusterResource.spec.serverPod = serverPod;
          }

          if (typeof cluster.replicas === 'number') {
            clusterResource.spec.replicas = cluster.replicas;
          }

          clusterResources.push(clusterResource);
        }
      }

      let result;
      if (generateYaml) {
        result = [];
        for (const clusterResource of clusterResources) {
          if (result.length === 0) {
            result.push(`# ${i18n.t('k8s-domain-script-generator-clusters-first-comment')}`, '#');
          }
          result.push(...jsYaml.dump(clusterResource, {}).split('\n'));
          result.push('---', '');
        }
        result.push(...jsYaml.dump(domainResource, {}).split('\n'));
      } else {
        result = { domainResource };

        if (clusterResources.length > 0) {
          result.clusters = clusterResources;
        }
      }

      return result;
    }

    _getDomainServerPod(wdtEncryptionSecretName = undefined) {
      let serverPod = this._getServerPod();

      if (this.project.k8sDomain.serverPodEnvironmentVariables.value.length > 0) {
        if (!serverPod) {
          serverPod = {};
        }
        if (!Array.isArray(serverPod.env)) {
          serverPod.env = [];
        }
        this.project.k8sDomain.serverPodEnvironmentVariables.value.forEach(envVar => {
          const existingEnvEntry = serverPod.env.find(envEntry => envEntry.name === envVar.name);
          if (existingEnvEntry) {
            existingEnvEntry.value = this._getEnvVarValue(existingEnvEntry, envVar.value);
          } else {
            serverPod.env.push({ name: envVar.name, value: envVar.value });
          }
        });
      }

      if (wdtEncryptionSecretName) {
        if (!serverPod) {
          serverPod = {};
        }
        if (!Array.isArray(serverPod.env)) {
          serverPod.env = [];
        }
        this._addWDTEncryptionSecret(serverPod.env, wdtEncryptionSecretName);
      }

      if (this.project.k8sDomain.domainNodeSelector.value.length > 0) {
        if (!serverPod) {
          serverPod = {};
        }
        serverPod.nodeSelector = {};

        this.project.k8sDomain.domainNodeSelector.value.forEach(selector => {
          serverPod.nodeSelector[selector.name] = selector.value;
        });
      }
      return serverPod;
    }

    _getServerPod() {
      const serverPod = _getServerPod(getJavaOptions(this.project.k8sDomain), getUserMemArgs(this.project.k8sDomain),
        getKubernetesResources(this.project.k8sDomain));

      if (this.project.settings.targetDomainLocation.value === 'pv') {
        const volumeName = this.project.k8sDomain.domainPersistentVolumeName.value || 'volume-name-not-set';
        serverPod.volumes = [
          {
            name: volumeName,
            persistentVolumeClaim: {
              claimName: this.project.k8sDomain.domainPersistentVolumeClaimName.value || 'volume-claim-name-not-set'
            }
          }
        ];
        serverPod.volumeMounts = [
          {
            name: volumeName,
            mountPath: this.project.k8sDomain.domainPersistentVolumeMountPath.value
          }
        ];
      }
      return serverPod;
    }

    _getMiiWdtRelatedPaths() {
      let result;
      if (this.project.settings.targetDomainLocation.value === 'mii') {
        result = { };

        // WKO 4.0+ has different behavior and parameters than 3.x
        //
        let wdtInstallHome = this.project.image.wdtHomePath.value;
        if (wdtInstallHome) {
          wdtInstallHome = window.api.path.joinAndConvertToUnixPath(wdtInstallHome, WDT_DIR_NAME);
        }
        if (usingAuxImage()) {
          if (usingExistingAuxImage()) {
            // If the source fields are exposed in the UI, use the values from those fields.
            //
            if (this.project.k8sDomain.auxImageSourceWDTInstallHome.value !== DEFAULT_AUX_IMAGE_WDT_INSTALL_HOME) {
              result.sourceWDTInstallHome = this.project.k8sDomain.auxImageSourceWDTInstallHome.value;
            }
            if (this.project.k8sDomain.auxImageSourceModelHome.value !== DEFAULT_AUX_IMAGE_WDT_MODEL_HOME) {
              result.sourceModelHome = this.project.k8sDomain.auxImageSourceModelHome.value;
            }
          } else {
            // If creating a new image, then use the values from the image page.
            //
            result.sourceWDTInstallHome = wdtInstallHome;
            result.sourceModelHome = this.project.image.modelHomePath.value;
          }
          // We intentionally do not set the wdtInstallHome and modelHome parameters
          // since the default values will always be correct in V9 when using aux images.
          //
        } else {
          if (usingExistingPrimaryImage()) {
            // If these fields are exposed in the UI, use them if they have non-default values.
            //
            if (this.project.k8sDomain.imageWDTInstallHome.hasValue()) {
              result.wdtInstallHome = this.project.k8sDomain.imageWDTInstallHome.value;
            }
            if (this.project.k8sDomain.imageModelHome.hasValue()) {
              result.modelHome = this.project.k8sDomain.imageModelHome.value;
            }
          } else {
            if (this.project.image.modelHomePath.hasValue()) {
              result.wdtInstallHome = wdtInstallHome;
            }
            if (this.project.image.modelHomePath.hasValue()) {
              result.modelHome = this.project.image.modelHomePath.value;
            }
          }
        }
      }
      return result;
    }

    _getPVC() {
      const pvc = {
        metadata: {
          name: this.project.k8sDomain.domainPersistentVolumeClaimName.value
        },
        spec: { }
      };

      if (this.project.k8sDomain.pvcStorageClassName.hasValue() &&
        !this.project.k8sDomain.pvcUseDefaultStorageClass.value) {
        pvc.spec.storageClassName = this.project.k8sDomain.pvcStorageClassName.value;
      } else if (!this.project.k8sDomain.pvcStorageClassName.value &&
        !this.project.k8sDomain.pvcUseDefaultStorageClass.value) {
        pvc.spec.storageClassName = '';
      }

      if (this.project.k8sDomain.pvName.value) {
        pvc.spec.volumeName = this.project.k8sDomain.pvName.value;
      }

      if (this.project.k8sDomain.pvcSizeRequest.value || this.project.k8sDomain.pvcSizeLimit.value) {
        pvc.spec.resources = { };
        if (this.project.k8sDomain.pvcSizeRequest.value) {
          pvc.spec.resources.requests = {
            storage: this.project.k8sDomain.pvcSizeRequest.value
          };
        }

        if (this.project.k8sDomain.pvcSizeLimit.value) {
          pvc.spec.resources.limits = {
            storage: this.project.k8sDomain.pvcSizeLimit.value
          };
        }
      }

      return pvc;
    }

    _getPV() {
      const pv = {
        metadata: {
          name: this.project.k8sDomain.pvName.value
        },
        spec: { }
      };

      pv.spec.capacity = {
        storage: this.project.k8sDomain.pvCapacity.value
      };

      if (this.project.k8sDomain.pvReclaimPolicy.hasValue()) {
        pv.spec.persistentVolumeReclaimPolicy = this.project.k8sDomain.pvReclaimPolicy.value;
      }

      const pvType = this.project.k8sDomain.pvType.value;
      if (this.project.k8sDomain.pvcStorageClassName.hasValue() &&
        !this.project.k8sDomain.pvcUseDefaultStorageClass.value) {
        pv.spec.storageClassName = this.project.k8sDomain.pvcStorageClassName.value;
      } else if (!this.project.k8sDomain.pvcStorageClassName.value &&
        !this.project.k8sDomain.pvcUseDefaultStorageClass.value) {
        pv.spec.storageClassName = '';
      }
      if (pvType === 'nfs') {
        pv.spec.nfs = {
          server: this.project.k8sDomain.pvNfsServer.value,
          path: this.project.k8sDomain.pvPath.value
        };
      } else if (pvType === 'hostPath') {
        pv.spec.hostPath = {
          path: this.project.k8sDomain.pvPath.value
        };
      }

      return pv;
    }

    _getEnvVarValue(envEntry, envVarValue) {
      if (envEntry && !project.k8sDomain.serverPodEnvironmentVariablesOverrideOtherSettings.value) {
        return `${envEntry.value} ${envVarValue}`;
      }
      return envVarValue;
    }

    usingDomainCreationImage() {
      return auxImageHelper.supportsDomainCreationImages() && this.project.image.useAuxImage.value;
    }

    _getWDTEncryptionSecretName() {
      let encryptionSecret;
      if (this.project.settings.targetDomainLocation.value === 'mii' ||
          (this.project.settings.targetDomainLocation.value === 'pv' && this.usingDomainCreationImage())) {
        encryptionSecret = this.project.k8sDomain.wdtEncryptionSecretName();
      }
      return encryptionSecret;
    }

    _addWDTEncryptionSecret(serverPodEnv, wdtEncryptionSecretName) {
      let foundEnvVar = false;
      for (const envVar of serverPodEnv) {
        if (envVar.name === WDT_PROPS_ENV_VAR_NAME) {
          foundEnvVar = true;
          if (envVar.value.includes(`-D${WDT_PASSPHRASE_SECRET_PROPERTY}=`)) {
            const values = envVar.value.split(' ');

            for (let i = 0; i < values.length; i++) {
              if (values[i].startsWith(`-D${WDT_PASSPHRASE_SECRET_PROPERTY}=`)) {
                values[i] = `-D${WDT_PASSPHRASE_SECRET_PROPERTY}=${wdtEncryptionSecretName}`;
                break;
              }
            }
            envVar.value = values.join(' ');
          } else {
            envVar.value = `${envVar.value} -D${WDT_PASSPHRASE_SECRET_PROPERTY}=${wdtEncryptionSecretName}`;
          }
          break;
        }
      }
      if (!foundEnvVar) {
        serverPodEnv.push({
          name:  WDT_PROPS_ENV_VAR_NAME,
          value: `-D${WDT_PASSPHRASE_SECRET_PROPERTY}=${wdtEncryptionSecretName}`
        });
      }
    }
  }

  function usingAuxImage() {
    return project.settings.targetDomainLocation.value === 'mii' && project.image.useAuxImage.value;
  }

  function usingExistingPrimaryImage() {
    return project.settings.targetDomainLocation.value === 'mii' && !project.image.createPrimaryImage.value
      && !project.image.useAuxImage.value;
  }

  function usingExistingAuxImage() {
    return usingAuxImage() && !project.image.createAuxImage.value;
  }

  function getOperatorNameForTargetDomainLocation(targetDomainLocation) {
    switch (targetDomainLocation) {
      case 'mii':
        return 'FromModel';

      case 'dii':
        return 'Image';

      case 'pv':
        return 'PersistentVolume';

      default:
        throw new Error(i18n.t('k8s-domain-script-generator-invalid-target-domain-location',
          { targetDomainLocation: targetDomainLocation}));
    }
  }

  function getServerPodForCluster(cluster) {
    const serverPod = _getServerPod(getJavaOptionsForCluster(cluster), getUserMemArgsForCluster(cluster), getKubernetesResourcesForCluster(cluster)) || {};

    return Object.keys(serverPod).length > 0 ? serverPod : null;
  }

  function _getServerPod(javaOptions, userMemArgs, resources) {
    const serverPod = {};
    const env = [];
    addIfNotNull(env, 'JAVA_OPTIONS', javaOptions);
    addIfNotNull(env, 'USER_MEM_ARGS', userMemArgs);
    if (env.length) {
      serverPod.env = env;
    }

    if (resources) {
      serverPod.resources = resources;
    }

    return Object.keys(serverPod).length > 0 ? serverPod : null;
  }

  function addIfNotNull(env, varName, varValue) {
    if (varValue) {
      env.push({ name: varName, value: varValue });
    }
  }

  function getJavaOptions(k8sDomain) {
    return _getJavaOptions(k8sDomain.disableDebugStdout.value, k8sDomain.useUrandom.value,
      k8sDomain.disableFan.value, k8sDomain.additionalArguments.value);
  }

  function getJavaOptionsForCluster(cluster) {
    return _getJavaOptions(cluster['disableDebugStdout'], cluster['useUrandom'], cluster['disableFan'],
      cluster['additionalArguments']);
  }

  function _getJavaOptions(disableDebugStdout, useUrandom, disableFan, additionalArguments) {
    const result = [];
    if (disableDebugStdout) {
      result.push('-Dweblogic.StdoutDebugEnabled=false');
    }
    if (useUrandom) {
      result.push('-Djava.security.egd=file:/dev/./urandom');
    }
    if (disableFan) {
      result.push('-Doracle.jdbc.fanEnabled=false');
    }
    if (additionalArguments && additionalArguments.length > 0) {
      result.push(...additionalArguments);
    }
    return (result.length) ? result.join(' ') : null;
  }

  function getUserMemArgs(k8sDomain) {
    return _getUserMemArgs(k8sDomain.minimumHeapSize.value, k8sDomain.maximumHeapSize.value);
  }

  function getUserMemArgsForCluster(cluster) {
    return _getUserMemArgs(cluster['minHeap'], cluster['maxHeap']);
  }

  function _getUserMemArgs(minHeap, maxHeap) {
    const result = [];
    if (minHeap) {
      result.push(`-Xms${minHeap}`);
    }
    if (maxHeap) {
      result.push(`-Xmx${maxHeap}`);
    }
    return (result.length) ? result.join(' ') : null;
  }

  function getKubernetesResources(k8sDomain) {
    return _getKubernetesResources(k8sDomain.cpuRequest.value, k8sDomain.cpuLimit.value,
      k8sDomain.memoryRequest.value, k8sDomain.memoryLimit.value);
  }

  function getKubernetesResourcesForCluster(cluster) {
    return _getKubernetesResources(cluster.cpuRequest, cluster.cpuLimit, cluster.memoryRequest, cluster.memoryLimit);
  }

  function _getKubernetesResources(cpuRequest, cpuLimit, memoryRequest, memoryLimit) {
    let foundValue = false;
    const resources = {
      limits: {},
      requests: {}
    };

    if (cpuRequest) {
      resources.requests.cpu = cpuRequest;
      foundValue = true;
    }
    if (cpuLimit) {
      resources.limits.cpu = cpuLimit;
      foundValue = true;
    }
    if (memoryRequest) {
      resources.requests.memory = memoryRequest;
      foundValue = true;
    }
    if (memoryLimit) {
      resources.limits.memory = memoryLimit;
      foundValue = true;
    }

    return foundValue ? resources : null;
  }

  function _getClusterName(domainUid, clusterName) {
    return `${domainUid}-${clusterName.replaceAll('_', '-')}`;
  }

  return K8sDomainV9ResourceGenerator;
});
