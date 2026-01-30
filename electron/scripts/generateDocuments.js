/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
const fs = require('fs');
const modelEditUtils = require('../app/js/modelEdit/modelEditUtils');
const i18n = require('../app/js/i18next.webui.config');
const path = require('path');

/* global __dirname */

// TODO: translate folder names
// TODO: translate attribute names
// TODO: security provider types navigation

const NAMESPACE = 'modeledit';  // for i18n

// nav paths that don't match alias paths
const ALIAS_PATH_MAP = {
  appDeployments: 'Deployments',
  domainInfo: 'DomainInfo',
  resources: 'Resources',
  topology: 'Topology'
};

// nav paths that don't have alias paths
const NO_ALIAS_PATHS = [
  'Deployments',
  'Resources'
];

const CLICK_TYPES = {
  attributes: 'section',
  attributesCollapsible: 'collapsible',
  attributesTab: 'tab',
  collapsible: 'collapsible',
  custom: 'section',
  tab: 'tab'
};

const DATA_PATH = path.normalize(path.join(__dirname, '..', '..', 'webui', 'src', 'js', 'utils', 'modeledit'));

const OUTPUT_DIR = path.normalize(path.join(__dirname, '..', '..', 'dist', 'document-map'));

const ERROR_LIST = [];

// paths intentionally omitted from the UI.
const SKIP_PATHS = [
  'CustomResource',
  'OptionalFeatureDeployment',
  'Partition',
  'PartitionWorkManager',
  'ResourceGroup',
  'ResourceGroupTemplate',
  'ResourceManagement',
  'ResourceManager',
  'Security',
  'VirtualTarget',

  // TODO: non-top-level folders could be derived if hidden logic was usable
  'CoherenceClusterSystemResource/SubDeployment',
  'DbClientDataDirectory/SubDeployment',
  'JDBCSystemResource/SubDeployment',
  'JMSServer/JmsSessionPool',
  'JMSSystemResource/JmsResource/DistributedQueue',
  'JMSSystemResource/JmsResource/DistributedTopic',
  'PluginDeployment/SubDeployment',
  'Server/FederationServices',
  'ServerTemplate/FederationServices',
  'WLDFSystemResource/SubDeployment'
];

async function generateDocuments() {

  // create output directory for document and debug files
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // *************************************************************
  // read alias files and create a document map organized by path
  // *************************************************************

  const wdtLibraryJar = path.normalize(path.join(__dirname, '..', '..', 'tools', 'weblogic-deploy', 'lib',
    'weblogic-deploy-core.jar'));

  const aliasInfo = await modelEditUtils.getAliasInfo(wdtLibraryJar);
  filterAliasInfo(aliasInfo);

  // sort the path map in the aliases
  const aliasPathMap = Object.keys(aliasInfo.paths)
    .sort() // Sorts keys alphabetically by default
    .reduce((obj, key) => {
      obj[key] = aliasInfo.paths[key];
      return obj;
    }, {});

  writeJson(aliasPathMap, 'aliasPathMap.json');

  const docPathMap = {};
  for(const [path, pathInfo] of Object.entries(aliasPathMap)) {
    const attributeInfo = {};
    const aliasAttributeMap = pathInfo['attributes'];
    for(const attributeName of Object.keys(aliasAttributeMap)) {
      attributeInfo[attributeName] = {
        locations: []
      };
    }

    docPathMap[path] = {
      locations: [],
      attributes: attributeInfo,
      isMultiple: pathInfo['isMultiple']
    };
  }

  // ***************************************
  // update the document from the nav files
  // ***************************************

  const navDataPath = path.normalize(path.join(DATA_PATH, 'navigation'));
  const navFiles = fs.readdirSync(navDataPath);
  for(const file of navFiles) {
    if(file.endsWith('.json')) {
      const filePath = path.join(navDataPath, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const navMap = JSON.parse(data);

      updateFromNavFolder(docPathMap, navMap, null, true);
    }
  }

  // ****************************************
  // update document from the metadata files
  // ****************************************

  const metadataPath = path.normalize(path.join(DATA_PATH, 'metadata'));
  const files = fs.readdirSync(metadataPath);
  for(const file of files) {
    if(file.endsWith('.json')) {
      const filePath = path.join(metadataPath, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const metadataMap = JSON.parse(data);

      for(const [path, metadata] of Object.entries(metadataMap)) {
        if(path === 'any' || NO_ALIAS_PATHS.includes(path)) {
          continue;
        }

        const docInfo = docPathMap[path];
        if(!docInfo) {
          addError('Path not in document: ' + path);
          continue;
        }

        // if this folder eas a merge folder, get the merge folder's attributes
        let mergeDocAttributes = {};
        const mergeFolder = metadata['mergeFolder'];
        if(mergeFolder) {
          const mergePath = path + '/' + mergeFolder;
          const mergeDocInfo = docPathMap[mergePath];
          if (mergeDocInfo) {
            mergeDocAttributes = mergeDocInfo['attributes'] || {};

            // flag this merged folder in document, so it is skipped in nav paths
            mergeDocInfo['isMergeFolder'] = true;

            // copy location(s) from the document folder to this merged folder
            Array.prototype.push.apply(mergeDocInfo['locations'], docInfo['locations']);

          } else {
            addError('No document info for merge path: ' + mergePath);
          }
        }

        const docAttributes = docInfo['attributes'];
        const allDocAttributes = { ...mergeDocAttributes, ...docAttributes };

        const sections = metadata.sections;
        if(sections) {
          updateFromMetadataSections(docPathMap, allDocAttributes, path, sections);
        }

        const remainingClickPath = docInfo['remainingAttributesClickPath'];

        // check if attributes with no location should be assigned to remaining attributes location
        for(const [attKey, attInfo] of Object.entries(allDocAttributes)) {
          const locations = attInfo['locations'];
          if(!locations.length) {
            if(remainingClickPath) {
              addError('Assign to remaining attributes location: ' + path + ' / ' + attKey);
              locations.push({
                select: remainingClickPath
              });
            }
          }
        }

        checkSummaryAttributes(path, metadataMap, docPathMap);  // check that the summary attributes are valid
      }
    }
  }

  writeJson(docPathMap, 'documentMap.json');

  // check for anomalies in the document map
  checkDocPathMap(docPathMap);

  // write the document
  writeDocument(docPathMap);

  // write any anomalies from the entire process
  writeErrors();
}

/**
 * Update the document from a navigation folder.
 * @param docPathMap the document map to be updated
 * @param navFolder the navigation folder to be examined
 * @param parentPath the navigation path to this folder
 * @param isTopLevel true if this is a top-level navigation folder, such as Topology
 */
function updateFromNavFolder(docPathMap, navFolder, parentPath, isTopLevel) {
  let navPath = navFolder['path'];
  if(parentPath) {
    navPath = parentPath + '/' + navFolder['path'];
  }

  let aliasPath = navPath;
  if(!isTopLevel) {
    // example: server path is Server, not Topology/Server
    const pathArray = navPath.split('/');
    aliasPath = pathArray.slice(1).join('/');
  }

  // may need translation to alias path
  aliasPath = ALIAS_PATH_MAP[aliasPath] || aliasPath;

  const pathInfo = docPathMap[aliasPath];
  if(pathInfo) {
    pathInfo['locations'].push({
      navigation: navPath
    });

  } else if(!NO_ALIAS_PATHS.includes(aliasPath)) {
    addError('No alias path found for nav path: ' + aliasPath);
  }

  const children = navFolder['children'] || [];
  for(const child of children) {
    updateFromNavFolder(docPathMap, child, navPath, false);
  }

  const instanceChildren = navFolder['instanceChildren'] || [];
  for(const instanceChild of instanceChildren) {
    updateFromNavFolder(docPathMap, instanceChild, navPath, false);
  }
}

/**
 * Update the document map from a list of metadata sections.
 * @param docPathMap document path map to be updated
 * @param path the metadata path
 * @param sections a list of metadata sections
 * @param docAttributes document attributes to be updated, including merge folder attributes
 * @param clickPath a list of page navigation clicks to this point
 */
function updateFromMetadataSections(docPathMap, docAttributes, path, sections, clickPath) {
  for (const section of sections) {
    const attributes = section.attributes || [];

    const clickLabel = section.labelKey ? t(section.labelKey) : (section.label || '');
    const clickName = section.type + ':' + clickLabel;
    const newClickPath = clickPath ? (clickPath + ' | ' + clickName) : clickName;

    for(const attribute of attributes) {
      if(attribute.includes('/')) {
        addError('Metadata attribute has slash: ' + path + ' | ' + attribute);
        continue;
      }

      let docAttribute = docAttributes[attribute];
      if(!docAttribute) {
        addError('Metadata attribute not in aliases: ' + path + ' | ' + attribute);
        continue;
      }

      docAttribute['locations'].push({
        select: newClickPath
      });
    }

    const addRemaining = section['addRemainingAttributes'];
    if(addRemaining) {
      const docInfo = docPathMap[path];
      const existingPath = docInfo['remainingAttributesClickPath'];
      if(existingPath) {
        addError('Multiple remaining attribute paths for: ' + path);
      } else {
        docInfo['remainingAttributesClickPath'] = newClickPath;
      }
    }

    const subsections = section['sections'] || [];
    if(sections.length) {
      updateFromMetadataSections(docPathMap, docAttributes, path, subsections, newClickPath);
    }
  }
}

/**
 * Verify that every summary attribute entry is valid.
 * Summary attributes may contain a subpath, such as "JdbcResource/DatasourceType".
 * Summary attributes may use handler methods instead of an attribute name.
 */
function checkSummaryAttributes(path, metadataMap, docPathMap) {
  const metadata = metadataMap[path];
  const docInfo = docPathMap[path];

  const attributeKeys = Object.keys(docInfo.attributes);
  const summaryAttributes = metadata['summaryAttributes'] || {};
  for(const [key, options] of Object.entries(summaryAttributes)) {
    // summary columns with both handlers don't require valid attribute key
    if(options['valueHandler'] && options['columnHandler']) {
      continue;
    }

    let checkKey = key;
    let checkKeys = attributeKeys;
    if(key.includes('/')) {
      const parts = key.split('/');
      const newPath = path + '/' + parts.slice(0, -1).join('/');
      const newDocInfo = docPathMap[newPath];
      if(!newDocInfo) {
        addError('Bad summary attribute subpath: ' + path + ' | ' + key);
        continue;
      }
      checkKeys = Object.keys(newDocInfo.attributes);
      checkKey = parts[parts.length - 1];
    }

    if(!checkKeys.includes(checkKey)) {
      addError('Bad summary attribute: ' + path + ' | ' + key);
    }
  }
}

function filterAliasInfo(aliasInfo) {
  const paths = aliasInfo['paths'];
  for(const path of Object.keys(paths)) {
    for(const skipPath of SKIP_PATHS) {
      if (path === skipPath || path.startsWith(skipPath + '/')) {
        delete paths[path];
      }
    }
  }
}

/**
 * Check the document structure before writing the document.
 * @param docPathMap the document structure, organized by path
 */
function checkDocPathMap(docPathMap) {
  addError('\nChecking document...');
  for(const [path, pathInfo] of Object.entries(docPathMap)) {
    const locations = pathInfo['locations'];
    if(!locations.length) {
      addError('No navigation path for: ' + path);
    }

    const attributes = pathInfo['attributes'];
    for(const [attKey, attInfo] of Object.entries(attributes)) {
      const attLocations = attInfo['locations'];
      if(attLocations.length > 1) {
        addError('Multiple click paths for: ' + path + ' / ' + attKey + ':');
        let index = 1;
        attLocations.forEach(attLocation => {
          addError('  ' + index + ': ' + getClickText(attLocation, true));
          index++;
        });
      }

      // it's ok for attribute to have no locations.
      // folder may not in metadata, or folder may not have sections
    }
  }
}

/**
 * Output the document from the document path map.
 * @param docPathMap the document path map
 */
function writeDocument(docPathMap) {
  addError('\nWriting document...');

  const outputFile = path.join(OUTPUT_DIR, 'document.md');
  const writeStream = fs.createWriteStream(outputFile, {});

  for(const [path, docInfo] of Object.entries(docPathMap)) {
    writeLine('\n### ' + path, writeStream);

    const locations = docInfo['locations'];
    if (!locations.length) {
      writeLine('  No navigation path\n', writeStream);
    }

    let first = true;
    locations.forEach(location => {
      if (!first) {
        writeLine('\n  or', writeStream);
      }
      const navigation = location['navigation'];
      if (navigation) {
        let navigationText = '';
        let navigationPath = '';
        const folders = navigation.split('/');
        for(const folder of folders) {
          let isMultiple = false;
          if(navigationText.length) {
            if(navigationPath.length) {
              navigationPath += '/';
            }
            navigationPath += folder;

            // look up this subpath in doc to check for merge folder
            const navDocInfo = docPathMap[navigationPath];
            if(navDocInfo['isMergeFolder']) {
              continue;
            }

            isMultiple = navDocInfo['isMultiple'];
            navigationText += ' => ';
          }
          navigationText += folder;
          if(isMultiple) {
            navigationText += ' => {name}';
          }
        }

        writeLine('Navigate to: ' + navigationText, writeStream);
        writeLine('', writeStream);
      }
      first = false;
    });

    const attributes = docInfo['attributes'];
    if (!Object.keys(attributes)) {
      writeLine('no attributes', writeStream);
    } else {
      writeLine('| Attribute Name | Model Key | Location |', writeStream);
      writeLine('|------|----------|------------------|', writeStream);

      for (const [attKey, attInfo] of Object.entries(attributes)) {
        let locationsText = '';
        let locationHidden = false;  // finding any hidden step will discard this attribute
        const attLocations = attInfo['locations'];
        for (const attLocation of attLocations) {
          const select = attLocation['select'];
          const steps = select.split('|').map(item => item.trim());
          for(const step of steps) {
            const parts = step.split(':');
            const clickType = parts[0];

            if(clickType === 'hidden') {
              locationHidden = true;
              continue;
            }

            if(!(clickType in CLICK_TYPES)) {
              addError('Unknown click type: ' + clickType);
            }
          }

          const stepsText = getClickText(attLocation, false);

          if(locationsText.length) {
            locationsText += ' or ';
          }
          locationsText += stepsText;
        }

        if(!locationHidden) {
          writeLine('|' + attKey + ' | ' + attKey + ' | ' + locationsText + ' |', writeStream);
        }
      }
    }
  }

  writeStream.end();
}

/**
 * Get the attribute click text for the location
 * @param attLocation the attribute location unformatted text
 * @param verbose if true, include hidden sections and text for empty location
 */
function getClickText(attLocation, verbose) {
  const select = attLocation['select'];
  const steps = select.split('|').map(item => item.trim());

  let stepsText = '';
  for(const step of steps) {
    const parts = step.split(':');
    const clickType = parts[0];
    const typeLabel = CLICK_TYPES[clickType] || 'section';
    let label = parts[1];

    if(clickType === 'hidden' && verbose) {
      label = 'hidden';
    }

    if(label !== '') {  // don't show steps with no label, such as "attributes:"
      if(stepsText.length) {
        stepsText += ' => ';
      }
      stepsText += `"${label}" ${typeLabel}`;
    }
  }

  if(verbose) {
    stepsText = stepsText.length ? stepsText : 'main section';
  }

  return stepsText;
}

function writeErrors() {
  const outputFile = path.join(OUTPUT_DIR, 'errors.txt');
  const writeStream = fs.createWriteStream(outputFile, {});
  ERROR_LIST.forEach(error => {
    writeLine(error, writeStream);
  });
  writeStream.end();
}

function writeJson(object, fileName) {
  const outputFile = path.join(OUTPUT_DIR, fileName);
  const writeStream = fs.createWriteStream(outputFile, {});
  writeStream.write(JSON.stringify(object, null, 2));
  writeStream.end();
}

function addError(text) {
  console.log(text);
  ERROR_LIST.push(text);
}

function writeLine(text, stream) {
  stream.write(text + '\n');
}

function t(key, args) {
  args = args || {};
  const allArgs = { ...args, ns: NAMESPACE };
  return i18n.t(key, allArgs);
}

generateDocuments().then().catch(err => console.error(err));
