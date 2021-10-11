/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';
const expect = require('chai').expect;
const {after, before, beforeEach, describe, it} = require('mocha');

const requirejs = require('requirejs');
const testHelper = require('./test-helper');

describe('wdt model properties', function () {
  let WdtModel;
  let wdtModel;
  let utils;
  let ko;

  function getContents() {
    const json = {};
    wdtModel.writeTo(json);
    return json;
  }

  function domainPrefix() {
    return 'base-domain';
  }

  before(function (done) {
    testHelper.install();
    requirejs(['models/wdt-model-definition', 'utils/observable-properties', 'knockout'],
      function (constructor, observableUtils, knockout) {
        WdtModel = constructor;
        utils = observableUtils;
        ko = knockout;
        done();
      });
  });

  after(function() {
    testHelper.remove();
  });

  beforeEach(function () {
    wdtModel = new WdtModel('model');
  })

  const PROJECT_DATA = {
    model: {
      modelFiles: ['wdt-model.yaml'],
      propertiesFiles: ['wdt-variables.properties'],
      archiveFiles: ['wdt-archive.zip']
    }
  };

  const WDT_CONTENTS = {
    models: {'wdt-model.yaml': 'MODEL_CONTENTS'},
    properties: {'wdt-variables.properties': {a: 'A', b: 'B', c: 'C'}},
    archives: {'wdt-archive.zip': {dir: {file1:'contents1', file2:'contents2'}}}
  }

  it('has default values for the wdt model data', function () {
    expect(wdtModel.modelFiles.value).to.eql([]);
    expect(wdtModel.propertiesFiles.value).to.eql([]);
    expect(wdtModel.archiveFiles.value).to.eql([]);
    expect(ko.isObservable(wdtModel.modelContent)).to.be.true;
    expect(wdtModel.modelContent()).to.equal('');
    expect(wdtModel.modelProperties()).to.eql({});
  })

  function load(projectData, wdtContents) {
    wdtModel.readFrom(projectData);
    wdtModel.setModelContents(wdtContents);
  }

  it('can load the wdt model data', function () {
    load(PROJECT_DATA, WDT_CONTENTS);

    expect(wdtModel.modelFiles.value).to.eql(['wdt-model.yaml']);
    expect(wdtModel.propertiesFiles.value).to.eql(['wdt-variables.properties']);
    expect(wdtModel.archiveFiles.value).to.eql(['wdt-archive.zip']);
    expect(wdtModel.modelContent()).to.equal('MODEL_CONTENTS');
    expect(wdtModel.modelProperties()).to.eql({a: 'A', b: 'B', c: 'C'});
  })

  it('can create an editable observable for the properties', function() {
    load(PROJECT_DATA, WDT_CONTENTS);

    const result = wdtModel.getModelPropertiesObject().value;
    expect(result).to.eql([{"Name":"a","Value":"A",uid: 0,"Override":undefined},{"Name":"b","Value":"B", uid: 1,"Override":undefined},
      {"Name":"c","Value":"C", uid: 2,"Override":undefined}]);
  });

  it('serializes the model data', function () {
    wdtModel.modelFiles.value = ['wdt-model.yaml'];
    wdtModel.propertiesFiles.value = ['wdt-variables.properties'];
    wdtModel.archiveFiles.value = ['wdt-archive.zip'];

    const data = {};
    wdtModel.writeTo(data);

    expect(data.model.modelFiles).to.eql(['wdt-model.yaml']);
    expect(data.model.propertiesFiles).to.eql(['wdt-variables.properties']);
    expect(data.model.archiveFiles).to.eql(['wdt-archive.zip']);
  })

  it ('a model file name containing spaces should be allowed', function() {
    const modelFileName = 'wdt-model 2.yaml';
    const modelJson = {'models':{[modelFileName]:'# empty model'}};
    wdtModel.setModelFiles(modelJson);
    const modelFiles = wdtModel.modelFiles.value;

    expect(modelFiles.length).to.equal(1);
    expect(modelFiles[0]).to.equal(modelFileName);
  });

  it ('when no model contents are available, getModelTextFor returns undefined value', function() {
    wdtModel.setModelContents({});

    expect(wdtModel.getModelTextFor('file2')).to.be.undefined;
  })

  it ('when getModelTextFor called for a non-existent model, return undefined', function() {
    wdtModel.setModelContents({models: {file1: 'value1'}});

    expect(wdtModel.getModelTextFor('file2')).to.be.undefined;
  })

  it ('after properties updated, retrieve to persist', function() {
    load(PROJECT_DATA, WDT_CONTENTS);

    wdtModel.getModelPropertiesObject().value = [{"Name":"a","Value":"Alpha"},{"Name":"b","Value":"Beta"},{"Name":"c","Value":"Gamma"}];

    expect (wdtModel.getPropertyFileContents()).to.eql(
      {'wdt-variables.properties': {a: 'Alpha', b: 'Beta', c: 'Gamma'}}
    )
  })

  it ('when no file specified, property file contents is undefined', function() {
    wdtModel.getModelPropertiesObject().value = [{"Name":"a","Value":"Alpha"},{"Name":"b","Value":"Beta"},{"Name":"c","Value":"Gamma"}];

    expect (wdtModel.getPropertyFileContents()).to.be.empty

  })

  it ('parse the domain name from model content', function() {
    wdtModel.modelContent('topology:\n  Name: myDomain\n');

    expect(wdtModel.domainName()).to.equal('myDomain');
  });

  it ('domain name should not be changed if model can\'t be parsed', function() {
    wdtModel.modelContent('topology:\n  Name: myDomain\n');
    wdtModel.modelContent('  topology:\nName: newDomain\n');

    expect(wdtModel.domainName()).to.equal('myDomain');
  });

})

