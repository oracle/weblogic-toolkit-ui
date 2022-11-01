/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const {app, dialog} = require('electron');
const {getCredentialPassphrase} = require('./promptUtils');
const {copyFile, mkdir, readFile, writeFile} = require('fs/promises');
const path = require('path');
const uuid = require('uuid');
const { EOL } = require('os');

const model = require('./model');
const modelProperties = require('./modelProperties');
const modelArchive = require('./modelArchive');
const fsUtils = require('./fsUtils');
const { getLogger } = require('./wktLogging');
const { sendToWindow } = require('./windowUtils');
const i18n = require('./i18next.config');
const { CredentialStoreManager, EncryptedCredentialManager, CredentialNoStoreManager } = require('./credentialManager');
const errorUtils = require('./errorUtils');

const projectFileTypeKey = 'dialog-wktFileType';
const projectFileExtension = 'wktproj';
const emptyProjectContents = {};

const openProjects = new Map();

// This file is the central file controlling all the project create and save functionality.
// As such, there are a number of flows that make 1 or more calls into the methods in this file.
//
// Create New Project menu item flow:
//    - The entry point is createNewProject():
//        + asks the user for the project file location
//        + sends the start-new-project message to the renderer
//    - On receiving the start-new-project message:
//        + the renderer gathers any project-related state
//        + sends the new-project message
//    - The new-project message calls initializeNewProject():
//        + writes the file
//        + handles other necessary state management if the file write succeeds
//
// Save All menu item flow:
//    - The entry point is startSaveProject():
//        + sends the start-save-project message to renderer
//    - On receiving the start-save-project message:
//        + determines if the project needs saving
//        + invokes confirm-project-file
//    - The confirm-project-file calls confirmProjectFile():
//        + gets the project file name, prompting the user if required
//        + returns the name, uuid, and file name (or null if file is not selected)
//    - On receiving the response to the confirm-project-file invocation, the renderer:
//        + gathers the project-related data
//        + invokes save-project
//    - The save-project calls saveProject()
//        + saves the project file
//        + if project file save succeeds, saves any model files
//        + returns whether the save was successful and the model file contents
//    - On receiving the response to the save-project invocation, the renderer ends the flow
//

// Public methods
//
function isWktProjectFile(filename) {
  return `.${projectFileExtension}` === path.extname(filename);
}

function removeProjectWindowFromCache(targetWindow) {
  return openProjects.delete(targetWindow);
}

function getWindowForProject(filename) {
  return _getOpenWindowForProject(filename);
}

function showExistingProjectWindow(existingProjectWindow) {
  if (existingProjectWindow) {
    existingProjectWindow.show();
  }
}

async function createNewProject(targetWindow) {
  const titleKey = 'dialog-createNewProjectTitle';
  const buttonKey = 'button-create';

  return new Promise(resolve => {
    _chooseProjectSaveFile(targetWindow,titleKey, buttonKey).then(projectFileName => {
      if (projectFileName) {
        sendToWindow(targetWindow, 'start-new-project', projectFileName);
        // window will reply with new-project -> initializeNewProject() including isDirty flag
      }
      resolve();
    });
  });
}

async function initializeNewProject(targetWindow, projectFile, isDirty) {
  // finish creating new project with project dirty flag
  let projectWindow = await _createOrReplace(targetWindow, isDirty);
  if (!projectWindow) {
    return;
  }

  const projectFileName = getProjectFileName(projectFile);
  const wktWindow = require('./wktWindow');

  const wroteFile = await _createNewProjectFile(projectWindow, projectFileName);
  if (wroteFile) {
    if (projectWindow.id === targetWindow.id) {
      wktWindow.setTitleFileName(projectWindow, projectFileName, false);
    } else {
      projectWindow.on('ready-to-show', () => {
        wktWindow.setTitleFileName(projectWindow, projectFileName, false);
      });
    }
    app.addRecentDocument(projectFileName);
    projectWindow.setRepresentedFilename(projectFileName);
  }
}

async function openProject(targetWindow) {
  const openResponse = await dialog.showOpenDialog(targetWindow, {
    title: i18n.t('dialog-openProjectWindow'),
    buttonLabel: i18n.t('button-openProject'),
    filters: [
      { name: i18n.t(projectFileTypeKey), extensions: [projectFileExtension] }
    ],
    properties: [ 'openFile' ]
  });

  if (openResponse.canceled || openResponse.filePaths.length === 0) {
    return;
  }

  const projectFileName = openResponse.filePaths[0];
  sendToWindow(targetWindow, 'start-open-project', projectFileName);
  // window will reply with open-project -> openProjectFile() including isDirty flag
}

async function openProjectFile(targetWindow, projectFile, isDirty) {
  return new Promise((resolve, reject) => {
    const existingProjectWindow = _getOpenWindowForProject(projectFile);
    if (existingProjectWindow) {
      showExistingProjectWindow(existingProjectWindow);
      resolve();
    } else {
      _createOrReplace(targetWindow, isDirty)
        .then(projectWindow => {
          if (!projectWindow) {
            return resolve();
          }
          _openProjectFile(projectWindow, projectFile)
            .then(() => {
              resolve();
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    }
  })
    .catch(err => {
      dialog.showErrorBox(
        i18n.t('dialog-openProjectFileErrorTitle'),
        i18n.t('dialog-openProjectFileErrorMessage', { projectFileName: projectFile, err: errorUtils.getErrorMessage(err) }),
      );
      getLogger().error('Failed to open project file %s: %s', projectFile, err);
    });
}

// request the existing project file, prompting the user if needed.
// return null values if no project file was established or selected.
// usually called by the confirm-project-file IPC invocation.
//
// This method is always used in the "Save All" flow.
//
async function confirmProjectFile(targetWindow) {
  let projectFile = _getProjectFilePath(targetWindow);
  if (projectFile) {
    // if the project file exists, no need to worry about
    // the project name and project UUID because they are
    // already defined in the file.
    //
    return [projectFile, null, null, false];
  } else {
    return chooseProjectFile(targetWindow);
  }
}

// choose a new project file for save.
// return null values if no project file was established or selected.
// usually called by the choose-project-file IPC invocation.
//
// This method is used directly in the "Save As" flow and
// indirectly in the "Save All" flow.
//
async function chooseProjectFile(targetWindow) {
  const projectFile = await _chooseProjectSaveFile(targetWindow);
  let projectName = null;
  let projectUuid = null;
  let isNewFile = false;
  if (projectFile) {
    projectName = _generateProjectName(projectFile);
    projectUuid = _generateProjectUuid();
    isNewFile = !await fsUtils.exists(projectFile);
  }
  return [projectFile, projectName, projectUuid, isNewFile];
}

// initiate the save process by sending a message to the web app.
// usually called from a menu click.
function startSaveProject(targetWindow) {
  sendToWindow(targetWindow, 'start-save-project');
}

// initiate the save-as process by sending a message to the web app.
// usually called from a menu click.
function startSaveProjectAs(targetWindow) {
  sendToWindow(targetWindow, 'start-save-project-as');
}

// save the specified project and model contents to the project file.
// usually invoked by the save-project IPC invocation.
async function saveProject(targetWindow, projectFile, projectContents, externalFileContents, isNewFile, showErrors = true) {
  // the result will contain only sections that were updated due to save, such as model.archiveFiles
  const saveResult = {
    isProjectFileSaved: false,
    areModelFilesSaved: false
  };

  const assignProjectFileData = _assignProjectFile(targetWindow, projectFile);
  try {
    await _saveProjectFile(targetWindow, projectFile, projectContents);
    saveResult.isProjectFileSaved = true;
  } catch (err) {
    if (showErrors) {
      _showSaveError(projectFile, err);
    }
    getLogger().error('Failed to save project file %s: %s', projectFile, err);
    // revert the project assignment to the window
    _revertAssignProjectFile(assignProjectFileData);
    saveResult.reason = i18n.t('dialog-saveProjectFileErrorMessage', { projectFileName: projectFile, err: err });
  }

  if (saveResult.isProjectFileSaved) {
    const wktWindow = require('./wktWindow');
    wktWindow.setTitleFileName(targetWindow, projectFile, false);
    if (isNewFile) {
      app.addRecentDocument(projectFile);
    }

    try {
      saveResult['model'] = await _saveExternalFileContents(_getProjectDirectory(targetWindow), externalFileContents);
      saveResult.areModelFilesSaved = true;
    } catch (err) {
      const message = i18n.t('project-save-model-files-error-message', { error: errorUtils.getErrorMessage(err) });
      if (showErrors) {
        const title = i18n.t('project-save-model-files-error-title');
        dialog.showErrorBox(title, message);
      }
      getLogger().error('Failed to save one of the model files for project file %s: %s', projectFile, err);
      saveResult.reason = message;
    }
  }
  return saveResult;
}

// initiate the close project process by sending a message to the web app.
// usually called from a menu click.
function startCloseProject(targetWindow) {
  sendToWindow(targetWindow, 'start-close-project');
}

// remove any project associated with the specified window.
// if keepWindow is true, or this is the last remaining window, keep it open (content was already cleared).
// for any other case, close the window.
// usually invoked by the close-project IPC invocation.
async function closeProject(targetWindow, keepWindow) {
  openProjects.delete(targetWindow);

  // require inside call due to circular reference
  const wktWindow = require('./wktWindow');
  if(keepWindow || wktWindow.isSingleWindow(targetWindow)) {
    wktWindow.clearWindow(targetWindow);
  } else {
    wktWindow.closeWindow(targetWindow);
  }
}

// build a map with model files and their contents to pass to the web app.
async function getModelFileContent(targetWindow, modelFiles, propertyFiles, archiveFiles) {
  let projectFile = _getProjectFilePath(targetWindow);
  let projectDir = path.dirname(projectFile);

  let modelFileResults = {};

  if (modelFiles && modelFiles.length > 0) {
    const existingModelFiles = await getExistingProjectModelFiles(projectDir, modelFiles);
    if (existingModelFiles.length > 0) {
      modelFileResults['models'] = await model.getContentsOfModelFiles(projectDir, existingModelFiles);
    }
  }

  if (propertyFiles && propertyFiles.length > 0) {
    const existingPropertyFiles = await getExistingProjectModelFiles(projectDir, propertyFiles);
    if (existingPropertyFiles.length > 0) {
      modelFileResults['properties'] = await modelProperties.getContentsOfPropertyFiles(projectDir, existingPropertyFiles);
    }
  }

  if (archiveFiles && archiveFiles.length > 0) {
    const existingArchiveFiles = await getExistingProjectModelFiles(projectDir, archiveFiles);
    if (existingArchiveFiles.length > 0) {
      modelFileResults['archives'] = await modelArchive.getContentsOfArchiveFiles(projectDir, existingArchiveFiles);
    }
  }
  return modelFileResults;
}

async function getExistingProjectModelFiles(projectDir, files) {
  const existingFiles = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const fullFile = fsUtils.getAbsolutePath(file, projectDir);
      if (await fsUtils.exists(fullFile)) {
        existingFiles.push(file);
      }
    }
  }
  return Promise.resolve(existingFiles);
}

async function sendProjectOpened(targetWindow) {
  const logger = getLogger();
  if (_hasOpenProject(targetWindow) && _hasPendingSend(targetWindow)) {
    const projectFilePath = _getProjectFilePath(targetWindow);
    logger.debug(`Opening delayed project file ${projectFilePath}`);
    return new Promise((resolve, reject) => {
      _openProjectFile(targetWindow, projectFilePath)
        .then(() => {
          logger.debug(`Delayed project file ${projectFilePath} opened`);
          resolve();
        })
        .catch(err => reject(err));
    });
  }
}

// returns 'yes', 'no', or 'cancel'
async function promptSaveBeforeClose(targetWindow) {
  const result = await dialog.showMessageBox(targetWindow, {
    type: 'question',
    title: i18n.t('dialog-title-closeProject'),
    message: i18n.t('dialog-prompt-saveProjectBeforeClose'),
    buttons: [
      i18n.t('button-yes'),
      i18n.t('button-no'),
      i18n.t('button-cancel')
    ],
    noLink: true,
    defaultId: 0,
    cancelId: 2
  });

  const responses = ['yes', 'no', 'cancel'];
  return responses[result.response];
}

// export the archive file to the default location for a different project file
async function exportArchiveFile(targetWindow, archivePath, projectFile) {
  if(!path.isAbsolute(archivePath)) {
    const sourceProjectDir = _getProjectDirectory(targetWindow);
    archivePath = path.join(sourceProjectDir, archivePath);
  }

  const targetDirectoryName = _getDefaultModelsDirectoryName(projectFile);
  const targetPath = path.join(path.dirname(projectFile), targetDirectoryName, 'archive.zip');
  await mkdir(path.dirname(targetPath), {recursive: true});

  getLogger().debug('Copying archive ' + archivePath + ' to ' + targetPath);
  await copyFile(archivePath, targetPath);
}

// Private helper methods
//
async function _createNewProjectFile(targetWindow, projectFileName) {
  getLogger().debug('entering _createNewProjectFile() for %s', projectFileName);
  return new Promise((resolve) => {
    const projectContents = _addProjectIdentifiers(projectFileName, emptyProjectContents);
    const projectContentsJson = JSON.stringify(projectContents, null, 2);
    writeFile(projectFileName, projectContentsJson, {encoding: 'utf8'})
      .then(() => {
        _addOpenProject(targetWindow, projectFileName, false, new CredentialStoreManager(projectContents.uuid));
        sendToWindow(targetWindow, 'project-created', projectFileName, projectContents);
        resolve(true);
      })
      .catch(err => {
        _showSaveError(projectFileName, err);
        getLogger().error('Failed to save new project in file %s: %s', projectFileName, err);
        resolve(false);
      });
  });
}

function _showSaveError(projectFileName, err) {
  dialog.showErrorBox(
    i18n.t('dialog-saveProjectFileErrorTitle'),
    i18n.t('dialog-saveProjectFileErrorMessage', { projectFileName: projectFileName, err: err }),
  );
}

function _addProjectIdentifiers(projectFileName, projectContents) {
  const alreadyHasName = Object.prototype.hasOwnProperty.call(projectContents, 'name');
  const alreadyHasGuid = Object.prototype.hasOwnProperty.call(projectContents, 'uuid');

  let newProjectContents = projectContents;
  if (!alreadyHasName || !alreadyHasGuid) {
    // make a copy so that we do not modify the emptyProjectContents object that is typically used to call this method...
    newProjectContents = JSON.parse(JSON.stringify(projectContents));
    if (!alreadyHasName) {
      newProjectContents['name'] = _generateProjectName(projectFileName);
    }
    if (!alreadyHasGuid) {
      newProjectContents['uuid'] = _generateProjectUuid();
    }
  }
  return newProjectContents;
}

function _generateProjectName(projectFileName) {
  return path.basename(projectFileName, `.${projectFileExtension}`);
}

function _generateProjectUuid() {
  return uuid.v4();
}

// exporting this for main to use to respond to an OS event for opening a project file.
//
async function _openProjectFile(targetWindow, projectFileName) {
  if (targetWindow.isReady) {
    return new Promise((resolve, reject) => {
      readFile(projectFileName, { encoding: 'utf8' }).then(data => {
        let jsonContent;
        try {
          jsonContent = JSON.parse(data.toString());
        } catch (err) {
          dialog.showErrorBox(
            i18n.t('dialog-openProjectFileParseErrorTitle'),
            i18n.t('dialog-openProjectFileParseErrorMessage', { projectFileName: projectFileName, err: err })
          );
          getLogger().error('Failed to parse project file %s: %s', projectFileName, err);
          return resolve();
        }

        // Have to add the project to the open projects map prior to creating the credential manager
        // so that the call to add the credential manager to the cached project data has a place to
        // store the credential manager.
        //
        _addOpenProject(targetWindow, projectFileName, false);
        _createCredentialManager(targetWindow, jsonContent).then(credentialManager => {
          credentialManager.loadCredentials(jsonContent).then(projectContent => {
            _sendProjectOpened(targetWindow, projectFileName, projectContent).then(() => {
              const wktWindow = require('./wktWindow');
              wktWindow.setTitleFileName(targetWindow, projectFileName, false);
              targetWindow.setRepresentedFilename(projectFileName);
              getLogger().debug('_openProjectFile adding %s to recent documents', projectFileName);
              app.addRecentDocument(projectFileName);
              resolve();
            }).catch(err => reject(err));
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }).catch(err => {
        dialog.showErrorBox(
          i18n.t('dialog-openProjectFileReadErrorTitle'),
          i18n.t('dialog-openProjectFileReadErrorMessage', { projectFileName: projectFileName, err: err }),
        );
        resolve();
      });
    });
  } else {
    // If the window is not yet ready, just remember the project file name for later use.
    //
    return new Promise(resolve => {
      _addOpenProject(targetWindow, projectFileName, true);
      resolve();
    });
  }
}

async function _saveProjectFile(targetWindow, projectFile, projectContents) {
  // Just in case the name or uuid were empty, make sure that they have a proper value.
  if (!projectContents.name) {
    projectContents.name = _generateProjectName(projectFile);
  }
  if (!projectContents.uuid) {
    projectContents.uuid = _generateProjectUuid();
  }

  return new Promise((resolve, reject) => {
    _getCredentialManagerForSavingProject(targetWindow, projectContents)
      .then(credentialManager => {
        credentialManager.storeCredentials(projectContents).then(projectFileContents => {
          const fileContents = JSON.stringify(projectFileContents, null, 2);
          writeFile(projectFile, fileContents, { encoding: 'utf8' })
            .then(() => resolve())
            .catch(err => reject(err));
        }).catch(err => reject(err));
      }).catch(err => reject(err));
  });
}

async function _saveExternalFileContents(projectDirectory, externalFileContents) {
  if (!externalFileContents) {
    return;
  }

  // the result will contain only sections that were updated due to save.
  // example: archiveUpdates are applied, and the resulting archiveFiles (with contents) are returned.
  const saveResult = {};

  if ('models' in externalFileContents) {
    const models = externalFileContents['models'];
    await model.saveContentsOfModelFiles(projectDirectory, models);
  }
  if ('properties' in externalFileContents) {
    const properties = externalFileContents['properties'];
    await modelProperties.saveContentsOfPropertiesFiles(projectDirectory, properties);
  }
  if ('archiveUpdates' in externalFileContents) {
    const archiveUpdates = externalFileContents['archiveUpdates'];
    saveResult['archives'] = await modelArchive.saveContentsOfArchiveFiles(projectDirectory, archiveUpdates);
  }
  return saveResult;
}

async function _createOrReplace(targetWindow, isDirty) {
  let projectWindow = targetWindow;
  if (openProjects.has(targetWindow) || isDirty) {
    const buttonResponse = await dialog.showMessageBox(targetWindow, {
      type: 'question',
      message: i18n.t('dialog-openProjectWindowPrompt'),
      buttons: [
        i18n.t('button-openProjectWindowPromptNewWindow'),
        i18n.t('button-openProjectWindowPromptSameWindow'),
        i18n.t('button-cancel')
      ],
      defaultId: 0,
      cancelId: 2
    });

    const wktWindow = require('./wktWindow');
    switch (buttonResponse.response) {
      case 0:
        projectWindow = await wktWindow.createWindow();
        break;

      case 1:
        // clean up openProjects structure for this window.
        openProjects.delete(targetWindow);
        break;

      case 2:
        // cancel so return undefined...
        return;
    }
  }
  return projectWindow;
}

async function _sendProjectOpened(targetWindow, file, jsonContents) {
  let modelFilesContentJson = {};
  if (jsonContents.model) {
    const projDir = _getProjectDirectory(targetWindow);

    if (jsonContents.model.modelFiles && jsonContents.model.modelFiles.length > 0) {
      modelFilesContentJson['models'] = await model.getContentsOfModelFiles(projDir, jsonContents.model.modelFiles);
    } else {
      delete jsonContents.model.modelFiles;
    }

    if (jsonContents.model.propertiesFiles && jsonContents.model.propertiesFiles.length > 0) {
      modelFilesContentJson['properties'] =
        await modelProperties.getContentsOfPropertyFiles(projDir, jsonContents.model.propertiesFiles);
    } else {
      delete jsonContents.model.propertiesFiles;
    }

    if (jsonContents.model.archiveFiles && jsonContents.model.archiveFiles.length > 0) {
      modelFilesContentJson['archives'] =
        await modelArchive.getContentsOfArchiveFiles(projDir, jsonContents.model.archiveFiles);
    } else {
      delete jsonContents.model.archiveFiles;
    }
  }
  getLogger().debug(`preparing to send project-opened at ${Date.now()}`);
  sendToWindow(targetWindow, 'project-opened', file, jsonContents, modelFilesContentJson);
}

async function _chooseProjectSaveFile(targetWindow, titleKey = 'dialog-chooseProjectSaveFile', buttonKey = 'button-save') {
  const title = i18n.t(titleKey);

  let saveResponse = await dialog.showSaveDialog(targetWindow, {
    title: title,
    message: title,
    filters: [
      {name: i18n.t(projectFileTypeKey), extensions: [projectFileExtension]}
    ],
    buttonLabel: i18n.t(buttonKey),
    properties: [
      'createDirectory',
      'showOverwriteConfirmation'
    ]
  });

  if (saveResponse.canceled || !saveResponse.filePath || projectFileAlreadyOpen(saveResponse.filePath)) {
    return null;
  }

  // Do a quick sanity check to make sure that the user has permissions to
  // write to the directory chosen.  If not, show them the error and return null.
  //
  if (! await fsUtils.canWriteInDirectory(saveResponse.filePath)) {
    const errTitle = i18n.t('dialog-projectSaveFileLocationNotWritableTitle');
    const errMessage = i18n.t('dialog-projectSaveFileLocationNotWritableError',
      { projectFileDirectory: path.dirname(saveResponse.filePath)});
    dialog.showErrorBox(errTitle, errMessage);
    return null;
  }
  return getProjectFileName(saveResponse.filePath);
}

async function chooseArchiveFile(targetWindow) {
  const title = i18n.t('dialog-chooseArchiveFile');
  const wktWindow = require('./wktWindow');
  let filePath = await wktWindow.chooseFromFileSystem(targetWindow, {
    title: title,
    message: title,
    buttonLabel: i18n.t('button-select'),
    filters: [
      {name: 'Archive Files', extensions: ['zip']}
    ],
    properties: [ 'openFile', 'dontAddToRecent']
  });

  let archivePath = null;
  let content = null;
  if(filePath) {
    archivePath = await checkAddModelFile(targetWindow, filePath);
    if(archivePath) {
      content = await getModelFileContent(targetWindow, null, null, [archivePath]);
    }
  }

  return {file: archivePath, content: content};
}

async function chooseModelFile(targetWindow) {
  const title = i18n.t('dialog-chooseModelFile');
  const wktWindow = require('./wktWindow');
  let filePath = await wktWindow.chooseFromFileSystem(targetWindow, {
    title: title,
    message: title,
    buttonLabel: i18n.t('button-select'),
    filters: [
      {name: 'Model Files', extensions: ['yaml', 'yml']}
    ],
    properties: [ 'openFile', 'dontAddToRecent']
  });

  let modelPath = null;
  let content = null;
  if(filePath) {
    modelPath = await checkAddModelFile(targetWindow, filePath);
    if(modelPath) {
      content = await getModelFileContent(targetWindow, [modelPath]);
    }
  }

  return {file: modelPath, content: content};
}

async function chooseVariableFile(targetWindow) {
  const title = i18n.t('dialog-chooseVariableFile');
  const wktWindow = require('./wktWindow');
  let filePath = await wktWindow.chooseFromFileSystem(targetWindow, {
    title: title,
    message: title,
    buttonLabel: i18n.t('button-select'),
    filters: [
      {name: 'Variable Files', extensions: ['properties']}
    ],
    properties: [ 'openFile', 'dontAddToRecent']
  });

  let variablePath = null;
  let content = null;
  if(filePath) {
    variablePath = await checkAddModelFile(targetWindow, filePath);
    if(variablePath) {
      content = await getModelFileContent(targetWindow, null, [variablePath]);
    }
  }

  return {file: variablePath, content: content};
}

/**
 * Determine if the path is inside the current project directory.
 * If inside the directory, return the relative path.
 * If outside the directory, offer to move the file under the project directory and return the relative path.
 * If remaining outside the directory, return the absolute path.
 */
async function checkAddModelFile(targetWindow, filePath) {
  let projectDir = _getProjectDirectory(targetWindow);
  const relativePath = fsUtils.getRelativePath(projectDir, filePath);
  if(relativePath) {
    return _fixRelativePath(relativePath);
  }

  const title = i18n.t('dialog-addFileToProject');

  // this was an absolute path, offer to copy it into the project
  const buttonResponse = await dialog.showMessageBox(targetWindow, {
    type: 'question',
    title: title,
    message: i18n.t('dialog-modelFileIsOutsideProjectDirectory', {file: filePath}, ),
    buttons: [
      i18n.t('button-useExistingLocation'),
      i18n.t('button-copyToProjectDirectory'),
      i18n.t('button-cancel')
    ],
    defaultId: 0,
    cancelId: 2
  });

  switch(buttonResponse.response) {
    case 1: {
      // copy
      const wktWindow = require('./wktWindow');
      const modelsPath = _getDefaultModelsPath(targetWindow);
      const targetDir = path.join(projectDir, modelsPath);
      try {
        await mkdir(targetDir, {recursive: true});
      } catch (err) {
        const message = i18n.t('dialog-failedToCreateDirectory', {dir: targetDir});
        await wktWindow.showErrorMessage(targetWindow, title, message);
        return null;
      }

      const fileName = path.basename(filePath);
      const targetFile = path.join(targetDir, fileName);
      try {
        await copyFile(filePath, targetFile);
        filePath = _fixRelativePath(path.join(modelsPath, fileName));
      } catch (err) {
        const message = i18n.t('dialog-failedToCopyFile', {sourceFile: filePath, targetFile: targetFile});
        await wktWindow.showErrorMessage(targetWindow, title, message);
        return null;
      }
    }
      break;
    case 2:
      // cancel
      filePath = null;
      break;
  }

  return filePath;
}

function projectFileAlreadyOpen(projectFilePath) {
  const result = _projectHasOpenWindow(projectFilePath);
  if (result) {
    getLogger().debug('projectFileAlreadyOpen() returning true for project file %s', projectFilePath);
    dialog.showErrorBox(
      i18n.t('project-save-file-already-open-title'),
      i18n.t('project-save-file-already-open-message', { projectFile: projectFilePath }));
  }
  return result;
}

function _hasOpenProject(targetWindow) {
  return openProjects.has(targetWindow);
}

function _projectHasOpenWindow(targetProjectFile) {
  let result = false;
  const entry = _getCacheEntryForProject(targetProjectFile);
  if (entry) {
    result = true;
  }
  return result;
}

function _getOpenWindowForProject(targetProjectFile) {
  let result;
  const entry = _getCacheEntryForProject(targetProjectFile);
  if (entry) {
    result = entry[0];
  }
  return result;
}

function _getCacheEntryForProject(targetProjectFile) {
  let result;
  let staleWindow;
  const targetProjectFilePath = path.normalize(targetProjectFile);
  for (const [window, projectCacheObj] of openProjects.entries()) {
    const projectFilePath = path.normalize(path.join(projectCacheObj.projectDirectory, projectCacheObj.projectFile));
    if (targetProjectFilePath === projectFilePath) {
      if (window.isDestroyed()) {
        staleWindow = window;
      } else {
        result = [window, projectCacheObj];
      }
      break;
    }
  }
  if (staleWindow) {
    openProjects.delete(staleWindow);
  }
  return result;
}

function _addOpenProject(targetWindow, file, pending, credentialManager) {
  const value = {
    projectDirectory: path.resolve(path.dirname(file)),
    projectFile: path.basename(file),
    hasPendingSend: pending,
    credentialManager: credentialManager
  };
  openProjects.set(targetWindow, value);
}

// assign project file to window if none is assigned, or file path changes.
// avoid unnecessary reassignments in order to keep credential manager between saves.
function _assignProjectFile(targetWindow, projectFile) {
  const existingProject = openProjects.get(targetWindow);
  const oldFile = existingProject ? `${existingProject.projectDirectory}|${existingProject.projectFile}` : '';
  const newFile = `${path.resolve(path.dirname(projectFile))}|${path.basename(projectFile)}`;
  if (newFile !== oldFile) {
    _addOpenProject(targetWindow, projectFile, false);
  }
  return {
    existingProject,
    oldFile,
    newFile
  };
}

function _revertAssignProjectFile(targetWindow, assignProjectFileData) {
  if (assignProjectFileData.existingProject) {
    if (assignProjectFileData.oldFile !== assignProjectFileData.newFile) {
      _addOpenProject(targetWindow, assignProjectFileData.oldFile, false);
    }
  } else {
    openProjects.delete(targetWindow);
  }
}

async function _createCredentialManager(targetWindow, projectFileJsonContent) {
  let credentialStorePolicy = _getProjectCredentialStorePolicy(projectFileJsonContent);
  return new Promise((resolve, reject) => {
    if (credentialStorePolicy === 'passphrase') {
      getCredentialPassphrase(targetWindow)
        .then(passphrase => {
          if (passphrase) {
            const credentialManager = new EncryptedCredentialManager(passphrase);
            _setCredentialManager(targetWindow, credentialManager);
            resolve(credentialManager);
          } else {
            reject(new Error('Passphrase is required but the user did not provide one.'));
          }
        })
        .catch(err => reject(new Error(`Failed to create passphrase credential manager: ${err}`)));
    } else {
      let credentialManager;
      if (credentialStorePolicy === 'native') {
        credentialManager = new CredentialStoreManager(projectFileJsonContent.uuid);
      } else {
        credentialManager = new CredentialNoStoreManager();
      }
      _setCredentialManager(targetWindow, credentialManager);
      resolve(credentialManager);
    }
  });
}

async function _getCredentialManagerForSavingProject(targetWindow, projectContents) {
  const currentProjectCredentialStorePolicy = _getProjectCredentialStorePolicy(projectContents);
  const windowCredentialManager = _getCredentialManager(targetWindow);
  if (!windowCredentialManager || windowCredentialManager.credentialStoreType !== currentProjectCredentialStorePolicy) {
    try {
      await _createCredentialManager(targetWindow, projectContents);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return Promise.resolve(_getCredentialManager(targetWindow));
}

function _getProjectCredentialStorePolicy(projectContents) {
  let currentCredentialStorePolicy = 'native';
  if (projectContents && 'settings' in projectContents &&
    'credentialStorePolicy' in projectContents['settings'] &&
    projectContents['settings']['credentialStorePolicy']) {
    currentCredentialStorePolicy = projectContents['settings']['credentialStorePolicy'];
  }
  return currentCredentialStorePolicy;
}

function _getProjectDirectory(targetWindow) {
  let dir;
  if (openProjects.has(targetWindow)) {
    dir = openProjects.get(targetWindow).projectDirectory;
  }
  return dir;
}

function _getProjectFilePath(targetWindow) {
  let projectFilePath;
  if (openProjects.has(targetWindow)) {
    const cache = openProjects.get(targetWindow);
    projectFilePath = path.join(cache.projectDirectory, cache.projectFile);
  }
  return projectFilePath;
}

function _getDefaultModelsPath(targetWindow) {
  const projectFilePath = _getProjectFilePath(targetWindow);
  return _getDefaultModelsDirectoryName(projectFilePath);
}

function _getDefaultModelsDirectoryName(projectFilePath) {
  const projectFilePrefix = path.basename(projectFilePath, path.extname(projectFilePath));
  return projectFilePrefix + '-models';
}

// relative paths for the project file should use forward slash,
// to make the project portable across platforms.
function _fixRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

function _hasPendingSend(targetWindow) {
  let hasPendingSend = false;
  if (openProjects.has(targetWindow)) {
    hasPendingSend = openProjects.get(targetWindow).hasPendingSend;
  }
  return hasPendingSend;
}

function _getCredentialManager(targetWindow) {
  let credentialManager;
  if (openProjects.has(targetWindow)) {
    credentialManager = openProjects.get(targetWindow).credentialManager;
  }
  return credentialManager;
}

function _setCredentialManager(targetWindow, credentialManager) {
  if (openProjects.has(targetWindow)) {
    openProjects.get(targetWindow).credentialManager = credentialManager;
  }
}

// On Linux, the save dialog does not automatically add the project file extension...
function getProjectFileName(dialogReturnedFileName) {
  let result = dialogReturnedFileName;
  if (dialogReturnedFileName && path.extname(dialogReturnedFileName) !== `.${projectFileExtension}`) {
    result = `${dialogReturnedFileName}.${projectFileExtension}`;
  }
  return result;
}

function downloadFile(targetWindow, lines, fileType, format, formatName) {
  const title = i18n.t('dialog-saveTitle', {type: fileType});
  const filterName = i18n.t('dialog-saveFilterLabel', {type: formatName});

  dialog.showSaveDialog(targetWindow, {
    title: title,
    message: title,
    filters: [
      {name: filterName, extensions: [format]}
    ],
    properties: [
      'createDirectory',
      'showOverwriteConfirmation'
    ]
  }).then(saveResponse =>  {
    if (saveResponse.filePath) {
      const contents = lines.join(EOL);
      writeFile(saveResponse.filePath, contents, { encoding: 'utf8' })
        .catch(err => {
          dialog.showErrorBox(title,
            i18n.t('dialog-saveFileErrorMessage', { file: saveResponse.filePath, error: err }));
        });
    }
  });
}

module.exports = {
  chooseArchiveFile,
  chooseModelFile,
  chooseProjectFile,
  chooseVariableFile,
  closeProject,
  confirmProjectFile,
  createNewProject,
  downloadFile,
  getModelFileContent,
  getWindowForProject,
  exportArchiveFile,
  isWktProjectFile,
  initializeNewProject,
  openProject,
  openProjectFile,
  _openProjectFile,
  promptSaveBeforeClose,
  removeProjectWindowFromCache,
  saveProject,
  sendProjectOpened,
  showExistingProjectWindow,
  startCloseProject,
  startSaveProject,
  startSaveProjectAs
};
