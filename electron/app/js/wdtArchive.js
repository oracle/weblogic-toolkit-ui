/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const fsUtils = require('./fsUtils');
const errorUtils = require('./errorUtils');
const { getLogger } = require('./wktLogging');

function getEntryTypes() {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');

  return {
    'application': {
      name: i18n.t('wdt-archiveType-application'),
      subtype: 'either',
      // XML because you can deploy WebLogic Modules as applications
      extensions: ['ear', 'war', 'jar', 'xml'],
      dirLabel: i18n.t('wdt-archiveType-application-dirLabel'),
      dirHelp: i18n.t('wdt-archiveType-application-dirHelp'),
      fileLabel: i18n.t('wdt-archiveType-application-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-application-fileHelp'),
      pathPrefix: 'wlsdeploy/applications/'
    },
    'applicationDeploymentPlan': {
      name: i18n.t('wdt-archiveType-applicationDeploymentPlan'),
      subtype: 'file',
      extensions: ['xml'],
      fileLabel: i18n.t('wdt-archiveType-applicationDeploymentPlan-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-applicationDeploymentPlan-fileHelp'),
      pathPrefix: 'wlsdeploy/applications/'
    },
    'applicationInstallationDirectory': {
      name: i18n.t('wdt-archiveType-applicationInstallationDir'),
      subtype: 'dir',
      dirLabel: i18n.t('wdt-archiveType-applicationInstallationDir-dirLabel'),
      dirHelp: i18n.t('wdt-archiveType-applicationInstallationDir-dirHelp'),
      pathPrefix: 'wlsdeploy/structuredApplications/'
    },
    'classpathLibrary': {
      name: i18n.t('wdt-archiveType-classpathLibrary'),
      subtype: 'either',
      extensions: ['jar'],
      dirLabel: i18n.t('wdt-archiveType-classpathLibrary-dirLabel'),
      dirHelp: i18n.t('wdt-archiveType-classpathLibrary-dirHelp'),
      fileLabel: i18n.t('wdt-archiveType-classpathLibrary-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-classpathLibrary-fileHelp'),
      pathPrefix: 'wlsdeploy/classpathLibraries/'
    },
    'coherenceConfig': {
      name: i18n.t('wdt-archiveType-coherenceConfig'),
      subtype: 'file',
      segregatedLabel: i18n.t('wdt-archiveType-coherenceClusterSegregationLabel'),
      segregatedHelp: i18n.t('wdt-archiveType-coherenceClusterSegregationHelp'),
      extensions: ['xml'],
      fileLabel: i18n.t('wdt-archiveType-coherenceConfig-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-coherenceConfig-fileHelp'),
      pathPrefix: 'wlsdeploy/coherence/'
    },
    'coherencePersistenceDirectory': {
      name: i18n.t('wdt-archiveType-coherenceStore'),
      subtype: 'emptyDir',
      subtypeChoices: [
        { name: 'active', label: i18n.t('wdt-archiveType-coherenceStore-activeLabel')},
        { name: 'snapshot', label: i18n.t('wdt-archiveType-coherenceStore-snapshotLabel')},
        { name: 'trash', label: i18n.t('wdt-archiveType-coherenceStore-trashLabel')}
      ],
      segregatedLabel: i18n.t('wdt-archiveType-coherenceClusterSegregationLabel'),
      segregatedHelp: i18n.t('wdt-archiveType-coherenceClusterSegregationHelp'),
      emptyDirLabel: i18n.t('wdt-archiveType-coherenceStore-emptyDirLabel'),
      emptyDirHelp: i18n.t('wdt-archiveType-coherenceStore-emptyDirHelp'),
      pathPrefix: 'wlsdeploy/coherence/'
    },
    'custom': {
      name: i18n.t('wdt-archiveType-custom'),
      subtype: 'either',
      dirLabel: i18n.t('wdt-archiveType-custom-dirLabel'),
      dirHelp: i18n.t('wdt-archiveType-custom-dirHelp'),
      fileLabel: i18n.t('wdt-archiveType-custom-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-custom-fileHelp'),
      pathLabel: i18n.t('wdt-archiveType-custom-pathLabel'),
      pathHelp: i18n.t('wdt-archiveType-custom-pathHelp'),
      pathPrefix: 'wlsdeploy/custom/'
    },
    'databaseWallet': {
      name: i18n.t('wdt-archiveType-databaseWallet'),
      subtype: 'either',
      segregatedLabel: i18n.t('wdt-archiveType-dbWalletSegregationLabel'),
      segregatedHelp: i18n.t('wdt-archiveType-dbWalletSegregationHelp'),
      dirLabel: i18n.t('wdt-archiveType-databaseWallet-dirLabel'),
      dirHelp: i18n.t('wdt-archiveType-databaseWallet-dirHelp'),
      fileLabel: i18n.t('wdt-archiveType-databaseWallet-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-databaseWallet-fileHelp'),
      pathPrefix: 'wlsdeploy/dbWallets/'
    },
    'domainBin': {
      name: i18n.t('wdt-archiveType-domainBin'),
      subtype: 'file',
      fileLabel: i18n.t('wdt-archiveType-domainBin-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-domainBin-fileHelp'),
      pathPrefix: 'wlsdeploy/domainBin/'
    },
    'domainLibrary': {
      name: i18n.t('wdt-archiveType-domainLibrary'),
      subtype: 'file',
      extensions: ['jar'],
      fileLabel: i18n.t('wdt-archiveType-domainLibrary-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-domainLibrary-fileHelp'),
      pathPrefix: 'wlsdeploy/domainLibraries/'
    },
    'fileStore': {
      name: i18n.t('wdt-archiveType-fileStore'),
      subtype: 'emptyDir',
      emptyDirLabel: i18n.t('wdt-archiveType-fileStore-emptyDirLabel'),
      emptyDirHelp: i18n.t('wdt-archiveType-fileStore-emptyDirHelp'),
      pathPrefix: 'wlsdeploy/stores/'
    },
    'jmsForeignServerBinding': {
      name: i18n.t('wdt-archiveType-jmsForeignServerBinding'),
      subtype: 'file',
      segregatedLabel: i18n.t('wdt-archiveType-jmsForeignServerSegregationLabel'),
      segregatedHelp: i18n.t('wdt-archiveType-jmsForeignServerSegregationHelp'),
      extensions: ['properties'],
      fileLabel: i18n.t('wdt-archiveType-jmsForeignServerBinding-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-jmsForeignServerBinding-fileHelp'),
      pathPrefix: 'wlsdeploy/jms/foreignServer/'
    },
    'mimeMapping': {
      name: i18n.t('wdt-archiveType-mimeMapping'),
      subtype: 'file',
      extensions: ['properties'],
      fileLabel: i18n.t('wdt-archiveType-mimeMapping-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-mimeMapping-fileHelp'),
      pathPrefix: 'wlsdeploy/config/'
    },
    'nodeManagerKeystore': {
      name: i18n.t('wdt-archiveType-nodeManagerKeystore'),
      subtype: 'file',
      fileLabel: i18n.t('wdt-archiveType-nodeManagerKeystore-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-nodeManagerKeystore-fileHelp'),
      pathPrefix: 'wlsdeploy/nodeManager/'
    },
    'opssWallet': {
      name: i18n.t('wdt-archiveType-opssWallet'),
      subtype: 'either',
      dirLabel: i18n.t('wdt-archiveType-opssWallet-dirLabel'),
      dirHelp: i18n.t('wdt-archiveType-opssWallet-dirHelp'),
      fileLabel: i18n.t('wdt-archiveType-opssWallet-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-opssWallet-fileHelp'),
      pathPrefix: 'wlsdeploy/opsswallet/'
    },
    'saml2InitializationData': {
      name: i18n.t('wdt-archiveType-saml2InitializationData'),
      subtype: 'file',
      fileLabel: i18n.t('wdt-archiveType-saml2InitializationData-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-saml2InitializationData-fileHelp'),
      pathPrefix: 'wlsdeploy/security/saml2/'
    },
    'script': {
      name: i18n.t('wdt-archiveType-script'),
      subtype: 'file',
      fileLabel: i18n.t('wdt-archiveType-script-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-script-fileHelp'),
      pathPrefix: 'wlsdeploy/scripts/'
    },
    'serverKeystore': {
      name: i18n.t('wdt-archiveType-serverKeystore'),
      subtype: 'file',
      segregatedLabel: i18n.t('wdt-archiveType-serverSegregationLabel'),
      segregatedHelp: i18n.t('wdt-archiveType-serverSegregationHelp'),
      fileLabel: i18n.t('wdt-archiveType-serverKeystore-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-serverKeystore-fileHelp'),
      pathPrefix: 'wlsdeploy/servers/'
    },
    'sharedLibrary': {
      name: i18n.t('wdt-archiveType-sharedLibrary'),
      subtype: 'either',
      extensions: ['ear', 'war', 'jar'],
      dirLabel: i18n.t('wdt-archiveType-sharedLibrary-dirLabel'),
      dirHelp: i18n.t('wdt-archiveType-sharedLibrary-dirHelp'),
      fileLabel: i18n.t('wdt-archiveType-sharedLibrary-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-sharedLibrary-fileHelp'),
      pathPrefix: 'wlsdeploy/sharedLibraries/'
    },
    'sharedLibraryDeploymentPlan': {
      name: i18n.t('wdt-archiveType-sharedLibraryDeploymentPlan'),
      subtype: 'file',
      extensions: ['xml'],
      fileLabel: i18n.t('wdt-archiveType-sharedLibraryDeploymentPlan-fileLabel'),
      fileHelp: i18n.t('wdt-archiveType-sharedLibraryDeploymentPlan-fileHelp'),
      pathPrefix: 'wlsdeploy/sharedLibraries/'
    }
  };
}

async function chooseArchiveEntryFile(targetWindow, entryType, fileType, fileExtensions, currentValue) {
  const i18n = require('./i18next.config');

  const typeDetail = getEntryTypes()[entryType];
  if (!typeDetail) {
    return Promise.reject(new Error(`Unknown archive entry type: ${entryType}`));
  }

  const title = i18n.t('dialog-chooseArchiveEntry', {entryType: typeDetail.name});
  const openProperty = fileType === 'dir' ? 'openDirectory' : 'openFile';

  let options = {
    title: title,
    message: title,
    buttonLabel: i18n.t('button-select'),
    properties: [openProperty, 'dontAddToRecent']
  };

  const defaultPath = await _getDefaultPathFromValue(currentValue);
  if (defaultPath) {
    options.defaultPath = defaultPath;
  }

  if (fileType === 'file' && Array.isArray(fileExtensions) && fileExtensions.length > 0) {
    const filterName = i18n.t('dialog-archiveEntryFilter', {entryType: typeDetail.name});
    options['filters'] = [ {name: filterName, extensions: fileExtensions} ];
  }

  const wktWindow = require('./wktWindow');
  return wktWindow.chooseFromFileSystem(targetWindow, options);
}

async function addArchiveEntry(targetWindow, entryType, entryData) {
  const { getLogger } = require('./wktLogging');

  const typeDetail = getEntryTypes()[entryType];
  if (!typeDetail) {
    return Promise.reject(new Error(`Unknown archive entry type: ${entryType}`));
  }

  if (! await _validateArchiveEntryData(targetWindow, entryType, typeDetail, entryData)) {
    return Promise.resolve({});
  }

  let filePath;
  let archivePath = typeDetail['pathPrefix'];
  let archiveUpdatePath;
  // file paths below a selected directory entry
  let childPaths;

  if (entryData.segregatedName) {
    archivePath = _joinArchivePaths(archivePath, entryData.segregatedName);
  } else if (entryData.customPath) {
    archivePath = _joinArchivePaths(archivePath, entryData.customPath);
  }

  if (entryData.fileType) {
    filePath = entryData.fileName;
    // wallets are special in that when adding one as a directory, you are really only
    // adding the directory content and not the directory itself into the archive path.
    //
    if (entryType === 'databaseWallet' || entryType === 'opssWallet') {
      if (entryData.fileType === 'file') {
        archivePath = _joinArchivePaths(archivePath, path.basename(filePath));
      }
    } else {
      archivePath = _joinArchivePaths(archivePath, path.basename(filePath));
    }
    archiveUpdatePath = archivePath;

    if (entryData.fileType === 'dir') {
      if (!archiveUpdatePath.endsWith('/')) {
        archiveUpdatePath += '/';
      }
      childPaths = await _getDirectoryPaths(filePath);
    }
  } else { // emptyDir
    archivePath = _joinArchivePaths(archivePath, entryData.emptyDirName);
    if (archivePath.endsWith('/')) {
      archivePath = archivePath.slice(-1);
    }
    archiveUpdatePath = archivePath + '/';
  }
  getLogger().debug(`filePath = ${filePath}, archivePath = ${archivePath}, archiveUpdatePath = ${archiveUpdatePath},` +
    ` childPaths = ${childPaths}`);

  return Promise.resolve({filePath, archivePath, archiveUpdatePath, childPaths});
}

// NOTE: This is part of the WRC-WKTUI API and is called directly from
//       WRC via the IPC channel.
//
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
// Note that as of today, this API only supports 5 types:
//  - applicationFile
//  - applicationDir
//  - applicationDeploymentPlan
//  - sharedLibraryFile
//  - sharedLibraryDir
//
// The code below needs to be reviewed before adding new types as it
// may or may not work correctly depending on the entry type.
//
async function wrcGetArchiveEntry(window, archiveEntryTypeName, options) {
  getLogger().debug(`Entering wrcGetArchiveEntry with ${archiveEntryTypeName} and ${JSON.stringify(options)}`);
  if (!options) {
    options = {
      providedValue: undefined,
      showChooser: false
    };
  }

  let promise;
  if (options.showChooser) {
    promise = _getArchiveEntryShowChooser(window, archiveEntryTypeName, options);
  } else {
    promise = _getArchiveEntry(archiveEntryTypeName, options);
  }
  return promise;
}

async function _getArchiveEntryShowChooser(targetWindow, wrcArchiveEntryTypeName, archiveEntryTypeOptions) {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');
  const { getLogger } = require('./wktLogging');
  const wktLogger = getLogger();

  if (wktLogger.isDebugEnabled()) {
    wktLogger.debug('entering _getArchiveEntryShowChooser(%s, %s, %s)',
      targetWindow, wrcArchiveEntryTypeName, JSON.stringify(archiveEntryTypeOptions));
  }

  const result = {};
  let fileType = _getFileTypeFromWrcArchiveEntryTypeName(wrcArchiveEntryTypeName);
  const archiveEntryTypeName = _getArchiveEntryTypeNameFromWrcArchiveEntryTypeName(wrcArchiveEntryTypeName);

  const archiveEntryType = getEntryTypes()[archiveEntryTypeName];
  if (!archiveEntryType) {
    result.errorMessage = i18n.t('wdt-archive-invalid-archive-entry-type', { type: archiveEntryTypeName });
    return result;
  }
  if (!fileType) {
    fileType = archiveEntryType.subtype;
  }

  let defaultPath;
  if (archiveEntryTypeOptions.providedValue) {
    defaultPath = await fsUtils.getDirectoryForPath(archiveEntryTypeOptions.providedValue);
  }

  const title = i18n.t('dialog-chooseArchiveEntry', {entryType: archiveEntryType.name});
  const chooserType = fileType === 'file' ? 'openFile' : 'openDirectory';

  let options = {
    title: title,
    message: title,
    defaultPath: defaultPath,
    buttonLabel: i18n.t('button-select'),
    properties: [chooserType, 'dontAddToRecent']
  };

  const { chooseFromFileSystem } = require('./wktWindow');
  const fileSystemPath = await chooseFromFileSystem(targetWindow, options);

  result.archiveEntryType = wrcArchiveEntryTypeName;
  result.filePath = fileSystemPath;

  if (wktLogger.isDebugEnabled()) {
    wktLogger.debug('exiting _getArchiveEntryShowChooser() with %s', JSON.stringify(result));
  }
  return result;
}

async function _getArchiveEntry(wrcArchiveEntryTypeName, archiveEntryTypeOptions) {
  // lazy load to allow initialization
  const i18n = require('./i18next.config');
  const { getLogger } = require('./wktLogging');
  const wktLogger = getLogger();

  if (wktLogger.isDebugEnabled()) {
    wktLogger.debug('entering _getArchiveEntry(%s, %s)', wrcArchiveEntryTypeName, JSON.stringify(archiveEntryTypeOptions));
  }

  const result = {};
  let fileType = _getFileTypeFromWrcArchiveEntryTypeName(wrcArchiveEntryTypeName);
  const archiveEntryTypeName = _getArchiveEntryTypeNameFromWrcArchiveEntryTypeName(wrcArchiveEntryTypeName);

  const archiveEntryTypes = getEntryTypes();
  let archiveEntryType = archiveEntryTypes[archiveEntryTypeName];
  if (!archiveEntryType) {
    result.errorMessage = i18n.t('wdt-archive-invalid-archive-entry-type', { type: archiveEntryTypeName });
    return result;
  }
  if (!fileType) {
    // this should only happen for the applicationDeploymentPlan type
    fileType = archiveEntryType.subtype;
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

  result.archiveEntryType = wrcArchiveEntryTypeName;
  const isDirectory = await fsUtils.isDirectory(fileSystemPath);
  const isFile = await fsUtils.isFile(fileSystemPath);

  if (!_archiveEntryTypesMatch(isDirectory, isFile, fileType)) {
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
    result.childPaths = await _getDirectoryPaths(result.filePath);
  }

  if (wktLogger.isDebugEnabled()) {
    wktLogger.debug('exiting _getArchiveEntryShowChooser() with %s', JSON.stringify(result));
  }
  return result;
}

function _getFileTypeFromWrcArchiveEntryTypeName(archiveEntryTypeName) {
  let result;
  if (archiveEntryTypeName.endsWith('Dir')) {
    result = 'dir';
  } else if (archiveEntryTypeName.endsWith('File')) {
    result = 'file';
  }
  return result;
}

function _getArchiveEntryTypeNameFromWrcArchiveEntryTypeName(wrcArchiveEntryTypeName) {
  let archiveEntryTypeName = wrcArchiveEntryTypeName;
  if (wrcArchiveEntryTypeName.endsWith('Dir')) {
    archiveEntryTypeName = wrcArchiveEntryTypeName.slice(0, -3);
  } else if (wrcArchiveEntryTypeName.endsWith('File')) {
    archiveEntryTypeName = wrcArchiveEntryTypeName.slice(0, -4);
  }
  return archiveEntryTypeName;
}

function _archiveEntryTypesMatch(fileSystemPathIsDirectory, fileSystemPathIsFile, archiveEntrySubtype) {
  let result = false;
  if (fileSystemPathIsDirectory) {
    result = archiveEntrySubtype === 'dir' || archiveEntrySubtype === 'emptyDir';
  } else if (fileSystemPathIsFile) {
    result = archiveEntrySubtype === 'file';
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

async function _getDefaultPathFromValue(currentValue) {
  return new Promise((resolve, reject) => {
    if (!currentValue) {
      return resolve();
    }

    const currentPath = path.resolve(currentValue);
    fsUtils.isDirectory(currentPath).then(isDir => {
      if (isDir) {
        resolve(currentPath);
      } else {
        resolve(path.dirname(currentPath));
      }
    }).catch(err => {
      reject(new Error(`Failed to get default path from current path ${currentPath}: ` + errorUtils.getErrorMessage(err)));
    });
  });
}

async function _validateArchiveEntryData(targetWindow, entryType, typeDetail, entryData) {
  return new Promise((resolve, reject) => {
    switch (entryType) {
      case 'application':
      case 'classpathLibrary':
      case 'custom':
      case 'opssWallet':
      case 'sharedLibrary':
        _validateArchiveEntryFile(targetWindow, entryType, entryData.fileType, entryData.fileName).then(result => {
          resolve(result);
        });
        break;

      case 'applicationDeploymentPlan':
      case 'domainBin':
      case 'domainLibrary':
      case 'mimeMapping':
      case 'nodeManagerKeystore':
      case 'script':
      case 'sharedLibraryDeploymentPlan':
      case 'saml2InitializationData':
        _validateArchiveEntryFile(targetWindow, entryType, 'file', entryData.fileName).then(result => {
          resolve(result);
        });
        break;

      case 'applicationInstallationDirectory':
        _validateArchiveEntryFile(targetWindow, entryType, 'dir', entryData.fileName).then(result => {
          resolve(result);
        });
        break;

      case 'databaseWallet':
        if (!_validateRequiredString(targetWindow, entryType, typeDetail.segregatedLabel, entryData.segregatedName)) {
          resolve(false);
        } else {
          _validateArchiveEntryFile(targetWindow, entryType, entryData.fileType, entryData.fileName).then(result => {
            resolve(result);
          });
        }
        break;

      case 'coherenceConfig':
      case 'jmsForeignServerBinding':
      case 'serverKeystore':
        if (!_validateRequiredString(targetWindow, entryType, typeDetail.segregatedLabel, entryData.segregatedName)) {
          resolve(false);
        } else {
          _validateArchiveEntryFile(targetWindow, entryType, 'file', entryData.fileName).then(result => {
            resolve(result);
          });
        }
        break;

      case 'coherencePersistenceDirectory':
        resolve(_validateRequiredString(targetWindow, entryType, typeDetail.segregatedLabel, entryData.segregatedName)
          && _validateRequiredString(targetWindow, entryType, typeDetail.emptyDirLabel, entryData.emptyDirName));
        break;

      case 'fileStore':
        resolve(_validateRequiredString(targetWindow, entryType, typeDetail.emptyDirLabel, entryData.emptyDirName));
        break;

      default:
        reject(new Error(`Unknown archive entry type: ${entryType}`));
        break;
    }
  });
}

async function _validateArchiveEntryFile(targetWindow, entryType, fileType, filePath) {
  const { getLogger } = require('./wktLogging');

  getLogger().debug(`Entering _validateArchiveEntryFile(${entryType}, ${fileType}, ${filePath})`);

  const title = `Add ${entryType} to archive failed`;
  if (!filePath) {
    const errMessage =
      `Failed to add ${entryType} to archive because the ${fileType === 'dir' ? 'directory' : 'file'} path was empty.`;
    _showArchiveEntryAddError(targetWindow, title, errMessage).then();
    return false;
  }

  if (fileType === 'dir' && ! await fsUtils.isDirectory(filePath)) {
    const errMessage = `Failed to add ${entryType} to archive because the directory ${filePath} ` +
      'either does not exist or is not a directory.';
    _showArchiveEntryAddError(targetWindow, title, errMessage).then();
    return false;
  } else if (fileType === 'file' && ! await fsUtils.isFile(filePath)) {
    const errMessage = `Failed to add ${entryType} to archive because the file ${filePath} ` +
      'either does not exist or is not a file.';
    _showArchiveEntryAddError(targetWindow, title, errMessage).then();
    return false;
  }
  return true;
}

function _validateRequiredString(targetWindow, entryType, fieldName, fieldValue) {
  if (!fieldValue) {
    const title = `Add ${entryType} to archive failed`;
    const errMessage = `The required field ${fieldName} for the ${entryType} was empty.`;
    _showArchiveEntryAddError(targetWindow, title, errMessage).then();
    return false;
  }
  return true;
}

function _joinArchivePaths(...archivePaths) {
  let result = '';
  for (const archivePath of archivePaths) {
    // No leading slashes
    if (!result) {
      result = archivePath;
      if (archivePath.startsWith('/')) {
        result = archivePath.substring(1);
      }
    } else {
      if (result.endsWith('/') || archivePath.startsWith('/')) {
        result += archivePath;
      } else {
        result += '/' + archivePath;
      }
    }
  }
  return result;
}

async function _showArchiveEntryAddError(targetWindow, title, errMessage) {
  const { showErrorMessage } = require('./wktWindow');

  return new Promise(resolve => {
    showErrorMessage(targetWindow, title, errMessage, 'error').then(() => resolve());
  });
}

module.exports = {
  getEntryTypes,
  addArchiveEntry,
  chooseArchiveEntryFile,
  wrcGetArchiveEntry
};
