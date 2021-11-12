/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'js-yaml'],
  function(project, jsYaml) {
    class IngressResourceGenerator {
      constructor() {
        this.project = project;
      }

      generate() {
        const lines = [];
        if (this.project.ingress.ingressRoutes.value.length > 0) {
          let ingressRouteData = {};
          for (const route of this.project.ingress.ingressRoutes.value) {
            switch (this.project.ingress.ingressControllerProvider.value) {
              case 'voyager':
                ingressRouteData = this.createVoyagerRoutesAsYaml(route);
                break;

              case 'traefik':
                ingressRouteData = this.createTraefikRoutesAsYaml(route);
                break;

              case 'nginx':
                ingressRouteData = this.createNginxRoutesAsYaml(route);
                break;
            }
            lines.push(ingressRouteData, '');
            lines.push('---');
          }
          // remove the trailing YAML separator
          lines.pop();
        }
        return lines;
      }

      createVoyagerRoutesAsYaml(item) {
        const namespace = item['targetServiceNameSpace'] || 'default';

        const result = {
          apiVersion: 'voyager.appscode.com/v1beta1',
          kind: 'Ingress',
          metadata: {
            name: item['name'],
            namespace: namespace,
          },
          spec: {
            rules: [
              {
                http: {
                  paths: [
                    {
                      backend: {
                        serviceName: item['targetService'],
                        servicePort: Number(item['targetPort'])
                      },
                      path: item['path']
                    }
                  ]
                }
              }
            ]
          }
        };
        this.addTlsSpec(result, item);
        this.addVirtualHost(result, item);
        this.addAnnotations(result, item);
        return jsYaml.dump(result);
      }

      createNginxRoutesAsYaml(item) {
        return this._createStandardRoutesAsYaml(item);
      }

      createTraefikRoutesAsYaml(item) {
        return this._createStandardRoutesAsYaml(item);
      }

      _createStandardRoutesAsYaml(item) {
        const namespace = item['targetServiceNameSpace'] || 'default';

        const result = {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'Ingress',
          metadata: {
            name: item['name'],
            namespace: namespace,
          },
          spec: {
            rules: [
              {
                http: {
                  paths: [
                    {
                      backend: {
                        service : {
                          name: item['targetService'],
                          port: {
                            number: Number(item['targetPort'])
                          }
                        }
                      },
                      path: item['path'],
                      pathType: 'Prefix'
                    }
                  ]
                }
              }
            ]
          }
        };
        this.addTlsSpec(result, item);
        this.addVirtualHost(result, item);
        this.addAnnotations(result, item);
        return jsYaml.dump(result);
      }

      addTlsSpec(result, item) {
        // If the Ingress TLS secret is not enabled, do not add the ingress TLS secret name even if it exists.
        if (this.project.ingress.specifyIngressTLSSecret.value && item && item['tlsEnabled'] === true) {
          if (!item['tlsSecretName']) {
            item['tlsSecretName'] = this.project.ingress.ingressTLSSecretName.value;
          }

          const obj = { secretName: item['tlsSecretName'] };
          if (item['virtualHost']) {
            obj['hosts'] = item['virtualHost'];
          }
          result.spec.tls = [ obj ];
        }
      }

      addVirtualHost(result, item) {
        if (item && item['virtualHost']) {
          result.spec.rules[0].host = item['virtualHost'];
        }
      }

      addAnnotations(result, item) {
        if (item && item['annotations'] && Object.keys(item['annotations']).length > 0) {
          result.metadata.annotations = item['annotations'];
        }
      }

    }

    return IngressResourceGenerator;
  }
);
