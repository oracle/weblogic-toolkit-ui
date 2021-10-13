/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const { describe, it } = require('mocha');
const path = require('path');

/* global __dirname, process */
describe('WKT Mode tests', () => {
  const electronStub = {
    app: {
      getAppPath: () => {
        return path.join(__dirname, 'Electron');
      },
      // eslint-disable-next-line no-unused-vars
      getPath: (type) => {
        let result = __dirname;
        if (process.platform === 'darwin') {
          result = path.join(result, 'someMacOsDirectory');
        }
        return path.join(result, 'WebLogic Kubernetes Toolkit UI');
      }
    }
  };

  const WktMode = proxyquire('../js/wktMode', { electron: electronStub });

  it('detect development mode for non-Windows platform', () => {
    const wktMode = new WktMode('/path/to/Electron');

    expect(wktMode.isDevelopmentMode()).to.equal(true);
    expect(wktMode.isExecutableMode()).to.equal(false);
  });

  it('detect development mode for Windows platform', () => {
    const wktMode = new WktMode('c:\\path\\to\\Electron.exe');

    expect(wktMode.isDevelopmentMode()).to.equal(true);
    expect(wktMode.isExecutableMode()).to.equal(false);
  });

  it('detect executable mode for non-Windows platform', () => {
    const wktMode = new WktMode('/path/to/WebLogic Kubernetes Toolkit UI');

    expect(wktMode.isDevelopmentMode()).to.equal(false);
    expect(wktMode.isExecutableMode()).to.equal(true);
  });

  it('detect executable mode for Windows platform', () => {
    const wktMode = new WktMode('c:\\path\\to\\WebLogic Kubernetes Toolkit UI.exe');

    expect(wktMode.isDevelopmentMode()).to.equal(false);
    expect(wktMode.isExecutableMode()).to.equal(true);
  });

  it('get extra files directory works in development mode', () => {
    const wktMode = new WktMode(path.join(__dirname, 'Electron'));

    expect(wktMode.getExtraFilesDirectory()).to.equal(__dirname);
  });

  it('get extra files directory works in executable mode', () => {
    const wktMode = new WktMode(path.join(__dirname, 'WebLogic Kubernetes Toolkit UI'));

    expect(wktMode.getExtraFilesDirectory()).to.equal(__dirname);
  });
});
