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
  return new Promise(async (resolve, reject) => {
  	console.log("Running after_build hook.");
    console.log('Purging unnecessary files created by the build...');
    for (const purgeLocation of purgeLocations) {
      if (fs.existsSync(purgeLocation)) {
        fs.rmSync(purgeLocation, { force: true, recursive: true });
      }
    }

    // Write the webui.json file that contains data
    // that the electron side needs during startup.
    //
    const webuiJsonCreated = await generateWebuiJsonFile(webuiJsonDirectory);

  	if (configObj.buildType === 'release') {
  	  console.log('Consolidating files for building the release');
  	  for (const sourceDirectory of sourceDirectories) {
  	    if (fs.existsSync(sourceDirectory)) {
          console.log(`Copying ${sourceDirectory} to ${targetDirectory}`)
          await copyDirectoryRecursively(sourceDirectory, targetDirectory);
        }
      }
    } else {
      if (webuiJsonCreated) {
        await copyFileToDirectory(webuiJsonFile, targetDirectory);
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

async function generateWebuiJsonFile() {
  const contents = {
    // This default value should never be required once the npm dependency actually exists.
    wlRemoteConsoleFrontendVersion: getRemoteConsoleFrontendVersion() || '2.3.0',
  };

  if (!fs.existsSync(targetDirectory)) {
    await mkdir(targetDirectory);
  }

  return new Promise((resolve, reject) => {
    fsPromises.writeFile(webuiJsonFile, JSON.stringify(contents, null, 2), {
      encoding: 'utf8',
      mode: 0o644
    }).then(() => {
      resolve(true)
    }).catch(err => {
      console.error(`Failed to write ${webuiJsonFile} file: ${err}`);
      resolve(false);
    });
  });
}

function getRemoteConsoleFrontendVersion() {
  let version;
  try {
    const packageLock = require('../../package-lock.json');
    version = packageLock?.packages?.['node_modules/@oracle/wrc-jet-pack']?.version;
  } catch {
    // fall through to return undefined...
  }
  return version;
}
