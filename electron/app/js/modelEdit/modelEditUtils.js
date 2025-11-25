/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

// This module is shared by scripts / updateAliasLabels.js, so it should not be
// dependent on Node.js initialization (don't require i18next, wktTools, etc.).
const fsPromises = require('fs/promises');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const wdtArchive = require('../wdtArchive');

const acronyms = [
  'ACL', 'ACS', 'CCDI', 'CORS', 'CPU', 'CRL', 'DB', 'DDL', 'EJB', 'HTTP', 'ID', 'JDBC', 'JMS', 'JNDI',
  'JPA', 'JTA', 'KSS', 'MDB', 'PC', 'RJVM', 'RMIT', 'SAML', 'SNMP', 'SRM', 'SSL', 'SSO', 'TLOG', 'TTL', 'TXN',
  'URI', 'URL', 'WLDF', 'WSAT', 'XA', 'XACML',
  'Coherence', 'WebLogic'
];

/* global __dirname */

const MESSAGES_FILE = path.normalize(path.join(__dirname, '..', '..', 'locales', 'en', 'modeledit.json'));
const MULTIPLE_CHILD_TYPES = ['multiple', 'multiple_with_type_subfolder'];

async function getAliasInfo(wdtLibraryJar) {
  const WDT_ALIAS_REGEX= /^oracle\/weblogic\/deploy\/aliases\/category_modules\/(.*)\.json$/;

  const fileData = await fsPromises.readFile(wdtLibraryJar);
  const zip = await JSZip.loadAsync(fileData);

  const result = {
    paths: {}
  };

  for (const zipEntryName in zip.files) {
    const match = zipEntryName.match(WDT_ALIAS_REGEX);
    if (match) {
      let name = match[1];
      name = (name === 'AppDeployment') ? 'Application' : name;  // WDT quirk
      name = (name === 'Domain') ? 'Topology' : name;  // name for UI references

      const zipEntry = zip.file(zipEntryName);
      const content = await zipEntry.async('text');
      const aliasData = JSON.parse(content);

      addPaths(aliasData, name, result.paths);
    }
  }

  return result;
}

function getMessageKeys() {
  // read these for each invocation, rather than require('../../locales/en/webui.json');
  // prevents cached data on front-end reload.

  // read from the en locale - this will give the most current set of keys.
  const messagesMap = getMessageMap();
  const messageKeys = [];
  Object.keys(messagesMap).forEach(key => {
    if(key.startsWith('f-') || key.startsWith('a-')) {
      messageKeys.push(key);
    }
  });
  return messageKeys;
}

function getMessageMap() {
  // read from the en locale - this will give the most current set of keys.
  const contents = fs.readFileSync(MESSAGES_FILE, 'utf8');
  return JSON.parse(contents.toString());
}

function addPaths(aliasFolder, path, pathMap) {
  const child_type = aliasFolder['child_folders_type'];
  const isMultiple = MULTIPLE_CHILD_TYPES.includes(child_type);
  const usesTypeFolders = child_type === 'multiple_with_type_subfolder';

  const attributes = {};
  for(const [key, value] of Object.entries(aliasFolder['attributes'])) {
    const firstValue = value[0];

    const access = firstValue['access'];  // exclude online+offline IGNORED attributes
    if(access === 'IGNORED') {
      continue;
    }

    const wlstType = firstValue['wlst_type'];
    const usesPath = firstValue['uses_path_tokens'];

    attributes[key] = {
      wlstType,
      usesPath
    };
  }

  const folders = [];
  for(const [key, value] of Object.entries(aliasFolder['folders'])) {
    const newPath = path + '/' + key;
    addPaths(value, newPath, pathMap);
    folders.push(key);
  }

  pathMap[path] = {
    isMultiple,
    usesTypeFolders,
    attributes,
    folders
  };
}

// this method is used by webui MessageHelper, and by updateAliasLabels tool
function getReadableLabel(aliasName) {
  // aliasName = aliasName.replaceAll('.', ' ');

  let result = aliasName.charAt(0);

  // skip the first letter
  for (let i = 1; i < aliasName.length; i++) {
    const current = aliasName.charAt(i);
    if(current === '.') {  // ex: rcu.xxx, parse as "rcu xxx"
      continue;
    }
    const previous = aliasName.charAt(i - 1);
    const next = (i < aliasName.length - 1) ? aliasName.charAt(i + 1) : null;

    if (isUpperCase(current)) {
      if(isUpperCase(previous)) {  // example: 'U S' in 'MTU Size'
        if(next && !isUpperCase(next)) {
          result += ' ';
        }
      } else {
        result += ' ';
      }
    }
    result += current;
  }

  for(const acronym of acronyms) {
    const expression = '\\b' + acronym + '\\b';  // use word boundaries
    const regex = new RegExp(expression, 'gi');
    result = result.replace(regex, acronym);
  }

  result = result.replace(/\bweb logic\b/gi, 'WebLogic');
  result = result.replace(/\bm bean\b/gi, 'MBean');

  return result;
}

function isUpperCase(char) {
  return char === char.toUpperCase();
}

function getMessagesFile() {
  return MESSAGES_FILE;
}

function chooseAttributeFile(targetWindow, fileOption, currentValue) {
  return wdtArchive.chooseAttributeFile(targetWindow, fileOption.label, fileOption.type,
    fileOption.extensions, currentValue, 'dialog-chooseAttributeFile');
}

module.exports = {
  chooseAttributeFile,
  getAliasInfo,
  getMessageKeys,
  getMessageMap,
  getMessagesFile,
  getReadableLabel
};
