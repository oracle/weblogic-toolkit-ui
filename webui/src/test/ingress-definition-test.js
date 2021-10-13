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

const { after, before, describe, it } = require('mocha');
const requirejs = require('requirejs');
const testHelper = require('./test-helper');
const jsyaml = require('js-yaml');

describe('ingress-definition', function () {
  let ingressResource;

  const voyagerIngress = {'name': 'Route1', 'virtualHost' : 'domain1.org',
    'targetServiceNameSpace' : 'domain1-ns', 'targetService' : 'domain1-cluster-cluster-1', 'targetPort' : '8109',
    'path': '/myapp', 'ssl' : false };

  const genericIngress = {'name': 'Route1', 'virtualHost' : 'domain1.org',
    'targetServiceNameSpace' : 'domain1-ns', 'targetService' : 'domain1-cluster-cluster-1', 'targetPort' : '8109',
    'path': '/myapp', 'ssl' : true, 'tlsSecretName': 'mytls' };

  before(function (done) {
    testHelper.install();
    requirejs(['utils/ingress-resource-generator'],
      function (IngressResourceGenerator) {
        ingressResource = new IngressResourceGenerator();
        done();
      });
  });

  after(function() {
    testHelper.remove();
  });

  describe('generate', function() {
    it('generate voyager ingress', function () {
      const yaml = ingressResource.createVoyagerRoutesAsYaml(voyagerIngress);
      const json = jsyaml.load(yaml);
      expect(json['apiVersion']).to.equal('voyager.appscode.com/v1beta1');
    });

    it('generate nginx ingress', function () {
      const yaml = ingressResource.createNginxRoutesAsYaml(genericIngress);
      const json = jsyaml.load(yaml);
      expect(json['apiVersion']).to.equal('networking.k8s.io/v1');
    });

    it('generate traefik ingress', function () {
      const yaml = ingressResource.createTraefikRoutesAsYaml(genericIngress);
      const json = jsyaml.load(yaml);
      expect(json['apiVersion']).to.equal('networking.k8s.io/v1');
    });
  });
});

