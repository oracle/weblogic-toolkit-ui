/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
"use strict";
const { expect } = require('chai');
const JSONPath = require('../js/jsonPath');

class InputData {
  constructor() {
    this.inputData = {
      dummy: 'myData',
      image: {
        baseImagePullRequiresAuthentication: true,
        baseImagePullUsername: 'scott',
        oracleSupportUserName: 'fred.flintstone@slaterockandgravel.com'
      },
      k8sDomain: {
        secrets: [
          {
            name: 'wilma',
            username: 'wilma.flintstone@housewives.com'
          },
          {
            name: 'barney',
            username: 'barney.rubble@slaterockandgravel.com'
          },
          {
            name: 'betty',
            username: 'betty.rubble@housewives.com'
          }
        ]
      }
    };
  }

  getInputData() {
    return this.inputData;
  }
}

it('verify that simple json path works', () => {
  const inputData = new InputData().getInputData();
  const jsonPath = 'image.oracleSupportUserName';

  const result = JSONPath.getJsonPathReference(jsonPath, inputData);
  expect(result).to.not.be.null;
  expect(result.reference).to.not.be.null;
  expect(result.field).to.not.be.null;

  expect(result.reference[result.field]).to.not.be.null;
  expect(result.reference[result.field]).to.equal(inputData.image.oracleSupportUserName);

  result.reference[result.field] = null;
  expect(inputData.image.oracleSupportUserName).to.be.null;
});

it('verify that a single element json path works', () => {
  const inputData = new InputData().getInputData();
  const jsonPath = 'dummy';

  const result = JSONPath.getJsonPathReference(jsonPath, inputData);
  expect(result).to.not.be.null;
  expect(result.reference).to.not.be.null;
  expect(result.field).to.not.be.null;

  expect(result.reference[result.field]).to.not.be.null;
  expect(result.reference[result.field]).to.equal(inputData.dummy);

  result.reference[result.field] = null;
  expect(inputData.dummy).to.be.null;
});

it('verify that a json path with an array works', () => {
  const inputData = new InputData().getInputData();
  const jsonPath = 'k8sDomain.secrets[1].username';

  const result = JSONPath.getJsonPathReference(jsonPath, inputData);
  expect(result).to.not.be.null;
  expect(result.reference).to.not.be.null;
  expect(result.field).to.not.be.null;

  expect(result.reference[result.field]).to.not.be.null;
  expect(result.reference[result.field]).to.equal(inputData.k8sDomain.secrets[1].username);

  result.reference[result.field] = null;
  expect(inputData.k8sDomain.secrets[1].username).to.be.null;
});
