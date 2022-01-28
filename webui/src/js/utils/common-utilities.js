/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which controls display of the main dialog.
 * Returns a singleton.
 */
define([],
  function () {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    // binary to string lookup table
    const b2s = alphabet.split('');

    const ntob = (number) => {
      if (number < 0) return `-${ntob(-number)}`;

      let lo = number >>> 0;
      let hi = (number / 4294967296) >>> 0;

      let right = '';
      while (hi > 0) {
        right = b2s[0x3f & lo] + right;
        lo >>>= 6;
        lo |= (0x3f & hi) << 26;
        hi >>>= 6;
      }

      let left = '';
      do {
        left = b2s[0x3f & lo] + left;
        lo >>>= 6;
      } while (lo > 0);

      return left + right;
    };

    return {
      /**
       * Returns true if the two objects are equal. This can compare scalars,
       * strings, arrays, and object.
       * @param obj1 the first object to compare
       * @param obj2 the second object to compare
       */
      equals(obj1, obj2) {
        if (obj1 === obj2) return true;
        if (obj1 === null || obj2 === null) return false;
        if (typeof obj1 !== typeof obj2) return false;
        if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

        if (Array.isArray(obj1)) return this.arraysEqual(obj1, obj2);
        if (typeof obj1 === 'object') return this.objectsEqual(obj1, obj2);

        return false;
      },

      arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
          if (!this.equals(arr1[i], arr2[i])) return false;
        }
        return true;
      },

      objectsEqual(obj1, obj2) {
        if (!this.arraysEqual(Object.keys(obj1).sort(), Object.keys(obj2).sort())) return false;

        return Object.keys(obj1).every(key => this.equals(obj1[key], obj2[key]));
      },

      k8sNameRegexp: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,

      k8sMaxNameLength: 63,

      /**
       * Returns true if the specified argument is a string which complies with
       * Kubernetes rules for names.
       * @param name the string to check
       */
      isLegalK8sName(name) {
        return typeof name == 'string'
          && name.length <= this.k8sMaxNameLength
          && this.k8sNameRegexp.test(name);
      },

      /**
       * Converts the specified string to a legal K8s name.
       * @param name the string to convert
       */
      toLegalK8sName(name) {
        if (this.isLegalK8sName(name)) return name;

        let result = name.toLowerCase().replace(/[^-a-z0-9]/, '-');
        while (result.startsWith('-')) result = result.slice(1);
        while (result.endsWith('-')) result = result.substring(0, result.length-1);

        return result.substring(0, this.k8sMaxNameLength);
      },

      hashIt(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
          ch = str.charCodeAt(i);
          h1 = Math.imul(h1 ^ ch, 2654435761);
          h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
        h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
        return ntob(4294967296 * (2097151 & h2) + (h1>>>0));
      },

      getShortUuid() {
        const uuid = window.api.utils.generateUuid();
        return this.hashIt(uuid);
      },

      capitalizeFirstLetter(str) {
        let result = str;
        if (str) {
          if (str.length > 1) {
            result = str[0].toUpperCase() + str.slice(1);
          } else {
            result = str[0].toUpperCase();
          }
        }
        return result;
      }
    };
  }
);
