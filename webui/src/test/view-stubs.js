/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

function AccUtilsStub() {
  this.announce = (announcement, level) => {
    this.announcement = announcement;
    this.level = level;
  };
}

function ArrayDataProviderStub(data) {
  this.data = data;
  this.arrayDataProviderHack = true;
}

function ArrayTreeDataProviderStub(data) {
  this.data = (typeof data === 'function') ? data() : data;
  this.arrayTreeDataProviderHack = true;
}

function BufferingDataProviderStub(providerStub) {
  this.providerStub = providerStub;
  this.bufferingDataProviderHack = true;
}

module.exports = {
  AccUtilsStub, ArrayDataProviderStub, ArrayTreeDataProviderStub, BufferingDataProviderStub
};
