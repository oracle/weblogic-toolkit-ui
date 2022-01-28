/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An helper object for project IO.
 * Returns a singleton.
 */

define(['knockout', 'models/wkt-project', 'utils/i18n'],
  function (ko, project, i18n) {
    function ProjectIo() {

      // verify that a project file is assigned to this project, choosing if necessary.
      // save the project contents to the specified file.
      this.saveProject = async(forceSave) => {
        const projectNotSaved = !project.getProjectFileName();

        if(forceSave || project.isDirty() || projectNotSaved) {
          const [projectFile, projectName, projectUuid] = await window.api.ipc.invoke('confirm-project-file');

          // if the project file is null, the user cancelled when selecting a new file.
          if(!projectFile) {
            return {saved: false, reason: i18n.t('project-io-user-cancelled-save-message')};
          }

          return saveToFile(projectFile, projectName, projectUuid);
        }

        return {saved: true};
      };

      // select a new project file for the project, and save the project contents to the specified file.
      this.saveProjectAs = async() => {
        const [projectFile, projectName, projectUuid] = await window.api.ipc.invoke('choose-project-file');
        // if the project file is null, the user cancelled when selecting a new file.
        if(!projectFile) {
          return {saved: false, reason: i18n.t('project-io-user-cancelled-save-message')};
        }

        project.wdtModel.clearModelFileNames();
        return saveToFile(projectFile, projectName, projectUuid);
      };

      // save the project to the specified project file with name and UUID.
      // if project file is null, do not save.
      // if project name and UUID are specified, this is a new file, so assign those.
      // return object with saved status and reason if not saved.
      async function saveToFile(projectFile, projectName, projectUuid) {

        project.setProjectFileName(projectFile);

        // if project name or UUID are null, they were previously assigned.
        if(projectName) {
          project.setProjectName(projectName);
        }
        if(projectUuid) {
          project.setProjectUuid(projectUuid);
        }

        let projectContents = project.getProjectContents();
        let modelContents = project.wdtModel.getModelContents();
        const saveResult = await window.api.ipc.invoke('save-project', projectFile, projectContents,
          modelContents);

        if(saveResult['model']) {
          project.wdtModel.setSpecifiedModelFiles(saveResult['model']);
        }

        project.setNotDirty();
        return {saved: true};
      }

      // close the project in this window.
      // if the project is dirty, ask the user if they want to save the project.
      // save the project if user indicates to do so.
      // send the close-project message to electron to close or clear the window.
      this.closeProject = async(keepWindow) => {

        if(project.isDirty()) {
          const promptResult = await window.api.ipc.invoke('prompt-save-before-close');
          if(promptResult === 'cancel') {
            return {closed: false};
          }

          if(promptResult === 'yes') {
            const saveResult = await this.saveProject();
            if(!saveResult.saved) {
              // the user cancelled selecting a file, so don't save, don't close.
              return {closed: false};
            }
          }
        }

        // clear the project file name
        project.setProjectFileName(null);

        // clear the project data
        project.setFromJson({}, {});

        // clear the any dirty flags
        project.setNotDirty();

        await window.api.ipc.invoke('close-project', keepWindow);
        return {closed: true};
      };

      this.startAddModelFile = async() => {
        let added = false;

        const saveResult = await this.saveProject();
        if (!saveResult.saved) {
          // save was cancelled, just return
          return {added: added};
        }

        let selectFile = true;
        if(project.wdtModel.modelContent()) {
          const title = i18n.t('add-model-file-title');
          const message = i18n.t('add-model-file-replace-message');
          selectFile = await window.api.ipc.invoke('ok-or-cancel-prompt', title, message);
        }

        if(selectFile) {
          const result = await window.api.ipc.invoke('choose-model-file');
          if(result['content']) {
            project.wdtModel.setSpecifiedModelFiles(result['content']);
            added = true;
          }
        }

        return {added: added};
      };

      this.startAddVariableFile = async() => {
        let added = false;

        const saveResult = await this.saveProject();
        if (!saveResult.saved) {
          // save was cancelled, just return
          return {added: added};
        }

        let selectFile = true;
        if(project.wdtModel.internal.propertiesContent.value.length) {
          const title = i18n.t('add-variable-file-title');
          const message = i18n.t('add-variable-file-replace-message');
          selectFile = await window.api.ipc.invoke('ok-or-cancel-prompt', title, message);
        }

        if(selectFile) {
          const result = await window.api.ipc.invoke('choose-variable-file');
          if(result['content']) {
            project.wdtModel.setSpecifiedModelFiles(result['content']);
            added = true;
          }
        }

        return {added: added};
      };

      this.startAddArchiveFile = async() => {
        let added = false;

        const saveResult = await this.saveProject();
        if (!saveResult.saved) {
          // save was cancelled, just return
          return {added: added};
        }

        let selectFile = true;
        if(project.wdtModel.archiveRoots().length) {
          const title = i18n.t('add-archive-file-title');
          const message = i18n.t('add-archive-file-replace-message');
          selectFile = await window.api.ipc.invoke('ok-or-cancel-prompt', title, message);
        }

        if(selectFile) {
          const result = await window.api.ipc.invoke('choose-archive-file');
          if(result['content']) {
            project.wdtModel.setSpecifiedModelFiles(result['content']);
            added = true;
          }
        }

        return {added: added};
      };

    }

    return new ProjectIo();
  });
