/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
const fs = require('fs');
const modelEditUtils = require('../app/js/modelEdit/modelEditUtils');
const path = require('path');
const readline = require('readline');

/* global __dirname */

async function updateAliasLabels() {

  // read the existing messages
  const messageMap = modelEditUtils.getMessageMap();

  // create maps for messages that start with "a-" or "f-"
  const attributeMap = {};
  const anyAttributeMap = {};
  const anyFolderMap = {};
  const folderMap = {};

  for(let key in messageMap) {
    if(key.startsWith('a-any-')) {
      anyAttributeMap[key] = messageMap[key];
    } else if(key.startsWith('f-any-')) {
      anyFolderMap[key] = messageMap[key];
    } else if(key.startsWith('a-')) {
      attributeMap[key] = messageMap[key];
    } else if(key.startsWith('f-')) {
      folderMap[key] = messageMap[key];
    }
  }

  // read the aliases to process every path and attribute
  const wdtLibraryJar = path.normalize(path.join(__dirname, '..', '..', 'tools', 'weblogic-deploy', 'lib',
    'weblogic-deploy-core.jar'));

  const aliasInfo = await modelEditUtils.getAliasInfo(wdtLibraryJar);
  const pathMap = aliasInfo.paths;
  for(let path in pathMap) {
    // add any missing folders
    const parts = path.split('/');
    const folderName = parts[parts.length - 1];
    const folderKey = 'f-any_' + folderName + '-label';
    const keys = Object.keys(folderMap);
    if(!keys.includes(folderKey)) {
      folderMap[folderKey] = modelEditUtils.getReadableLabel(folderName);
    }

    // add any missing attributes
    const details = pathMap[path];
    const aliasAttributeMap = details.attributes || {};
    for(let attribute in aliasAttributeMap) {
      const attributeKey = getAttributeKey(attribute);
      const messageKey = 'a-' + attributeKey + '-label';
      const keys = Object.keys(attributeMap);
      if(!keys.includes(messageKey)) {  // don't overwrite established values from translation file
        attributeMap[messageKey] = modelEditUtils.getReadableLabel(attribute);
      }
    }
  }

  // read lines from the existing messages file
  const messagesFile = modelEditUtils.getMessagesFile();
  const readStream = fs.createReadStream(messagesFile);
  const lineReader = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity  // recognize CR LF as single line break
  });

  // create a new temporary messages file
  const tempFile = path.join(path.dirname(messagesFile), 'modeledit-temp.json');
  const writeStream = fs.createWriteStream(tempFile, {});

  // copy lines for messages that don't start with "a-" or "f-".
  // combine multiple blank lines
  let lastLine = 'X';
  for await (const line of lineReader) {
    const keyRegex = /^\s*"[af]-.*$/;
    const closeRegex = /^\s*}\s*/;  // skip the closing bracket for now
    const twoBlankLines = isBlank(lastLine) && isBlank(line);

    if(!line.match(keyRegex) && !line.match(closeRegex) && !twoBlankLines) {
      writeStream.write(line + '\n');
      lastLine = line;
    }
  }

  // write "any" attribute messages, leave trailing comma
  writeMessageMap(anyAttributeMap, writeStream, false);
  writeStream.write('\n');

  // write remaining attribute messages, leave trailing comma
  writeMessageMap(attributeMap, writeStream, false);
  writeStream.write('\n');

  // write "any" folder messages, leave trailing comma
  writeMessageMap(anyFolderMap, writeStream, false);
  writeStream.write('\n');

  // write remaining folder messages, omit trailing comma
  writeMessageMap(folderMap, writeStream, true);

  writeStream.write('}\n');  // close JSON object

  writeStream.end();
  lineReader.close();

  // replace the original modeledit.json with the temp file
  fs.unlinkSync(messagesFile);
  fs.renameSync(tempFile, messagesFile);
}

function writeMessageMap(messageMap, writeStream, noTrailingComma) {
  const folderKeys = Object.keys(messageMap);
  folderKeys.sort();
  const finalKey = folderKeys[folderKeys.length - 1];
  for(let key of folderKeys) {
    writeStream.write(`  "${key}": "${messageMap[key]}"`);
    if(!noTrailingComma || (key !== finalKey)) {
      writeStream.write(',');
    }
    writeStream.write('\n');
  }
}

function isBlank(text) {
  return text.trim().length === 0;
}

function getAttributeKey(attributeName) {
  return attributeName.replaceAll('.', '_');
}

updateAliasLabels().then().catch(err => console.error(err));
