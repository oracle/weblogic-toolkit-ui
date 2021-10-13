/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const path = require('path');
const chai = require('chai');
const { describe, it } = require('mocha');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const osUtils = require('../js/osUtils');
const fsUtils = require('../js/fsUtils');

/* global __dirname, __filename */
describe('File System Utilities tests', () => {
  it('is directory returns true for existing directory', async () => {
    const isDir = await fsUtils.isDirectory(__dirname);
    return expect(isDir).to.be.true;
  });

  it('is directory returns false for existing file', async () => {
    const isDir = await fsUtils.isDirectory(__filename);
    return expect(isDir).to.be.false;
  });

  it('is directory returns false for non-existinng item', async () => {
    const itemName = path.join(__dirname, 'makeBelieve');
    const isDir = await fsUtils.isDirectory(itemName);
    return expect(isDir).to.be.false;
  });

  it('exists returns true on existing directory', async () => {
    const doesExist = await fsUtils.exists(__dirname);
    return expect(doesExist).to.be.true;
  });

  it('exists returns true on existing file', async () => {
    const doesExist = await fsUtils.exists(__filename);
    return expect(doesExist).to.be.true;
  });

  it('exists returns false on non-existing item', async () => {
    const dirName = path.join(__dirname, 'makeBelieve');

    const doesExist = await fsUtils.exists(dirName);
    return expect(doesExist).to.be.false;
  });

  const dirToMake = path.join(__dirname, 'foo', 'bar');
  it('make recursive directories that do not exist works', async () => {
    await fsUtils.makeDirectoryIfNotExists(dirToMake);
    const doesExist = await fsUtils.exists(dirToMake);
    return expect(doesExist).to.be.true;
  });

  it('make directory that already exist to not complain', async () => {
    await fsUtils.makeDirectoryIfNotExists(__dirname);
    const doesExist = await fsUtils.exists(dirToMake);
    return expect(doesExist).to.be.true;
  });

  it('remove directory recursively that exists works', async () => {
    const dirToRemove = path.dirname(dirToMake);
    await fsUtils.removeDirectoryRecursively(dirToRemove);
    const doesExist = await fsUtils.exists(dirToRemove);
    return expect(doesExist).to.be.false;
  });

  it('remove directory recursively that does not exist to not complain', async () => {
    const dirName = path.join(__dirname, 'in', 'the', 'land', 'of', 'make', 'believe');
    const promise = fsUtils.removeDirectoryRecursively(dirName);

    return expect(promise).to.not.be.rejected;
  });

  it('get absolute path for absolute path works', () => {
    expect(fsUtils.getAbsolutePath(__dirname, path.dirname(__dirname))).to.equal(__dirname);
  });

  it('get absolute path for relative path works', () => {
    expect(fsUtils.getAbsolutePath(path.basename(__dirname), path.dirname(__dirname))).to.equal(__dirname);
  });

  it('get executable path for known executable works', () => {
    const exeName = osUtils.isWindows() ? 'node.exe' : 'node';
    const nodePath = fsUtils.getExecutableFilePath(exeName);
    expect(nodePath).to.not.be.undefined;
    expect(nodePath).to.not.be.empty;
    expect(path.basename(nodePath)).to.equal(exeName);
  });

  it('get executable path for bogus executable works', () => {
    expect(fsUtils.getExecutableFilePath('gobbledygook')).to.be.undefined;
  });

  if (!osUtils.isWindows()) {
    it('is root directory works on Unix root directory', () => {
      expect(fsUtils.isRootDirectory('/')).to.be.true;
    });
  } else {
    it('is root directory works on Windows root directory', () => {
      expect(fsUtils.isRootDirectory('C:\\')).to.be.true;
    });
  }

  it('get file list asynchronously from directory recursively works', () => {
    const dir = path.join(__dirname, 'resources', 'nested');
    const expected = [
      path.join(dir, 'deeper', 'deeper.jar'),
      path.join(dir, 'deeper', 'deepest', 'deepest.jar'),
      path.join(dir, 'nested.jar')
    ];

    const promise = fsUtils.getFilesRecursivelyFromDirectory(dir);
    return expect(promise).to.eventually.deep.equal(expected);
  });
});
