/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

const { assert, expect } = require('chai');
const { after, before, describe, it } = require('mocha');
const requirejs = require('requirejs');
const testHelper = require('./test-helper');

describe('validation-helper', function() {
  let validationHelper;
  let utils;

  before(function(done) {
    testHelper.install();
    requirejs(['utils/validation-helper', 'utils/observable-properties'],
      function(testValidationHelper, props) {
        validationHelper = testValidationHelper;
        utils = props;
        done();
      }
    );
  });

  after(function() {
    testHelper.remove();
  });

  describe('required field validation tests', function() {
    it('validate required field with undefined value returns an error', function() {
      const message = validationHelper.validateRequiredField(undefined);

      expect(message).to.equal('validation-helper-validate-field-value-is-not-defined');
    });

    it('validate required field with null value returns an error', function() {
      const message = validationHelper.validateRequiredField(null);

      expect(message).to.equal('validation-helper-validate-field-value-is-not-defined');
    });

    it('validate required field with an empty string returns an error', function() {
      const message = validationHelper.validateRequiredField('');

      expect(message).to.equal('validation-helper-validate-string-field-value-is-empty');
    });

    it('validate required field with an empty array returns an error', function() {
      const message = validationHelper.validateRequiredField([]);

      expect(message).to.equal('validation-helper-validate-array-field-value-is-empty');
    });

    it('validate required field with value of zero does not return an error', function() {
      const message = validationHelper.validateRequiredField(0);

      expect(message).to.be.undefined;
    });

    it('validate required field with non-empty string does not return an error', function() {
      const message = validationHelper.validateRequiredField('abc');

      expect(message).to.be.undefined;
    });

    it('validate required field with non-empty array does not return an error', function() {
      const message = validationHelper.validateRequiredField(['abc']);

      expect(message).to.be.undefined;
    });
  });

  describe('image tag validation tests', function() {
    function getImageTagProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getImageTagValidators());
      myProp.observable(value);
      return myProp;
    }

    it('simple image tag has no validation errors', function() {
      const myProp = getImageTagProperty('busybox');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('optional empty image tag has no validation errors', function() {
      const myProp = getImageTagProperty('');

      const validationErrors = myProp.validate(false);
      expect(validationErrors).to.be.undefined;
    });

    it('namespaced image tag has no validation errors', function() {
      const myProp = getImageTagProperty('foo/busybox');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('registry image tag has no validation errors', function() {
      const myProp = getImageTagProperty('ocir.io/foo/busybox');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('registry host and port image tag has no validation errors', function() {
      const myProp = getImageTagProperty('ocir.io:12345/foo/busybox');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('registry image tag with version has no validation errors', function() {
      const myProp = getImageTagProperty('ocir.io/foo/busybox:v1.0-beta');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('registry image tag with digest has no validation errors', function() {
      const myProp = getImageTagProperty('ocir.io/foo/busybox@sha256:111222333444555666777888999000abcdef');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('image tag with version and digest has validation errors', function() {
      const myProp = getImageTagProperty('ocir.io/foo/busybox:v1.0@sha256:111222333444555666777888999000abcdef');
      const expected = [
        'validation-helper-image-tag-message-detail'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('image tag with 256 characters has validation errors', function() {
      const longName = 'a'.repeat(256);
      const myProp = getImageTagProperty(longName);
      const expected = [
        'Enter no more than 255 characters.'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });
  });

  describe('kubernetes name validation tests', function() {
    function getK8sNameProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getK8sNameValidators());
      myProp.observable(value);
      return myProp;
    }

    it('valid Kubernetes name has no validation errors', function() {
      const myProp = getK8sNameProperty('weblogic-operator');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('long valid Kubernetes name has no validation errors', function() {
      const myProp = getK8sNameProperty('weblogic-operator-weblogic-operator-weblogic-operator-weblogic1');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('too long Kubernetes name has validation errors', function() {
      const myProp = getK8sNameProperty('weblogic-operator-weblogic-operator-weblogic-operator-weblogic12');
      const expected = [
        'validation-helper-k8s-name-validator-message-detail'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('empty Kubernetes name has validation errors', function() {
      const myProp = getK8sNameProperty('');
      const expected = [
        'validation-helper-validate-string-field-value-is-empty'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('Kubernetes name with capital letters has validation errors', function() {
      const myProp = getK8sNameProperty('myImage');
      const expected = [
        'validation-helper-k8s-name-validator-message-detail'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });
  });

  describe('hostname validation tests', function() {
    function getHostNameProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getHostNameValidators());
      myProp.observable(value);
      return myProp;
    }

    it('localhost is a valid hostname', function() {
      const myProp = getHostNameProperty('localhost');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('127.0.0.1 is a valid hostname', function() {
      const myProp = getHostNameProperty('localhost');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('fully qualified hostname a valid hostname', function() {
      const myProp = getHostNameProperty('everest.rocks.mycompany.com');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('null hostname has validation errors', function() {
      const myProp = getHostNameProperty(null);
      const expected = [
        'validation-helper-validate-field-value-is-not-defined'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('undefined hostname has validation errors', function() {
      const myProp = getHostNameProperty(undefined);
      const expected = [
        'validation-helper-validate-field-value-is-not-defined'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('hostname with invalid characters has validation errors', function() {
      const myProp = getHostNameProperty('foo@bar.com');
      const expected = [
        'validation-helper-hostname-message-detail'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });
  });

  describe('port number validation tests', function() {
    function getPortNumberProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getPortNumberValidators());
      myProp.observable(value);
      return myProp;
    }

    it('valid port number has no validation errors', function() {
      const myProp = getPortNumberProperty(8888);

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('optional empty port number has no validation errors', function() {
      const myProp = getPortNumberProperty();

      const validationErrors = myProp.validate(false);
      expect(validationErrors).to.be.undefined;
    });

    it('minimum valid port number has no validation errors', function() {
      const myProp = getPortNumberProperty(1);

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('maximum valid port number has no validation errors', function() {
      const myProp = getPortNumberProperty(65535);

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('negative port number has validation errors', function() {
      const myProp = getPortNumberProperty(-1);
      const expected = [
        'Enter a number that\'s 1 or higher.'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('port number of 0 has validation errors', function() {
      const myProp = getPortNumberProperty(0);
      const expected = [
        'Enter a number that\'s 1 or higher.'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('port number of 65536 has validation errors', function() {
      const myProp = getPortNumberProperty(65536);
      const expected = [
        'Enter a number that\'s 65535 or lower.'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });
  });

  describe('email address validation tests', function() {
    function getEmailAddressProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getEmailAddressValidators());
      myProp.observable(value);
      return myProp;
    }

    it('valid email address has no validation errors', function() {
      const myProp = getEmailAddressProperty('fred.flintstone@slaterockandgravel.com');

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('really long valid email address has no validation errors', function() {
      const name = 'my.really.really.really.really.really.really.really.long.name123';
      const suffix = 'a'.repeat(251) + '.com';
      const email = `${name}@${suffix}`;
      const myProp = getEmailAddressProperty(email);

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.be.undefined;
    });

    it('really long email address has validation errors', function() {
      const name = 'my.really.really.really.really.really.really.really.long.name1234';
      const suffix = 'a'.repeat(251) + '.com';
      const email = `${name}@${suffix}`;
      const myProp = getEmailAddressProperty(email);
      const expected = [
        'Enter no more than 320 characters.'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('email address with no @ has validation errors', function() {
      const myProp = getEmailAddressProperty('fred.flintstone');
      const expected = [
        'validation-helper-email-address-message-detail'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('email address with no name before @ has validation errors', function() {
      const myProp = getEmailAddressProperty('@slaterockandgravel.com');
      const expected = [
        'validation-helper-email-address-message-detail'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('email address with no . after @ has validation errors', function() {
      const myProp = getEmailAddressProperty('fred.flintstone@slaterockandgravel');
      const expected = [
        'validation-helper-email-address-message-detail'
      ];

      const validationErrors = myProp.validate(true);
      expect(validationErrors).to.deep.equal(expected);
    });

    it('validatable object has no validation errors when errors are undefined', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label', undefined);
      validatableObject.addField('project-settings-java-home-label', undefined);

      const actual = validatableObject.hasValidationErrors();
      expect(actual).to.be.false;
    });

    it('validatable object has no validation errors when errors are empty string', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label', '');
      validatableObject.addField('project-settings-java-home-label', '');

      const actual = validatableObject.hasValidationErrors();
      expect(actual).to.be.false;
    });

    it('validatable object has no validation errors when errors are empty arrays', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label', []);
      validatableObject.addField('project-settings-java-home-label', []);

      const actual = validatableObject.hasValidationErrors();
      expect(actual).to.be.false;
    });

    it('validatable object has validation errors when string errors are present', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label', 'java home is not specified');
      validatableObject.addField('project-settings-java-home-label', undefined);

      const actual = validatableObject.hasValidationErrors();
      expect(actual).to.be.true;
    });

    it('validatable object has validation errors when array errors are present', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label', ['java home is not specified']);
      validatableObject.addField('project-settings-java-home-label', undefined);

      const actual = validatableObject.hasValidationErrors();
      expect(actual).to.be.true;
    });

    it('validatable object format error message is empty when no errors exist', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label', undefined);
      validatableObject.addField('project-settings-java-home-label', '');
      validatableObject.addField('project-settings-foo-home-label', []);

      const expected = { title: 'test-title' };
      const actual = validatableObject.getValidationErrorDialogConfig('test-title');
      expect(actual).to.eql(expected);
    });

    it('validatable object format error message is expected when string errors exist', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label', 'java home is not defined');

      const expected = {
        title: 'test-title',
        message: 'validation-helper-validation-error-fields-message',
        errorFields: [
          {
            fieldName: 'project-settings-java-home-label',
            fieldErrors: [
              'java home is not defined'
            ]
          }
        ]
      };

      const actual = validatableObject.getValidationErrorDialogConfig('test-title');
      expect(actual).to.eql(expected);
    });

    it('validatable object format error message is expected when array errors exist', function() {
      const validatableObject = validationHelper.createValidatableObject('my-test-flow');
      validatableObject.addField('project-settings-java-home-label',
        [ 'java home is not defined', 'java home does not exist' ]);
      const expected = {
        title: 'test-title',
        message: 'validation-helper-validation-error-fields-message',
        errorFields: [
          {
            fieldName: 'project-settings-java-home-label',
            fieldErrors: [
              'java home is not defined',
              'java home does not exist'
            ]
          }
        ]
      };

      const actual = validatableObject.getValidationErrorDialogConfig('test-title');
      expect(actual).to.eql(expected);
    });
  });

  describe('Kubernetes CPU validation works', function() {
    function getK8sCpuProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getK8sCpuValidators());
      myProp.observable(value);
      return myProp;
    }

    function validCpuValuesTest(cpu) {
      const cpuProperty = getK8sCpuProperty(cpu);

      try {
        cpuProperty.validate(false);
      } catch (err) {
        assert.fail(`${cpu} should be a valid CPU value: ${err.message}`);
      }
    }

    function invalidCpuValuesTest(cpu) {
      const cpuProperty = getK8sCpuProperty(cpu);

      try {
        cpuProperty.validate(false);
        assert.fail(`${cpu} should be an invalid CPU value`);
      } catch {
      }
    }

    it('negative number is invalid', function() {
      invalidCpuValuesTest('-1');
    });

    it('0 is invalid', function() {
      invalidCpuValuesTest('0');
    });

    it('1 is valid', function() {
      validCpuValuesTest('1');
    });

    it('0m is invalid', function() {
      invalidCpuValuesTest('0m');
    });

    it('1m is valid', function() {
      validCpuValuesTest('1m');
    });

    it('8000m is valid', function() {
      validCpuValuesTest('8000m');
    });

    it('0.001 is valid', function() {
      validCpuValuesTest('0.001');
    });

    it('0.0001 is invalid', function() {
      invalidCpuValuesTest('0.0001');
    });

    it('0.1m is invalid', function() {
      invalidCpuValuesTest('0.1m');
    });

    it('.1 is invalid', function() {
      invalidCpuValuesTest('.1');
    });

    it('1. is invalid', function() {
      invalidCpuValuesTest('1.');
    });
  });

  describe('Kubernetes Memory validation works', function() {
    function getK8sMemoryProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getK8sMemoryValidators());
      myProp.observable(value);
      return myProp;
    }

    function validMemoryValuesTest(memory) {
      const memoryProperty = getK8sMemoryProperty(memory);

      try {
        memoryProperty.validate(false);
      } catch (err) {
        assert.fail(`${memory} should be a valid memory value: ${err.message}`);
      }
    }

    function invalidMemoryValuesTest(memory) {
      const memoryProperty = getK8sMemoryProperty(memory);

      try {
        memoryProperty.validate(false);
        assert.fail(`${memory} should be an invalid memory value`);
      } catch {
      }
    }

    it('negative number is invalid', function() {
      invalidMemoryValuesTest('-1');
    });

    it('0 is invalid', function() {
      invalidMemoryValuesTest('0');
    });

    it('0.1 is invalid', function() {
      invalidMemoryValuesTest('0.1');
    });

    it('1 is valid', function() {
      validMemoryValuesTest('1');
    });

    it('1.0 is invalid', function() {
      invalidMemoryValuesTest('1.0');
    });

    it('1234567890 is valid', function() {
      validMemoryValuesTest('1234567890');
    });

    it('1K is valid', function() {
      validMemoryValuesTest('1K');
    });

    it('1Ki is valid', function() {
      validMemoryValuesTest('1Ki');
    });

    it('1M is valid', function() {
      validMemoryValuesTest('1M');
    });

    it('1Mi is valid', function() {
      validMemoryValuesTest('1Mi');
    });

    it('1G is valid', function() {
      validMemoryValuesTest('1G');
    });

    it('1Gi is valid', function() {
      validMemoryValuesTest('1Gi');
    });

    it('1T is valid', function() {
      validMemoryValuesTest('1T');
    });

    it('1Ti is valid', function() {
      validMemoryValuesTest('1Ti');
    });

    it('1P is valid', function() {
      validMemoryValuesTest('1P');
    });

    it('1Pi is valid', function() {
      validMemoryValuesTest('1Pi');
    });

    it('1E is valid', function() {
      validMemoryValuesTest('1E');
    });

    it('1Ei is valid', function() {
      validMemoryValuesTest('1Ei');
    });

    it('1m is invalid', function() {
      invalidMemoryValuesTest('1m');
    });

    it('1mi is valid', function() {
      validMemoryValuesTest('1mi');
    });
  });

  describe('Java heap size validation works', function() {
    function getJavaMemoryProperty(value) {
      const myProp = utils.createProperty();
      myProp.addValidator(...validationHelper.getJavaMemoryValidators());
      myProp.observable(value);
      return myProp;
    }

    function validMemoryValuesTest(memory) {
      const memoryProperty = getJavaMemoryProperty(memory);

      try {
        memoryProperty.validate(false);
      } catch (err) {
        assert.fail(`${memory} should be a valid memory value: ${err.message}`);
      }
    }

    function invalidMemoryValuesTest(memory) {
      const memoryProperty = getJavaMemoryProperty(memory);

      try {
        memoryProperty.validate(false);
        assert.fail(`${memory} should be an invalid memory value`);
      } catch {
      }
    }

    it('negative number is invalid', function() {
      invalidMemoryValuesTest('-1');
    });

    it('0 is invalid', function() {
      invalidMemoryValuesTest('0');
    });

    it('0.1 is invalid', function() {
      invalidMemoryValuesTest('0.1');
    });

    it('1024 is valid', function() {
      validMemoryValuesTest('1024');
    });

    it('1024.0 is invalid', function() {
      invalidMemoryValuesTest('1024.0');
    });

    it('1073741824 is valid', function() {
      validMemoryValuesTest('1073741824');
    });

    it('512K is valid', function() {
      validMemoryValuesTest('512K');
    });

    it('512k is valid', function() {
      validMemoryValuesTest('512k');
    });

    it('16M is valid', function() {
      validMemoryValuesTest('16M');
    });

    it('16m is valid', function() {
      validMemoryValuesTest('16m');
    });

    it('1G is valid', function() {
      validMemoryValuesTest('1G');
    });

    it('1g is valid', function() {
      validMemoryValuesTest('1g');
    });
  });
});

