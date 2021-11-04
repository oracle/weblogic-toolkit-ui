/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const errorUtils = require('../js/errorUtils');

describe('errorUtils tests', function() {
  describe('getMaskedErrorMessage tests', function() {
    it('single password is masked in string', function() {
      const pwd = 'sdc98sytrw4yr928hfo';
      const errorMessage = `docker login -u abncd -p ${pwd} phx.ocir.io`;
      const expected = errorMessage.replace(pwd, '********');

      const actual = errorUtils.getMaskedErrorMessage(errorMessage, pwd);
      expect(actual).to.equal(expected);
    });

    it('single password is masked in Error object', function() {
      const pwd = 'sdc98sytrw4yr928hfo';
      const errorMessage = `docker login -u abncd -p ${pwd} phx.ocir.io`;
      const expected = errorMessage.replace(pwd, '********');

      const actual = errorUtils.getMaskedErrorMessage(new Error(errorMessage), pwd);
      expect(actual).to.equal(expected);
    });

    it('two passwords are masked in string', function() {
      const pwd = 'sdc98sytrw4yr928hfo';
      const errorMessage = `Command failed: docker login -u abncd -p ${pwd} phx.ocir.io because ${pwd} is invalid`;
      const expected = errorMessage.replace(pwd, '********');

      const actual = errorUtils.getMaskedErrorMessage(errorMessage, pwd);
      expect(actual).to.equal(expected);
    });

    it('two passwords are masked in Error object', function() {
      const pwd = 'sdc98sytrw4yr928hfo';
      const errorMessage = `Command failed: docker login -u abncd -p ${pwd} phx.ocir.io because ${pwd} is invalid`;
      const expected = errorMessage.replace(pwd, '********');

      const actual = errorUtils.getMaskedErrorMessage(new Error(errorMessage), pwd);
      expect(actual).to.equal(expected);
    });

    it('no password returns input string', function() {
      const pwd = 'sdc98sytrw4yr928hfo';
      const errorMessage = 'docker login -u abncd --password-stdin phx.ocir.io';
      const expected = errorMessage.replace(pwd, '********');

      const actual = errorUtils.getMaskedErrorMessage(errorMessage, pwd);
      expect(actual).to.equal(expected);
    });

    it('no password returns input Error object message', function() {
      const pwd = 'sdc98sytrw4yr928hfo';
      const errorMessage = 'docker login -u abncd --password-stdin phx.ocir.io';
      const expected = errorMessage.replace(pwd, '********');

      const actual = errorUtils.getMaskedErrorMessage(new Error(errorMessage), pwd);
      expect(actual).to.equal(expected);
    });

    it('empty password returns input string', function() {
      const pwd = '';
      const errorMessage = 'docker login -u abncd --password-stdin phx.ocir.io';
      const expected = errorMessage;

      const actual = errorUtils.getMaskedErrorMessage(errorMessage, pwd);
      expect(actual).to.equal(expected);
    });

    it('empty password returns input Error object message', function() {
      const pwd = '';
      const errorMessage = 'docker login -u abncd --password-stdin phx.ocir.io';
      const expected = errorMessage;

      const actual = errorUtils.getMaskedErrorMessage(new Error(errorMessage), pwd);
      expect(actual).to.equal(expected);
    });
  });
});
