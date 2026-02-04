/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/wkt-logger', 'utils/dialog-helper', 'utils/wdt-archive-helper',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/alias-helper', 'utils/modelEdit/message-helper', 'utils/modelEdit/navigation-helper'
],
function (ko, WktLogger, DialogHelper, ArchiveHelper, ModelEditHelper, AliasHelper,
  MessageHelper, NavigationHelper) {

  function MetaMethods() {
    const ENCRYPTED_VALUE_ATTRIBUTE = 'EncryptedValueEncrypted';
    const PROPERTY_ATTRIBUTE_NAMES = ['Value', ENCRYPTED_VALUE_ATTRIBUTE, 'SysPropValue'];

    // ask about adding Application Installation Directory (structured) app
    this.addApplication = async (modelPath) => {
      const options = {
        modelPath
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

    // *******************************
    // instance table summary methods
    // *******************************

    this.propertyValueColumnInfo = (attributeKey, aliasPath, defaultSortable) => {
      return {
        // use simple 'Value' attribute translation as the name of this column
        headerText: MessageHelper.getAttributeLabelFromName('Value', aliasPath),
        sortable: defaultSortable,
        sortProperty: attributeKey,
        resizable: 'enabled'
      };
    };

    this.propertyValueTypeColumnInfo = (attributeKey, aliasPath, defaultSortable) => {
      return {
        headerText: MessageHelper.t('attribute-editor-property-value-type-label'),
        sortable: defaultSortable,
        sortProperty: attributeKey,
        resizable: 'enabled'
      };
    };

    this.propertyValue = (attributeKey, modelPath) => {
      let value  = null;
      let isCredential = false;
      for (const eachAttributeName of PROPERTY_ATTRIBUTE_NAMES) {
        value = ModelEditHelper.getValue(modelPath, eachAttributeName);
        if(value) {
          isCredential = eachAttributeName === ENCRYPTED_VALUE_ATTRIBUTE;
          break;
        }
      }

      return {
        value: ModelEditHelper.getDerivedValue(value),
        isCredential
      };
    };

    this.propertyValueType = (attributeKey, modelPath) => {
      let attributeName  = null;
      for (const eachAttributeName of PROPERTY_ATTRIBUTE_NAMES) {
        const value = ModelEditHelper.getValue(modelPath, eachAttributeName);
        if(value) {
          attributeName = eachAttributeName;
          break;
        }
      }

      const aliasPath = AliasHelper.getAliasPath(modelPath);
      const value = attributeName ? MessageHelper.getAttributeLabelFromName(attributeName, aliasPath) : null;
      return {
        value,
        isCredential: false
      };
    };
  }

  // return a singleton instance
  return new MetaMethods();
});
