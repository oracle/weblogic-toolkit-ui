/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout',
  'utils/i18n'],

function (ko, i18n) {
  /*
    message conventions:

    basePrefix = model-edit
    folderPrefix = <base-prefix>-<folderKey>-<subfolderKey>...
    attributePrefix = <folderPrefix>-attribute-<attributeKey>

    attributeLabel = <attributePrefix>-label (required, can be derived)

    attributeMessage =
      <attributePrefix>-<key> (optional)
      <folderPrefix>-anyAttribute-<key> (optional, argument: name)
      <basePrefix>-anyAttribute-<key> (required, argument: name)
   */

  function MessageHelper() {
    // provide methods for resolving i18n messages.

    let messageKeys = [];
    window.api.ipc.invoke('get-model-edit-message-keys')
      .then(newMessageKeys => {
        messageKeys = newMessageKeys;
      });

    this.getFolderLabel = aliasPath => {
      // aliasPath should be an array
      const key = this.getFolderKey(aliasPath);
      let label = i18n.t(key);
      if (label === key) {
        const lastFolder = aliasPath[aliasPath.length - 1];
        label = getReadableLabel(lastFolder);
      }
      return label;
    };

    this.getFolderKey = aliasPath => {
      return 'model-edit-f-' + aliasPath.join('_');
    };

    this.getAttributeLabel = (field, labelPrefix) => {
      // every attribute should have a translation for label.
      // if none is available, i18n will log to webui.missing.json, and we return a readable name.
      const key = `${labelPrefix}-attribute-${field.key}-label`;
      const label = i18n.t(key);
      return (label === key) ? getReadableLabel(field.attribute) : label;
    };

    this.getAttributeHelp = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'help', labelPrefix);
    };

    // item label/help for attributes of type "list"

    this.getItemLabel = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'itemLabel', labelPrefix);
    };

    this.getItemHelp = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'itemHelp', labelPrefix);
    };

    this.hasAssignedItemLabel = (field, labelPrefix) => {
      // look for attribute-specific label only
      const attributeKey = `${labelPrefix}-attribute-${field.key}-itemLabel`;
      return messageKeys.includes(attributeKey);
    };

    this.getAddItemLabel = (field, labelPrefix, verbose) => {
      const itemLabel = this.getItemLabel(field, labelPrefix);
      if(verbose && !this.hasAssignedItemLabel(field, labelPrefix)) {
        // use the attribute name for context
        // "Add Item to Libraries"
        const attributeLabel = this.getAttributeLabel(field, labelPrefix);
        return i18n.t('model-edit-addItemTo-label', {item: itemLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return i18n.t('model-edit-add-label', {item: itemLabel});
      }
    };

    this.getDeleteItemLabel = (field, labelPrefix) => {
      const itemLabel = this.getItemLabel(field, labelPrefix);
      // "Delete Library"
      return i18n.t('model-edit-delete-label', {item: itemLabel});
    };

    // key/value/entry label/help for attributes of type "dict"

    this.getKeyLabel = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'keyLabel', labelPrefix);
    };

    this.getKeyHelp = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'keyHelp', labelPrefix);
    };

    this.getValueLabel = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'valueLabel', labelPrefix);
    };

    this.getValueHelp = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'valueHelp', labelPrefix);
    };

    this.getEntryLabel = (field, labelPrefix) => {
      return this.getAttributeMessage(field, 'entryLabel', labelPrefix);
    };

    this.hasAssignedEntryLabel = (field, labelPrefix) => {
      // look for attribute-specific label only
      const attributeKey = `${labelPrefix}-attribute-${field.key}-entryLabel`;
      return messageKeys.includes(attributeKey);
    };

    this.getAddEntryLabel = (field, labelPrefix, verbose) => {
      const entryLabel = this.getEntryLabel(field, labelPrefix);
      if(verbose && !this.hasAssignedEntryLabel(field, labelPrefix)) {
        // use the attribute name for context
        // "Add Item to Libraries"
        const attributeLabel = this.getAttributeLabel(field, labelPrefix);
        return i18n.t('model-edit-addEntryTo-label', {item: entryLabel, attribute: attributeLabel});
      } else {
        // don't need/want context
        // "Add Library"
        return i18n.t('model-edit-add-label', {item: entryLabel});
      }
    };

    this.getDeleteEntryLabel = (field, labelPrefix) => {
      const entryLabel = this.getEntryLabel(field, labelPrefix);
      // "Delete Library"
      return i18n.t('model-edit-delete-label', {item: entryLabel});
    };

    // check for a message at the attribute level, folder level, then top level
    this.getAttributeMessage = (field, key, labelPrefix) => {
      const attributeKey = `${labelPrefix}-attribute-${field.key}-${key}`;
      const folderKey = `${labelPrefix}-anyAttribute-${key}`;
      const genericKey = `model-edit-anyAttribute-${key}`;
      const attributeName = this.getAttributeLabel(field, labelPrefix);
      if(messageKeys.includes(attributeKey)) {
        return i18n.t(attributeKey);
      } else if(messageKeys.includes(folderKey)) {
        return i18n.t(folderKey, {name: getReadableLabel(attributeName)});
      } else {
        return i18n.t(genericKey, {name: getReadableLabel(attributeName)});
      }
    };

    // *******************
    // internal functions
    // *******************

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
