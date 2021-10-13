/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

// Returns the index of the first element in sourceArray which includes the specified string, or -1 if none does.
function firstLineIncluding(sourceArray, string) {
  return sourceArray.findIndex(s => s.includes(string));
}

function numExpectedLinesFound(sourceArray, expectedArray) {
  let linesToSearch = sourceArray;
  for (let i = 0; i < expectedArray.length; i++) {
    const index = firstLineIncluding(linesToSearch, expectedArray[i]);
    if (index < 0) return i;
    linesToSearch = linesToSearch.slice(index+1);
  }

  return expectedArray.length;
}

module.exports = function(chai, utils) {
  const Assertion = chai.Assertion;

  Assertion.addMethod('haveLinesContaining', function (strings) {
    const array = this._obj;

    utils.expectTypes(this, ['array']);
    const linesFound = numExpectedLinesFound(array, strings);

    this.assert(
      linesFound === strings.length,
      'expected #{act} to contain #{exp}',
      'expected #{act} not to contain strings',
      strings.slice(linesFound).toString(),
      array.toString()
    );
  });
};
