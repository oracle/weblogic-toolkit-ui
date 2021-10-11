/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

const path = require('path');
const fsPromises = require('fs/promises');

function getEntryTypes() {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');

  return {
    'applicationDir': {
      name: i18n.t('wdt-archiveType-applicationDir'),
      subtype: 'dir',
      pathPrefix: 'wlsdeploy/applications/'
    },
    'applicationFile': {
      name: i18n.t('wdt-archiveType-applicationFile'),
      subtype: 'file',
      extensions: ['ear', 'war'],
      pathPrefix: 'wlsdeploy/applications/'
    },
    'atpWallet': {
      name: i18n.t('wdt-archiveType-atpWallet'),
      subtype: 'file',
      extensions: ['zip'],
      pathPrefix: 'atpwallet/'
    },
    'classpathLibrary': {
      name: i18n.t('wdt-archiveType-classpathLibrary'),
      subtype: 'file',
      extensions: ['jar'],
      pathPrefix: 'wlsdeploy/classpathLibraries/'
    },
    'coherenceStore': {
      name: i18n.t('wdt-archiveType-coherenceStore'),
      subtype: 'emptyDir',
      pathPrefix: 'wlsdeploy/coherence/'
    },
    'domainBin': {
      name: i18n.t('wdt-archiveType-domainBin'),
      subtype: 'file',
      pathPrefix: 'wlsdeploy/domainBin/'
    },
    'domainLibrary': {
      name: i18n.t('wdt-archiveType-domainLibrary'),
      subtype: 'file',
      extensions: ['jar'],
      pathPrefix: 'wlsdeploy/domainLibraries/'
    },
    'nodeManagerFile': {
      name: i18n.t('wdt-archiveType-nodeManagerFile'),
      subtype: 'file',
      pathPrefix: 'wlsdeploy/nodeManager/'
    },
    'opssWallet': {
      name: i18n.t('wdt-archiveType-opssWallet'),
      subtype: 'file',
      extensions: ['zip'],
      pathPrefix: 'opsswallet/'
    },
    'script': {
      name: i18n.t('wdt-archiveType-script'),
      subtype: 'file',
      pathPrefix: 'wlsdeploy/scripts/'
    },
    'serverFileDirectory': {
      name: i18n.t('wdt-archiveType-serverFileDir'),
      subtype: 'dir',
      pathPrefix: 'wlsdeploy/servers/'
    },
    'sharedLibraryDir': {
      name: i18n.t('wdt-archiveType-sharedLibraryDir'),
      subtype: 'dir',
      pathPrefix: 'wlsdeploy/sharedLibraries/'
    },
    'sharedLibraryFile': {
      name: i18n.t('wdt-archiveType-sharedLibraryFile'),
      subtype: 'file',
      extensions: ['jar'],
      pathPrefix: 'wlsdeploy/sharedLibraries/'
    },
    'fileStore': {
      name: i18n.t('wdt-archiveType-fileStore'),
      subtype: 'emptyDir',
      pathPrefix: 'wlsdeploy/stores/'
    }
  };
}


// choose an archive entry of the specified type.
async function chooseArchiveEntry(targetWindow, entryType) {
  const typeDetail = getEntryTypes()[entryType];
  if(!typeDetail) {
    throw('Unknown archive entry type: ' + entryType);
  }

  // the full file system path, ex. /home/me/abc.jar
  let filePath = null;
  // the path to an archive member, ex. wlsdeploy/apps/my.war, wlsdeploy/apps/exploded
  let archivePath = null;
  // the path to use in archive updates (directories end with /)
  let archiveUpdatePath = null;
  // file paths below a selected directory entry
  let childPaths = null;

  const subtype = typeDetail['subtype'];
  switch(subtype) {
    case 'file':
      filePath = await chooseArchiveFileEntry(targetWindow, typeDetail);
      if(filePath) {
        archivePath = typeDetail['pathPrefix'] + path.basename(filePath);
        archiveUpdatePath = archivePath;
      }
      break;
    case 'dir':
      filePath = await chooseArchiveDirEntry(targetWindow, typeDetail);
      if(filePath) {
        archivePath = typeDetail['pathPrefix'] + path.basename(filePath);
        archiveUpdatePath = archivePath + '/';
        childPaths = await _getDirectoryPaths(filePath);
      }
      break;
    default:
      // note: emptyDir subtype is currently handled on client side
      throw('Unrecognized archive entry subtype: ' + subtype);
  }

  return {filePath: filePath, archivePath: archivePath, archiveUpdatePath: archiveUpdatePath, childPaths: childPaths};
}

async function chooseArchiveFileEntry(targetWindow, typeDetail) {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');

  const title = i18n.t('dialog-chooseArchiveEntry', {entryType: typeDetail.name});

  let options = {
    title: title,
    message: title,
    buttonLabel: i18n.t('button-select'),
    properties: ['openFile', 'dontAddToRecent']
  };

  const filterExtensions = typeDetail.extensions;
  if(filterExtensions) {
    const filterName = i18n.t('dialog-archiveEntryFilter', {entryType: typeDetail.name});
    options['filters'] = [
      {name: filterName, extensions: filterExtensions}
    ];
  }

  const wktWindow = require('./wktWindow');
  return await wktWindow.chooseFromFileSystem(targetWindow, options);
}

async function chooseArchiveDirEntry(targetWindow, typeDetail) {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');

  const title = i18n.t('dialog-chooseArchiveEntry', {entryType: typeDetail.name});

  let options = {
    title: title,
    message: title,
    buttonLabel: i18n.t('button-select'),
    properties: ['openDirectory', 'dontAddToRecent']
  };

  const wktWindow = require('./wktWindow');
  return await wktWindow.chooseFromFileSystem(targetWindow, options);
}

// get a list of paths for all the files and folders in the specified directory.
// the paths should be relative to the directory, and folders should end with / .
async function _getDirectoryPaths(directory) {
  const paths = [];
  await _addDirectoryPaths(directory, paths, null);
  return paths;
}

async function _addDirectoryPaths(directory, paths, pathPrefix) {
  const dirContents = await fsPromises.readdir(directory, {withFileTypes: true});
  for (const entry of dirContents) {
    let name = entry.name;
    let path = pathPrefix ? pathPrefix + '/' + name : name;
    let fullPath = entry.isDirectory() ? path + '/' : path;
    paths.push(fullPath);

    if(entry.isDirectory()) {
      const subdirectory = directory + '/' + name;
      await _addDirectoryPaths(subdirectory, paths, path);
    }
  }
}

module.exports = {
  getEntryTypes,
  chooseArchiveEntry
};
