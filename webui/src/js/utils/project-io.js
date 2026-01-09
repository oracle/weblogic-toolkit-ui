/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * A helper object for project IO.
 * Returns a singleton.
 */

define(['knockout', 'models/wkt-project', 'utils/i18n', 'utils/dialog-helper'],
  function (ko, project, i18n, DialogHelper) {
    function ProjectIo() {

      /**
       * Save the project, requesting a location if needed.
       * @param forceSave if true, save regardless of state
       * @param displayMessages if true, display dialogs for busy, errors, etc. If this call is embedded in
       *   another sequence, no dialogs are displayed, and the caller will display the result.
       * @returns {Promise<{saved: boolean, reason: *}>}
       */
      this.saveProject = async(forceSave = false, displayMessages = true) => {
        const projectNotSaved = !project.getProjectFileName();

        if(forceSave || project.isDirty() || projectNotSaved) {
          const checkResult = await this.checkBeforeSave(displayMessages);
          if(checkResult) {
            return checkResult;
          }

          // verify that a project file is assigned to this project, choosing if necessary.
          const [projectFile, projectName, projectUuid, isNewFile] = await window.api.ipc.invoke('confirm-project-file');

          // if the project file is null, the user cancelled when selecting a new file.
          if(!projectFile) {
            return {saved: false, reason: i18n.t('project-io-user-cancelled-save-message')};
          }

          // show busy dialog if displaying messages, and archive updates are present
          const showBusyDialog = displayMessages && project.wdtModel.archiveUpdates.length;
          if(showBusyDialog) {
            const busyDialogMessage = i18n.t('save-in-progress-with-archive-message');
            DialogHelper.openBusyDialog(busyDialogMessage, 'bar');
          }

          // save the project contents to the specified file.
          const result = await saveToFile(projectFile, projectName, projectUuid, isNewFile, displayMessages);

          if(showBusyDialog) {
            await delay(100);  // ensure dialog had time to open if save is too fast
            DialogHelper.closeBusyDialog();
          }

          return result;
        }

        return {saved: true};
      };

      // select a new project file for the project, and save the project contents to the specified file.
      this.saveProjectAs = async() => {
        const checkResult = await this.checkBeforeSave(true);
        if(checkResult) {
          return checkResult;
        }

        const [projectFile, projectName, projectUuid, isNewFile] = await window.api.ipc.invoke('choose-project-file');
        // if the project file is null, the user cancelled when selecting a new file.
        if(!projectFile) {
          return {saved: false, reason: i18n.t('project-io-user-cancelled-save-message')};
        }

        // copy the archive file before archive updates are applied during save
        const currentArchiveFile = project.wdtModel.archiveFile();
        if(currentArchiveFile) {
          await window.api.ipc.invoke('export-archive-file', currentArchiveFile, projectFile);
        }

        // this will cause the model files to be written with new names
        project.wdtModel.clearModelFileNames();

        const busyDialogMessage = i18n.t('save-in-progress-message');
        DialogHelper.openBusyDialog(busyDialogMessage, 'bar');

        const result = await saveToFile(projectFile, projectName, projectUuid, isNewFile);

        await delay(100);  // ensure dialog had time to open if save is too fast
        DialogHelper.closeBusyDialog();

        return result;
      };

      this.checkBeforeSave = async(displayMessages) => {
        let errorMessage = null;

        const pluginType = project.settings.wdtArchivePluginType.observable();
        const javaHome = project.settings.javaHome.observable();
        if (pluginType === 'java' && !javaHome) {
          errorMessage = i18n.t('save-no-java-home-for-archive-helper');
        }

        if(displayMessages && errorMessage) {
          const errorTitle = i18n.t('save-failed-title');
          const qualifiedMessage = i18n.t('save-failed-message', { error: errorMessage });
          await window.api.ipc.invoke('show-error-message', errorTitle, qualifiedMessage);
        }

        return errorMessage ? { saved: false, reason: errorMessage } : null;
      };

      function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      // save the project to the specified project file with name and UUID.
      // if project file is null, do not save.
      // if project name and UUID are specified, this is a new file, so assign those.
      // return object with saved status and reason if not saved.
      async function saveToFile(projectFile, projectName, projectUuid, isNewFile, displayElectronSideErrors = true) {
        const result = { saved: true };
        // if project name or UUID are null, they were previously assigned.
        if(projectName) {
          project.setProjectName(projectName);
        }
        if(projectUuid) {
          project.setProjectUuid(projectUuid);
        }

        let projectContents = project.getProjectContents();
        let modelContents = project.wdtModel.getModelContents();
        const projectContext = getProjectContext();
        const saveResult = await window.api.ipc.invoke('save-project', projectFile, projectContents,
          modelContents, isNewFile, displayElectronSideErrors, projectContext);

        if (saveResult['isProjectFileSaved']) {
          project.setProjectFileName(projectFile);
          if (saveResult['areModelFilesSaved']) {
            if(saveResult['model']) {
              project.wdtModel.setSpecifiedModelFiles(saveResult['model']);
            }
            project.setNotDirty();
          } else {
            result['saved'] = false;
            result['reason'] = saveResult.reason;
          }
        } else {
          result['saved'] = false;
          result['reason'] = saveResult.reason;
        }
        return result;
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

        // clear the dirty flags
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
          const result =  await window.api.ipc.invoke('choose-archive-file',
            project.settings.wdtArchivePluginType.value(), project.settings.javaHome.value());
          if(result['content']) {
            project.wdtModel.setSpecifiedModelFiles(result['content']);
            added = true;
          }
        }

        return {added: added};
      };

      function getProjectContext() {
        const macZipjsTmpDir = project.settings.zipjsTmpDir.observable();
        const context = {
          wdtArchivePluginType: project.settings.wdtArchivePluginType.observable(),
          javaHome: project.settings.javaHome.observable(),
        };
        if (macZipjsTmpDir) {
          context.macZipjsTmpDir = macZipjsTmpDir;
        }
        return context;
      }
    }

    return new ProjectIo();
  });
