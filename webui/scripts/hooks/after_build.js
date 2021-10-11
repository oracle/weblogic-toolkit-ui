/**
  Copyright (c) 2015, 2021, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/

'use strict';

const fs = require('fs');
const fsPromises = require('fs/promises');
const { copyFile, lstat, mkdir, readdir } = require('fs/promises');
const path = require('path');

const sourceDirectories = [
  path.normalize(path.join(__dirname, '..', '..', 'web'))
  // path.normalize(path.join(__dirname, '..', '..', 'staged-themes'))
];
const targetDirectory = path.normalize(path.join(__dirname, '..', '..', '..', 'electron', 'app'));

module.exports = function (configObj) {
  return new Promise(async (resolve, reject) => {
  	console.log("Running after_build hook.");
  	if (configObj.buildType === 'release') {
  	  console.log('Consolidating files for building the release');
  	  for (const sourceDirectory of sourceDirectories) {
  	    if (fs.existsSync(sourceDirectory)) {
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

  let targetDirectory = path.join(target, path.basename(source));
  if (!fs.existsSync(targetDirectory)) {
    await mkdir(targetDirectory);
  }

  if (await isDirectory(source)) {
    files = await readdir(source);
    for (const file of files) {
      const currentSource = path.join(source, file);
      if (await isDirectory(currentSource)) {
        await copyDirectoryRecursively(currentSource, targetDirectory);
      } else {
        await copyFileToDirectory(currentSource, targetDirectory);
      }
    }
  } else {
    console.log(`Source ${source} was not a directory`);
  }
}

async function copyFileToDirectory(source, target) {
  let targetFile = target;
  if (await isDirectory(target)) {
    targetFile = path.join(target, path.basename(source));
  }
  await copyFile(source, targetFile);
}

async function isDirectory(path) {
  const result = await fsPromises.lstat(path).catch(err => {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  });

  return !result ? result: result.isDirectory();
}
