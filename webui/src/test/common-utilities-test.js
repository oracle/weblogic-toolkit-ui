/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

const expect = require('chai').expect;
const { after, before, describe, it } = require('mocha');
const requirejs = require('requirejs');
const testHelper = require('./test-helper');

describe('general utilities', function () {
  let utils;

  before(function (done) {
    testHelper.install();
    requirejs(['utils/common-utilities'],
      function (equality_utils) {
        utils = equality_utils;
        done();
      });
  });

  after(function() {
    testHelper.remove();
  });

  describe('equality', function() {
    it('returns false when comparing different types', function () {
      expect(utils.equals(null, undefined)).to.equal(false);
      expect(utils.equals(1, 'a string')).to.equal(false);
      expect(utils.equals([1, 2, 3], {one: 'value'})).to.equal(false);
    });
  
    it('returns true when comparing equal scalars', function () {
      expect(utils.equals(undefined, undefined)).to.equal(true);
      expect(utils.equals(1, 8 - 7)).to.equal(true);
      expect(utils.equals(true, true)).to.equal(true);
    });
  
    it('returns false when comparing unequal scalars', function () {
      expect(utils.equals(true, false)).to.equal(false);
      expect(utils.equals('abcd', 'xyz')).to.equal(false);
      expect(utils.equals(1, 5)).to.equal(false);
    });
  
    it('returns false when comparing unequal objects', function () {
      expect(utils.equals({first: 1, second: 'both'}, {first: 1, second: 'neither'})).to.equal(false);
      expect(utils.equals({first: 1, second: 'both'}, {second: 'both', first: 1, third: null})).to.equal(false);
      expect(utils.equals({first: {nest: 1}, second: 'both'}, {second: 'both', first: [1]})).to.equal(false);
    });
  
    it('returns true when comparing equal objects', function () {
      expect(utils.equals({first: 1, second: 'both'}, {first: 1, second: 'both'})).to.equal(true);
      expect(utils.equals({first: 1, second: 'both'}, {second: 'both', first: 1})).to.equal(true);
      expect(utils.equals({first: {nest: 1}, second: 'both'}, {second: 'both', first: {nest: 1}})).to.equal(true);
    });
  
    it('returns true when comparing unequal arrays', function () {
      expect(utils.equals([1, 2, 3], [3, 1, 2])).to.equal(false);
      expect(utils.equals([{age: 12, height: 50}], [{age: 12, height: 60}])).to.equal(false);
    });
  
    it('returns true when comparing equal arrays', function () {
      expect(utils.equals([1, 2, 3], [1, 2, 3])).to.equal(true);
      expect(utils.equals([{age: 12, height: 50}], [{age: 12, height: 50}])).to.equal(true);
    });
  });
  
  // Kubernetes uses a modified version of the DNS-1123 standard.
  describe('Kubernetes names', function() {
    it ('recognizes legal Kubernetes names', function() {
      expect(utils.isLegalK8sName('aa')).to.be.true;
      expect(utils.isLegalK8sName('aa-bb-cc')).to.be.true;
      expect(utils.isLegalK8sName('aa12-b3')).to.be.true;
    });
    
    it ('recognizes illegal Kubernetes names', function() {
      expect(utils.isLegalK8sName(7)).to.be.false;
      expect(utils.isLegalK8sName('Aa')).to.be.false;
      expect(utils.isLegalK8sName('aa_bb-cc')).to.be.false;
      expect(utils.isLegalK8sName('aa12.b3')).to.be.false;
      expect(utils.isLegalK8sName('-aa')).to.be.false;
      expect(utils.isLegalK8sName('aa-')).to.be.false;
      expect(utils.isLegalK8sName('aa-bb-cc-dd-ee-ff-gg-hh-ii-jj-kk-ll-mm-nn-oo-pp-qq-rr-ss-tt-uu-vv-ww-xx-yy-zz')).to.be.false;
    });

    it ('does not change legal Kubernetes names', function() {
      expect(utils.toLegalK8sName('aa')).to.equal('aa');
      expect(utils.toLegalK8sName('aa-bb-cc')).to.equal('aa-bb-cc');
      expect(utils.toLegalK8sName('aa12-b3')).to.equal('aa12-b3');
    });

    it ('converts illegal to legal names', function() {
      expect(utils.toLegalK8sName('AA')).to.equal('aa');
      expect(utils.toLegalK8sName('aa_bb-cc')).to.equal('aa-bb-cc');
      expect(utils.toLegalK8sName('aa12.b3')).to.equal('aa12-b3');
      expect(utils.toLegalK8sName('aa12$b3')).to.equal('aa12-b3');
      expect(utils.toLegalK8sName('--aa')).to.equal('aa');
      expect(utils.toLegalK8sName('aa--')).to.equal('aa');
      expect(utils.toLegalK8sName('aa-bb-cc-dd-ee-ff-gg-hh-ii-jj-kk-ll-mm-nn-oo-pp-qq-rr-ss-tt-uu-vv-ww-xx-yy-zz'))
        .to.equal('aa-bb-cc-dd-ee-ff-gg-hh-ii-jj-kk-ll-mm-nn-oo-pp-qq-rr-ss-tt-uu-');
    });
  });
});
