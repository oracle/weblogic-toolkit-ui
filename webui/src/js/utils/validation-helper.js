/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/i18n', 'ojs/ojvalidator', 'ojs/ojvalidation-error', 'ojs/ojvalidator-regexp', 'ojs/ojvalidator-length',
  'ojs/ojvalidator-numberrange'],
function(i18n, Validator, ojvalidationError, RegExpValidator, LengthValidator, NumberRangeValidator) {
  function ValidationHelper() {

    const literalForwardSlash = '[\\/]';

    const nameComponentRegexText = '(?:(?:[a-z0-9]+)(?:(?:[._]|__|[-]?)(?:[a-z0-9]+))*)';
    const hostRegexText = '(?:(?:[a-zA-Z0-9]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])' +
      '(?:(?:[.](?:[a-zA-Z0-9]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]))+)?)';
    const hostAndPortRegexText = `(?:${hostRegexText}(?:[:][0-9]{1,5})?)`;
    const tagRegexText = '[\\w][\\w.-]{0,127}';
    const digestRegexText = '[A-Za-z][A-Za-z0-9]*(?:(?:[-_+.][A-Za-z][A-Za-z0-9]*)*)[:][0-9A-Fa-f]{32,}';
    const nameRegexText = `(?:(${hostAndPortRegexText})${literalForwardSlash})?${nameComponentRegexText}` +
      `(?:${literalForwardSlash}${nameComponentRegexText})*`;
    const imageReferenceRegexText = `^(${nameRegexText})(?:(?:[:](${tagRegexText}))|(?:[@](${digestRegexText})))?$`;

    const k8sNameRegexText = '^[a-z0-9](?:[-a-z0-9]{0,61}[a-z0-9])?$';

    const emailAddressRegexText = '^(?:[a-z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*|' +
      '"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")@' +
      '(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|' +
      '\\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\\.){3}' +
      '(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:' +
      '(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])$';

    const ingressPathRegexText = '^\\/\\S*$';

    this.createValidatableObject = (flowName) => {
      class ValidatableObject {
        constructor(flowNameKey) {
          this.flowNameKey = flowNameKey;
          this.fields = {};
        }

        getDefaultConfigObject() {
          return {
            fieldNameIsKey: true,
            fieldNamePayload: undefined,
            formName: undefined,
            formNameIsKey: true,
            tabName: undefined,
            tabNameIsKey: true,
            subTabName: undefined,
            subTabNameIsKey: true
          };
        }

        addField(fieldName, errors, config) {
          if (errors && !(Array.isArray(errors) && errors.length === 0)) {
            this.fields[fieldName] = { errors: errors, config: config || this.getDefaultConfigObject() };
          }
        }

        hasValidationErrors() {
          return Object.getOwnPropertyNames(this.fields).length > 0;
        }

        getValidationErrorCount() {
          return Object.getOwnPropertyNames(this.fields).length || 0;
        }

        getValidationErrorDialogConfig(title, message) {
          let validationErrorDialogConfig = { title: title };
          if (this.hasValidationErrors()) {
            if (message) {
              validationErrorDialogConfig['message'] = message;
            } else {
              validationErrorDialogConfig['message'] = i18n.t('validation-helper-validation-error-fields-message', {
                fieldCount: this.getValidationErrorCount()
              });
            }

            const errorFields = [];
            for (const [ fieldName, fieldData ] of Object.entries(this.fields)) {
              const field = {
                fieldName: formatFieldName(fieldName, fieldData),
                fieldErrors: getFieldErrorMessages(fieldName, fieldData)
              };
              errorFields.push(field);
            }
            validationErrorDialogConfig['errorFields'] = errorFields;
          }
          return validationErrorDialogConfig;
        }
      }

      return new ValidatableObject(flowName);
    };

    this.validateField = (validators, currentValue, isRequired = false) => {
      return this._validateSpecialField(validators, currentValue, isRequired);
    };

    this.validateRequiredField = (currentValue) => {
      return _validateRequiredFieldValue(currentValue);
    };

    this.getRequiredFieldValidators = () => {
      return [
        {
          validate: _validateRequiredFieldValue
        }
      ];
    };

    this.getK8sCpuValidators = () => {
      return [
        {
          validate: _validateK8sCpuValue
        }
      ];
    };

    this.getK8sMemoryValidators = () => {
      return [
        {
          validate: _validateK8sMemoryValue
        }
      ];
    };

    this.getJavaMemoryValidators = () => {
      return [
        {
          validate: _validateJavaMemoryValue
        }
      ];
    };

    this.getImageTagValidators = (options) => {
      const regExpValidatorOptions = {
        pattern: imageReferenceRegexText,
        hint: getHintField(options, 'hint', i18n.t('validation-helper-image-tag-hint')),
        messageSummary: getMessageSummary(options),
        messageDetail: getMessageDetail(options, 'messageDetail',
          i18n.t('validation-helper-image-tag-message-detail'))
      };
      const lengthValidatorOptions = !!options ? JSON.parse(JSON.stringify(options)) : {};
      lengthValidatorOptions.max = 255;
      return [ new RegExpValidator(regExpValidatorOptions), this.getLengthValidator(lengthValidatorOptions) ];
    };

    this.getK8sNameValidators = (options) => {
      const regExpValidatorOptions = {
        pattern: k8sNameRegexText,
        hint: getHintField(options, 'hint', i18n.t('validation-helper-k8s-name-validator-hint')),
        messageSummary: getMessageSummary(options),
        messageDetail: getMessageDetail(options, 'messageDetail', i18n.t('validation-helper-k8s-name-validator-message-detail'))
      };
      return [ new RegExpValidator(regExpValidatorOptions) ];
    };

    this.getHostNameValidators = (options) => {
      const regExpValidatorOptions = {
        pattern: hostRegexText,
        hint: getHintField(options, 'hint', i18n.t('validation-helper-hostname-hint')),
        messageSummary: getMessageSummary(options),
        messageDetail: getMessageDetail(options, 'messageDetail', i18n.t('validation-helper-hostname-message-detail'))
      };
      const lengthValidatorOptions = !!options ? JSON.parse(JSON.stringify(options)) : {};
      lengthValidatorOptions.max = 63;
      return [ new RegExpValidator(regExpValidatorOptions), this.getLengthValidator(lengthValidatorOptions) ];
    };

    this.getEmailAddressValidators = (options) => {
      const regExpValidatorOptions = {
        pattern: emailAddressRegexText,
        hint: getHintField(options, 'hint', i18n.t('validation-helper-email-address-hint')),
        messageSummary: getMessageSummary(options),
        messageDetail: getMessageDetail(options, 'messageDetail', i18n.t('validation-helper-email-address-message-detail'))
      };
      const lengthValidatorOptions = !!options ? JSON.parse(JSON.stringify(options)) : {};
      lengthValidatorOptions.max = 320;   // 64 + @ + 255
      return [ new RegExpValidator(regExpValidatorOptions), this.getLengthValidator(lengthValidatorOptions) ];
    };

    this.getPortNumberValidators = (options) => {
      const portNumberValidatorOptions = !!options ? JSON.parse(JSON.stringify(options)) : {};
      portNumberValidatorOptions.min = getNumberField(options, 'min', 1);
      portNumberValidatorOptions.max = getNumberField(options, 'max', 65535);
      return [ this.getNumberRangeValidator(portNumberValidatorOptions) ];
    };

    this.getIngressPathValidators = (options) => {
      const regExpValidatorOptions = {
        pattern: ingressPathRegexText,
        hint: getHintField(options, 'hint', i18n.t('validation-helper-ingress-path-hint')),
        messageSummary: getMessageSummary(options),
        messageDetail: getMessageDetail(options, 'messageDetail', i18n.t('validation-helper-ingress-path-message-detail'))
      };
      return [ new RegExpValidator(regExpValidatorOptions) ];
    };

    this.getLengthValidator = (options) => {
      const lengthValidatorOptions = {
        min: getNumberField(options, 'min'),
        max: getNumberField(options, 'max'),
        hint: getHintField(options),
        'hint.min': getHintField(options, 'hint.min'),
        'hint.max': getHintField(options, 'hint.max'),
        'hint.inRange': getHintField(options, 'hint.inRange'),
        'hint.exact': getHintField(options, 'hint.exact'),
        messageSummary: getMessageSummary(options),
        'messageSummary.tooShort': getMessageSummary(options, 'messageSummary.tooShort'),
        'messageSummary.tooLong': getMessageSummary(options, 'messageSummary.tooLong'),
        messageDetail: getMessageDetail(options),
        'messageDetail.tooShort': getMessageDetail(options, 'messageDetail.tooShort'),
        'messageDetail.tooLong': getMessageDetail(options, 'messageDetail.tooLong'),
      };
      return new LengthValidator(lengthValidatorOptions);
    };

    this.getNumberRangeValidator = (options) => {
      const numberRangeValidatorOptions = {
        min: getNumberField(options, 'min'),
        max: getNumberField(options, 'max'),
        hint: getHintField(options),
        'hint.min': getHintField(options, 'hint.min'),
        'hint.max': getHintField(options, 'hint.max'),
        'hint.inRange': getHintField(options, 'hint.inRange'),
        'hint.exact': getHintField(options, 'hint.exact'),
        messageSummary: getMessageSummary(options),
        'messageSummary.rangeUnderflow': getMessageSummary(options, 'messageSummary.rangeUnderflow'),
        'messageSummary.rangeOverflow': getMessageSummary(options, 'messageSummary.rangeOverflow'),
        messageDetail: getMessageDetail(options),
        'messageDetail.rangeUnderflow': getMessageDetail(options, 'messageDetail.rangeUnderflow'),
        'messageDetail.rangeOverflow': getMessageDetail(options, 'messageDetail.rangeOverflow'),
        'messageDetail.exact': getMessageDetail(options, 'messageDetail.exact'),
      };
      return new NumberRangeValidator(numberRangeValidatorOptions);
    };

    this.validateK8sName = (currentValue, isRequired, options) => {
      return this._validateSpecialField(this.getK8sNameValidators(options), currentValue, isRequired);
    };

    this.validateHostName = (currentValue, isRequired, options) => {
      return this._validateSpecialField(this.getHostNameValidators(options), currentValue, isRequired);
    };

    this.validateEmailAddress = (currentValue, isRequired, options) => {
      return this._validateSpecialField(this.getEmailAddressValidators(options), currentValue, isRequired);
    };

    this.validatePortNumber = (currentValue, isRequired, options) => {
      return this._validateSpecialField(this.getPortNumberValidators(options), currentValue, isRequired);
    };

    // This is to be able to support dynamic tables where the individual attributes
    // are not stored as observable properties.
    this._validateSpecialField = (validators, currentValue, isRequired) => {
      let errMessages = [];

      if (isRequired || (currentValue && currentValue.toString().length > 0)) {
        for (const validator of validators) {
          try {
            validator.validate(currentValue);
          } catch (err) {
            // Another option might be to try to get the hint, messageSummary, or messageDetail fields from the validator...
            errMessages.push(toErrorMessage(err));
          }
        }
      }

      if (isRequired) {
        const requiredMessage = this.validateRequiredField(currentValue);
        if (requiredMessage) {
          errMessages.push(requiredMessage);
        }
      }

      if (errMessages.length === 0) {
        errMessages = undefined;
      }
      return errMessages;
    };

    function toErrorMessage(err) {
      if (err instanceof Error) {
        return err.message;
      } else if (err instanceof String) {
        return err;
      } else {
        return err.toString();
      }
    }

    function getNumberField(options, fieldName, defaultValue) {
      let result = defaultValue;
      if (options && options[fieldName] !== undefined && options[fieldName] !== null) {
        result = options[fieldName];
      }
      return result;
    }

    function getHintField(options, fieldName, defaultValue) {
      if (!fieldName) {
        fieldName = 'hint';
      }
      return getMessage(options, fieldName, defaultValue);
    }

    function getMessageSummary(options, fieldName, defaultValue) {
      if (!fieldName) {
        fieldName = 'messageSummary';
      }
      return getMessage(options, fieldName, defaultValue);
    }

    function getMessageDetail(options, fieldName, defaultValue) {
      if (!fieldName) {
        fieldName = 'messageDetail';
      }
      return getMessage(options, fieldName, defaultValue);
    }

    function getMessage(options, fieldName, defaultValue) {
      let message = defaultValue;
      if (options && options[fieldName]) {
        let key = options[fieldName];

        const payloadName = fieldName.payload;
        if (options[payloadName]) {
          message = i18n.t(key, [payloadName]);
        } else {
          message = i18n.t(key);
        }
      }
      return message;
    }

    function _validateRequiredFieldValue(value) {
      let requiredMessage;
      if (value === undefined || value === null) {
        requiredMessage = i18n.t('validation-helper-validate-field-value-is-not-defined');
      } else if (value === '') {
        requiredMessage = i18n.t('validation-helper-validate-string-field-value-is-empty');
      } else if (Array.isArray(value) && value.length === 0) {
        requiredMessage = i18n.t('validation-helper-validate-array-field-value-is-empty');
      }
      return requiredMessage;
    }

    const K8S_CPU_REGEX = [ /^[1-9]\d*[Mm]?$/, /^\d+(\.\d{1,3})?$/, /^0\.\d{1,3}$/ ];
    const K8S_CPU_HELP_URL = 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#meaning-of-cpu';
    function _validateK8sCpuValue(value) {
      if (!value) {
        return;
      }

      let foundMatch = false;
      for (const regex of K8S_CPU_REGEX) {
        if (regex.test(value)) {
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        throw new Error(i18n.t('validation-helper-k8s-cpu-error', { value: value, url: K8S_CPU_HELP_URL }));
      }
    }

    const K8S_MEMORY_REGEX = /^[1-9]\d*((E|P|T|G|M|K)i?)?$/;
    const K8S_MEMORY_HELP_URL = 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#meaning-of-memory';
    function _validateK8sMemoryValue(value) {
      if (value && !K8S_MEMORY_REGEX.test(value)) {
        throw new Error(i18n.t('validation-helper-k8s-memory-error', { value: value, url: K8S_MEMORY_HELP_URL }));
      }
    }

    const JAVA_MEMORY_REGEX = /^[1-9]\d*(k|K|m|M|g|G)?$/;
    const JAVA_MEMORY_HELP_URL = 'https://docs.oracle.com/javase/8/docs/technotes/tools/windows/java.html#BABDJJFI';
    function _validateJavaMemoryValue(value) {
      if (value && !JAVA_MEMORY_REGEX.test(value)) {
        throw new Error(i18n.t('validation-helper-java-memory-error', { value: value, url: JAVA_MEMORY_HELP_URL }));
      }
    }
  }

  function formatFieldName(fieldName, fieldData) {
    let result;
    const messagePayload = {};
    if (fieldData.config.fieldNameIsKey) {
      messagePayload['fieldName'] = i18n.t(fieldName, fieldData.config.fieldNamePayload);
    } else {
      messagePayload['fieldName'] = fieldName;
    }

    if (fieldData.config.formName) {
      let resultKey = 'validation-helper-form-and-field-name-message';
      if (fieldData.config.formNameIsKey) {
        messagePayload['formName'] = i18n.t(fieldData.config.formName);
      } else {
        messagePayload['formName'] = fieldData.config.formName;
      }

      if (fieldData.config.tabName) {
        resultKey = 'validation-helper-form-tab-and-field-name-message';
        if (fieldData.config.tabNameIsKey) {
          messagePayload['tabName'] = i18n.t(fieldData.config.tabName);
        } else {
          messagePayload['tabName'] = fieldData.config.tabName;
        }

        if (fieldData.config.subTabName) {
          resultKey = 'validation-helper-form-tab-sub-tab-and-field-name-message';
          if (fieldData.config.subTabNameIsKey) {
            messagePayload['subTabName'] = i18n.t(fieldData.config.subTabName);
          } else {
            messagePayload['subTabName'] = fieldData.config.subTabName;
          }
        }
      }
      result = i18n.t(resultKey, messagePayload);
    } else {
      result = messagePayload['fieldName'];
    }
    return result;
  }

  function getFieldErrorMessages(fieldName, fieldData) {
    const errorMessages = [];
    if (Array.isArray(fieldData.errors)) {
      if (fieldData.errors.length > 0) {
        errorMessages.push(...fieldData.errors);
      }
    } else {
      errorMessages.push(fieldData.errors);
    }
    return errorMessages;
  }

  return new ValidationHelper();
});
