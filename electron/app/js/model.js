/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const {app, dialog} = require('electron');
const fs = require('fs');
const {readFile, writeFile} = require('fs/promises');
const path = require('path');

const fsUtils = require('./fsUtils');
const {getLogger} = require('./wktLogging');
const {sendToWindow} = require('./windowUtils');

async function getModelFileFromUser(targetWindow) {
  const openResponse = await dialog.showOpenDialog(targetWindow, {
    properties: ['openFile'],
    filters: [
      {name: 'YAML Files', extensions: ['yaml', 'yml']},
      {name: 'JSON Files', extensions: ['json']}
    ]
  });

  if (!openResponse.canceled && openResponse.filePaths.length > 0) {
    openModelFile(targetWindow, openResponse.filePaths[0]).then();
  }
}

async function openModelFile(targetWindow, file) {
  return new Promise((resolve) => {
    readFile(file, 'utf8').then(data => {
      // startWatchingFile(targetWindow, file);
      sendToWindow(targetWindow, 'model-file-opened', file, data);
    }).catch(err => {
      dialog.showErrorBox(`Failed to read model file: ${file}`, err.message).then(() => {
        getLogger().error(`Failed to read model file ${file}: ${err}`);
        resolve();
      });
    });
  });
}

async function saveModelFile(targetWindow, file, content) {
  return new Promise((resolve, reject) => {
    if (!file) {
      dialog.showSaveDialog(targetWindow, {
        title: 'Save Model',
        // TODO - the default path should really be in the right location inside the project directory
        defaultPath: app.getPath('documents'),
        filters: [
          {name: 'YAML Files', extensions: ['yaml', 'yml']},
          {name: 'JSON Files', extensions: ['json']}
        ]
      })
        .then(saveResponse => {
          if (!saveResponse.canceled && saveResponse.filePath) {
            writeFile(saveResponse.filePath, content, {encoding: 'utf8'})
              .then(() => {
                sendToWindow(targetWindow, 'model-file-saved', saveResponse.filePath, content);
                resolve();
              })
              .catch(err => reject(err));
          } else {
            return resolve();
          }
        });
    } else {
      writeFile(file, content, {encoding: 'utf8'})
        .then(() => {
          sendToWindow(targetWindow, 'model-file-saved', file, content);
          resolve();
        })
        .catch(err => reject(err));
    }
  });
}

async function getContentsOfModelFiles(projectDirectory, modelFiles) {
  if (!modelFiles || modelFiles.length === 0) {
    return null;
  }

  const modelFilesContents = { };
  for (const modelFile of modelFiles) {
    modelFilesContents[modelFile] = await _getModelFileContent(projectDirectory, modelFile);
  }
  return modelFilesContents;
}

async function saveContentsOfModelFiles(projectDirectory, models) {
  for (const [modelFile, modelContent] of Object.entries(models)) {
    await _saveModelFileContent(projectDirectory, modelFile, modelContent);
  }
}

async function _getModelFileContent(projectDirectory, modelFile) {
  const effectiveModelFile = fsUtils.getAbsolutePath(modelFile, projectDirectory);
  return new Promise((resolve, reject) => {
    readFile(effectiveModelFile, {encoding: 'utf8'})
      .then(data => resolve(data))
      .catch(err => reject(err));
  });
}

async function _saveModelFileContent(projectDirectory, modelFile, modelContents) {
  const effectiveModelFile = fsUtils.getAbsolutePath(modelFile, projectDirectory);
  const directory = path.dirname(effectiveModelFile);
  fs.mkdirSync(directory, { recursive: true });
  return writeFile(effectiveModelFile, modelContents, {encoding: 'utf8'});
}

module.exports = {
  getContentsOfModelFiles,
  getModelFileFromUser,
  openModelFile,
  saveContentsOfModelFiles,
  saveModelFile
};
