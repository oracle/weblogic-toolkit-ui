/**
  Copyright (c) 2015, 2025, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/
'use strict';

const { existsSync, rmSync } = require('fs');
const fsPromises = require('fs/promises');
const { rename, mkdir, readdir } = require('fs/promises');
const path = require('path');

const purgeLocations = [
  path.normalize(path.join(__dirname, '..', '..', 'web', 'test'))
];

const webuiJsonDirectory = path.normalize(path.join(__dirname, '..', '..', 'web'));
const webuiJsonFile = path.join(webuiJsonDirectory, 'webui.json');

const sourceDirectories = [
  path.normalize(path.join(__dirname, '..', '..', 'web'))
  // path.normalize(path.join(__dirname, '..', '..', 'staged-themes'))
];
const targetDirectory = path.normalize(path.join(__dirname, '..', '..', '..', 'electron', 'app'));

module.exports = function (configObj) {
  return new Promise(async (resolve) => {
  	console.log("Running after_build hook.");
    console.log('Purging unnecessary files created by the build...');
    for (const purgeLocation of purgeLocations) {
      if (existsSync(purgeLocation)) {
        rmSync(purgeLocation, { force: true, recursive: true });
      }
    }

  	if (configObj.buildType === 'release') {
  	  console.log('Consolidating files for building the release');
  	  for (const sourceDirectory of sourceDirectories) {
  	    if (existsSync(sourceDirectory)) {
          console.log(`Copying ${sourceDirectory} to ${targetDirectory}`)
          await copyDirectoryRecursively(sourceDirectory, targetDirectory);
        }
      }
    }
    resolve(configObj);
  });
};

async function copyDirectoryRecursively(source, target) {
  let files = []

  let _targetDirectory = path.join(target, path.basename(source));
  if (!existsSync(_targetDirectory)) {
    await mkdir(_targetDirectory);
  }

  if (await isDirectory(source)) {
    files = await readdir(source);
    for (const file of files) {
      const currentSource = path.join(source, file);
      if (await isDirectory(currentSource)) {
        await copyDirectoryRecursively(currentSource, _targetDirectory);
      } else {
        await moveFileToDirectory(currentSource, _targetDirectory);
      }
    }
  } else {
    console.log(`Source ${source} was not a directory`);
  }
}

async function moveFileToDirectory(source, target) {
  let targetFile = target;
  if (await isDirectory(target)) {
    targetFile = path.join(target, path.basename(source));
  }
  await rename(source, targetFile);
}

async function isDirectory(testPath) {
  const result = await fsPromises.lstat(testPath).catch(err => {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  });

  return !result ? result: result.isDirectory();
}
