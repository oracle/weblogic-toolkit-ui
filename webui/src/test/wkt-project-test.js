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

describe('wkt-project', function () {
  let project;
  let ko;

  before(function (done) {
    testHelper.install();
    requirejs(['knockout', 'models/wkt-project'],
      function (knockout, module) {
        ko = knockout;
        project = module;
        project.updateModels = () => {
        };
        done();
      });
  });

  after(function() {
    testHelper.remove();
  });

  function clearProject() {
    project.setFromJson({}, {});
  }

  it('provides a function for the uuid', function() {
    project.setProjectUuid('12345');

    const getter = project.getProjectUuid;

    expect(getter()).to.equal('12345');
  });

  describe('wkt project', function() {
    it('is not dirty when created', function() {
      clearProject();

      expect(project.isDirty()).to.be.false;
    });

    it('is changed when a property changed', function() {
      clearProject();
      project.wdtModel.modelFiles.value = ['a new file'];

      expect(project.isDirty()).to.be.true;
    });

    it('is no longer changed after marked not changed', function() {
      clearProject();
      project.wdtModel.modelFiles.value = ['a new file'];

      project.setNotDirty();

      expect(project.isDirty()).to.be.false;
    });
  });

  describe('wdt model properties', function () {

    beforeEach(function () {
      clearProject();
    });

    const PROJECT_DATA = {
      name: 'foo',
      uuid: '88888888-4444-4444-4444-123456789abc',
      credentialPaths: [],
      model: {
        modelFiles: ['wdt-model2.yaml'],
        propertiesFiles: ['wdt-variables.properties'],
        archiveFiles: ['wdt-archive.zip']
      }
    };

    const WDT_CONTENTS = {
      models: {'wdt-model2.yaml': 'MODEL2_CONTENTS', 'wdt-model3.yaml': 'age: 3\r\ncolor: "red"'},
      properties: {'wdt-variables.properties': {a: 'A', b: 'B', c: 'C'}},
      archives: {'wdt-archive.zip': {dir: {file1:'contents1', file2:'contents2'}}}
    };

    it('has a wdt model property', function () {
      expect(project.wdtModel).to.be.a('object');
    });

    it('can load the wdt contents', function () {
      project.setFromJson(PROJECT_DATA, WDT_CONTENTS);

      expect(project.wdtModel.modelFiles.value).to.eql(['wdt-model2.yaml']);
      expect(project.wdtModel.propertiesFiles.value).to.eql(['wdt-variables.properties']);
      expect(project.wdtModel.archiveFiles.value).to.eql(['wdt-archive.zip']);

      expect(project.wdtModel.modelProperties()).to.eql({a: 'A', b: 'B', c: 'C'});
      expect(project.wdtModel.archiveRoots().length).to.eql(1);
      expect(project.wdtModel.archiveRoots()[0].children()[0]).to.eql({title:'file1',id:'dir/file1'});
      expect(project.wdtModel.archiveRoots()[0].children()[1]).to.eql({title:'file2',id:'dir/file2'});
    });

    it('after data loaded, can return the wdt model data', function() {
      project.setFromJson(PROJECT_DATA, WDT_CONTENTS);

      expect(project.getProjectContents()).to.eql(PROJECT_DATA);
      expect(project.wdtModel.getModelContents()['models']['wdt-model2.yaml']).to.equal('MODEL2_CONTENTS');
    });

    it('after wdt content updated, can retrieve it', function() {
      project.setFromJson(PROJECT_DATA, WDT_CONTENTS);

      project.wdtModel.modelContent('new content');

      expect(project.wdtModel.getModelContents()['models']['wdt-model2.yaml']).to.equal('new content');
    });

    it('serializes the model data', function () {
      project.wdtModel.modelFiles.value = ['wdt-model2.yaml'];
      project.wdtModel.propertiesFiles.value = ['wdt-variables.properties'];
      project.wdtModel.archiveFiles.value = ['wdt-archive.zip'];

      const data = project.getProjectContents();

      expect(data.model.modelFiles).to.eql(['wdt-model2.yaml']);
      expect(data.model.propertiesFiles).to.eql(['wdt-variables.properties']);
      expect(data.model.archiveFiles).to.eql(['wdt-archive.zip']);
    });

    it ('assign default model file names for save if not set', function() {
      project.wdtModel.modelContent('# empty model');
      project.wdtModel.getModelPropertiesObject().value = [{Name: 'a', Value: 'A'}, {Name: 'b', Value: 'B'}];

      project.setProjectName('abc');
      const defaultModelFileName = 'abc-models/model.yaml';
      const defaultPropertiesFileName = 'abc-models/variables.properties';

      const projectContent = project.getProjectContents();
      expect(projectContent.model.modelFiles.length).to.equal(1);
      expect(projectContent.model.modelFiles[0]).to.equal(defaultModelFileName);

      expect(projectContent.model.propertiesFiles.length).to.equal(1);
      expect(projectContent.model.propertiesFiles[0]).to.equal(defaultPropertiesFileName);

      const modelContent = project.wdtModel.getModelContents();
      expect(Object.keys(modelContent.models).length).to.equal(1);
      expect(Object.keys(modelContent.models)[0]).to.equal(defaultModelFileName);

      expect(Object.keys(modelContent.properties).length).to.equal(1);
      expect(Object.keys(modelContent.properties)[0]).to.equal(defaultPropertiesFileName);
    });

    it ('don\'t save files if there\'s no content', function() {
      // clearProject didn't work on these, see test below
      project.wdtModel.modelContent('');
      project.wdtModel.getModelPropertiesObject().value = [];
      project.setProjectName('abc');

      const projectContent = project.getProjectContents();
      expect(projectContent.models).to.equal(undefined);

      const modelContent = project.wdtModel.getModelContents();
      expect(Object.keys(modelContent.models).length).to.equal(0);
      expect(Object.keys(modelContent.properties).length).to.equal(0);
    });

    it ('setting empty content should clear project', function() {
      // add more as detected
      project.wdtModel.modelContent('# empty model');
      project.wdtModel.getModelPropertiesObject().value = [{Name: 'a', Value: 'A'}, {Name: 'b', Value: 'B'}];

      project.setFromJson({}, {});

      expect(project.wdtModel.modelContent()).to.equal('');

      const properties = project.wdtModel.getModelPropertiesObject().value;
      expect(properties).to.eql([]);
    });
  });

  describe('image properties', function () {

    beforeEach(function () {
      clearProject();
    });

    it('has an image property', function () {
      expect(project.image).to.be.a('object');
    });

    it('has default values for the image data', function () {
      expect(project.image.baseImage.value).to.equal('');
      expect(project.image.jdkInstaller.value).to.equal('');
      expect(project.image.oracleInstaller.value).to.equal('');
      expect(project.image.oraclePatchesToApply.value).to.have.members([]);
    });

    it('can load the image data', function () {
      const project_data = {
        image: {
          baseImage: 'other-linux-image',
          jdkInstaller: 'jdk.tar.gz',
          oracleInstaller: 'wls11.zip',
          oraclePatchesToApply: '123, 456',
          targetDomainType: 'WLS'
        }
      };
      project.setFromJson(project_data, {});

      expect(project.image.baseImage.observable()).to.equal('other-linux-image');
      expect(project.image.jdkInstaller.observable()).to.equal('jdk.tar.gz');
      expect(project.image.oracleInstaller.observable()).to.equal('wls11.zip');
      expect(project.image.oraclePatchesToApply.observable()).to.equal('123, 456');
      expect(project.image.targetDomainType.observable()).to.equal('WLS');
    });

    it('on load, sets unspecified image data to defaults', function () {
      project.image.baseImage.observable('overwrite-this');

      project.setFromJson({image: {jdkInstaller: 'something'}}, {});

      expect(project.image.baseImage.observable()).to.equal('');
    });

    it('serializes the specified image data', function () {
      project.image.baseImage.observable('oracle-linux');
      project.image.oraclePatchesToApply.observable('abc');

      const data = project.getProjectContents();

      expect(data.image.baseImage).to.equal('oracle-linux');
      expect(data.image.oraclePatchesToApply).to.eql(['abc']);
    });

    it('records the defined credential fields', function () {
      project.image.baseImagePullUsername.value = 'me';
      project.image.baseImagePullPassword.value = 'do not tell';

      const data = project.getProjectContents();

      expect(data.credentialPaths).to.include.members(['image.baseImagePullUsername', 'image.baseImagePullPassword']);
    });

    it('does not serialize image data that matches the defaults', function () {
      project.image.baseImage.observable('');
      project.image.jdkInstaller.observable('jdk');

      const data = project.getProjectContents();

      expect(data.image.baseImage).to.equal(undefined);
      expect(data.image.jdkInstaller).to.equal('jdk');
    });

    it('does not serialize image data if all values are defaulted', function () {
      const data = project.getProjectContents();

      expect(data).to.not.have.property('image');
    });
  });

  describe('kubectl properties', function () {

    beforeEach(function () {
      clearProject();
    });

    it('has a kubectl property', function () {
      expect(project.kubectl).to.be.a('object');
    });

    it('has default values for the kubectl data', function () {
      expect(project.kubectl.k8sFlavor.value).to.equal('OKE');
      expect(project.kubectl.kubeConfig.value).to.eql(['fake-kube-config']);
      expect(project.kubectl.executableFilePath.value).to.equal('/fake/kubectl');
      expect(project.kubectl.kubeConfigContextToUse.value).to.equal('');
      expect(project.kubectl.helmExecutableFilePath.observable()).to.equal('/helm/file');
    });

    it('can load the kubectl data', function () {
      const project_data = {
        kubectl: {
          k8sFlavor: 'local',
          kubeConfig: 'my-config'
        }
      };
      project.setFromJson(project_data, {});

      expect(project.kubectl.k8sFlavor.observable()).to.equal('local');
      expect(project.kubectl.kubeConfig.observable()).to.equal('my-config');
    });

    it('on load, sets unspecified kubectl data to defaults', function () {
      project.kubectl.k8sFlavor.observable('overwrite-this');

      project.setFromJson({kubectl: {kubeConfig: 'something'}}, {});

      expect(project.kubectl.k8sFlavor.observable()).to.equal('OKE');
    });

    it('serializes the specified kubectl data', function () {
      project.kubectl.k8sFlavor.observable('local');

      const data = project.getProjectContents();

      expect(data.kubectl.k8sFlavor).to.equal('local');
    });

    it('does not serialize kubectl data that matches the defaults', function () {
      project.kubectl.k8sFlavor.observable('OKE');
      project.kubectl.kubeConfig.observable('my-config');

      const data = project.getProjectContents();

      expect(data.kubectl.k8sFlavor).to.equal(undefined);
      expect(data.kubectl.kubeConfig).to.eql(['my-config']);
    });

    it('does not serialize kubectl data if all values are defaulted', function () {
      const data = project.getProjectContents();

      expect(data).to.not.have.property('kubectl');
    });
  });

  describe('wko properties', function () {

    beforeEach(function () {
      clearProject();
    });

    it('has a wko property', function () {
      expect(project.wko).to.be.a('object');
    });

    it('has default values for the wko data', function () {
      expect(project.wko.k8sNamespace.observable()).to.equal('weblogic-operator-ns');
      expect(project.wko.k8sServiceAccount.observable()).to.equal('weblogic-operator-sa');
    });

    it('can load the wko data', function () {
      const project_data = {
        wko: {
          k8sNamespace: 'my-operator',
          operatorImage: 'my-image'
        }
      };
      project.setFromJson(project_data, {});

      expect(project.wko.k8sNamespace.observable()).to.equal('my-operator');
      expect(project.wko.operatorImage.observable()).to.equal('my-image');
    });
  });
});
