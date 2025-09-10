/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/vz-helper', 'js-yaml', 'utils/i18n', 'utils/wkt-logger'],
  function(project, VerrazzanoHelper, jsYaml) {
    class VerrazzanoApplicationResourceGenerator {
      constructor() {
        this.project = project;
        this._vzHelper = undefined;
      }

      generate() {
        const isMultiCluster = this.project.vzApplication.useMultiClusterApplication.value;
        let appSpec = this._generateApplicationSpec(isMultiCluster);

        if (isMultiCluster) {
          const template = Object.assign({}, appSpec);
          appSpec = {
            apiVersion: this._getMultiClusterApplicationApiVersion(),
            kind: 'MultiClusterApplicationConfiguration',
            metadata: { },
            spec: {
              template,
              placement: {
                clusters: []
              },
            },
          };

          this._setNameAndNamespace(appSpec.metadata);

          for (const clusterName of this.project.vzApplication.placementClusters.value) {
            appSpec.spec.placement.clusters.push({ name: clusterName });
          }

          if (this.project.vzApplication.secrets.value.length > 0) {
            appSpec.spec.secrets = [ ...this.project.vzApplication.secrets.value ];
          }
        }
        return jsYaml.dump(appSpec).split('\n');
      }

      _generateApplicationSpec(isMultiCluster) {
        const appSpec = {
          apiVersion: this._getApplicationApiVersion(),
          kind: 'ApplicationConfiguration',
          metadata: { },
          spec: {
            components: [ ]
          }
        };

        if (isMultiCluster) {
          delete appSpec.apiVersion;
          delete appSpec.kind;
        } else {
          this._setNameAndNamespace(appSpec.metadata);
        }

        this._addAnnotations(appSpec.metadata);
        if (Object.keys(appSpec.metadata).length === 0) {
          delete appSpec.metadata;
        }

        this.project.vzApplication.components.value.forEach(component => {
          this._addComponent(appSpec.spec.components, component);
        });

        return appSpec;
      }

      _setNameAndNamespace(metadata) {
        if (this.project.vzApplication.applicationName.value) {
          metadata.name = this.project.vzApplication.applicationName.value;
        }
        if (this.project.k8sDomain.kubernetesNamespace.value) {
          metadata.namespace = this.project.k8sDomain.kubernetesNamespace.value;
        }
      }

      _addAnnotations(metadata) {
        if (this.project.vzApplication.applicationVersion.value) {
          if (!metadata.annotations) {
            metadata.annotations = {};
          }
          metadata.annotations.version = this.project.vzApplication.applicationVersion.value;
        }

        if (this.project.vzApplication.applicationDescription.value) {
          if (!metadata.annotations) {
            metadata.annotations = {};
          }
          metadata.annotations.description = this.project.vzApplication.applicationDescription.value;
        }
      }

      _addComponent(componentsList, componentObject) {
        const component = {
          componentName: componentObject.name,
        };

        const traits = [];
        this._addIngressTrait(componentObject, traits);
        this._addLoggingTrait(componentObject, traits);
        this._addManualScalerTrait(componentObject, traits);
        this._addMetricsTrait(componentObject, traits);

        if (traits.length > 0) {
          component.traits = traits;
        }
        componentsList.push(component);
      }

      _addIngressTrait(component, traits) {
        if (component.ingressTraitEnabled) {
          const ingressTrait = {
            apiVersion: this._getIngressTraitApiVersion(),
            kind: 'IngressTrait',
            spec: {
              rules: [],
            },
          };

          if (component.ingressTraitSecretName) {
            ingressTrait.spec.tls = {
              secretName: component.ingressTraitSecretName,
            };
          }

          if (Array.isArray(component.ingressTraitRules)) {
            for (const ingressTraitRule of component.ingressTraitRules) {
              const rule = { };

              if (typeof ingressTraitRule.hosts === 'string' && ingressTraitRule.hosts.length > 0) {
                rule.hosts = ingressTraitRule.hosts.split(',').map(host => host.trim());
              } else if (Array.isArray(ingressTraitRule.hosts) && ingressTraitRule.hosts.length > 0) {
                rule.hosts = ingressTraitRule.hosts;
              }

              if (Array.isArray(ingressTraitRule.paths) && ingressTraitRule.paths.length > 0) {
                rule.paths = ingressTraitRule.paths.map(path => {
                  const newPath = Object.assign({}, path);
                  delete newPath.uid;
                  return newPath;
                });
              }

              const destination = this._getIngressTraitRuleDestination(ingressTraitRule);
              if (destination) {
                rule.destination = destination;
              }

              if (Object.keys(rule).length > 0) {
                ingressTrait.spec.rules.push(rule);
              }
            }
          }

          traits.push({trait: ingressTrait });
        }
      }

      _addLoggingTrait(component, traits) {
        if (component.loggingTraitEnabled) {
          const loggingTrait = {
            apiVersion: this._getLoggingTraitApiVersion(),
            kind: 'LoggingTrait',
            spec: { },
          };

          if (component.loggingTraitImage) {
            loggingTrait.spec.loggingImage = component.loggingTraitImage;
          }
          if (component.loggingTraitConfiguration) {
            loggingTrait.spec.loggingConfig = component.loggingTraitConfiguration;
          }

          traits.push({trait: loggingTrait});
        }
      }

      _addManualScalerTrait(component, traits) {
        if (component.manualScalerTraitEnabled) {
          const manualScalerTrait = {
            apiVersion: this._getManualScalerTraitApiVersion(),
            kind: 'ManualScalerTrait',
            spec: { },
          };

          if (component.manualScalerTraitReplicaCount) {
            manualScalerTrait.spec.replicaCount = component.manualScalerTraitReplicaCount;
          }

          traits.push({trait: manualScalerTrait});
        }
      }

      _addMetricsTrait(component, traits) {
        if (component.metricsTraitEnabled) {
          const metricsTrait = {
            apiVersion: this._getMetricsTraitApiVersion(),
            kind: 'MetricsTrait',
            spec: { },
          };

          if (component.metricsTraitHttpPort) {
            metricsTrait.spec.port = component.metricsTraitHttpPort;
          }
          if (component.metricsTraitHttpPath) {
            metricsTrait.spec.path = component.metricsTraitHttpPath;
          }
          if (component.metricsTraitSecretName) {
            metricsTrait.spec.secret = component.metricsTraitSecretName;
          }
          if (component.metricsTraitDeploymentName) {
            metricsTrait.spec.scaper = component.metricsTraitDeploymentName;
          }

          traits.push({trait: metricsTrait});
        }
      }

      _getIngressTraitRuleDestination(ingressTraitRule) {
        const destination = { };

        if (ingressTraitRule.destinationHost) {
          destination.host = ingressTraitRule.destinationHost;
        }
        if (ingressTraitRule.destinationPort) {
          destination.port = ingressTraitRule.destinationPort;
        }

        const httpCookie = { };
        if (ingressTraitRule.destinationHttpCookieName) {
          httpCookie.name = ingressTraitRule.destinationHttpCookieName;
        }
        if (ingressTraitRule.destinationHttpCookiePath) {
          httpCookie.path = ingressTraitRule.destinationHttpCookiePath;
        }
        if (ingressTraitRule.destinationHttpCookieTTL) {
          httpCookie.ttl = ingressTraitRule.destinationHttpCookieTTL;
        }
        if (Object.keys(httpCookie).length > 0) {
          destination.httpCookie = httpCookie;
        }

        if (Object.keys(destination).length === 0) {
          return undefined;
        }
        return destination;
      }

      _getMultiClusterApplicationApiVersion() {
        let result = '<UNKNOWN>';

        const vzHelper = this._getVerrazzanoHelper();
        if (vzHelper) {
          result = vzHelper.getMultiClusterApplicationApiVersion();
        }
        return result;
      }

      _getApplicationApiVersion() {
        let result = '<UNKNOWN>';

        const vzHelper = this._getVerrazzanoHelper();
        if (vzHelper) {
          result = vzHelper.getApplicationApiVersion();
        }
        return result;
      }

      _getIngressTraitApiVersion() {
        let result = '<UNKNOWN>';

        const vzHelper = this._getVerrazzanoHelper();
        if (vzHelper) {
          result = vzHelper.getIngressTraitApiVersion();
        }
        return result;
      }

      _getLoggingTraitApiVersion() {
        let result = '<UNKNOWN>';

        const vzHelper = this._getVerrazzanoHelper();
        if (vzHelper) {
          result = vzHelper.getLoggingTraitApiVersion();
        }
        return result;
      }

      _getManualScalerTraitApiVersion() {
        let result = '<UNKNOWN>';

        const vzHelper = this._getVerrazzanoHelper();
        if (vzHelper) {
          result = vzHelper.getManualScalerTraitApiVersion();
        }
        return result;
      }

      _getMetricsTraitApiVersion() {
        let result = '<UNKNOWN>';

        const vzHelper = this._getVerrazzanoHelper();
        if (vzHelper) {
          result = vzHelper.getMetricsTraitApiVersion();
        }
        return result;
      }

      _getVerrazzanoHelper() {
        if (!this._vzHelper) {
          const vzVersion = this.project.vzInstall.actualInstalledVersion.value;
          if (vzVersion) {
            this._vzHelper = new VerrazzanoHelper(vzVersion);
          }
        }
        return this._vzHelper;
      }
    }

    return VerrazzanoApplicationResourceGenerator;
  }
);
