/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const fsPromises = require('fs/promises');
const JSZip = require('jszip');
const { getWdtLibraryJar } = require('../wktTools');
const fs = require('fs');
const path = require('path');

async function getAliasInfo() {
  const WDT_ALIAS_REGEX= /^oracle\/weblogic\/deploy\/aliases\/category_modules\/(.*)\.json$/;

  const fileData = await fsPromises.readFile(getWdtLibraryJar());
  const zip = await JSZip.loadAsync(fileData);

  const result = {
    paths: {}
  };

  for (const zipEntryName in zip.files) {
    const match = zipEntryName.match(WDT_ALIAS_REGEX);
    if (match) {
      let name = match[1];
      name = (name === 'AppDeployment') ? 'Application' : name;  // WDT quirk

      const zipEntry = zip.file(zipEntryName);
      const content = await zipEntry.async('text');
      const aliasData = JSON.parse(content);

      addPaths(aliasData, name, result.paths);
    }
  }

  return result;
}

function getMetadata() {
  const metadata = {};
  const metadataDir = path.normalize(path.join(__dirname, 'metadata'));
  const files = fs.readdirSync(metadataDir);

  files.forEach(file => {
    const filePath = path.join(metadataDir, file);
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    for (const key in jsonData) {
      metadata[key] = jsonData[key];
    }
  });
  return metadata;
}

function getMessageKeys() {
  // read these for each invocation, rather than require('../../locales/en/webui.json');
  // prevents cached data on front-end reload.

  // read from the en locale - this will give the most current set of keys.
  /* global __dirname */
  const messagesFile = path.normalize(path.join(__dirname, '..', '..', 'locales', 'en', 'modeledit.json'));
  const contents = fs.readFileSync(messagesFile, 'utf8');
  const messagesMap = JSON.parse(contents.toString());

  const messageKeys = [];
  Object.keys(messagesMap).forEach(key => {
    if(key.startsWith('f-') || key.startsWith('a-')) {
      messageKeys.push(key);
    }
  });
  return messageKeys;
}

function addPaths(aliasFolder, path, pathMap) {
  const child_type = aliasFolder['child_folders_type'];
  const isMultiple = child_type === 'multiple';

  const attributes = {};
  for(const [key, value] of Object.entries(aliasFolder['attributes'])) {
    const firstValue = value[0];
    const wlstType = firstValue['wlst_type'];

    // TODO: fix WLST types that are ${abc:xyz}

    attributes[key] = {
      wlstType: wlstType
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
    attributes,
    folders
  };
}

module.exports = {
  getAliasInfo,
  getMessageKeys,
  getMetadata
};
