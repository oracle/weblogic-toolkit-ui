/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

const { AccUtilsStub, ArrayDataProviderStub } = require('./view-stubs');
const expect = require('chai').expect;
const { after, before, beforeEach, describe, it, xit } = require('mocha');
const requirejs = require('requirejs');
const testHelper = require('./test-helper');

describe('model-page', function () {
  const accUtilsStub = new AccUtilsStub();

  let ModelPageImpl;
  let ko;
  let i18next;
  let viewModel;

  before(function (done) {
    testHelper.install();
    requirejs(['viewModels/model-page-impl', 'knockout', 'utils/i18n'],
      function (viewModelConstructor, knockout, i18n) {
        ModelPageImpl = viewModelConstructor;
        ko = knockout;
        i18next = i18n;
        done();
      });
  });

  after(function() {
    testHelper.remove();
  });

  const args = {
    parentRouter: {
      createChildRouter: function() {
        return {
          sync: function() {},
          go: function() {}
        };
      }
    }
  };

  function ModuleRouterAdapterStub() {
  }

  beforeEach(function () {
    viewModel = new ModelPageImpl(args, accUtilsStub, ko, i18next, ModuleRouterAdapterStub, ArrayDataProviderStub);
  });

  function getEntry(array, key, value) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][key] === value) return array[i];
    }
    return undefined;
  }

  function entry(array, key, value) {
    return getEntry(array, key, value);
  }

  it('the initial selection is the code view', function () {
    expect(viewModel.selectedItem()).to.equal('model-code-view');
  });

  xit('offers view choices choices', function () {
    const navData = viewModel.dataProvider.data;
    expect(entry(navData, 'path', 'model-design-view')).to.have.property('label', 'page-design-view');
    expect(entry(navData, 'path', 'model-code-view')).to.have.property('label', 'page-code-view');
  });
});
