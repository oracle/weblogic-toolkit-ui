/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const fsUtils = require('./fsUtils');

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
    'applicationDeploymentPlan': {
      name: i18n.t('wdt-archiveType-applicationDeploymentPlan'),
      subtype: 'file',
      extensions: ['xml'],
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
    'customFile': {
      name: i18n.t('wdt-archiveType-customFile'),
      subtype: 'file',
      pathPrefix: 'wlsdeploy/custom/'
    },
    'customDirectory': {
      name: i18n.t('wdt-archiveType-customDirectory'),
      subtype: 'dir',
      pathPrefix: 'wlsdeploy/custom/'
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
    throw new Error(`Unknown archive entry type: ${entryType}`);
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
      throw new Error(`Unrecognized archive entry subtype: ${subtype}`);
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
  return wktWindow.chooseFromFileSystem(targetWindow, options);
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
  return wktWindow.chooseFromFileSystem(targetWindow, options);
}

// Help the model design view properly handle archive entries when using
// both text fields and the file chooser.
//
// Electron dialog.showOpenDialog has limitations on Windows and Linux
// that only allow either files or directories to be selected, we have
// to jump through some hoops to deal with this:
//
//  - The UI will have a menu for the file chooser to force the user
//    to select file or directory for entries that support both types
//    (e.g., applications can be an archive file or a directory).
//
//  - For these "dual-type" fields, the user may simply type in a path
//    so that the UI does not know if the path is a file or a directory.
//    For that case, the UI will always set showChooser to false and
//    pass the archive type for a file.  The code below will determine if
//    the user provided path is a directory and change the archive type
//    to the matching directory type.
//
async function getArchiveEntry(window, archiveEntryType, options) {
  if (!options) {
    options = {
      providedValue: undefined,
      showChooser: false
    };
  }

  if (options.showChooser) {
    return _getArchiveEntryShowChooser(window, archiveEntryType, options);
  } else {
    return _getArchiveEntry(archiveEntryType, options);
  }
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
    let entryPath = pathPrefix ? pathPrefix + '/' + name : name;
    let fullPath = entry.isDirectory() ? entryPath + '/' : entryPath;
    paths.push(fullPath);

    if(entry.isDirectory()) {
      const subdirectory = directory + '/' + name;
      await _addDirectoryPaths(subdirectory, paths, entryPath);
    }
  }
}

async function _getArchiveEntryShowChooser(targetWindow, archiveEntryTypeName, archiveEntryTypeOptions) {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');

  const result = {};
  const archiveEntryType = getEntryTypes()[archiveEntryTypeName];
  if (!archiveEntryType) {
    result.errorMessage = i18n.t('wdt-archive-invalid-archive-entry-type', { type: archiveEntryTypeName });
    return result;
  }

  let defaultPath;
  if (archiveEntryTypeOptions.providedValue) {
    defaultPath = await fsUtils.getDirectoryForPath(archiveEntryTypeOptions.providedValue);
  }

  const title = i18n.t('dialog-chooseArchiveEntry', {entryType: archiveEntryType.name});
  const chooserType = archiveEntryType.subtype === 'file' ? 'openFile' : 'openDirectory';

  let options = {
    title: title,
    message: title,
    defaultPath: defaultPath,
    buttonLabel: i18n.t('button-select'),
    properties: [chooserType, 'dontAddToRecent']
  };

  const { chooseFromFileSystem } = require('./wktWindow');
  const fileSystemPath = await chooseFromFileSystem(targetWindow, options);

  result.archiveEntryType = archiveEntryTypeName;
  result.fileSystemPath = fileSystemPath;
  if (fileSystemPath) {
    result.archivePath = archiveEntryType['pathPrefix'] + path.basename(fileSystemPath);
    result.archiveUpdatePath = result.archivePath;
    if (chooserType === 'openDirectory') {
      result.archiveUpdatePath = `${result.archivePath}/`;
      result.childPaths = _getDirectoryPaths(result.filePath);
    }
  }
  return result;
}

async function _getArchiveEntry(archiveEntryTypeName, archiveEntryTypeOptions) {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');

  const result = {};
  const archiveEntryTypes = getEntryTypes();
  let archiveEntryType = archiveEntryTypes[archiveEntryTypeName];
  if (!archiveEntryType) {
    result.errorMessage = i18n.t('wdt-archive-invalid-archive-entry-type', { type: archiveEntryTypeName });
    return result;
  }

  const fileSystemPath = archiveEntryTypeOptions.providedValue;
  if (!fileSystemPath) {
    result.errorMessage = i18n.t('wdt-archive-empty-file-system-path');
    return result;
  }

  if (!fs.existsSync(fileSystemPath)) {
    result.errorMessage = i18n.t('wdt-archive-invalid-file-system-path', { path: fileSystemPath });
    return result;
  }

  result.archiveEntryType = archiveEntryTypeName;
  const isDirectory = await fsUtils.isDirectory(fileSystemPath);
  if (!_archiveEntryTypesMatch(isDirectory, archiveEntryType)) {
    if (_archiveEntryTypeHasDualTypes(archiveEntryTypeName)) {
      result.archiveEntryType = _archiveEntryTypeGetOppositeType(archiveEntryTypeName);
    } else {
      const pathType = isDirectory ? 'directory' : 'file';
      const archiveEntryTypeSubtype = archiveEntryType.subtype === 'file' ? 'file' : 'directory';
      result.errorMessage = i18n.t('wdt-archive-entry-path-type-mismatch',
        { archiveEntryTypeName, archiveEntryTypeSubtype, path: fileSystemPath, pathType });
    }
  }

  result.filePath = fileSystemPath;
  result.archivePath = archiveEntryType['pathPrefix'] + path.basename(fileSystemPath);
  result.archiveUpdatePath = result.archivePath;
  if (archiveEntryTypes[result.archiveEntryType].subtype !== 'file') {
    result.archiveUpdatePath = `${result.archivePath}/`;
    result.childPaths = _getDirectoryPaths(result.filePath);
  }
  return result;
}

function _archiveEntryTypesMatch(fileSystemPathIsDirectory, archiveEntryType) {
  let result;
  if (fileSystemPathIsDirectory) {
    result = archiveEntryType.subtype === 'dir' || archiveEntryType.subtype === 'emptyDir';
  } else {
    result = archiveEntryType.subtype === 'file';
  }
  return result;
}

function _archiveEntryTypeHasDualTypes(archiveEntryTypeName) {
  let result;
  switch(archiveEntryTypeName) {
    case 'applicationDir':
    case 'applicationFile':
    case 'customDir':
    case 'customFile':
    case 'sharedLibraryDir':
    case 'sharedLibraryFile':
      result = true;
      break;

    default:
      result = false;
      break;
  }
  return result;
}

function _archiveEntryTypeGetOppositeType(archiveEntryTypeName) {
  let result;
  switch(archiveEntryTypeName) {
    case 'applicationDir':
      result = 'applicationFile';
      break;

    case 'applicationFile':
      result = 'applicationDir';
      break;

    case 'customDir':
      result = 'customFile';
      break;

    case 'customFile':
      result = 'customDir';
      break;

    case 'sharedLibraryDir':
      result = 'sharedLibraryFile';
      break;

    case 'sharedLibraryFile':
      result = 'sharedLibraryDir';
      break;

    default:
      break;
  }
  return result;
}

module.exports = {
  getEntryTypes,
  chooseArchiveEntry,
  getArchiveEntry
};
