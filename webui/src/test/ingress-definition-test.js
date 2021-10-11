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

const {after, before, beforeEach, describe, it} = require('mocha');

const requirejs = require('requirejs');
const testHelper = require('./test-helper');
const jsyaml = require('js-yaml');

describe('ingress-definition', function () {
  let IngressDefn;
  let ingress;
  let props;
  let settings;
  let wdtModel;
  let utils;
  let jsonQuery;
  let propertyNames;
  let ko;
  let ingressResource;

  function getContents() {
    const json = {};
    ingress.writeTo(json);
    return json;
  }

  const voyagerIngress = {'name': 'Route1', 'virtualHost' : 'domain1.org',
    'targetServiceNameSpace' : 'domain1-ns', 'targetService' : 'domain1-cluster-cluster-1', 'targetPort' : '8109',
    'path': '/myapp', 'ssl' : false };

  const genericIngress = {'name': 'Route1', 'virtualHost' : 'domain1.org',
    'targetServiceNameSpace' : 'domain1-ns', 'targetService' : 'domain1-cluster-cluster-1', 'targetPort' : '8109',
    'path': '/myapp', 'ssl' : true, 'tlsSecretName': 'mytls' };

  before(function (done) {
    testHelper.install();
    requirejs(['models/ingress-definition', 'knockout', 'utils/observable-properties', 'utils/common-utilities', 'utils/ingress-resource-generator', 'json-query'],
      function (constructor, knockout, observableUtils, generalUtils, IngressResourceGenerator, jq) {
        IngressDefn = constructor;
        ko = knockout;
        props = observableUtils;
        utils = generalUtils;
        ingressResource = new IngressResourceGenerator();
        jsonQuery = jq;
        propertyNames = props.createArrayProperty();
        done();
      });
  });

  after(function() {
    testHelper.remove();
  });

  beforeEach(function () {
    ingress = new IngressDefn();
  });

  describe('generate', function() {

    it('generate voyager ingress', function () {
      const yaml = ingressResource.createVoyagerRoutesAsYaml(voyagerIngress);
      const json = jsyaml.load(yaml);
      expect(json['apiVersion']).to.equal('voyager.appscode.com/v1beta1');
    });

    // it('generate nginx ingress', function () {
    //   const yaml = ingress.createNginxRoutesAsYaml(genericIngress);
    //   console.log(yaml);
    //   //expect(json['apiVersion']).to.equal('voyager.appscode.com/v1beta1');
    // });
  });



});

