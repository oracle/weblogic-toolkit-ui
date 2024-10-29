/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/i18n',
  'utils/modelEdit/alias-helper'],

function (ko, i18n, AliasHelper) {
  /*
    message conventions:

    basePrefix = model-edit
    folderPrefix = <base-prefix>-<folderKey>-<subfolderKey>...
    attributePrefix = <folderPrefix>-a-<attributeKey>

    folderLabel = <folderPrefix>-label (required, can be derived)

    folderMessage search path:
      <folderPrefix>-<suffix> (optional, argument: name)
      <basePrefix>-anyFolder-<suffix> (required, argument: name)

    attributeLabel = <attributePrefix>-label (required, can be derived)

    attributeMessage search path:
      <attributePrefix>-<suffix> (optional)
      <folderPrefix>-anyAttribute-<suffix> (optional, argument: name)
      <basePrefix>-anyAttribute-<suffix> (required, argument: name)
   */

  function MessageHelper() {
    // provide methods for resolving i18n messages.

    let messageKeys = [];
    window.api.ipc.invoke('get-model-edit-message-keys')
      .then(newMessageKeys => {
        messageKeys = newMessageKeys;
      });

    this.getPageTitle = modelPath => {
      const aliasPath = AliasHelper.getAliasPath(modelPath);
      if(AliasHelper.isNamedPath(modelPath)) {
        const name = modelPath[modelPath.length - 1];
        if(hasAssignedFolderMessage(aliasPath, 'typeLabel')) {
          return `${this.getFolderTypeLabel(aliasPath)} "${name}"`;
        }
        return `${this.getFolderLabel(aliasPath)} / ${modelPath[modelPath.length - 1]}`;
      }
      return this.getFolderLabel(aliasPath);
    };

    // *******************
    // Folder Messages
    // *******************

    this.getFolderLabel = aliasPath => {
      // required - this will add a webui.missing.json entry if not found
      const prefix = getFolderPrefix(aliasPath);
      const key = `${prefix}-label`;
      let label = i18n.t(key);
      if (label === key) {
        const lastFolder = aliasPath[aliasPath.length - 1];
        label = getReadableLabel(lastFolder);
      }
      return label;
    };

    this.getAddInstanceMessage = aliasPath => {
      const label = this.getFolderTypeLabel(aliasPath);
      return i18n.t('model-edit-add-label', {item: label});
    };

    this.getDeleteInstanceMessage = aliasPath => {
      const label = this.getFolderTypeLabel(aliasPath);
      return i18n.t('model-edit-delete-label', {item: label});
    };

    this.getNoDataMessage = aliasPath => {
      return getFolderMessage(aliasPath, 'noDataLabel');
    };

    this.getInstanceNameLabel = aliasPath => {
      const label = this.getFolderTypeLabel(aliasPath);
      return getFolderMessage(aliasPath, 'nameLabel', { folderType: label });
    };

    this.getInstanceNameHelp = aliasPath => {
      const label = this.getFolderTypeLabel(aliasPath);
      return getFolderMessage(aliasPath, 'nameHelp', { folderType: label });
    };

    this.getFolderTypeLabel = aliasPath => {
      // elementLabel is the singular: "Server", not "Servers"
      return getFolderMessage(aliasPath, 'typeLabel');
    };

    this.getRenameInstanceMessage = modelPath => {
      const aliasPath = AliasHelper.getAliasPath(modelPath);
      const typeLabel = this.getFolderTypeLabel(aliasPath);
      const instanceName = modelPath[modelPath.length - 1];
      return i18n.t('model-edit-rename-title', {type: typeLabel, name: instanceName});
    };

    // *******************
    // attribute messages
    // *******************

    this.getAttributeLabel = (attribute, aliasPath) => {
      return this.getAttributeLabelInternal(attribute.name, aliasPath);
    };

    this.getAttributeLabelFromName = (attributeName, aliasPath) => {
      return this.getAttributeLabelInternal(attributeName, aliasPath);
    };

    this.getAttributeLabelInternal = (attributeName, aliasPath) => {
      // every attribute should have a translation for label.
      // if none is available, i18n will log to webui.missing.json, and we return a readable name.
      const attributeKey = getAttributeKey(attributeName);
      const folderPrefix = getFolderPrefix(aliasPath);
      const key = `${folderPrefix}-a-${attributeKey}-label`;
      const label = i18n.t(key);
      return (label === key) ? getReadableLabel(attributeName) : label;
    };

    this.getAttributeHelp = (attribute, aliasPath) => {
      const args = { attribute: this.getAttributeLabel(attribute, aliasPath) };
      return getAttributeMessage(attribute, 'help', aliasPath, args);
    };

    // item label/help for attributes of type "list"

    this.getItemLabel = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'itemLabel', aliasPath);
    };

    this.getItemHelp = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'itemHelp', aliasPath);
    };

    this.hasAssignedItemLabel = (attribute, aliasPath) => {
      return hasAssignedAttributeMessage(attribute, 'itemLabel', aliasPath);
    };

    this.getAddItemLabel = (attribute, aliasPath, verbose) => {
      const itemLabel = this.getItemLabel(attribute, aliasPath);
      if(verbose && !this.hasAssignedItemLabel(attribute, aliasPath)) {
        // use the attribute name for context
        // "Add Item to Libraries"
        const attributeLabel = this.getAttributeLabel(attribute, aliasPath);
        return i18n.t('model-edit-addItemTo-label', {item: itemLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return i18n.t('model-edit-add-label', {item: itemLabel});
      }
    };

    this.getDeleteItemLabel = (attribute, aliasPath) => {
      const itemLabel = this.getItemLabel(attribute, aliasPath);
      // "Delete Library"
      return i18n.t('model-edit-delete-label', {item: itemLabel});
    };

    // key/value/entry label/help for attributes of type "dict"

    this.getKeyLabel = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'keyLabel', aliasPath);
    };

    this.getKeyHelp = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'keyHelp', aliasPath);
    };

    this.getValueLabel = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'valueLabel', aliasPath);
    };

    this.getValueHelp = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'valueHelp', aliasPath);
    };

    this.getEntryLabel = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'entryLabel', aliasPath);
    };

    this.hasAssignedEntryLabel = (attribute, aliasPath) => {
      return hasAssignedAttributeMessage(attribute, 'entryLabel', aliasPath);
    };

    this.getAddEntryLabel = (attribute, aliasPath, verbose) => {
      const entryLabel = this.getEntryLabel(attribute, aliasPath);
      if(verbose && !this.hasAssignedEntryLabel(attribute, aliasPath)) {
        // use the attribute name for context
        // "Add Item to Libraries"
        const attributeLabel = this.getAttributeLabel(attribute, aliasPath);
        return i18n.t('model-edit-addEntryTo-label', {item: entryLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return i18n.t('model-edit-add-label', {item: entryLabel});
      }
    };

    this.getDeleteEntryLabel = (attribute, aliasPath) => {
      const entryLabel = this.getEntryLabel(attribute, aliasPath);
      // "Delete Library"
      return i18n.t('model-edit-delete-label', {item: entryLabel});
    };

    // *******************
    // internal functions
    // *******************

    function getFolderPrefix(aliasPath) {
      return 'model-edit-f-' + aliasPath.join('_');
    }

    // check for a message at the folder level, then top level
    function getFolderMessage (aliasPath, suffix, args) {
      const folderPrefix = getFolderPrefix(aliasPath);
      const folderKey =  `${folderPrefix}-${suffix}`;
      const genericKey = `model-edit-anyFolder-${suffix}`;
      args = args || {};

      if(messageKeys.includes(folderKey)) {
        return i18n.t(folderKey, args);
      } else {
        return i18n.t(genericKey, args);
      }
    }

    function hasAssignedFolderMessage(aliasPath, suffix) {
      // look for attribute-specific message only
      const folderPrefix = getFolderPrefix(aliasPath);
      const folderKey = `${folderPrefix}-${suffix}`;
      return messageKeys.includes(folderKey);
    }

    function getAttributeKey(attributeName) {
      return attributeName.replaceAll('.', '_');
    }

    // check for a message at the attribute level, folder level, then top level
    function getAttributeMessage(attribute, suffix, aliasPath, args) {
      const key = getAttributeKey(attribute.name);
      const folderPrefix = getFolderPrefix(aliasPath);
      const attributeKey = `${folderPrefix}-a-${key}-${suffix}`;
      const folderKey = `${folderPrefix}-anyAttribute-${suffix}`;
      const genericKey = `model-edit-anyAttribute-${suffix}`;
      args = args || {};

      if(messageKeys.includes(attributeKey)) {
        return i18n.t(attributeKey, args);
      } else if(messageKeys.includes(folderKey)) {
        return i18n.t(folderKey, args);
      } else {
        return i18n.t(genericKey, args);
      }
    }

    function hasAssignedAttributeMessage(attribute, suffix, aliasPath) {
      // look for attribute-specific message only
      const key = getAttributeKey(attribute.name);
      const folderPrefix = getFolderPrefix(aliasPath);
      const attributeKey = `${folderPrefix}-a-${key}-${suffix}`;
      return messageKeys.includes(attributeKey);
    }

    function getReadableLabel(name) {
      let result = name.charAt(0);

      // skip the first letter
      for (let i = 1; i < name.length; i++) {
        const current = name.charAt(i);
        const previous = name.charAt(i - 1);
        const next = (i < name.length - 1) ? name.charAt(i + 1) : null;

        if (isUpperCase(current)) {
          if(isUpperCase(previous)) {  // check for S in 'MTU Size'
            if(next && !isUpperCase(next)) {
              result += ' ';
            }
          } else {
            result += ' ';
          }
        }
        result += current;
      }
      return result;
    }

    function isUpperCase(char) {
      return char === char.toUpperCase();
    }
  }

  // important to be a singleton
  return new MessageHelper();
}
);
