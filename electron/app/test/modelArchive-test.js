/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const proxyquire = require('proxyquire');
const chai = require('chai');
const { after, before, describe, it } = require('mocha');
const expect = require('chai').expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const os = require('os');
const path = require('path');
const fs = require('fs');
const fsUtils = require('../js/fsUtils');

const wktLoggerMock = {
  getLogger: () => {
    return console;
  }
};

const modelArchive = proxyquire('../js/modelArchive', { './wktLogging': wktLoggerMock });

/* global __dirname */
describe('Model Archive tests', function () {
  this.timeout(15000);

  const readOnlyRelativePath = path.join('resources', 'wdt-archive.zip');
  const readOnlyArchiveFile = path.join(__dirname, readOnlyRelativePath);
  const workingArchiveFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'wktui-tests-')), 'wdt-archive.zip');
  const newArchiveFile = path.join(path.dirname(workingArchiveFile), 'new-archive.zip');

  before((done) => {
    fs.copyFileSync(readOnlyArchiveFile, workingArchiveFile);
    console.log('workingArchiveFile = %s', workingArchiveFile);
    done();
  });

  after((done) => {
    fs.rmSync(path.dirname(workingArchiveFile), { force: true, recursive: true });
    done();
  });

  it('get archive contents null archive list returns null', () => {
    const promise = modelArchive.getContentsOfArchiveFiles(__dirname, null);
    return expect(promise).to.eventually.be.null;
  });

  it('get archive contents empty archive list returns null', () => {
    const promise = modelArchive.getContentsOfArchiveFiles(__dirname, [ ]);
    return expect(promise).to.eventually.be.null;
  });

  it('get archive contents absolute path returns expected data', () => {
    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        }
      }
    };

    const promise = modelArchive.getContentsOfArchiveFiles(__dirname, [ workingArchiveFile ]);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('get archive contents relative path returns expected data', () => {
    const expected = {};
    expected[readOnlyRelativePath] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        }
      }
    };

    const promise = modelArchive.getContentsOfArchiveFiles(__dirname, [ readOnlyRelativePath ]);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('remove non-existent zip entry leaves the archive with the expected contents', () => {
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'remove', path: 'wlsdeploy/libraries' }
    ];

    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('add with no filePath causes an error', () => {
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'add', path: 'wlsdeploy/libraries/foo.jar' }
    ];

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.be.rejected;
  });

  it('add with null filePath causes an error', () => {
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'add', path: 'wlsdeploy/libraries/foo.jar', filePath: null }
    ];

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.be.rejected;
  });

  it('add with empty filePath causes an error', () => {
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'add', path: 'wlsdeploy/libraries/foo.jar', filePath: '' }
    ];

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.be.rejected;
  });

  it('add with non-existent filePath causes an error', () => {
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'add', path: 'wlsdeploy/libraries/foo.jar', filePath: path.join('foo', 'bar', 'my', 'app.ear') }
    ];

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.be.rejected;
  });

  it('add with existing filePath adds file', () => {
    const addPath = 'wlsdeploy/libraries/nested.jar';
    const jarFile = path.join(__dirname, 'resources', 'nested', 'nested.jar');

    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'add', path: addPath, filePath: jarFile }
    ];

    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        },
        libraries: {
          'nested.jar': ''
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('remove file leaves archive with expected content', () => {
    const addPath = 'wlsdeploy/libraries/nested.jar';
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'remove', path: addPath }
    ];

    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('add empty folder adds the empty folder', () => {
    const addPath = 'wlsdeploy/stores/mystore/';
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'add', path: addPath }
    ];

    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        },
        stores: {
          mystore: { }
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('remove folder removes the folder', () => {
    const removePath = 'wlsdeploy/stores/';
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'remove', path: removePath }
    ];

    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('add exploded directory to new zip file added expected content', () => {
    const addFilePath = path.join(__dirname, 'resources', 'nested');
    const addPath = 'wlsdeploy/libraries/nested/';
    const archiveUpdates = { };
    archiveUpdates[newArchiveFile] = [
      { op: 'add', path: addPath, filePath: addFilePath }
    ];

    const expected = {};
    expected[newArchiveFile] = {
      wlsdeploy: {
        libraries: {
          nested: {
            'nested.jar': '',
            deeper: {
              deepest: {
                'deepest.jar': ''
              },
              'deeper.jar': ''
            }
          }
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('add exploded directory to new zip file created the file', () => {
    const promise = fsUtils.exists(newArchiveFile);
    return expect(promise).to.eventually.be.true;
  });

  it('add exploded directory added expected content', () => {
    const addFilePath = path.join(__dirname, 'resources', 'nested');
    const addPath = 'wlsdeploy/libraries/nested/';
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'add', path: addPath, filePath: addFilePath }
    ];

    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        },
        libraries: {
          nested: {
            'nested.jar': '',
            deeper: {
              deepest: {
                'deepest.jar': ''
              },
              'deeper.jar': ''
            }
          }
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });

  it('remove folder with contents removed all of the content and the folder recursively', () => {
    const removePath = 'wlsdeploy/libraries/';
    const archiveUpdates = { };
    archiveUpdates[workingArchiveFile] = [
      { op: 'remove', path: removePath }
    ];

    const expected = {};
    expected[workingArchiveFile] = {
      wlsdeploy: {
        applications: {
          'todo.war': ''
        }
      }
    };

    const promise = modelArchive.saveContentsOfArchiveFiles(__dirname, archiveUpdates);
    return expect(promise).to.eventually.deep.equal(expected);
  });
});
