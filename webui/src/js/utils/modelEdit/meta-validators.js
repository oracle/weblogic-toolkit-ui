/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/wkt-logger', 'utils/modelEdit/message-helper'],
  function (ko, WktLogger, MessageHelper) {
    function MetaValidators() {
      // *********************
      // attribute validators
      // *********************

      const INTEGER_REGEX = /^(-?[0-9]*)$/;
      const DOUBLE_REGEX = /^(-?[0-9]+(?:\.[0-9]*)?)$/;

      // java min and max seem to be the limits in WebLogic docs
      const MIN_INT = -2147483648;
      const MAX_INT = 2147483647;

      const MIN_LONG = -9223372036854775808n;  // n => BigInt
      const MAX_LONG = 9223372036854775807n;

      const MIN_PORT = 1;
      const MAX_PORT = 65535;

      this.defaultInteger = () => {
        return {
          validate: value => {
            checkIntegerText(value);
            validateRange(value, MIN_INT, MAX_INT);
          }
        };
      };

      this.defaultLong = () => {
        return {
          validate: value => {
            checkIntegerText(value);
            validateLongRange(value, MIN_LONG, MAX_LONG);
          }
        };
      };

      this.defaultDouble = () => {
        return {
          validate: value => {
            checkDoubleText(value);
          }
        };
      };

      this.port = () => {
        return {
          validate: value => {
            checkIntegerText(value);
            validateRange(value, MIN_PORT, MAX_PORT);
          }
        };
      };

      this.range = (args, type) => {
        if(!args || args.length < 2) {
          WktLogger.error('Range validator must have two arguments');
          return {};
        }

        if(type === 'long') {
          const min = args[0].length ? BigInt(args[0]) : MIN_LONG;
          const max = args[1].length ? BigInt(args[1]) : MAX_LONG;
          return {
            validate: value => {
              checkIntegerText(value);
              validateLongRange(value, min, max);
            }
          };

        } else if(type === 'double') {
          const min = args[0].length ? Number(args[0]) : MIN_INT;
          const max = args[1].length ? Number(args[1]) : MAX_INT;
          return {
            validate: value => {
              checkDoubleText(value);
              validateDoubleRange(value, min, max);
            }
          };

        } else {
          const min = args[0].length ? Number(args[0]) : MIN_INT;
          const max = args[1].length ? Number(args[1]) : MAX_INT;
          return {
            validate: value => {
              checkIntegerText(value);
              validateRange(value, min, max);
            }
          };
        }
      };

      const validateRange = (value, min, max) => {
        if(value) {
          const number = parseInt(value, 10);
          if((number < min) || (number > max)) {
            throw new Error(MessageHelper.t('invalid-range-error', {min, max}));
          }
        }
      };

      const validateDoubleRange = (value, min, max) => {
        if(value) {
          const number = parseFloat(value);
          if((number < min) || (number > max)) {
            throw new Error(MessageHelper.t('invalid-range-error', {min, max}));
          }
        }
      };

      const validateLongRange = (value, min, max) => {
        if(value) {
          const number = BigInt(value);
          if((number < min) || (number > max)) {
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

      this.getLongValue = value => {
        const result = value.match(INTEGER_REGEX);
        if(result && (result.length > 1)) {
          return BigInt(result[1]);
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

      const checkIntegerText = value => {
        if(value && !INTEGER_REGEX.test(value)) {
          throw new Error(MessageHelper.t('invalid-integer-error'));
        }
      };

      const checkDoubleText = value => {
        if(value && !DOUBLE_REGEX.test(value)) {
          throw new Error(MessageHelper.t('invalid-double-error'));
        }
      };
    }

    // return a singleton instance
    return new MetaValidators();
  }
);
