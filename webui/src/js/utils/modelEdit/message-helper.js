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
        if(hasAssignedFolderMessage(aliasPath, 'elementLabel')) {
          return `${this.getFolderTypeLabel(aliasPath)} ${name}`;
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

    // *******************
    // attribute messages
    // *******************

    this.getAttributeFieldLabel = (field, aliasPath) => {
      return this.getAttributeLabelInternal(field.attribute, aliasPath);
    };

    this.getAttributeLabel = (attributeName, aliasPath) => {
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

    this.getAttributeHelp = (field, aliasPath) => {
      const args = { attribute: this.getAttributeFieldLabel(field, aliasPath) };
      return getAttributeMessage(field, 'help', aliasPath, args);
    };

    // item label/help for attributes of type "list"

    this.getItemLabel = (field, aliasPath) => {
      return getAttributeMessage(field, 'itemLabel', aliasPath);
    };

    this.getItemHelp = (field, aliasPath) => {
      return getAttributeMessage(field, 'itemHelp', aliasPath);
    };

    this.hasAssignedItemLabel = (field, aliasPath) => {
      return hasAssignedAttributeMessage(field, 'itemLabel', aliasPath);
    };

    this.getAddItemLabel = (field, aliasPath, verbose) => {
      const itemLabel = this.getItemLabel(field, aliasPath);
      if(verbose && !this.hasAssignedItemLabel(field, aliasPath)) {
        // use the attribute name for context
        // "Add Item to Libraries"
        const attributeLabel = this.getAttributeFieldLabel(field, aliasPath);
        return i18n.t('model-edit-addItemTo-label', {item: itemLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return i18n.t('model-edit-add-label', {item: itemLabel});
      }
    };

    this.getDeleteItemLabel = (field, aliasPath) => {
      const itemLabel = this.getItemLabel(field, aliasPath);
      // "Delete Library"
      return i18n.t('model-edit-delete-label', {item: itemLabel});
    };

    // key/value/entry label/help for attributes of type "dict"

    this.getKeyLabel = (field, aliasPath) => {
      return getAttributeMessage(field, 'keyLabel', aliasPath);
    };

    this.getKeyHelp = (field, aliasPath) => {
      return getAttributeMessage(field, 'keyHelp', aliasPath);
    };

    this.getValueLabel = (field, aliasPath) => {
      return getAttributeMessage(field, 'valueLabel', aliasPath);
    };

    this.getValueHelp = (field, aliasPath) => {
      return getAttributeMessage(field, 'valueHelp', aliasPath);
    };

    this.getEntryLabel = (field, aliasPath) => {
      return getAttributeMessage(field, 'entryLabel', aliasPath);
    };

    this.hasAssignedEntryLabel = (field, aliasPath) => {
      return hasAssignedAttributeMessage(field, 'entryLabel', aliasPath);
    };

    this.getAddEntryLabel = (field, aliasPath, verbose) => {
      const entryLabel = this.getEntryLabel(field, aliasPath);
      if(verbose && !this.hasAssignedEntryLabel(field, aliasPath)) {
        // use the attribute name for context
        // "Add Item to Libraries"
        const attributeLabel = this.getAttributeFieldLabel(field, aliasPath);
        return i18n.t('model-edit-addEntryTo-label', {item: entryLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return i18n.t('model-edit-add-label', {item: entryLabel});
      }
    };

    this.getDeleteEntryLabel = (field, aliasPath) => {
      const entryLabel = this.getEntryLabel(field, aliasPath);
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
    function getAttributeMessage(field, suffix, aliasPath, args) {
      const fieldKey = getAttributeKey(field.attribute);
      const folderPrefix = getFolderPrefix(aliasPath);
      const attributeKey = `${folderPrefix}-a-${fieldKey}-${suffix}`;
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

    function hasAssignedAttributeMessage(field, suffix, aliasPath) {
      // look for attribute-specific message only
      const fieldKey = getAttributeKey(field.attribute);
      const folderPrefix = getFolderPrefix(aliasPath);
      const attributeKey = `${folderPrefix}-a-${fieldKey}-${suffix}`;
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
