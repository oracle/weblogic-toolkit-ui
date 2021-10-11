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
const {after, before, beforeEach, describe, it} = require('mocha');
const requirejs = require('requirejs');
const testHelper = require('./test-helper');

function PromiseTestSupport() {
  const self = this;
  this.executor = function(resolve, reject) {
    self.resolve = resolve;
    self.reject = reject;
  };

  this.doResolve = function(value) {
    this.resolve(value);
  };

  this.doReject = function(reason) {
    this.reject(reason);
  };
}

describe('observable-properties-support', function () {
  let utils;
  let ko;

  before(function (done) {
    testHelper.install();
    requirejs(['utils/observable-properties', 'knockout'], function (module, knockout) {
      utils = module;
      ko = knockout;
      done();
    });
  });

  after(function() {
    testHelper.remove();
  });

  describe('observable properties with undefined defaults', function () {
    it('initial value matches empty string', function () {
      const property = utils.createProperty();

      expect(property.observable()).to.equal('');
    });

    it('reports not being promise-based', function() {
      const property = utils.createProperty();

      expect(property.getPromise()).to.be.null;
    });

    it('value can be set', function () {
      const property = utils.createProperty();

      property.value = 'new value';

      expect(property.observable()).to.equal('new value');
    });

    it('initially is not changed', function () {
      const property = utils.createProperty();

      expect(property.hasValue()).to.equal(false);
    });

    it('after value set, is changed', function () {
      const property = utils.createProperty();

      property.value = 'change';

      expect(property.hasValue()).to.equal(true);
    });

    it('after value set and set to empty string, is not changed', function () {
      const property = utils.createProperty();

      property.value = 'change';
      property.value = '';

      expect(property.hasValue()).to.equal(false);
    });

    it('after value set may be cleared', function () {
      const property = utils.createProperty();
      property.observable('change');

      property.clear();

      expect(property.observable()).to.equal('');
      expect(property.hasValue()).to.equal(false);
    });

    it('returns numeric values unchanged', function () {
      const property = utils.createProperty();
      property.observable(7);

      expect(property.value).to.equal(7);
    });

    it('supports boolean defaults', function () {
      const property1 = utils.createProperty(true);
      const property2 = utils.createProperty(false);

      expect(property1.value).to.be.true;
      expect(property2.value).to.be.false;
    });

    it('returns unset string values as empty strings', function () {
      const property = utils.createProperty();

      expect(property.value).to.equal('');
    });

    it('returns string values trimmed', function () {
      const property = utils.createProperty();
      property.observable('   a value   ');

      expect(property.value).to.equal('a value');
    });

    it ('when asCredential invoked, property is marked as a credential', function() {
      const property1 = utils.createProperty();
      const property2 = utils.createProperty().asCredential();

      expect(property1.isCredential()).to.be.false;
      expect(property2.isCredential()).to.be.true;
    });

    it('default field access works', function() {
      const property = utils.createProperty('INFO');

      expect(property.default).to.equal('INFO');
    });
  });

  describe('observable properties with numeric default values', function() {
    it('create property with integer default has expected state', function() {
      const property = utils.createProperty(5);

      expect(property.value).to.equal(5);
      expect(property.observable()).to.equal(5);
      expect(property.persistedValue).to.be.undefined;
      expect(property.hasValue()).to.be.false;
    });

    it('change property with integer default to a new value has expected state', function() {
      const property = utils.createProperty(5);

      property.value = 10;

      expect(property.value).to.equal(10);
      expect(property.observable()).to.equal(10);
      expect(property.persistedValue).to.equal(10);
      expect(property.hasValue()).to.be.true;
    });

    it('change property with integer default to a null value has expected state', function() {
      const property = utils.createProperty(5);

      property.value = null;

      expect(property.value).to.equal(null);
      expect(property.observable()).to.equal(null);
      expect(property.persistedValue).to.equal(null);
      expect(property.hasValue()).to.be.true;
    });
  });

  describe('observable property persistence', function() {

    it('when value changed, value to persist matches it', function() {
      const property = utils.createProperty('original');
      property.observable('change');

      expect(property.persistedValue).to.equal('change');
    });

    it('when value equal to default, value to persist is undefined', function() {
      const property = utils.createProperty('zork');

      expect(property.persistedValue).to.be.undefined;
    });

    it('when value empty and not equal to default, value to persist is empty string', function() {
      const property = utils.createProperty('default');

      property.value = '';
      expect(property.persistedValue).to.equal('');
      expect(property.value).to.equal('');
      expect(property.observable()).to.equal('');
    });

    it('when value empty and not equal to default, is marked changed', function() {
      const property = utils.createProperty('default');

      property.value = '';
      expect(property.isChanged()).to.be.true;
    });

    it('when value empty and not equal to default, has a value', function() {
      const property = utils.createProperty('default');

      property.value = '';
      expect(property.hasValue()).to.be.true;
    });

    it('when value empty and not equal to default, persisted value is empty string', function() {
      const property = utils.createProperty('default');

      property.value = '';
      expect(property.persistedValue).to.equal('');
    });

    it('when value not yet persisted and equal to default, is not marked changed', function() {
      const property = utils.createProperty(17);

      expect(property.isChanged()).to.be.false;
    });

    it('when value set, is marked changed', function() {
      const property = utils.createProperty(17);

      property.value = 12;

      expect(property.isChanged()).to.be.true;
    });

    it('when persisted value set, is not marked changed', function() {
      const property = utils.createProperty(17);

      property.value = 12;
      property.persistedValue = 12;

      expect(property.isChanged()).to.be.false;
    });

    it('when setNotChanged called, is not marked changed', function() {
      const property = utils.createProperty(17);

      property.setNotChanged();

      expect(property.isChanged()).to.be.false;
    });
  });

  describe('observable properties with defined defaults', function () {
    it('initial value matches constant default', function () {
      const property = utils.createProperty('zork');

      expect(property.observable()).to.equal('zork');
    });

    it('converts null default to empty string', function() {
      const nullInitializer = function() { return null; }
      const property = utils.createProperty(nullInitializer());

      expect(property.observable()).to.equal('');
    });

    it('value can be set', function () {
      const property = utils.createProperty('zork');

      property.observable('new value');

      expect(property.observable()).to.equal('new value');
    });

    it('initially is not changed', function () {
      const property = utils.createProperty('zork');

      expect(property.hasValue()).to.equal(false);
    });

    it('after value set, is changed', function () {
      const property = utils.createProperty('zork');

      property.observable('change');

      expect(property.hasValue()).to.equal(true);
    });

    it('after value set and set to original value, is not changed', function () {
      const property = utils.createProperty('zork');

      property.observable('change');
      property.observable('zork');

      expect(property.hasValue()).to.equal(false);
    });

    it('after value set may be cleared', function () {
      const property = utils.createProperty('zork');
      property.observable('change');

      property.clear();

      expect(property.observable()).to.equal('zork');
      expect(property.hasValue()).to.equal(false);
    });
  });

  describe('deferred initialization properties', function () {
    function PropertySource() {
      this.computeInitialProperty = () => {
        return 'bad property';
      }
      this.getInitialProperty = () => {
        return this.computeInitialProperty();
      }
    }

    let propertySource;
    let property;

    beforeEach(function () {
      propertySource = new PropertySource();
      property = utils.createProperty(propertySource.getInitialProperty);
      propertySource.computeInitialProperty = () => {
        return 'good property';
      };
    });

    it('reports not being promise-based', function() {
      expect(property.getPromise()).to.be.null;
    });

    it('initial value matches constant default', function () {
      expect(property.observable()).to.equal('good property');
    });

    it('observable value can be set', function () {
      property.observable('new value');

      expect(property.observable()).to.equal('new value');
    });

    it('initially is not changed', function () {
      expect(property.hasValue()).to.equal(false);
    });

    it('after observable value set, is changed', function () {
      property.observable('change');

      expect(property.hasValue()).to.equal(true);
    });

    it('after observable value set and cleared, is not changed', function () {
      property.observable('change');
      property.observable('good property');

      expect(property.hasValue()).to.equal(false);
    });

    it('before observable set may be cleared without invoking initializer', function () {
      propertySource.computeInitialProperty = () => {
        throw new Error('initializer called');
      }

      property.clear();

      expect(property.hasValue()).to.equal(false);
    });
  });

  describe('deferred initialization properties with Promise', function () {
    function PropertySource() {
      this.computeInitialProperty = () => {
        throw new Error('not right');
      };
      this.getInitialProperty = () => {
        return this.computeInitialProperty();
      };
    }

    let propertySource;
    let property;
    let success = true;
    let promiseSupport = new PromiseTestSupport();

    beforeEach(function () {
      propertySource = new PropertySource();
      property = utils.createProperty(propertySource.getInitialProperty);
      propertySource.computeInitialProperty = () => {
        return new Promise(promiseSupport.executor);
      };
    });

    function resolvePromise() {
      promiseSupport.doResolve('good property');
    }

    it('returns the promise', function() {
      expect(property.getPromise()).to.not.be.null;
    });

    it('initial value matches constant default', function () {
      property.observable();
      resolvePromise();

      property.getPromise().then(() => {
        expect(property.observable()).to.equal('good property')
      });
    });

    it('value can be set', function () {
      property.observable('new value');

      expect(property.observable()).to.equal('new value');
    });

    it('initially is not changed', function () {
      expect(property.hasValue()).to.equal(false);
    });

    it('after value set, is changed', function () {
      property.observable('change');

      expect(property.hasValue()).to.equal(true);
    });

    it('after value set and cleared, is not changed once promise resolves', function () {
      property.observable('change');
      property.observable('good property');

      resolvePromise();

      property.getPromise().then(() => {
        expect(property.hasValue()).to.equal(false);
      });
    });

    it('before value set may be cleared without invoking initializer', function () {
      propertySource.computeInitialProperty = () => {
        throw new Error('initializer called');
      };

      property.clear();

      expect(property.hasValue()).to.equal(false);
    });
  });

  describe('properties that depend on substitution of other properties', function () {

    let property;
    let sourceProperty1;
    let sourceProperty2;
    let functionProperty;

    beforeEach(function () {
      sourceProperty1 = utils.createProperty('FOO');
      property = utils.createProperty('${1}-BAR', sourceProperty1.observable);
      sourceProperty2 = utils.createProperty('FOO');
      functionProperty = utils.createProperty((source) => {
        switch (source()) {
          case 'FOO':
            return 'FOO_BAR';

          case 'BAR':
            return 'BAR_FOO';

          default:
            return undefined;
        }
      }, sourceProperty2.observable);
    });

    it('function property reports expected default value', function() {
      expect(functionProperty.value).to.equal('FOO_BAR');
      expect(functionProperty.observable()).to.equal('FOO_BAR');
    });

    it('function property resetting value to non-function works', function() {
      functionProperty.value = 'NEW_VALUE';

      expect(functionProperty.persistedValue).to.equal('NEW_VALUE');
      expect(functionProperty.value).to.equal('NEW_VALUE');
      expect(functionProperty.observable()).to.equal('NEW_VALUE');
    });

    it('function property resetting value to empty string works', function() {
      functionProperty.value = '';

      expect(functionProperty.persistedValue).to.equal('');
      expect(functionProperty.value).to.equal('');
      expect(functionProperty.observable()).to.equal('');
    });

    it('reports not being promise-based', function() {
      expect(property.getPromise()).to.be.null;
    });

    it('initial value matches computed default', function () {
      expect(property.observable()).to.equal('FOO-BAR');
    });

    it('observable value can be set', function () {
      property.observable('new value');

      expect(property.observable()).to.equal('new value');
    });

    it('if not set, changes when source object changes', function () {
      property.value;

      sourceProperty1.observable('BAZ');

      expect(property.observable()).to.equal('BAZ-BAR');
    });

    it('initially is not changed', function () {
      expect(property.hasValue()).to.equal(false);
    });

    it('after observable value set, is changed', function () {
      property.observable('change');

      expect(property.hasValue()).to.equal(true);
    });

    it('after observable value set and deleted, has original value', function () {
      property.observable('change');
      property.value = null;

      expect(property.observable()).to.equal('FOO-BAR');
    });

    it('after observable value set and deleted, is not changed', function () {
      property.observable('change');
      property.value = null;

      expect(property.hasValue()).to.equal(false);
    });
  });


  describe('properties that depend on computation from other properties', function () {

    let property;
    let sourceProperty1;

    function lowerCase(observable) {
      return typeof observable === 'function' ? observable().toLowerCase() : '';
    }

    beforeEach(function () {
      sourceProperty1 = utils.createProperty('FOO');
      property = utils.createProperty(lowerCase, sourceProperty1.observable);
    });

    it('reports not being promise-based', function() {
      expect(property.getPromise()).to.be.null;
    });

    it('initial value matches computed default', function () {
      expect(property.observable()).to.equal('foo');
    });

    it('observable value can be set', function () {
      property.observable('new value');

      expect(property.observable()).to.equal('new value');
    });

    it('if not set, changes when source object changes', function () {
      property.value;

      sourceProperty1.observable('BAZ');

      expect(property.observable()).to.equal('baz');
    });

    it('initially is not changed', function () {
      expect(property.hasValue()).to.equal(false);
    });

    it('after observable value set, is changed', function () {
      property.observable('change');

      expect(property.hasValue()).to.equal(true);
    });

    it('after observable value set and deleted, has original value', function () {
      property.observable('change');
      property.value = null;

      expect(property.observable()).to.equal('foo');
    });

    it('after observable value set and deleted, is not changed', function () {
      property.observable('change');
      property.value = null;

      expect(property.hasValue()).to.equal(false);
    });

  });


  describe('array properties', function () {
    it('reports not being promise-based', function() {
      const property = utils.createArrayProperty();

      expect(property.getPromise()).to.be.null;
    });

    it('defaults to empty array', function () {
      const property = utils.createArrayProperty();

      expect(Array.isArray(property.value)).to.be.true;
      expect(property.value.length).to.equal(0);
    });

    it('rejects non-array initial value', function () {
      expect(() => utils.createArrayProperty(null)).to.throw();
      expect(() => utils.createArrayProperty(2)).to.throw();
      expect(() => utils.createArrayProperty(false)).to.throw();
      expect(() => utils.createArrayProperty('a value')).to.throw();
    });

    it('initial value matches constant default', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      expect(property.value).to.have.members(['foo', 'bar', 'baz']);
    });

    it('observable is read as space-separated strings', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      expect(property.observable()).to.equal('foo, bar, baz');
    });

    it('initially is not changed', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      expect(property.hasValue()).to.equal(false);
    });

    it('value can be set programmatically', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      property.value = ['first', 'second', 'third'];

      expect(property.value).to.have.members(['first', 'second', 'third']);
    });

    it('value can be set by UI', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      property.observable('first,second, third');

      expect(property.value).to.have.members(['first', 'second', 'third']);
    });

    it('after value set, is changed', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      property.observable('first,second, third');

      expect(property.hasValue()).to.equal(true);
    });

    it('after value set, observable value is updated', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      property.observable('first,   second, third\nfourth');

      expect(property.observable()).to.equal('first, second, third, fourth');
    });

    it('after value set and set to original value, is not changed', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      property.observable('first,second');
      property.observable('foo, bar, baz');

      expect(property.hasValue()).to.equal(false);
    });

    it('after value set may be cleared', function () {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);
      property.observable('first,second');

      property.clear();

      expect(property.value).to.have.members(['foo', 'bar', 'baz']);
      expect(property.hasValue()).to.equal(false);
    });

    it('returns string values trimmed', function () {
      const property = utils.createArrayProperty();
      property.observable('   first   ,  second ');

      expect(property.value).to.eql(['first', 'second']);
    });
  });

  describe('array property persistence', function() {
    let property;

    beforeEach(function() {
      property = utils.createArrayProperty(['foo', 'bar', 'baz']);
    });

    it('when value changed, value to persist matches it', function() {
      property.observable('first,second');

      expect(property.persistedValue).to.have.members(['first','second']);
    });

    it('when value equal to default, value to persist is null', function() {
      expect(property.persistedValue).to.be.undefined;
    });

    it('when value not yet persisted and equal to default, is not marked changed', function() {
      expect(property.isChanged()).to.be.false;
    });

    it('when value set, is marked changed', function() {
      property.value = ['first', 'second'];

      expect(property.isChanged()).to.be.true;
    });

    it('when persisted value set, is not marked changed', function() {
      property.value = ['first', 'second'];

      property.persistedValue = ['first', 'second'];

      expect(property.isChanged()).to.be.false;
    });

    it('when setNotChanged called, is not marked changed', function() {
      property.value = ['first', 'second'];

      property.setNotChanged();

      expect(property.isChanged()).to.be.false;
    });
  });

  describe('observable lists', function () {
    const INITIAL_DATA = [
      {name: 'George', age: '16', skill: 'Chess'},
      {name: 'Stuart', age: '16', skill: 'FORTRAN'},
      {name: 'Barry', age: '14', skill: 'Dogs'}
    ];

    let property;
    let property2;

    function createPropertyWithFields(defaultList) {
      return utils.createListProperty(['name', 'age', 'skill']).withDefaultValue(defaultList);
    }

    beforeEach(function () {
      property = createPropertyWithFields(INITIAL_DATA);
      property2 = createPropertyWithFields();
    });

    it('reports not being promise-based', function() {
      expect(property.getPromise()).to.be.null;
    });

    it('observable is an observable array', function () {
      expect(ko.isObservableArray(property.observable)).to.equal(true);
      expect(ko.isObservableArray(property2.observable)).to.equal(true);
    });

    it('looks to Oracle JET like an observable array', function () {
      expect(typeof property.observable).to.equal('function');
      expect(!!property.observable.subscribe).to.equal(true);
      expect(!(property.observable['destroyAll'] === undefined)).to.equal(true);
    });

    it('initially is not changed', function () {
      expect(property.hasValue()).to.equal(false);
      expect(property2.hasValue()).to.equal(false);
    });

    it('initializes each named field', function () {
      property.observable().forEach((item, index) => {
        expect(ko.isObservable(item['name'])).to.equal(false, `name is ${typeof item['name']}`);
        expect(ko.isObservable(item['age'])).to.equal(false, `age is ${typeof item['age']}`);
        expect(ko.isObservable(item['skill'])).to.equal(false, `skill is ${typeof item['skill']}`);
        expect(item['name']).to.equal(INITIAL_DATA[index].name);
        expect(item['age']).to.equal(INITIAL_DATA[index].age);
        expect(item['skill']).to.equal(INITIAL_DATA[index].skill);
      });
    });

    it('ignores non-key fields', function() {
      const newProperty = utils.createListProperty(['name', 'age']).withDefaultValue(INITIAL_DATA);
      newProperty.observable().forEach((item) => {
        expect(item['skill']).to.be.undefined;
      });
    });

    it('ignore empty fields in result', function() {
      const PARTIAL_DATA = [
        {name: 'George', age: '16', skill: ''},
        {name: 'Stuart', age: '', skill: ''},
        {name: 'Barry', age: '14', skill: 'Dogs'}
      ];

      const EXPECTED_RESULT = [
        {name: 'George', age: '16'},
        {name: 'Stuart'},
        {name: 'Barry', age: '14', skill: 'Dogs'}
      ];

      const newProperty = utils.createListProperty(['name', 'age', 'skill']).withDefaultValue(PARTIAL_DATA).ignoringEmptyFields();

      expect(newProperty.value).to.eql(EXPECTED_RESULT);
    });

    it('rejects non-array initial value', function () {
      expect(() => createPropertyWithFields(null)).to.throw();
      expect(() => createPropertyWithFields(1)).to.throw();
      expect(() => createPropertyWithFields(false)).to.throw();
      expect(() => createPropertyWithFields('string')).to.throw();
      expect(() => createPropertyWithFields({})).to.throw();
    });

    it('can add item', function () {
      property.addNewItem();

      const item = property.observable()[3];

      expect(item).to.not.be.undefined;
    });

    it('when item added, values are undefined', function () {
      property.addNewItem();

      const item = property.observable()[3];

      expect(item['name']).to.be.undefined;
      expect(item['age']).to.be.undefined;
      expect(item['skill']).to.be.undefined;
    });

    it('when item added with initial values, use them', function () {
      property.addNewItem({name: 'George'});

      const item = property.observable()[3];

      expect(item['name']).to.equal('George');
    });

    it('can return initial value', function () {
      expect(property2.value).to.eql([]);
      expect(property.value).to.eql(INITIAL_DATA);
    });

    it('can load value programmatically', function () {
      const newData = [
        {name: 'David', age: '20', skill: 'Writing'},
        {name: 'Mark', age: '22', skill: 'Heroism'}
      ];

      property.value = newData;

      expect(property.value).to.eql(newData);
    });

    it('is changed after updating an observable', function () {
      property.observable()[1]['skill'] = 'Hockey';

      expect(property.hasValue()).to.equal(true);
    });

    it('is changed after adding a row', function () {
      property2.addNewItem();
      property2.observable()[0]['name'] = 'Jeffrey';
      property2.observable()[0]['age'] = '21';
      property2.observable()[0]['skill'] = 'Parcheesi';

      const expectedValue = [{name: 'Jeffrey', age: '21', skill: 'Parcheesi'}];
      expect(property2.value).to.eql(expectedValue);
      expect(property2.hasValue()).to.equal(true);
    });

    it('can delete a selected row', function () {
      property.observable()[1].remove();

      const expectedValue = [
        {name: 'George', age: '16', skill: 'Chess'},
        {name: 'Barry', age: '14', skill: 'Dogs'}
      ];

      expect(property.value).to.eql(expectedValue);
      expect(property.hasValue()).to.equal(true);
    });

    it('ignores completely empty rows', function () {
      property.observable()[1]['name'] = '';
      property.observable()[1]['age'] = '';
      property.observable()[1]['skill'] = '';

      const expectedValue = [
        {name: 'George', age: '16', skill: 'Chess'},
        {name: 'Barry', age: '14', skill: 'Dogs'}
      ];

      expect(property.value).to.eql(expectedValue);
    });

    it('after value set may be cleared', function () {
      property.value = [
        {name: 'David', age: '20', skill: 'Writing'},
        {name: 'Mark', age: '22', skill: 'Heroism'}
      ];
      property.clear();

      expect(property.value).to.eql(INITIAL_DATA);
      expect(property.hasValue()).to.equal(false);
    });
  });

  describe('list property array persistence', function() {
    const INITIAL_DATA = [
      {name: 'George', age: '16', skill: 'Chess'},
      {name: 'Stuart', age: '16', skill: 'FORTRAN'},
      {name: 'Barry', age: '14', skill: 'Dogs'}
    ];

    const NEW_DATA = [
      {name: 'George', age: '18', skill: 'Go'},
      {name: 'Stuart', age: '16', skill: 'Pascal'},
      {name: 'Barry', age: '14', skill: 'Cats'}
    ];

    let property;

    beforeEach(function() {
      property = utils.createListProperty(['name', 'age', 'skill']).withDefaultValue(INITIAL_DATA);
    });

    it('when value equal to default, value to persist is undefined', function() {
      expect(property.persistedValue).to.be.undefined;
    });

    it('when value not yet persisted and equal to default, is not marked changed', function() {
      expect(property.isChanged()).to.be.false;
    });

    it('when value set, is marked changed', function() {
      const property = utils.createArrayProperty(['foo', 'bar', 'baz']);

      property.value = NEW_DATA;

      expect(property.isChanged()).to.be.true;
    });

    it('when value changed, value to persist matches it', function() {
      property.observable(NEW_DATA);

      expect(property.persistedValue).to.eql(NEW_DATA);
    });

    it('when persisted value set, is not marked changed', function() {
      property.observable(NEW_DATA);

      property.persistedValue = NEW_DATA;

      expect(property.isChanged()).to.be.false;
    });

    it('when setNotChanged called, is not marked changed', function() {
      property.value = NEW_DATA;

      property.setNotChanged();

      expect(property.isChanged()).to.be.false;
    });
  });

  describe('list property by-key persistence', function() {
    /** The default data used to initialize the property. */
    const INITIAL_DEFAULT_DATA = [
      {name: 'George', age: '16', skill: 'Chess'},
      {name: 'Stuart', age: '16', skill: 'FORTRAN'},
      {name: 'Barry', age: '14', skill: 'Dogs'}
    ];

    /** Updated data to test changes to the property. */
    const NEW_DATA = [
      {name: 'George', age: '18', skill: 'Go'},
      {name: 'Stuart', age: '16', skill: 'Pascal'},
      {name: 'Barry', age: '14', skill: 'Dogs'}
    ];

    /** The value to persist after setting NEW_DATA. */
    const PERSISTED_NEW_DATA = {
      'George': {age: '18', skill: 'Go'},
      'Stuart': {skill: 'Pascal'}};

    /** A replacement default data to show what changes. */
    const NEW_DEFAULT_DATA = [
      {name: 'George', age: '16', skill: 'Chess'},
      {name: 'Stuart', age: '17', skill: 'FORTRAN'},
      {name: 'Barry', age: '14', skill: 'Dogs'}
    ];

    /** The new state after replacing the default data. */
    const COMBINED_DATA = [
      {name: 'George', age: '18', skill: 'Go'},
      {name: 'Stuart', age: '17', skill: 'Pascal'},
      {name: 'Barry', age: '14', skill: 'Dogs'}
    ];

    let property;

    beforeEach(function() {
      property = utils.createListProperty(['name', 'age', 'skill']).persistByKey('name').withDefaultValue(INITIAL_DEFAULT_DATA);
    });

    it('when value equal to default, value to persist is undefined', function() {
      expect(property.persistedValue).to.be.undefined;
    });

    it('when value not yet persisted and equal to default, is not marked changed', function() {
      expect(property.isChanged()).to.be.false;
    });

    it('when value set, is marked changed', function() {
      property.value = NEW_DATA;

      expect(property.isChanged()).to.be.true;
    });

    it('when value changed, value to persist matches it', function() {
      property.observable(NEW_DATA);

      expect(property.persistedValue).to.eql(PERSISTED_NEW_DATA);
    });

    it('when cleared after loading array value, is not marked changed', function() {
      property.persistedValue = NEW_DATA;
      property.clear();

      expect(property.isChanged()).to.be.false;
    });

    it('when persisted value set, is not marked changed', function() {
      property.persistedValue = NEW_DATA;

      expect(property.isChanged()).to.be.false;
    });

    it('when setNotChanged called, is not marked changed', function() {
      property.value = NEW_DATA;

      property.setNotChanged();

      expect(property.isChanged()).to.be.false;
    });

    it('changing the default does not require new persistence', function() {
      property.value = NEW_DATA;
      property.setDefaultValue(NEW_DEFAULT_DATA);

      expect(property.isChanged()).to.be.false;
    });
  });

  describe('list property with numeric fields', function() {
    const DATA = [
      {name: 'George', replicas: 16},
      {name: 'Stuart', replicas: 0},
      {name: 'Barry', replicas: null}
    ];

    let property;
    beforeEach(function() {
      property = utils.createListProperty(['name', 'replicas']);
    });

    it('set/get value does not swallow zero or null', function() {
      property.value = DATA;
      const actual = property.value;

      expect(Array.isArray(actual)).to.be.true;
      expect(actual.length).to.equal(3);

      const stuart = actual[1];
      const barry = actual[2];
      expect(stuart.name).to.equal('Stuart');
      expect(stuart.replicas).to.equal(0);
      expect(barry.name).to.equal('Barry');
      expect(barry.replicas).to.be.null;
    });

    it('persisted value does not swallow zero or null', function() {
      property.value = DATA;
      const actual = property.persistedValue;

      expect(Array.isArray(actual)).to.be.true;
      expect(actual.length).to.equal(3);

      const stuart = actual[1];
      const barry = actual[2];
      expect(stuart.name).to.equal('Stuart');
      expect(stuart.replicas).to.equal(0);
      expect(barry.name).to.equal('Barry');
      expect(barry.replicas).to.be.null;
    });
  });

  describe('observable groups', function () {
    let anObject;

    beforeEach(function () {
      anObject = {
        color: utils.createProperty('red'),
        name: utils.createProperty('fred'),
        friends: utils.createArrayProperty(['joe']),
        size: utils.createProperty(7),
        eventual: utils.createProperty(() => new Promise((resolve) => resolve('Yay!'))),
        ignore: utils.createProperty(() => {
          throw new Error('called initializer')
        }),
        execs: utils.createListProperty(['name', 'title'])
                   .withDefaultValue([{name: 'George', title: 'POTUS'}, {name: 'John', title: 'VEEP'}]),
        doIt: function () {
        }
      };
    });

    it('can be read from data', function () {
      const group = utils.createGroup('stuff', anObject);
      group.readFrom({
        stuff: {
          color: 'green', size: 3, friends: ['joe', 'sue'],
          execs: [{name: 'Tippecanoe', title: 'POTUS'}, {name: 'Tyler', title: 'VEEP'}]
        }
      });

      expect(anObject.color.value).to.equal('green');
      expect(anObject.name.value).to.equal('fred');
      expect(anObject.size.value).to.equal(3);
      expect(anObject.friends.value).to.eql(['joe', 'sue']);
      expect(anObject.execs.value).to.eql([{name: 'Tippecanoe', title: 'POTUS'}, {name: 'Tyler', title: 'VEEP'}]);
    });

    it('after group read, is not changed', function () {
      const group = utils.createGroup('stuff', anObject);
      group.readFrom({
        stuff: {
          color: 'green', size: 3, friends: ['joe', 'sue'],
          execs: [{name: 'Tippecanoe', title: 'POTUS'}, {name: 'Tyler', title: 'VEEP'}]
        }
      });

      expect(group.isChanged()).to.be.false;
    });

    it('can be written to data', function () {
      const group = utils.createGroup('stuff', anObject);
      anObject.color.value = 'blue';
      anObject.size.value = 13;
      anObject.execs.observable()[0]['name'] = 'Chris';

      const result = {};
      group.writeTo(result);

      expect(Object.keys(result.stuff)).to.have.lengthOf(3);
      expect(result.stuff.color).to.equal('blue');
      expect(result.stuff.size).to.equal(13);
      expect(result.stuff.execs).to.eql([{name: 'Chris', title: 'POTUS'}, {name: 'John', title: 'VEEP'}]);
    });

    it('on write, strings are trimmed', function () {
      const group = utils.createGroup('stuff', anObject);
      anObject.color.observable('  blue   ');
      anObject.friends.observable(['joe ', '  sue'])

      const result = {};
      group.writeTo(result);

      expect(result.stuff.color).to.equal('blue');
      expect(result.stuff.friends).to.eql(['joe', 'sue']);
    });

    it('on write, empty string values that differ from default values are kept', function() {
      const group = utils.createGroup('stuff', anObject);
      anObject.color.observable('');

      const result = {};
      group.writeTo(result);

      expect(result.stuff.color).to.equal('');
    });

    it('on write, empty string values that differ from default values are kept and survive JSON serialization/deserialization', function() {
      const group = utils.createGroup('stuff', anObject);
      anObject.color.observable('');

      const result = {};
      group.writeTo(result);
      const actual = JSON.parse(JSON.stringify(result, null, 2));

      expect(actual.stuff.color).to.equal('');
    });

    it('when group created, is not changed', function () {
      const group = utils.createGroup('stuff', anObject);

      expect(group.isChanged()).to.be.false;
    });

    it('when fields changed, group is changed', function () {
      const group = utils.createGroup('stuff', anObject);
      anObject.color.value = 'blue';

      expect(group.isChanged()).to.be.true;
    });

    it('after group written, is still changed', function () {
      const group = utils.createGroup('stuff', anObject);
      anObject.color.value = 'blue';

      const result = {};
      group.writeTo(result);

      expect(group.isChanged()).to.be.true;
    });

    it('after group marked as saved, is not changed', function () {
      const group = utils.createGroup('stuff', anObject);
      anObject.color.value = 'blue';

      group.setNotChanged();

      expect(group.isChanged()).to.be.false;
    });

    it('on write, if getCredentialFields is defined on the object, paths are added to result', function () {
      const group = utils.createGroup('stuff', anObject);
      anObject.getCredentialFields = function() {
        return ['one', 'two'];
      }

      const result = {credentialPaths:['existing']};
      group.writeTo(result);

      expect(result.credentialPaths).to.have.members(['existing', 'one', 'two']);
    });

    it('on write, if getCredentialFields is not defined on the object, paths for set credential fields are added to result', function () {
      const group = utils.createGroup('stuff', anObject);
      anObject.name.asCredential();
      anObject.color.asCredential();
      anObject.size.asCredential();
      anObject.name.value = 'George';
      anObject.color.value = 'green';

      const result = {};
      group.writeTo(result);

      expect(result.credentialPaths).to.have.members(['stuff.name', 'stuff.color']);
    });

    it('obtains a promise for the group', function() {
      const group = utils.createGroup('stuff', anObject);
      group.getPromise().then(result =>
        expect(result.eventual.value).to.equal('Yay!'));
    });
  });
});
