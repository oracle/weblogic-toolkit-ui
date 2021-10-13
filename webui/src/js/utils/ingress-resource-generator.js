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
                ingressRouteData = this.createVoyagerRoutesAsYaml(route, this.project);
                break;

              case 'traefik':
                ingressRouteData = this.createTraefikRoutesAsYaml(route, this.project);
                break;

              case 'nginx':
                ingressRouteData = this.createNginxRoutesAsYaml(route, this.project);
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

      createVoyagerRoutesAsYaml(item, wktProject) {
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
        this.addTlsSpec(result, item, wktProject);
        this.addVirtualHost(result, item);
        this.addAnnotations(result, item);
        return jsYaml.dump(result);
      }

      createNginxRoutesAsYaml(item, wktProject) {
        return this._createStandardRoutesAsYaml(item, wktProject);
      }

      createTraefikRoutesAsYaml(item, wktProject) {
        return this._createStandardRoutesAsYaml(item, wktProject);
      }

      _createStandardRoutesAsYaml(item, wktProject) {
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
        this.addTlsSpec(result, item, wktProject);
        this.addVirtualHost(result, item);
        this.addAnnotations(result, item);
        return jsYaml.dump(result);
      }

      addTlsSpec(result, item, wktProject) {
        if (item && item['tlsEnabled'] === true) {
          if (!item['tlsSecretName']) {
            item['tlsSecretName'] = wktProject.ingress.ingressTLSSecretName.value;
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
