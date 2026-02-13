/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/model-edit-helper', 'utils/modelEdit/message-helper',
  'utils/modelEdit/alias-helper', 'utils/view-helper', 'utils/wdt-archive-helper',
  'oj-c/input-text', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojswitch', 'ojs/ojvalidationgroup'],
function(accUtils, ko, ModelEditHelper, MessageHelper, AliasHelper, ViewHelper, ArchiveHelper) {

  function AppInstallDirDialogModel(args) {
    const DIALOG_SELECTOR = '#appInstallDirDialog';

    const MODEL_PATH = args.modelPath;

    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.connected = () => {
      accUtils.announce('Application installation directory dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.labelMapper = (labelId, arg) => {
      return MessageHelper.t('add-install-dir-' + labelId, arg);
    };

    this.title = this.labelMapper('title');
    this.selectDirectoryLabel = MessageHelper.t('attribute-editor-select-directory');
    this.selectFileLabel = MessageHelper.t('attribute-editor-select-file');

    this.installDirLabel = this.labelMapper('install-dir-label', ALIAS_PATH);
    this.installDirHelp = this.labelMapper('install-dir-help', ALIAS_PATH);
    this.installDir = ko.observable();
    this.installDirMessages = ko.observableArray();

    this.sourcePathLabel = MessageHelper.getAttributeLabelFromName('SourcePath', ALIAS_PATH);
    this.sourcePathHelp = MessageHelper.getAttributeHelp({name: 'SourcePath'}, ALIAS_PATH);
    this.sourcePath = ko.observable();
    this.sourcePathMessages = ko.observableArray();

    this.planDirLabel = MessageHelper.getAttributeLabelFromName('PlanDir', ALIAS_PATH);
    this.planDirHelp = MessageHelper.getAttributeHelp({name: 'PlanDir'}, ALIAS_PATH);
    this.planDir = ko.observable();
    this.planDirMessages = ko.observableArray();

    this.planPathLabel = MessageHelper.getAttributeLabelFromName('PlanPath', ALIAS_PATH);
    this.planPathHelp = MessageHelper.getAttributeHelp({name: 'PlanPath'}, ALIAS_PATH);
    this.planPath = ko.observable();
    this.planPathMessages = ko.observableArray();

    this.addToArchiveLabel = this.labelMapper('use-archive-label');
    this.addToArchiveHelp = this.labelMapper('use-archive-help');
    this.addToArchive = ko.observable(false);

    this.selectInstallDirectory = async () => {
      await this._selectPath(this.installDir, 'dir', this.installDirLabel);
    };

    this.selectSourceDirectory = async () => {
      await this._selectArchiveTypePath(this.sourcePath, 'dir', 'application');
    };

    this.selectSourceFile = async () => {
      await this._selectArchiveTypePath(this.sourcePath, 'file', 'application');
    };

    this.selectPlanDirectory = async () => {
      await this._selectPath(this.planDir, 'dir', this.planDirLabel);
    };

    this.selectPlanPath = async () => {
      await this._selectArchiveTypePath(this.planPath, 'file', 'applicationDeploymentPlan');
    };

    this._selectArchiveTypePath = async (pathObservable, pathType, archiveTypeName) => {
      const archiveType = ModelEditHelper.getArchiveType(archiveTypeName);
      const chooserName = pathType === 'dir' ? archiveType.dirLabel : archiveType.fileLabel;
      await this._selectPath(pathObservable, pathType, chooserName, archiveType.extensions);
    };

    this._selectPath = async (pathObservable, pathType, chooserName, extensions) => {
      const currentValue = pathObservable() || this.installDir();
      const selectOption = {type: pathType, chooserName, extensions};
      const fileChosen = await ArchiveHelper.chooseAttributeFile(selectOption, currentValue);
      if(fileChosen) {
        pathObservable(fileChosen);
      }
    };

    this.validateAll = async () => {
      // validate that every field is compatible with app install dir layout.

      this.installDirMessages.removeAll();
      this.sourcePathMessages.removeAll();
      this.planDirMessages.removeAll();
      this.planPathMessages.removeAll();

      let valid = true;

      const installDir = this.installDir();

      // source path must be a relative path, or absolute subpath of installDir
      let fullSourcePath = this.sourcePath();
      if(fullSourcePath) {  // "required" validator will catch empty value
        if (window.api.path.isAbsolute(fullSourcePath)) {
          if (!isSubPath(fullSourcePath, installDir)) {
            addError(this.labelMapper('not-sub-path-error'), this.sourcePathMessages);
            valid = false;
          }
        } else {
          fullSourcePath = window.api.path.join(installDir, fullSourcePath);
        }
      }

      // plan dir must be empty, a relative path, or absolute subpath of installDir
      let fullPlanDir = this.planDir();
      if(fullPlanDir) {  // "required" validator will catch empty value
        if (window.api.path.isAbsolute(fullPlanDir)) {
          if (!isSubPath(fullPlanDir, installDir)) {
            addError(this.labelMapper('not-sub-path-error'), this.planDirMessages);
            valid = false;
          }
        } else {
          fullPlanDir = window.api.path.join(installDir, fullPlanDir);
        }
      }

      // plan path must consider plan dir, then be empty, a relative path, or absolute subpath of installDir
      let fullPlanPath = this.planPath();
      if(fullPlanPath) {
        if(window.api.path.isAbsolute(fullPlanPath)) {
          if(fullPlanDir) {
            addError(this.labelMapper('not-relative-plan-path-error'), this.planPathMessages);
            valid = false;
          } else if (!isSubPath(fullPlanPath, installDir)) {
            addError(this.labelMapper('not-sub-path-error'), this.planPathMessages);
            valid = false;
          }
        } else if(fullPlanDir) {
          fullPlanPath = window.api.path.join(fullPlanDir, fullPlanPath);
        } else {
          fullPlanPath = window.api.path.join(installDir, fullPlanPath);
        }
      } else if(fullPlanDir) {
        addError(this.labelMapper('required-with-plan-dir-error'), this.planPathMessages);
        valid = false;
      }

      // if adding to archive, verify that each directory/file exists.

      if(this.addToArchive()) {
        if(installDir) {  // "required" validator will catch empty value
          const isDir = await window.api.modelEdit.isDirectory(installDir);
          if (!isDir) {
            addError(this.labelMapper('not-directory-error'), this.installDirMessages);
            valid = false;
          }
        }

        if(fullSourcePath) {  // "required" validator will catch empty value
          const sourcePathExists = await window.api.modelEdit.exists(fullSourcePath);
          if (!sourcePathExists) {
            addError(this.labelMapper('not-exists-error'), this.sourcePathMessages);
            valid = false;
          }
        }

        if(fullPlanDir) {
          const planDirExists = await window.api.modelEdit.isDirectory(fullPlanDir);
          if (!planDirExists) {
            addError(this.labelMapper('not-directory-error'), this.planDirMessages);
            valid = false;
          }
        }

        if(fullPlanPath) {
          const planPathExists = await window.api.modelEdit.exists(fullPlanPath);
          if (!planPathExists) {
            addError(this.labelMapper('not-file-error'), this.planPathMessages);
            valid = false;
          }
        }
      }

      return valid;
    };

    function addError(messageText, messagesObservable) {
      const message = { summary: '', detail: messageText, severity: 'error' };
      messagesObservable.push(message);
    }

    function isSubPath(path, parentPath) {
      const relativePath = window.api.path.relative(parentPath, path);
      return relativePath && !relativePath.startsWith('..') && relativePath !== '..';
    }

    this.okInput = async () => {
      const crossValid = await this.validateAll();
      const tracker = document.getElementById('appInstallDirTracker');

      if (tracker.valid !== 'valid' || !crossValid) {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      const result = {
        addToArchive: this.addToArchive(),
        installDir: this.installDir(),
        folderContent: {
          SourcePath: this.sourcePath(),
          PlanDir: this.planDir(),
          PlanPath: this.planPath()
        }
      };

      args.setValue(result);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue({});
    };
  }

  return AppInstallDirDialogModel;
});
