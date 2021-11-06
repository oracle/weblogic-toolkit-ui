/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const proxyquire = require('proxyquire');
const path = require('path');
const { readFileSync } = require('fs');

const { describe, it, xit } = require('mocha');
const { expect } = require('chai');

const packageJson = require('../../package.json');

const wktLoggerMock = {
  getLogger: () => {
    return console;
  }
};

/* global __dirname, process */
describe('WKT App tests', () => {
  const WktApp = proxyquire('../js/wktApp', { './wktLogging': wktLoggerMock });

  const baseDir = path.normalize(path.join(path.join(__dirname, '..', '..', '..')));

  const electronStub = {
    app: {
      getAppPath: () => {
        return path.join(baseDir, 'Electron');
      },
      // eslint-disable-next-line no-unused-vars
      getPath: (type) => {
        let result = baseDir;
        if (process.platform === 'darwin') {
          result = path.join(result, 'someMacOsDirectory');
        }
        return path.join(result, 'WebLogic Kubernetes Toolkit UI');
      }
    }
  };

  const WktMode = proxyquire('../js/wktMode', { electron: electronStub });

  function getDefaultVersionNumber() {
    const packageJsonFileName = path.normalize(path.join(__dirname, '..', '..', 'package.json'));
    const packageJson = require(packageJsonFileName);
    const wktuiVersionFileName = path.normalize(path.join(__dirname, '..', '..', '..', 'WKTUI_VERSION.txt'));
    const qualifier = readFileSync(wktuiVersionFileName, { encoding: 'utf8'});
    return `${packageJson.version}${qualifier.trim()}`;
  }

  it('make sure application name works', () => {
    const wktMode = new WktMode(path.join(__dirname, 'Electron'));
    const wktApp = new WktApp(wktMode);

    expect(wktApp.getApplicationName()).to.equal(packageJson.productName);
  });

  it('make sure application version works', () => {
    const wktMode = new WktMode(path.join(__dirname, 'Electron'));
    const wktApp = new WktApp(wktMode);

    expect(wktApp.getApplicationVersion()).to.equal(packageJson.version);
  });

  // In Jenkins, the build version is generated and the Jenkinsfile stores it the
  // version_number environment variable.  As such, to make the unit test work properly
  // in both Jenkins and development, we have to compute the expected default based on
  // the presence or absence of the version_number environment variable.
  //
  const expectedVersion = process.env['version_number'] ? process.env['version_number'] : getDefaultVersionNumber();

  it('make sure application build version works in development mode', () => {
    const wktMode = new WktMode(path.join(__dirname, 'Electron'));
    const wktApp = new WktApp(wktMode);

    const actual = wktApp.getApplicationBuildVersion();
    expect(actual).to.equal(expectedVersion);
  });

  // Can't test this since the new location of the file is in the extraResources directory
  // that doesn't exist for unit tests.
  //
  xit('make sure application build version works in executable mode', () => {
    const wktMode = new WktMode(path.join(__dirname, 'WebLogic Kubernetes Toolkit UI'));
    const wktApp = new WktApp(wktMode);

    const actual = wktApp.getApplicationBuildVersion();
    return expect(actual).to.equal(expectedVersion);
  });

  it('make sure application copyright works', () => {
    const wktMode = new WktMode(path.join(__dirname, 'Electron'));
    const wktApp = new WktApp(wktMode);

    expect(wktApp.getApplicationCopyright()).to.equal(packageJson.copyright);
  });

  it('make sure that application website works', () => {
    const wktMode = new WktMode(path.join(__dirname, 'Electron'));
    const wktApp = new WktApp(wktMode);

    expect(wktApp.getApplicationWebsite()).to.equal(packageJson.homepage);
  });
});
