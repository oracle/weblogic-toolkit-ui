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
const { after, before, beforeEach, describe, it } = require('mocha');
const requirejs = require('requirejs');
const testHelper = require('./test-helper');

describe('image-design-view', function () {
  const accUtilsStub = new AccUtilsStub();
  let ImageViewModel;
  let ko;
  let project;
  let i18next;
  let dialogHelper;

  let viewModel;

  before(function (done) {
    testHelper.install();
    requirejs(['utils/i18n', 'models/wkt-project', 'viewModels/image-design-view-impl', 'knockout', 'utils/dialog-helper'],
      function (i18n, loadedProject, viewModelConstructor, knockout, dialogHelperObj) {
        i18next = i18n;
        project = loadedProject;
        ImageViewModel = viewModelConstructor;
        ko = knockout;
        dialogHelper = dialogHelperObj;
        done();
      });
  });

  after(function() {
    testHelper.remove();
  });

  beforeEach(function () {
    viewModel = new ImageViewModel(i18next, project, accUtilsStub, ko, dialogHelper, ArrayDataProviderStub);
  });

  describe('when connected() is called', function () {
    it('should announce that it was loaded', function () {
      viewModel.connected();

      expect(accUtilsStub.announcement).to.equal('Image Design View page loaded.');
      expect(accUtilsStub.level).to.equal('assertive');
    });
  });
});
