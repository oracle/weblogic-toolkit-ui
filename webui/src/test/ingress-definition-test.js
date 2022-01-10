/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

const chai = require('chai');
const expect = chai.expect;
const wkt_assertions = require('./wkt-assertions');
chai.use(wkt_assertions);

const { after, before, beforeEach, describe, it } = require('mocha');
const requirejs = require('requirejs');
const testHelper = require('./test-helper');
const jsyaml = require('js-yaml');
const {WindowStub} = require('./window-stub');

describe('ingress-definition', function () {
  let ingressResource;

  const voyagerIngress = {'name': 'Route1', 'virtualHost' : 'domain1.org',
    'targetServiceNameSpace' : 'domain1-ns', 'targetService' : 'domain1-cluster-cluster-1', 'targetPort' : '8109',
    'path': '/myapp', 'ssl' : false };

  const traefikIngress = {
    'name': 'console',
    'targetServiceNameSpace': 'sample-domain1-ns',
    'targetService': 'sample-domain1-admin-server',
    'targetPort': 7002,
    'path': '/console',
    'annotations': {
      'kubernetes.io/ingress.class': 'traefik',
      'traefik.ingress.kubernetes.io/router.tls': 'true'
    },
    'tlsOption': 'ssl_terminate_ingress',
    'isConsoleService': true
  };


  const nginxIngress = {
    'name': 'console',
    'targetServiceNameSpace': 'sample-domain1-ns',
    'targetService': 'sample-domain1-admin-server',
    'targetPort': 7001,
    'path': '/console',
    'annotations': {
      'kubernetes.io/ingress.class': 'nginx'
    },
    'tlsOption': 'ssl_terminate_ingress',
    'isConsoleService': true
  };

  before(function (done) {
    testHelper.install();
    WindowStub.install();
    requirejs(['utils/ingress-resource-generator'],
      function (IngressResourceGenerator) {
        ingressResource = new IngressResourceGenerator();
        done();
      });
  });

  beforeEach(function () {
    WindowStub.initialize();
  });

  after(function() {
    testHelper.remove();
    WindowStub.remove();
  });

  describe('generate', function() {
    it('generate voyager ingress', function () {
      const yaml = ingressResource.createVoyagerRoutesAsYaml(voyagerIngress);
      const json = jsyaml.load(yaml);
      expect(json['apiVersion']).to.equal('voyager.appscode.com/v1beta1');
    });

    it('generate nginx ingress', function () {
      const yaml = ingressResource.createNginxRoutesAsYaml(nginxIngress);
      const json = jsyaml.load(yaml);
      const expectedAnnotation = 'more_clear_input_headers "WL-Proxy-Client-IP" "WL-Proxy-SSL";\n' +
        'more_set_input_headers "X-Forwarded-Proto: https";\n' +
        'more_set_input_headers "WL-Proxy-SSL: true";\n';

      expect(json.metadata.annotations['nginx.ingress.kubernetes.io/configuration-snippet']).to.equal(expectedAnnotation);
      expect(json['apiVersion']).to.equal('networking.k8s.io/v1');
    });

    it('generate traefik ingress', function () {
      const yaml = ingressResource.createTraefikRoutesAsYaml(traefikIngress);
      const expectedYaml = 'apiVersion: traefik.containo.us/v1alpha1\n' +
        'kind: Middleware\n' +
        'metadata:\n' +
        '  name: console-middleware\n' +
        '  namespace: sample-domain1-ns\n' +
        '  labels:\n' +
        '    createdByWtkUIVersion: 1.1.0\n' +
        'spec:\n' +
        '  headers:\n' +
        '    sslRedirect: true\n' +
        '    customRequestHeaders:\n' +
        '      X-Custom-Request-Header: \'\'\n' +
        '      X-Forwarded-For: \'\'\n' +
        '      WL-Proxy-Client-IP: \'\'\n' +
        '      WL-Proxy-SSL: \'true\'\n' +
        '\n' +
        '---\n' +
        'apiVersion: traefik.containo.us/v1alpha1\n' +
        'kind: IngressRoute\n' +
        'metadata:\n' +
        '  name: console\n' +
        '  namespace: sample-domain1-ns\n' +
        '  annotations:\n' +
        '    kubernetes.io/ingress.class: traefik\n' +
        '    traefik.ingress.kubernetes.io/router.tls: \'true\'\n' +
        'spec:\n' +
        '  routes:\n' +
        '    - kind: Rule\n' +
        '      match: PathPrefix(`/console`)\n' +
        '      services:\n' +
        '        - kind: Service\n' +
        '          name: sample-domain1-admin-server\n' +
        '          port: 7002\n' +
        '      middlewares:\n' +
        '        - name: console-middleware\n';

      expect(yaml).to.equal(expectedYaml);
    });
  });
});

