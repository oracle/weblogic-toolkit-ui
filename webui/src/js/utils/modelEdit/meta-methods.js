/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/wkt-logger', 'utils/dialog-helper', 'utils/wdt-archive-helper',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/navigation-helper'
],
function (ko, WktLogger, DialogHelper, ArchiveHelper, ModelEditHelper, NavigationHelper) {
  function MetaMethods() {

    // ask about adding Application Installation Directory (structured) app
    this.addApplication = async (modelPath, nameValidators) => {
      const options = {
        modelPath,
        nameValidators
      };

      const newResult = await DialogHelper.promptDialog('modelEdit/new-app-dialog', options);
      const newName = newResult.instanceName;
      if (!newName) {  // cancel
        return;
      }

      let folderContent = {};

      if(newResult.useAppInstallDir) {
        const appResult = await DialogHelper.promptDialog('modelEdit/app-install-dir-dialog', options);
        if (!appResult.installDir) {  // cancel
          return;
        }

        folderContent = appResult.folderContent;

        if(appResult.addToArchive) {
          const addOptions = {
            fileName: appResult.installDir,
            fileType: 'dir'
          };
          const archivePath = await ArchiveHelper.addToArchive('applicationInstallationDirectory', addOptions);

          // absolute paths need correction to wlsdeploy/...
          for(const [key, path] of Object.entries(folderContent)) {
            if (path && window.api.path.isAbsolute(path)) {
              const relativePath = window.api.path.relative(appResult.installDir, path);
              folderContent[key] = window.api.path.join(archivePath, relativePath);
            }
          }
        }
      }

      ModelEditHelper.addFolder(modelPath, newName, folderContent);

      NavigationHelper.openNavigation(modelPath);  // open parent
    };

    this.newEnableDebugScopeFolderContent = () => {
      return { Enabled: true };
    };
  }

  // return a singleton instance
  return new MetaMethods();
});
