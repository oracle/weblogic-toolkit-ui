/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper'],
  function (ko, ModelEditHelper, MessageHelper) {
    function MetaValidators() {
      // *********************
      // attribute validators
      // *********************

      const INTEGER_REGEX = /^(-?[0-9]*)$/;
      const DOUBLE_REGEX = /^(-?[0-9]+(?:\.[0-9]*)?)$/;
      const MIN_PORT = 1;
      const MAX_PORT = 65535;

      this.integerValidator = {
        validate: value => {
          if(value) {
            if (!INTEGER_REGEX.test(value)) {
              throw new Error(MessageHelper.t('invalid-integer-error'));
            }
          }
        }
      };

      this.doubleValidator = {
        validate: value => {
          if(value) {
            if (!DOUBLE_REGEX.test(value)) {
              throw new Error(MessageHelper.t('invalid-double-error'));
            }
          }
        }
      };

      this.portValidator = {
        validate: value => {
          this.integerValidator.validate(value);
          this.validateRange(value, MIN_PORT, MAX_PORT);
        }
      };

      this.validateRange = (value, min, max) => {
        if(value) {
          const port = parseInt(value, 10);
          if((port < min) || (port > max)) {
            throw new Error(MessageHelper.t('invalid-range-error', {min, max}));
          }
        }
      };

      this.getIntegerValue = value => {
        const result = value.match(INTEGER_REGEX);
        if(result && (result.length > 1)) {
          return parseInt(result[1], 10);
        }
        return null;
      };

      this.getDoubleValue = value => {
        const result = value.match(DOUBLE_REGEX);
        if(result && (result.length > 1)) {
          return parseFloat(result[1]);
        }
        return null;
      };
    }

    // return a singleton instance
    return new MetaValidators();
  }
);
