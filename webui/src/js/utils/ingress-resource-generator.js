/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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
        const version = window.api.process.getVersion();
        const result = {
          apiVersion: 'voyager.appscode.com/v1beta1',
          kind: 'Ingress',
          metadata: {
            name: item['name'],
            namespace: namespace,
            labels: { createdByWtkUIVersion: version}
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
        const namespace = item['targetServiceNameSpace'] || 'default';
        const version = window.api.process.getVersion();
        let path = item['path'];
        if (this.isSSLPassThrough(item)) {
          path = '/';
        }

        const result = {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'Ingress',
          metadata: {
            name: item['name'],
            namespace: namespace,
            labels: { createdByWtkUIVersion: version}
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
                      path: path,
                      pathType: 'Prefix'
                    }
                  ]
                }
              }
            ]
          }
        };
        // No need to set TLS if passthrough
        if (!this.isSSLPassThrough(item)) {
          this.addTlsSpec(result, item);
        }

        this.addVirtualHost(result, item);

        if (this.isSSLTerminateAtIngress(item)) {
          if (!('annotations' in item)) {
            item['annotations'] = {};
          }
          // must have nl at the end
          item.annotations['nginx.ingress.kubernetes.io/configuration-snippet'] = 'more_clear_input_headers' +
              ' "WL-Proxy-Client-IP" "WL-Proxy-SSL";\n'
              + 'more_set_input_headers "X-Forwarded-Proto: https";\n'
              + 'more_set_input_headers "WL-Proxy-SSL: true";\n';
          item.annotations['nginx.ingress.kubernetes.io/ingress.allow-http'] = 'false';
        }

        this.addAnnotations(result, item);
        return jsYaml.dump(result);
      }

      isSSLTerminateAtIngress(item) {
        return (item && item['tlsOption'] === 'ssl_terminate_ingress');
      }

      isSSLPassThrough(item) {
        return (item && item['tlsOption'] === 'ssl_passthrough');
      }

      isPlainHTTP(item) {
        return (item && item['tlsOption'] === 'plain');
      }

      createTraefikMiddlewaresAsYaml(item) {

        const namespace = item['targetServiceNameSpace'] || 'default';
        const version = window.api.process.getVersion();

        const result = {
          apiVersion: 'traefik.containo.us/v1alpha1',
          kind: 'Middleware',
          metadata: {
            name: item['name'] + '-middleware',
            namespace: namespace,
            labels: { createdByWtkUIVersion: version}
          }
        };

        if (this.isSSLTerminateAtIngress(item)) {
          if (item['isConsoleService']) {
            result.spec = {
              headers: {
                sslRedirect: true,
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
            result.spec = { replacePathRegex: { regex: '^' + item['path'] + '(.*)', replacement: item['path'] + '/$1'}};
            return jsYaml.dump(result);
          }

        }

      }

      createTraefikRoutesAsYaml(item) {

        let ingressTraefikMiddlewares = this.createTraefikMiddlewaresAsYaml(item);
        let useMiddlewares = false;
        if (ingressTraefikMiddlewares) {
          useMiddlewares = true;
        }

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
        if (this.isSSLTerminateAtIngress(item)) {
          // Set user provided tls cert if provided, otherwise use whatever is set up during user install
          if (!item['tlsSecretName'] && this.project.ingress.specifyIngressTLSSecret.value) {
            item['tlsSecretName'] = this.project.ingress.ingressTLSSecretName.value;
            result.spec.tls = { secretName: item['tlsSecretName'] };
          }
        }
        // SSL passthrough
        if (this.isSSLPassThrough(item)) {
          const obj = { passthrough: true };
          result.spec.tls =  obj;

          // passthrough is a different kind!
          result.kind = 'IngressRouteTCP';
          delete result.spec.routes[0].kind;
          delete result.spec.routes[0].services[0].kind;

          // Set HostSNI
          if (item && item['virtualHost']) {
            result.spec.routes[0].match = 'HostSNI(`' + item['virtualHost'] + '`)';
          }
        }

        if (useMiddlewares) {
          result.spec.routes[0].middlewares = [ {name: item['name'] + '-middleware'} ];
        }

        this.addAnnotations(result, item);

        let yaml = '';
        if (ingressTraefikMiddlewares) {
          yaml = ingressTraefikMiddlewares;
          yaml += '\n---\n';
        }
        yaml += jsYaml.dump(result);
        return yaml;
      }

      addTlsSpec(result, item) {
        // If the Ingress TLS secret is not enabled, do not add the ingress TLS secret name even if it exists.
        if (this.project.ingress.specifyIngressTLSSecret.value && !this.isPlainHTTP(item)) {
          if (!item['tlsSecretName']) {
            item['tlsSecretName'] = this.project.ingress.ingressTLSSecretName.value;
          }

          const obj = { secretName: item['tlsSecretName'] };
          if (item['virtualHost']) {
            obj['hosts'] = [ item['virtualHost'] ];
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
