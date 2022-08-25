/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-domain-configmap-generator', 'js-yaml', 'utils/i18n', 'utils/wkt-logger'],
  function(project, K8sDomainConfigMapGenerator, jsYaml, i18n) {
    class K8sDomainResourceGenerator {
      constructor() {
        this.project = project;
        this.k8sConfigMapGenerator = new K8sDomainConfigMapGenerator();
      }

      generate() {
        const domainResource = {
          apiVersion: 'weblogic.oracle/v8',
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

        if (this.project.k8sDomain.domainHome.value) {
          domainResource.spec.domainHome = this.project.k8sDomain.domainHome.value;
        }

        if (usingAuxImage()) {
          domainResource.spec.auxiliaryImageVolumes = [
            {
              name: `${domainResource.spec.domainUID}-aux-image-volume`,
              mountPath: '/auxiliary'
            }
          ];
        }

        if (this.project.settings.targetDomainLocation.value === 'pv') {
          if (this.project.k8sDomain.domainPersistentVolumeLogHomeEnabled.value) {
            domainResource.spec.logHomeEnabled = true;
            domainResource.spec.logHome = this.project.k8sDomain.domainPersistentVolumeLogHome.value;
          }
        }

        const serverPod = this._getServerPod();
        if (serverPod) {
          domainResource.spec.serverPod = serverPod;
        }

        const wdtRelatedPaths = this._getWdtRelatedPaths(domainResource);
        if (usingAuxImage()) {
          const volumeName = domainResource.spec.auxiliaryImageVolumes[0].name;
          const command = getAuxImageCopyCommand(wdtRelatedPaths);
          const auxiliaryImage = {
            image: this.project.image.auxImageTag.value,
            command: command,
            volume: volumeName
          };
          if (this.project.k8sDomain.auxImagePullPolicy.hasValue()) {
            auxiliaryImage.imagePullPolicy = this.project.k8sDomain.auxImagePullPolicy.value;
          }
          serverPod.auxiliaryImages = [ auxiliaryImage ];
        }

        if (this.project.k8sDomain.clusters.value.length === 0) {
          domainResource.spec.replicas = this.project.k8sDomain.replicas.value;
        } else {
          const specClusters = [];
          for (const cluster of this.project.k8sDomain.clusters.value) {
            const specCluster = { clusterName: cluster.name };
            if (cluster.replicas !== undefined && cluster.replicas !== null) {
              specCluster.replicas = cluster.replicas;
            }
            const clusterServerPod = getServerPodForCluster(cluster);
            if (clusterServerPod) {
              specCluster.serverPod = clusterServerPod;
            }
            specClusters.push(specCluster);
          }
          if (specClusters.length > 0) {
            domainResource.spec.clusters = specClusters;
          }
        }

        const imagePullSecrets = [];
        if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value && this.project.k8sDomain.imageRegistryPullSecretName.value) {
          imagePullSecrets.push({ name: this.project.k8sDomain.imageRegistryPullSecretName.value });
        }
        if (usingAuxImage()) {
          if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value && this.project.k8sDomain.auxImageRegistryPullSecretName.value) {
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
          domainResource.spec.configuration = { };
          domainResource.spec.configuration.model = {
            domainType: this.project.k8sDomain.domainType.value,
            runtimeEncryptionSecret: this.project.k8sDomain.runtimeSecretName.value
          };

          if (usingAuxImage()) {
            const mountPoint = domainResource.spec.auxiliaryImageVolumes[0].mountPath;
            // Always set these since WKO aux image support makes these required
            domainResource.spec.configuration.model.wdtInstallHome =
              window.api.path.join(mountPoint, wdtRelatedPaths.targetWdtHomeDirName);
            domainResource.spec.configuration.model.modelHome =
              window.api.path.join(mountPoint, wdtRelatedPaths.targetModelHomeDirName);
          } else {
            // Only set these if they are specified; otherwise, rely on the default values
            if (wdtRelatedPaths.wdtHome) {
              domainResource.spec.configuration.model.wdtHome = wdtRelatedPaths.wdtHome;
            }
            if (wdtRelatedPaths.modelHome) {
              domainResource.spec.configuration.model.modelHome = wdtRelatedPaths.modelHome;
            }
          }

          if (this.k8sConfigMapGenerator.shouldCreateConfigMap()) {
            domainResource.spec.configuration.model.configMap = this.project.k8sDomain.modelConfigMapName.value;
          }

          if (this.project.k8sDomain.secrets.value.length > 0) {
            domainResource.spec.configuration.secrets = [];
            for (const secret of this.project.k8sDomain.secrets.value) {
              domainResource.spec.configuration.secrets.push(secret.name);
            }
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
        return jsYaml.dump(domainResource, {}).split('\n');
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

      _getWdtRelatedPaths() {
        let result;

        if (this.project.settings.targetDomainLocation.value === 'mii') {

          result = { };
          if (usingAuxImage()) {
            const wdtHome = this.project.image.wdtHomePath.value;
            const modelHome = this.project.image.modelHomePath.value;
            result.targetWdtHomeDirName = 'weblogic-deploy';
            result.sourceWdtHome = window.api.path.join(wdtHome, result.targetWdtHomeDirName);
            result.sourceModelHome = modelHome;
            result.targetModelHomeDirName = window.api.path.basename(modelHome);
          } else {
            // Only set these if they are not the default
            if (this.project.image.wdtHomePath.hasValue()) {
              result.wdtHome = this.project.image.wdtHomePath.value;
            }
            if (this.project.image.modelHomePath.hasValue()) {
              result.modelHome = this.project.image.modelHomePath.value;
            }
          }
        }
        return result;
      }
    }

    function usingAuxImage() {
      return project.settings.targetDomainLocation.value === 'mii' && project.image.useAuxImage.value;
    }

    function getAuxImageCopyCommand(wdtRelatedPaths) {
      const auxImageInternalTarget = '$AUXILIARY_IMAGE_TARGET_PATH';

      return `cp -R ${wdtRelatedPaths.sourceWdtHome} ${auxImageInternalTarget}; cp -R ${wdtRelatedPaths.sourceModelHome} ${auxImageInternalTarget}`;
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

      const affinity = _getAffinityForServerPod(100);
      if (affinity) {
        serverPod.affinity = affinity;
      }

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

    function _getAffinityForServerPod(weight) {
      return {
        podAntiAffinity: {
          preferredDuringSchedulingIgnoredDuringExecution: [{
            weight: weight,
            podAffinityTerm: {
              topologyKey: 'kubernetes.io/hostname',
              labelSelector: {
                matchExpressions: [{
                  key: 'weblogic.clusterName',
                  operator: 'In',
                  values: ['$(CLUSTER_NAME)']
                }]
              }
            }
          }]
        }
      };
    }

    return K8sDomainResourceGenerator;
  }
);
