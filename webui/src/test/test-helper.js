/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

const path = require('path');
const {WindowStub} = require('./window-stub');
const { JSDOM } = require('jsdom');
const requirejs = require('requirejs');

requirejs.config({
  baseUrl: path.normalize(path.join(__dirname, '..', '..')),
  paths: {
    'knockout': 'node_modules/knockout/build/output/knockout-latest.debug',
    'ojs': 'node_modules/@oracle/oraclejet/dist/js/libs/oj/debug',
    'ojL10n': 'node_modules/@oracle/oraclejet/dist/js/libs/oj/ojL10n',
    'ojtranslations': 'node_modules/@oracle/oraclejet/dist/js/libs/oj/resources',
    'ace': 'src/js/libs/ace/ace',
    'utils': 'src/js/utils',
    'models': 'src/js/models',
    'viewModels': 'src/js/viewModels',
    'i18next': 'node_modules/i18next/i18next'
  }
});

function install() {
  const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');
  WindowStub.install(dom);
}

function remove() {
  WindowStub.remove();
}

module.exports = {
  install,
  remove
};
