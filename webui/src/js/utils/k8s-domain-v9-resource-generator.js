/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-domain-configmap-generator', 'js-yaml', 'utils/i18n', 'utils/wkt-logger'],
  function(project, K8sDomainConfigMapGenerator, jsYaml, i18n) {
    const WDT_DIR_NAME = 'weblogic-deploy';

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

        if (this.project.k8sDomain.domainHome.value) {
          domainResource.spec.domainHome = this.project.k8sDomain.domainHome.value;
        }

        if (this.project.settings.targetDomainLocation.value === 'pv') {
          if (this.project.k8sDomain.domainPersistentVolumeLogHomeEnabled.value) {
            domainResource.spec.logHomeEnabled = true;
            domainResource.spec.logHome = this.project.k8sDomain.domainPersistentVolumeLogHome.value;
          }
        }

        const serverPod = this._getDomainServerPod();
        if (serverPod) {
          domainResource.spec.serverPod = serverPod;
        }

        if (this.project.settings.targetDomainLocation.value === 'mii') {
          const wdtRelatedPaths = this._getWdtRelatedPaths(domainResource);

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
        }

        if (this.project.k8sDomain.clusters.value.length === 0) {
          domainResource.spec.replicas = this.project.k8sDomain.replicas.value;
        } else {
          domainResource.spec.clusters = this.project.k8sDomain.clusters.value.map(cluster => {
            return { name: _getClusterName(this.project.k8sDomain.uid.value, cluster.name) };
          });
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
          domainResource.spec.configuration.model.domainType = this.project.k8sDomain.domainType.value;
          domainResource.spec.configuration.model.runtimeEncryptionSecret = this.project.k8sDomain.runtimeSecretName.value;

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
                clusterName: cluster.name,
                serverPod: getServerPodForCluster(cluster),
              },
            };

            if (typeof cluster.replicas === 'number') {
              clusterResource.spec.replicas = cluster.replicas;
            }

            clusterResources.push(clusterResource);
          }
        }

        let result;
        if (generateYaml) {
          result = jsYaml.dump(domainResource, {}).split('\n');
          for (const clusterResource of clusterResources) {
            result.push('', '---', '');
            result.push(...jsYaml.dump(clusterResource, {}).split('\n'));
          }
        } else {
          result = { domainResource };

          if (clusterResources.length > 0) {
            result.clusters = clusterResources;
          }
        }

        return result;
      }

      _getDomainServerPod() {
        let serverPod = this._getServerPod();

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

      _getWdtRelatedPaths() {
        let result;
        if (this.project.settings.targetDomainLocation.value === 'mii') {
          result = { };

          // WKO 4.0+ has different behavior and parameters than 3.x
          //
          let wdtInstallHome = this.project.image.wdtHomePath.value;
          if (!wdtInstallHome.endsWith(WDT_DIR_NAME)) {
            wdtInstallHome = window.api.path.join(wdtInstallHome, WDT_DIR_NAME);
          }
          if (usingAuxImage()) {
            if (usingExistingAuxImage()) {
              // If the source fields are exposed in the UI, use the values from those fields.
              //
              if (this.project.k8sDomain.auxImageSourceWDTInstallHome.hasValue()) {
                result.sourceWDTInstallHome = this.project.k8sDomain.auxImageSourceWDTInstallHome.value;
              }
              if (this.project.k8sDomain.auxImageSourceModelHome.hasValue()) {
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
                  values: ['$(CLUSTER_NAME)'],
                }],
              },
            },
          }],
        },
      };
    }

    function _getClusterName(domainUid, clusterName) {
      return `${domainUid}-${clusterName.replaceAll('_', '-')}`;
    }

    return K8sDomainV9ResourceGenerator;
  }
);
