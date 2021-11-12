/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';


/**
 * Utilities for observable properties that can be used as the base for JET control and handle persistence.
 *
 * Three types of properties are defined, each implementing a common interface:
 *  get observable()     - returns an observable for the property value that can be associated with a GUI element
 *  get value()          - returns the current value of the property
 *  set value()          - sets the value of the property
 *  get persistedValue() - returns the value to persist - if undefined, indicates that nothing should be persisted
 *  set persistedValue() - sets the value to what was persisted
 *  function clear()     - resets the value of the property to its default
 *  function hasValue()  - returns true if the property has a value that differs from its default
 *  function isChanged() - returns true if the property has a value that differs from its persisted value
 *
 *
 * Simple properties (created by props.createProperty() and intended for use with oj-input-text and oj-bind-text)
 *    define a single value, usually a string or a number.
 *    Its default value is defined by the arguments passed to the create function:
 *    - a constant value, supplied by a string, number, or function
 *    - a constant value supplied by a Promise
 *    - a dynamic value supplied by a function followed by one or more observable values, which will be
 *      passed to that function
 *    - a dynamic value supplied by a string followed by one or more observable values, which will replace
 *      substrings of the form {1}, {2}, etc.
 *
 * Array properties (created by props.createArrayProperty() and intended for use with oj-text-area)
 *     define a property represented as an array of strings.
 *     The observable for such a property is a string, in which the elements of the array are separated by commas;
 *     updating that observable will accept other separators, such as semicolons, spaces or tabs. An array element
 *     may be quoted to allow it contain internal spaces or other separators.
 *
 * List properties (created by props.createListProperty() and intended for use with oj-table)
 *     define a property represented as an array of objects
 *
 */
define(['knockout', 'utils/common-utilities', 'utils/validation-helper', 'utils/wkt-logger'],
  function (ko, utils, validationHelper, wktLogger) {
  // The abstract base class for all properties
    class Property {
      constructor() {
        this._persistedValue = undefined;
      }

      /**
       * Returns an observable for the property value that can be associated with a GUI value.
       */
      get observable() {
        throw new Error('subclasses must override this');
      }

      /**
       * Returns the current value of the property.
       */
      get value() {
        throw new Error('subclasses must override this');
      }

      /**
       * Sets the value of the property.
       */
      set value(value) {
        throw new Error('subclasses must override this');
      }

      /**
       * Returns the value to persist - if null, indicates that nothing should be persisted.
       */
      get persistedValue() {
        return this.hasValue() ? this.value : undefined;
      }

      /**
       * Sets the value to what was persisted.
       */
      set persistedValue(newValue) {
        this.value = newValue;
        this._persistedValue = this.value;
      }

      /**
       * Resets the value of the property to its default.
       */
      clear() {
        throw new Error('subclasses must override this');
      }

      /**
       * Returns true if the property has a value that differs from its default.
       */
      hasValue() {
        throw new Error('subclasses must override this');
      }

      /**
       * Returns true if the property has a value that differs from its persisted value.
       */
      isChanged() {
        return this._persistedValue === undefined ? this.hasValue() : !utils.equals(this.value, this._persistedValue);
      }

      /**
       * Marks the property no longer changed.
       */
      setNotChanged() {
        if (this.isChanged())
          this.persistedValue = this.value;
      }
    }

    /**
     * A property with a single underlying value, which may be a string, number or boolean.
     */
    class ScalarProperty extends Property {
      /**
       * Creates an instance of a property with a single underlying value, which may be a string, number or boolean.
       *
       * @param defaultValue - optional argument to set the default value.  If not specified, the default value is empty.
       *                       This argument can be a simple value, a pattern using "${<number>}" token(s), or
       *                       a function that computes the value based on the source(s).
       *
       *                       When using a pattern, the tokens specify which source to use to fill in the pattern
       *                       (starting at position 1 for the first source).  When using a function, the function should
       *                       accept the source(s) as parameters and return the simple value to use as the default.
       * @param source         optional arguments to pass the observable(s) to use with the defaultValue pattern or function.
       */
      constructor(defaultValue, ...source) {
        super();
        this._defaultValue = defaultValue;
        this._source = source;
        this._pattern = null;
        this._default = null;
        this._credential = false;
        this._observable = null;
        this._validators = [];
      }

      // sets the default value for the property, and optionally sets the current value.
      resolvePromise(initialValue) {
        this._default = initialValue;
        if (typeof this._observable() === 'undefined') {
          this._observable(initialValue);
        }
      }

      getPromise() {
        try {
          return (typeof this._defaultValue === 'function' && this.isPromise(this._defaultValue())) ? this._defaultValue() : null;
        } catch (e) {
          return null;
        }
      }

      // initializes the default value for the property, either immediately or when the initial Promise is settled.
      initializeDefaultValue(initialValue) {
        if (this.isPromise(initialValue)) {
          this._observable = ko.observable(undefined);
          initialValue.then(result => this.resolvePromise(result)).catch(() => this.resolvePromise(''));
        } else {
          this._default = initialValue;
          this._observable = ko.observable(this._default);
        }
      }

      // initializes the observable for this property,
      initializeObservable() {
        if (this._default != null) {
          this._observable = ko.observable(this._default);
        } else if (this.isComputedDefault(this)) {
          const computedScalarObservable = new ComputedScalarObservable(this._defaultValue, ...this._source);
          this._default = computedScalarObservable.getDefaultFunction();
          this._observable = computedScalarObservable.createObservable();
        } else {
          this.initializeDefaultValue(getInitialValue(this._defaultValue));
        }
      }

      // Returns true if the specified object is a Promise (inferred from the presence of a 'then' function).
      isPromise(obj) {
        return typeof obj === 'object' && obj !== null && typeof obj['then'] === 'function';
      }

      isComputedDefault(prop) {
        return Array.isArray(prop._source) && ko.isObservable(prop._source[0]);
      }

      asCredential() {
        this._credential = true;
        return this;
      }

      isCredential() {
        return this._credential === true;
      }

      addValidator(...validator) {
        this._validators.push(...validator);
      }

      validate(isRequired) {
        return validationHelper.validateField(this._validators, this.value, isRequired);
      }

      validators() {
        return this._validators;
      }

      // Returns the observable which manages the value for this property.
      get observable() {
        if (this._observable == null) {
          this.initializeObservable();
        }

        return this._observable;
      }

      // Returns the usable value of the property. If it is a string, the value returned will be trimmed.
      get value() {
        return trimmed(this.observable());
      }

      // Updates the usable value of the property.
      set value(newValue) {
        this.observable(newValue);
      }

      get persistedValue() {
        return super.persistedValue;
      }

      set persistedValue(newValue) {
        super.persistedValue = newValue;
      }

      get default() {
        return this.getDefaultValue();
      }

      // Returns the default value against which to test current values for change
      getDefaultValue() {
        if (this._observable == null) {
          this.initializeObservable();
        }

        if (typeof this._default === 'function') {
          return this._default();
        } else {
          return this._default;
        }
      }

      // clears this property to its default value.
      clear() {
        if (this._observable !== null) {
          if (typeof this._default === 'function') {
            this._observable(undefined);
          } else {
            this._observable(this._default);
          }
        }
      }

      // returns true if this property is changed from its default value.
      hasValue() {
        return this._default !== null
          ? this.getDefaultValue() !== this.observable()
          : this._observable != null && typeof this._observable() !== 'undefined';
      }
    }

    /**
     * A property whose underlying value is an array of strings, and whose observable is a string with a list of values.
     */
    class ArrayProperty extends Property {

      static isSupportedInput(inputValue) {
        if (typeof inputValue === 'undefined' || typeof inputValue === 'function') return true;
        return Array.isArray(inputValue);
      }

      static validateInput(inputValue) {
        if (!ArrayProperty.isSupportedInput(inputValue)) {
          throw new Error(`value <${inputValue}> specified to ArrayProperty must be an array, but is '${typeof inputValue}`);
        }
      }

      constructor(defaultValue) {
        super();
        this._defaultValue = defaultValue;
        this._default = null;
        this._observable = null;
        this._arrayObservable = null;

        ArrayProperty.validateInput(defaultValue);
      }

      get default() {
        if (this._default == null) {
          this._default = getInitialValue(this._defaultValue) || [];
        }
        return this._default;
      }

      get arrayObservable() {
        if (this._arrayObservable == null) {
          this._arrayObservable = new ArrayObservable(this.default);
        }
        return this._arrayObservable;
      }

      get observable() {
        return this.arrayObservable.getObservable();
      }

      get value() {
        return this.arrayObservable.getValue();
      }

      set value(newValue) {
        this.observable(newValue);
      }

      get persistedValue() {
        return super.persistedValue;
      }

      set persistedValue(newValue) {
        super.persistedValue = newValue;
      }

      getPromise() {
        return null;
      }

      clear() {
        if (this._arrayObservable !== null) {
          this._arrayObservable.clear();
        }
      }

      hasValue() {
        return this._default !== null && !utils.equals(this.default, this.value);
      }
    }

    /**
     * A property whose underlying value is an array of objects.
     */
    class ListProperty extends Property {
      /**
       * Creates a new ListProperty object.
       *
       * @param keys - the list of property names for the element objects in the list.
       */
      constructor(keys) {
        super();
        if (!Array.isArray(keys) || keys.length === 0) {
          throw new Error('List property may not be created without keys');
        }

        this._defaultValue = [];
        this._persistedValue = undefined;
        this._keys = keys;
        this._observable = null;
        this._returnEmptyFields = true;
      }

      // if specified, the primary key is not considered to be data
      isDataKey(key) {
        return key !== this._primaryKey;
      }

      getPromise() {
        return null;
      }

      ignoringEmptyFields() {
        this._returnEmptyFields = false;
        return this;
      }

      setDefaultValue(defaultValue) {
        if (!this._persistByKey) {
          this.doSetDefault(defaultValue);
        } else {
          const savedValue = this.persistedValue || {};
          this.doSetDefault(defaultValue);
          this.persistedValue = savedValue;
        }
      }

      doSetDefault(defaultValue) {
        if (typeof defaultValue !== 'undefined' && !Array.isArray(defaultValue)) {
          throw new Error(`Default value of type ${typeof defaultValue} not allowed`);
        }

        this._defaultValue = defaultValue;
        this._persistedValue = this.persistedValue;
      }

      withDefaultValue(defaultValue) {
        this.doSetDefault(defaultValue);
        return this;
      }

      persistByKey(primaryKey) {
        this._primaryKey = primaryKey;
        this._persistByKey = true;
        this._persistedValue = this.persistedValue;
        return this;
      }

      // computes the effective value for this property, using the defaults to fill in unspecified values
      createArrayItem(self, element) {
        const result = {};
        this._keys.forEach(key => result[key] = element[key]);

        if (!this._primaryKey) {
          result['remove'] = function () {
            self.observable.remove(result);
          };
        }

        return result;
      }

      createList(value) {
        if (typeof value === 'undefined') {
          return [];
        } else {
          return value.map(e => this.createArrayItem(this, e));
        }
      }

      addNewItem() {
        this.observable.push(this.createArrayItem(this, arguments.length === 0 ? {} : arguments[0]));
      }

      get observable() {
        if (this._observable == null) {
          this._observable = ko.observableArray(this.createList(this._defaultValue));
        }
        return this._observable;
      }

      addIfDefined(result, key, value) {
        if (value || this._returnEmptyFields) result[key] = value;
      }

      extractArrayItem(element) {
        const result = {};
        this._keys.forEach(key => this.addIfDefined(result, key, trimmed(element[key])));
        return result;
      }

      anyPropertyDefined(element) {
        return Object.keys(element).find(key => this.isDataKey(key) && (element[key] || element[key] === 0));
      }

      get value() {
        return this.observable().map(e => this.extractArrayItem(e)).filter(e => this.anyPropertyDefined(e));
      }

      set value(newValue) {
        this.observable(this.createList(newValue));
      }

      getDefaultWithKey(key) {
        return this._defaultValue.find(item => item[this._primaryKey] === key) || {};
      }

      ifNonEmpty(obj) {
        return Object.keys(obj).length > 0 ? obj : null;
      }

      getChanges(item) {
        const matchingDefault = this.getDefaultWithKey(item[this._primaryKey]);
        const result = {};
        for (const key of Object.keys(item).filter(k => k !== this._primaryKey)) {
          if (item[key] !== matchingDefault[key]) result[key] = item[key];
        }
        return this.ifNonEmpty(result);
      }

      get persistedValue() {
        if (!this._primaryKey || !this._persistByKey) {
          return super.persistedValue;
        } else if (!this.hasValue()) {
          return undefined;
        } else {
          return this.ifNonEmpty(this.computePerKeyPersistedValue());
        }
      }

      computePerKeyPersistedValue() {
        const result = {};
        for (const item of this.value) {
          const changes = this.getChanges(item);
          if (changes) result[item[this._primaryKey]] = changes;
        }
        return result;
      }

      set persistedValue(newValue) {
        function getNewValue(primaryKeyName, primaryKeyValue, values, keys) {
          let result;
          if (values || typeof(values) === 'object') {
            result = {};
            result[primaryKeyName] = primaryKeyValue;
            for (const key of keys) {
              if (values[key] !== undefined) {
                if (values[key] !== null) {
                  if (typeof values[key] === 'string') {
                    if (values[key]) {
                      result[key] = values[key];
                    }
                  } else {
                    result[key] = values[key];
                  }
                } else {
                  // we really only want to allow this for numeric fields but there is no way to tell...
                  result[key] = values[key];
                }
              }
            }
          }
          return result;
        }

        if (Array.isArray(newValue)) {
          super.persistedValue = newValue;
        } else if (this._persistByKey && typeof newValue === 'object') {
          let values = this._defaultValue;
          if (newValue && Object.keys(newValue).length > 0) {
            const updatedValues = [];
            for (const [entryKey, entryValues] of Object.entries(newValue)) {
              const updatedValue = getNewValue(this._primaryKey, entryKey, entryValues, this._keys);
              if (updatedValue) {
                updatedValues.push(updatedValue);
              }
            }
            if (updatedValues.length > 0) {
              values = updatedValues;
            }
          }
          super.persistedValue = values;
        }
        this._persistedValue = this.persistedValue;
      }

      clear() {
        if (this._observable !== null) {
          this.value = this._defaultValue;
        }
        this._persistedValue = this.persistedValue;
      }

      hasValue() {
        if (this._observable === null) return false;

        return !utils.equals(this.value, this._defaultValue);
      }

      isChanged() {
        return !utils.equals(this.persistedValue, this._persistedValue);
      }

      setNotChanged() {
        this._persistedValue = this.persistedValue;
      }
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //                           Private Helper methods                                  //
    ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * The function used by ScalarProperty to handle a default value that is a pattern or function.
     *
     * @param pattern the pattern or function used to set the default value
     * @param sources the knockout observables to use with the pattern or function for determining the default value.
     * @constructor
     */
    function ComputedScalarObservable(pattern, ...sources) {
      const self = this;
      this._explicitValue = ko.observable(null);
      this._sources = sources;

      this.computedOptions = {
        write: newValue => this._explicitValue(newValue)
      };

      function replaceInString() {
        let result = pattern;
        for (let i = 0; i < self._sources.length; i++) {
          result = result.replace('${' + (i + 1) + '}', self._sources[i]());
        }
        return result;
      }

      this._computedValue = ko.computed(function () {
        if (typeof pattern === 'function') {
          return pattern(...self._sources);
        } else {
          return replaceInString();
        }
      });

      this.getComputedValue = () => {
        return this._explicitValue() != null ? this._explicitValue() : this._computedValue();
      };

      this.getDefaultFunction = () => {
        return this._computedValue;
      };

      this.createObservable = function () {
        return ko.computed(this.getComputedValue, this, this.computedOptions);
      };
    }

    /**
     * This is a custom observable whose underlying value is an array. Input may be an array, a comma- or
     * semicolon-separated string, or a newline-separated string. To the UI, it looks like an observable
     * with a comma-separated string, but its returned value is always an array.
     */
    class ArrayObservable {
      // defaultValue - must be an array
      constructor(defaultValue) {
        this._originalValue = arrayToString(defaultValue);
        this._explicitValue = ko.observable(this._originalValue);
        this._computedOptions = {
          write: newValue => this.setValue(newValue)
        };
        this._observable = ko.computed(this._explicitValue, this, this._computedOptions);
      }

      // Replace all separators with a comma-space sequence
      setValue(newValue) {
        function guiInput(rawString) {
          return arrayToString(stringToArray(rawString));
        }

        if (Array.isArray(newValue)) {
          this._explicitValue(arrayToString(newValue));
        } else {
          this._explicitValue(guiInput(newValue));
        }
      }

      getObservable() {
        return this._observable;
      }

      // convert a string with separators to an array
      getValue() {
        return stringToArray(this._explicitValue()) || [];
      }

      clear() {
        this.setValue(this._originalValue);
      }
    }

    /**
     * Returns the initial value for a property.
     * @param initializer the specified initial value, which may be a value or a function.
     */
    function getInitialValue(initializer) {
      switch (typeof initializer) {
        case 'function':
          return initializer();
        case 'undefined':
          return '';
        default:
          return initializer === null ? '' : initializer;
      }
    }

    function trimmed(value) {
      return (typeof value === 'string') ? value.trim() : value;
    }

    function isProperty(property) {
      return typeof property === 'object' && property !== null && property.hasValue !== undefined;
    }

    function escape(s) {
      return /[,;\n\s]/.test(s) ? `"${s}"` : s;
    }

    function arrayToString(array) {
      return array.length ? array.map(escape).join(', ') : '';
    }

    function stringToArray(string) {
      const result = [];
      const re = /([^,;\s'"`]*)[,;\s'"`]/g;
      while (re.lastIndex < string.length) {
        const start = re.lastIndex;
        re.exec(string);
        if (re.lastIndex === 0) {
          const lastToken = string.substring(start, string.length);
          if (lastToken.length > 0) {
            result.push(lastToken.trim());
          }
          break;
        }
        const token = string.substring(start, re.lastIndex - 1);
        if (token.length > 0) {
          result.push(token);
        }
        const c = string.charAt(re.lastIndex - 1);
        if (c === '\'' || c === '"' || c === '`') {
          let end = string.indexOf(c, re.lastIndex);
          if (end < 0) {
            end = string.length;
          }
          if (end > re.lastIndex + 1) {
            result.push(string.substring(re.lastIndex, end).trim());
          }
          re.lastIndex = end + 1;
        }
      }
      return result;
    }

    /**
     * Returns true if the specified field is an observable property.
     * @param object the containing object
     * @param fieldName the name of the field
     */
    function isPropertyField(object, fieldName) {
      return isProperty(object[fieldName]);
    }

    function getPropertyFieldNames(object) {
      return Object.keys(object).filter(fieldName => object[fieldName] instanceof Property);
    }

    function getPropertyFields(object) {
      return Object.values(object).filter(field => field instanceof Property);
    }

    function loadField(object, fieldName, jsonFields) {
      if (jsonFields && jsonFields.hasOwnProperty(fieldName)) {
        object[fieldName].persistedValue = jsonFields[fieldName];
      } else {
        object[fieldName].clear();
      }
    }

    // load project fields from the JSON content.
    function loadFields(object, jsonFields) {
      getPropertyFieldNames(object).forEach(n => loadField(object, n, jsonFields));
    }

    // add fields with non-default values from the specified object
    function storeField(object, fieldName, fieldContents) {
      const persistedValue = object[fieldName].persistedValue;
      if (object[fieldName].hasValue()) {
        fieldContents[fieldName] = persistedValue;
      }
    }

    // to the project contents json for saving.
    function storeFields(fieldSetName, object, json) {
      const fieldContents = {};
      getPropertyFieldNames(object).forEach(n => storeField(object, n, fieldContents));

      if (Object.keys(fieldContents).length) {
        json[fieldSetName] = fieldContents;
      }
    }

    function recordSecureFields(json, credentialPaths) {
      if (!json.credentialPaths) json.credentialPaths = [];
      json.credentialPaths.push(...credentialPaths);
    }

    function isSecureProperty(object, fieldName) {
      return isPropertyField(object, fieldName) && object[fieldName].isCredential && object[fieldName].isCredential();
    }

    function getSecurePropertyPaths(name, object) {
      const paths = [];
      for (const [fieldName, fieldValue] of Object.entries(object)) {
        if (isSecureProperty(object, fieldName) && fieldValue.hasValue()) {
          paths.push(`${name}.${fieldName}`);
        }
      }
      return paths;
    }

    function getCredentialFields(name, object) {
      const paths = getSecurePropertyPaths(name, object);
      if (typeof object.getCredentialFields === 'function') {
        paths.push(...object.getCredentialFields());
      }
      return paths;
    }

    /**
     * Add a json-path list of fields to encrypt to the project contents json.
     * @param name the name under which this object's fields are defined for the json
     * @param object the object from which the additions to the list should be taken
     * @param json the encoding to which they should be written
     */
    function storeFieldsToEncrypt(name, object, json) {
      recordSecureFields(json, getCredentialFields(name, object));
    }

    function createGroupPromise(object) {
      // get all non-null promises in the object fields.
      const promises = Object.values(object).filter(isProperty).map(p => p.getPromise()).map(p => p !== null);
      return Promise.all(promises).then(() => { return object; });
    }

    function ObjectGroup(name, object) {
      return {
        readFrom: function (json) {
          loadFields(object, json[name]);
        },

        writeTo: function (json) {
          storeFields(name, object, json);
          storeFieldsToEncrypt(name, object, json);
        },

        setNotChanged() {
          getPropertyFields(object).forEach(p=> p.setNotChanged());
        },

        isChanged: function () {
          getPropertyFieldNames(object).forEach(key => {
            const value = object[key];
            if(value.isChanged()) {
              wktLogger.debug('isChanged: %s %s', name, key);
            }
          });
          return getPropertyFields(object).some(p => p.isChanged());
        },

        getPromise: function () {
          return createGroupPromise(object);
        }
      };
    }

    /////////////////////////////////////////////////////////////////////////////
    //                  Public API Entry Point Functions                       //
    /////////////////////////////////////////////////////////////////////////////
    return {
      /**
       * Returns true if the specified object is a property.
       */
      isPropertyObject: function (obj) {
        return typeof obj === 'object' && typeof obj.hasValue === 'function';
      },

      /**
       * Returns a property that wraps an observable which can be used as the source for a view.
       *
       * The defaultValue may be one of the following:
       * - a simple constant value, such as a string or a number
       * - a Promise, which will update the view when it is fulfilled
       * - a function which will be lazily evaluated when the view updates
       *
       * If additional observable parameters are specified, the property will automatically update
       * as those observables change. In that case, the first parameter may be either a string or a function.
       * If it is a string, it should contain holes in the form ${n}, where n is a non-negative number indicating
       * the source observable whose value should be used. If it is a function, that function will be called with the
       * specified observables, to compute the actual default value.
       *
       * Once a user enters a value, that will be the value of the observable rather than the default.
       */
      createProperty: function (defaultValue, arg) {
        return new ScalarProperty(defaultValue, arg);
      },

      createArrayProperty: function (defaultValue) {
        return new ArrayProperty(defaultValue);
      },

      /**
       * Creates a property whose observable is a knockout observable array, each element of which is an object
       * with observables for each its properties. In addition, each object has a property named 'remove' which is
       * a function that will remove that object from the observable array.
       *
       * The value of this property is an array of objects, whose keys correspond to the keys in the observable objects,
       * and whose values are those observable's values.
       *
       * If the 'keys' parameter is specified, object field names not listed will be ignored.
       *
       * The property has a method, 'addNewItem' which will add an object to the observable array, with empty values
       * for each of the specified keys. If no keys are specified, 'addNewItem' throws an exception.
       *
       * @param keys an optional list of keys to retain in setting this property's value.
       */
      createListProperty: function(keys) {
        return new ListProperty(keys);
      },

      createGroup: function (name, object) {
        return new ObjectGroup(name, object);
      }
    };
  }
);
