/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
"use strict";
const fs = require('fs');
const path = require('path');
const proxyquire = require('proxyquire');
const { assert, expect } = require('chai');

const osUtils = require('../js/osUtils');

const wktLoggerMock = {
  getLogger: () => {
    return console;
  }
}

const childProcessExecutor = proxyquire('../js/childProcessExecutor', { './wktLogging': wktLoggerMock });
const javaUtils = proxyquire('../js/javaUtils', {
  './wktLogging': wktLoggerMock,
  './childProcessExecutor': childProcessExecutor
});

const { getExecutableFilePath } = require('../js/fsUtils');

if (osUtils.isWindows()) {
  it('get Java Home from Windows JDK executable path works', () => {
    const javaHome = 'c:\\Program Files\\Java\\jdk1.8.0_271'
    const pathToJava = path.join(javaHome, 'bin', 'java');

    expect(javaUtils.getJavaHomeFromExecutable(pathToJava)).to.equal(javaHome);
  });
} else {
  it('get Java Home from JDK executable path works', () => {
    const javaHome = '/usr/local/java/jdk1.8.0_271'
    const pathToJava = path.join(javaHome, 'bin', 'java');

    expect(javaUtils.getJavaHomeFromExecutable(pathToJava)).to.equal(javaHome);
  });
}

if (osUtils.isWindows()) {
  it('get Java Home from Windows JRE executable path works', () => {
    const javaHome = 'c:\\Program Files\\Java\\jdk1.8.0_271'
    const pathToJava = path.join(javaHome, 'jre', 'bin', 'java');

    expect(javaUtils.getJavaHomeFromExecutable(pathToJava)).to.equal(javaHome);
  });
} else {
  it('get Java Home from JRE executable path works', () => {
    let javaHome = '/usr/local/java/jdk1.8.0_271'
    const pathToJava = path.join(javaHome, 'jre', 'bin', 'java');

    expect(javaUtils.getJavaHomeFromExecutable(pathToJava)).to.equal(javaHome);
  });
}

it('get Java Home from executable outside Java Home works', () => {
  const pathToJava = '/bin/java';

  expect(javaUtils.getJavaHomeFromExecutable(pathToJava)).to.be.undefined;
});

if (process.platform === 'darwin') {
  if (fs.existsSync('/usr/libexec/java_home')) {
    it('get Java Home from MacOS works', () => {
      expect(javaUtils.getJavaHomeFromMacOS()).to.not.be.undefined;
    });
  } else {
    it('get Java Home from MacOS works', () => {
      expect(javaUtils.getJavaHomeFromMacOS()).to.not.undefined;
    });
  }
}

if (process.platform === 'linux') {
  const javaPath = getExecutableFilePath('java');
  if (javaPath) {
    it('get Java Home from Linux works', () => {
      expect(javaUtils.getJavaHomeFromLinux()).to.not.be.undefined;
    });
  } else {
    it('get Java Home from Linux works', () => {
      expect(javaUtils.getJavaHomeFromLinux()).to.be.undefined;
    });
  }
}

it('try to find Java Home works', async () => {
  try {
    await javaUtils.tryToComputeJavaHome();
  } catch (err) {
    assert.fail(`Expected tryToComputeJavaHome() not to fail: ${err}`);
  }
});
