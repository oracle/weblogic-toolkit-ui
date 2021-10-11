/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fs = require('fs');
const { writeFile } = require('fs/promises');
const { EOL } = require('os');
const readline = require('readline');

const fsUtils = require('./fsUtils');

async function getContentsOfPropertyFiles(projectDirectory, propertyFiles) {
  if (!propertyFiles || propertyFiles.length === 0) {
    return null;
  }

  const propertyFilesContents = {};
  for (const propertyFile of propertyFiles) {
    propertyFilesContents[propertyFile] = await _getPropertyFileContents(projectDirectory, propertyFile);
  }
  return propertyFilesContents;
}

async function saveContentsOfPropertiesFiles(projectDirectory, properties) {
  for (const [propertyFile, propertyFileContents] of Object.entries(properties)) {
    await _savePropertyFileContent(projectDirectory, propertyFile, propertyFileContents);
  }
}

async function _getPropertyFileContents(projectDirectory, propertyFile) {
  let effectivePropertyFilePath = fsUtils.getAbsolutePath(propertyFile, projectDirectory);

  if (!fs.existsSync(effectivePropertyFilePath)) {
    throw new Error(`Unable to get content from property file ${effectivePropertyFilePath} because the file does not exist`);
  } else if (fs.lstatSync(effectivePropertyFilePath).isDirectory()) {
    throw new Error(`Unable to get content from property file ${effectivePropertyFilePath} because the file is a directory`);
  }
  const propertiesStream = fs.createReadStream(effectivePropertyFilePath, 'utf8');

  const rl = readline.createInterface({
    input: propertiesStream,
    crlfDelay: Infinity
  });

  let propertiesContent = {};
  let lineContinuationPropertyName = null;
  let lineContinuationPropertyValue = null;

  for await (const line of rl) {
    // Skip over any blank lines or comment lines
    //
    if (!line || line.match(/^\s*$/) || line.match(/^\s*#/)) {
      continue;
    }

    if (lineContinuationPropertyName) {
      if (line.match(/[\\]\s*$/)) {
        const trimmedLine = line.trimStart().trimEnd();
        // remove the line continuation character...
        const value = trimmedLine.substring(0, trimmedLine.length - 1);
        if (lineContinuationPropertyValue) {
          lineContinuationPropertyValue += value;
        } else {
          lineContinuationPropertyValue = value;
        }
      } else {
        // last value in multi-line property
        const trimmedLine = line.trimStart().trimEnd();
        if (lineContinuationPropertyValue) {
          lineContinuationPropertyValue += trimmedLine;
        } else {
          lineContinuationPropertyValue = trimmedLine;
        }

        propertiesContent[lineContinuationPropertyName] = lineContinuationPropertyValue;
        lineContinuationPropertyName = null;
        lineContinuationPropertyValue = null;
      }
    } else if (line.match(/[\\]\s*$/)) {
      const nameAndValue = _splitOnEquals(propertyFile, line);
      lineContinuationPropertyName = nameAndValue[0];
      if (nameAndValue[1].length > 1) {
        // remove the line continuation character...
        lineContinuationPropertyValue = nameAndValue[1].substring(0, nameAndValue[1].length - 1);
      }
    } else {
      const nameAndValue = _splitOnEquals(propertyFile, line);
      propertiesContent[nameAndValue[0]] = nameAndValue[1];
    }
  }
  return propertiesContent;
}

async function _savePropertyFileContent(projectDirectory, propertyFile, propertyFileContents) {
  const effectivePropertyFile = fsUtils.getAbsolutePath(propertyFile, projectDirectory);
  const fileContent = _formatPropertiesForStorage(propertyFileContents);
  await writeFile(effectivePropertyFile, fileContent, { encoding: 'utf8' });
}

function _splitOnEquals(propertyFile, propertyLine) {
  const firstEqualsIndex = propertyLine.indexOf('=');
  if (firstEqualsIndex === -1) {
    throw new Error(`Property file ${propertyFile} line did not contain an equal sign: ${propertyLine}`);
  } else if (firstEqualsIndex === 0) {
    throw new Error(`Property file ${propertyFile} line did not property name because it starts with an equal sign: ${propertyLine}`);
  }

  const propertyName = propertyLine.slice(0, firstEqualsIndex).trimStart().trimEnd();
  const propertyValue = propertyLine.slice(firstEqualsIndex +  1, propertyLine.length).trimStart().trimEnd();
  return [ propertyName, propertyValue ];
}

function _formatPropertiesForStorage(propertyFileContents) {
  let content = '';
  for (const [key, value] of Object.entries(propertyFileContents)) {
    const textValue = value ? value : '';
    content += `${key}=${textValue}${EOL}`;
  }
  return content;
}

module.exports = {
  getContentsOfPropertyFiles,
  saveContentsOfPropertiesFiles
};
