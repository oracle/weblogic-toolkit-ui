/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fsUtils = require('./fsUtils');
const { JSZipPlugin } = require('./modelArchiveJSZipPlugin');
const { ZipDotJsPlugin } = require('./modelArchiveZipjsPlugin');
const { WdtArchiveHelperPlugin } = require('./modelArchiveJavaPlugin');
const { getLogger } = require('./wktLogging');

async function getContentsOfArchiveFiles(currentWindow, projectDirectory, archiveFiles,
  modelArchivePluginType = 'jszip', javaHome = undefined) {
  if (!archiveFiles || archiveFiles.length === 0) {
    return null;
  }

  const options = {
    currentWindow,
    projectDirectory,
    javaHome,
    // TMPDIR is not used for getting the archive contents.
    extraEnvironmentVariables: {}
  };
  const modelArchivePlugin = getModelArchivePlugin(modelArchivePluginType, getLogger(), options);
  const archiveFilesContents = { };
  for (const archiveFile of archiveFiles) {
    archiveFilesContents[archiveFile] =
      await modelArchivePlugin.getArchiveFileContents(projectDirectory, archiveFile);
  }
  return archiveFilesContents;
}

// This function expects the archiveUpdates object to look like this:
//
// {
//     <path-to-archive>: [
//         { op: <operation-name>, path: <archive-entry-path>, [filePath: <path of the content>] },
//         { op: <operation-name>, path: <archive-entry-path>, [filePath: <path of the content>] },
//         ...
//     ],
//     ...
// }
//
// Currently supported operations:
//       add - Adds/Updates the file or directory specified by filePath to the archive at the specified path.
//             To add an empty folder, make sure the path value ends with '/' and filePath is not specified.
//
//    remove - Removes the entry specified by path from the archive.  If the path is a folder, the
//             folder and all of its content is removed recursively.  Make sure that the path ends
//             with a '/'.
//
// This function will first scan the list of operations on a particular archive file to consolidate
// multiple user actions into a single action.  The logic is as follows:
//
// 1. If the operations are on a file, the last operation wins.
// 2. If the operations are on a directory:
//    a. If the last operation is a remove, then it wins.
//    b. If the last operation is an add, then it wins.  The only difference is we need to remove the existing
//       directory in the archive, if it exists, before performing the add operation.
//
async function saveContentsOfArchiveFiles(currentWindow, projectDirectory, archiveUpdates,
  modelArchivePluginType = 'jszip', javaHome = undefined, macZipjsTmpDir = undefined) {
  if (!archiveUpdates) {
    return Promise.resolve({ });
  }

  const options = {
    currentWindow,
    projectDirectory,
    javaHome
  };
  if (macZipjsTmpDir) {
    options.macZipjsTmpDir = macZipjsTmpDir;
  }

  const modelArchivePlugin =
    getModelArchivePlugin(modelArchivePluginType, getLogger(), options);
  if (modelArchivePluginType === 'java') {
    const archiveContents = await modelArchivePlugin.saveContentsOfArchiveFiles(archiveUpdates, getCollapsedOperations);
    return Promise.resolve(archiveContents);
  } else {
    for (const [archiveFileName, userOperations ] of Object.entries(archiveUpdates)) {
      const archiveFile = fsUtils.getAbsolutePath(archiveFileName, projectDirectory);
      const operations = getCollapsedOperations(userOperations);

      if (operations.length > 0) {
        getLogger().debug(`saving archive file ${archiveFile}`);
        await modelArchivePlugin.saveZipEntries(archiveFile, operations);
      }
    }

    const archiveFiles = Object.getOwnPropertyNames(archiveUpdates);
    const archiveContents =
      await getContentsOfArchiveFiles(currentWindow, projectDirectory, archiveFiles, modelArchivePluginType, javaHome);
    return Promise.resolve(archiveContents);
  }
}

function getModelArchivePlugin(modelArchivePluginType, logger, options) {
  let modelArchivePlugin;
  switch (modelArchivePluginType) {
    case 'jszip':
      modelArchivePlugin = new JSZipPlugin(logger);
      break;

    case 'zipjs':
      modelArchivePlugin = new ZipDotJsPlugin(logger, options);
      break;

    case 'java':
      modelArchivePlugin = new WdtArchiveHelperPlugin(logger, options);
      break;

    default:
      modelArchivePlugin = new JSZipPlugin(logger);
  }
  return modelArchivePlugin;
}

function getCollapsedOperations(userOperations) {
  const pathOperationMap = new Map();

  for (const userOperation of userOperations) {
    pathOperationMap.set(userOperation.path, userOperation);
  }

  const operations = [];
  for (const [ zipPath, operation ] of pathOperationMap.entries()) {
    operations.push(...getOperationsForPath(zipPath, operation));
  }
  return operations;
}

function getOperationsForPath(zipPath, operation) {
  const results = [ operation ];
  if (operation.op === 'add' && zipPath.endsWith('/')) {
    // Insert this operation ahead of the add operation.
    results.unshift({ op: 'remove', path: zipPath });
  }
  return results;
}

module.exports = {
  getContentsOfArchiveFiles,
  saveContentsOfArchiveFiles
};
