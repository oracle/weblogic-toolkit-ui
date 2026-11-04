/**
  Copyright (c) 2015, 2026, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/
'use strict';

const { lstat, mkdir, mkdtemp, rename, rm } = require('fs/promises');
const path = require('path');

/* global __dirname */
const sourceDirectory = path.resolve(__dirname, '..', '..', 'web');
const targetDirectory = path.resolve(__dirname, '..', '..', '..', 'electron', 'app', 'web');

module.exports = async function (configObj) {
  console.log('Running after_build hook.');
  console.log('Purging unnecessary files created by the build...');
  await rm(path.join(sourceDirectory, 'test'), { force: true, recursive: true });

  if (configObj.buildType === 'release') {
    console.log('Consolidating files for building the release');
    await replaceDirectory(sourceDirectory, targetDirectory);
  }

  return configObj;
};

async function replaceDirectory(source, target) {
  if (!(await lstat(source)).isDirectory()) {
    throw new Error(`Build output is not a directory: ${source}`);
  }

  // Keep the previous output outside the Electron package while publishing the new tree.
  const backupDirectory = await mkdtemp(path.join(path.dirname(source), '.web-previous-'));
  const backup = path.join(backupDirectory, 'web');
  let hasPreviousOutput = false;
  let preserveBackup = false;

  try {
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await rename(target, backup);
      hasPreviousOutput = true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    try {
      await rename(source, target);
    } catch (error) {
      if (hasPreviousOutput) {
        try {
          await rename(backup, target);
        } catch (restoreError) {
          preserveBackup = true;
          throw new AggregateError([error, restoreError],
            `Could not publish the build or restore the previous output, preserved at ${backup}`);
        }
      }
      throw error;
    }
  } finally {
    if (!preserveBackup) {
      await rm(backupDirectory, { force: true, recursive: true });
    }
  }
}
