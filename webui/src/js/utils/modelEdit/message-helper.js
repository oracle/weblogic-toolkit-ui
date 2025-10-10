/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/i18n',
  'utils/modelEdit/alias-helper'],

function (ko, i18n, AliasHelper) {
  /*
    message conventions:

    folderPath = <folderKey>_<subfolderKey>...

    folderLabel = <folderPath>-label (required, can be derived)

    folder message search path:
      f-<folderPath>-<messageType>  (optional)
      f-any-<messageType>           (required)

    attributeLabel = <attributePrefix>-label (required, can be derived)

    attribute message search path:
      f-<folderPath>-a-<attributeName>-help  (optional)
      f-<folderPath>-a-any-help              (optional)
      a-<attributeName>-help                 (optional)
      a-any-help                             (required)
   */

  function MessageHelper() {
    // provide methods for resolving i18n messages.

    const NAMESPACE = 'modeledit';

    let messageKeys = [];
    window.api.ipc.invoke('get-model-edit-message-keys')
      .then(newMessageKeys => {
        messageKeys = newMessageKeys;
      });

    const t = (key, args) => {
      args = args || {};
      const allArgs = { ...args, ns: NAMESPACE };
      return i18n.t(key, allArgs);
    };

    this.t = (key, args) => {
      return t(key, args);
    };

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
      const prefix = getFolderPrefix(aliasPath);
      const lastFolder = aliasPath[aliasPath.length - 1];
      const folderKey = `${prefix}-label`;
      const anyFolderKey =  `f-any_${lastFolder}-label`;

      if(messageKeys.includes(folderKey)) {  // specific to folder path
        return t(folderKey);
      } else {  // specific to folder name, log as missing if unavailable
        const label = t(anyFolderKey);
        return (label === anyFolderKey) ? getReadableLabel(lastFolder) : label;
      }
    };

    this.getAddInstanceMessage = aliasPath => {
      const label = this.getFolderTypeLabel(aliasPath);
      return t('add-label', {item: label});
    };

    this.getDeleteInstanceMessage = aliasPath => {
      const label = this.getFolderTypeLabel(aliasPath);
      return t('delete-label', {item: label});
    };

    this.getNoInstancesMessage = aliasPath => {
      return getFolderMessage(aliasPath, 'noInstancesMessage');
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
      // folderTypeLabel is the singular: "Server", not "Servers"
      return getFolderMessage(aliasPath, 'typeLabel');
    };

    this.getRenameInstanceMessage = modelPath => {
      const aliasPath = AliasHelper.getAliasPath(modelPath);
      const typeLabel = this.getFolderTypeLabel(aliasPath);
      const instanceName = modelPath[modelPath.length - 1];
      return t('rename-title', {type: typeLabel, name: instanceName});
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
      const folderAttributeKey = `${folderPrefix}-a-${attributeKey}-label`;
      const onlyAttributeKey = `a-${attributeKey}-label`;

      if(messageKeys.includes(folderAttributeKey)) {  // specific to folder + attribute
        return t(folderAttributeKey);
      } else {  // specific to attribute, log as missing if unavailable
        const label = t(onlyAttributeKey);
        return (label === onlyAttributeKey) ? getReadableLabel(attributeName) : label;
      }
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
        return t('add-to-label', {item: itemLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return t('add-label', {item: itemLabel});
      }
    };

    this.getDeleteItemLabel = (attribute, aliasPath) => {
      const itemLabel = this.getItemLabel(attribute, aliasPath);
      // "Delete Library"
      return t('delete-label', {item: itemLabel});
    };

    this.getNoItemsMessage = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'noItemsMessage', aliasPath);
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

    this.getNoEntriesMessage = (attribute, aliasPath) => {
      return getAttributeMessage(attribute, 'noEntriesMessage', aliasPath);
    };

    this.getAddEntryLabel = (attribute, aliasPath, verbose) => {
      const entryLabel = this.getEntryLabel(attribute, aliasPath);
      if(verbose && !this.hasAssignedEntryLabel(attribute, aliasPath)) {
        // use the attribute name for context
        // "Add Item to Libraries"
        const attributeLabel = this.getAttributeLabel(attribute, aliasPath);
        return t('add-to-label', {item: entryLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return t('add-label', {item: entryLabel});
      }
    };

    this.getDeleteEntryLabel = (attribute, aliasPath) => {
      const entryLabel = this.getEntryLabel(attribute, aliasPath);
      // "Delete Library"
      return t('delete-label', {item: entryLabel});
    };

    // *******************
    // internal functions
    // *******************

    function getFolderPrefix(aliasPath) {
      return 'f-' + aliasPath.join('_');
    }

    // check for a message at the folder level, then "any" level
    function getFolderMessage (aliasPath, suffix, args) {
      const folderPrefix = getFolderPrefix(aliasPath);
      const lastFolder = aliasPath[aliasPath.length - 1];
      const folderKey =  `${folderPrefix}-${suffix}`;
      const anyFolderKey =  `f-any_${lastFolder}-${suffix}`;
      const genericKey = `f-any-${suffix}`;
      args = args || {};

      if(messageKeys.includes(folderKey)) {
        return t(folderKey, args);
      } else if(messageKeys.includes(anyFolderKey)) {
        return t(anyFolderKey, args);
      } else {
        return t(genericKey, args);
      }
    }

    function hasAssignedFolderMessage(aliasPath, suffix) {
      // look for folder-specific message only
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
      const folderAttributeKey = `${folderPrefix}-a-${key}-${suffix}`;
      const folderKey = `${folderPrefix}-a-any-${suffix}`;
      const attributeKey = `a-${key}-${suffix}`;
      const genericKey = `a-any-${suffix}`;
      args = args || {};

      if(messageKeys.includes(folderAttributeKey)) {  // specific to folder + attribute
        return t(folderAttributeKey, args);
      } else if(messageKeys.includes(folderKey)) {  // specific to folder
        return t(folderKey, args);
      } else if(messageKeys.includes(attributeKey)) {  // specific to attribute
        return t(attributeKey, args);
      } else {  // default for any attribute, log as missing if unavailable
        return t(genericKey, args);
      }
    }

    function hasAssignedAttributeMessage(attribute, suffix, aliasPath) {
      // look for attribute-specific message only
      const key = getAttributeKey(attribute.name);
      const folderPrefix = getFolderPrefix(aliasPath);
      const folderAttributeKey = `${folderPrefix}-a-${key}-${suffix}`;
      const attributeKey = `a-${key}-${suffix}`;
      return messageKeys.includes(folderAttributeKey) || messageKeys.includes(attributeKey);
    }

    function getReadableLabel(name) {
      return window.api.modelEdit.getReadableLabel(name);
    }
  }

  // important to be a singleton
  return new MessageHelper();
}
);
