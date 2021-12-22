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
                let ingressTraefikMiddlewares = this.createTraefikMiddlewaresAsYaml(route);
                let useMiddlewares = false;
                if (ingressTraefikMiddlewares) {
                  lines.push(ingressTraefikMiddlewares, '');
                  lines.push('---');
                  useMiddlewares = true;
                }
                ingressRouteData = this.createTraefikRoutesAsYaml(route, useMiddlewares);
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

      isTraefikSSLTerminateAtIngress(item) {
        if (item && item['tlsOption'] === 'ssl_terminate_ingress') {
          return true;
        } else {
          return false;
        }
      }

      isTraefikSSLPassThrough(item) {
        if (item && item['tlsOption'] === 'ssl_passthrough') {
          return true;
        } else {
          return false;
        }
      }

      isTraefikPlain(item) {
        if (item && item['tlsOption'] === 'plain') {
          return true;
        } else {
          return false;
        }
      }

      createTraefikMiddlewaresAsYaml(item) {

        const namespace = item['targetServiceNameSpace'] || 'default';

        const result = {
          apiVersion: 'traefik.containo.us/v1alpha1',
          kind: 'Middleware',
          metadata: {
            name: item['name'] + '-middleware',
            namespace: namespace,
          }
        };

        if (this.isTraefikSSLTerminateAtIngress(item)) {
          if (item['isConsoleService'].includes('yes')) {
            console.log('at tthere');
            result.spec = {
              sslRedirct: true,
              headers: {
                customRequestHeaders: {
                  'X-Custom-Request-Header': '',
                  'X-Forwarded-For': '',
                  'WL-Proxy-Client-IP': '',
                  'WL-Proxy-SSL': 'true'
                }
              }
            };

            return jsYaml.dump(result);
          }

          if (item['path'].indexOf('.') < 0) {
            console.log('at here');
            result.spec = { replacePathRegex: { regex: '^' + item['path'] + '(.*)'}, replacement: item['path'] + '/$1'};
            return jsYaml.dump(result);
          }

        }

      }

      createTraefikRoutesAsYaml(item, useMiddlewares) {
        const namespace = item['targetServiceNameSpace'] || 'default';

        const result = {
          apiVersion: 'traefik.containo.us/v1alpha1',
          kind: 'IngressRoute',
          metadata: {
            name: item['name'],
            namespace: namespace,
          },
          spec: {
            routes: [
              {
                kind: 'Rule',
                match: {},
                services: [{
                  kind: 'Service',
                  name: item['targetService'],
                  port: Number(item['targetPort'])
                }]
              }
            ]
          }
        };

        let matchExpression = '';

        if (item && item['path']) {
          matchExpression += 'PathPrefix(`' + item['path'] + '`)';
        }

        if (item['virtualHost']) {
          if (matchExpression !== '') {
            matchExpression += ' && ';
          }
          matchExpression += 'Host(`' + item['virtualHost'] + '`)';
        }

        result.spec.routes[0].match = matchExpression;

        // if SSL terminate at ingress
        if (this.project.ingress.specifyIngressTLSSecret.value && this.isTraefikSSLTerminateAtIngress(item)) {
          if (!item['tlsSecretName']) {
            item['tlsSecretName'] = this.project.ingress.ingressTLSSecretName.value;
          }
          result.spec.tls = { secretName: item['tlsSecretName'] };
        }
        // SSL passthrough
        console.log(item);
        if (this.project.ingress.specifyIngressTLSSecret.value && this.isTraefikSSLPassThrough(item)) {
          const obj = { passthrough: true };
          result.spec.tls = [ obj ];

          // Set HostSNI
          if (item && item['virtualHost']) {
            result.spec.routes[0].match = 'HostSNI(`' + item['virtualHost'] + '`)';
          }
        }

        if (useMiddlewares) {
          result.spec.routes[0].middleware = item['name'] + '-middleware';
        }

        this.addAnnotations(result, item);
        return jsYaml.dump(result);
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
        if (this.project.ingress.specifyIngressTLSSecret.value && !this.isTraefikPlain(item)) {
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
