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

const DOCUMENTATION_VERSION = '2.0';
const TITLE = 'Model Design View Map';
const NAMESPACE = 'modeledit';  // for i18n

const INTRO_TEXT = 'This page list MBean folders and attributes that are available in WDT, ' +
  'and where they can be found in the Model Design View navigation.';

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

const PROJECT_PATH = path.normalize(path.join(__dirname, '..', '..'));

const DATA_PATH = path.normalize(path.join(PROJECT_PATH, 'webui', 'src', 'js', 'utils', 'modeledit'));

const I18N_PATH = path.normalize(path.join(PROJECT_PATH, 'electron', 'app', 'locales', 'en', 'modeledit.json'));

const OUTPUT_DIR = path.normalize(path.join(PROJECT_PATH, 'dist', 'map-document'));

const DOCUMENT_DIR = path.normalize(path.join(PROJECT_PATH, 'documentation', DOCUMENTATION_VERSION,
  'content', 'navigate', 'model'));

const DOCUMENT_FILE = path.join(DOCUMENT_DIR, 'model-map.md');

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

async function generateMapDocument() {

  // create output directory for document and debug files
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  addError('\nBuilding document map...');

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

    const usesTypeFolders = pathInfo['usesTypeFolders'];
    const typeFolderNames = usesTypeFolders ? pathInfo['folders'] : [];

    docPathMap[path] = {
      locations: [],
      attributes: attributeInfo,
      isMultiple: pathInfo['isMultiple'],
      usesTypeFolders,
      typeFolderNames
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
              locations.push(remainingClickPath);
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

  const docPathInfo = docPathMap[aliasPath];
  if(docPathInfo) {
    docPathInfo['locations'].push(navPath);

    if(docPathInfo['usesTypeFolders']) {
      addTypeLocations(docPathMap, aliasPath, navPath);
    }

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

function addTypeLocations(docPathMap, aliasPath, navPath) {
  const docPathInfo = docPathMap[aliasPath];
  const typeNames = docPathInfo['typeFolderNames'];
  typeNames.forEach(typeName => {
    const typePath = aliasPath + '/' + typeName;
    const typeInfo = docPathMap[typePath];
    typeInfo['locations'].push(navPath + ':' + typeName);
  });
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

      docAttribute['locations'].push(newClickPath);
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
      // folder may not be in metadata, or folder may not have sections.
      // in those cases, all attributes appear in the main section of the page.
    }
  }
}

/**
 * Output the document from the document path map.
 * @param docPathMap the document path map
 */
function writeDocument(docPathMap) {
  addError('\nWriting document...');

  const messageMap = require(I18N_PATH);

  const writeStream = fs.createWriteStream(DOCUMENT_FILE, {});

  // front matter used by Hugo
  writeLine('---', writeStream);
  writeLine(`title: "${TITLE}"`, writeStream);
  writeLine('weight: 1', writeStream);
  writeLine('draft: false', writeStream);
  writeLine('---', writeStream);

  writeLine(INTRO_TEXT, writeStream);
  writeLine('', writeStream);

  writeIndex(docPathMap, writeStream);

  for(const [path, docInfo] of Object.entries(docPathMap)) {
    if(docInfo['usesTypeFolders']) {  // don't include provider categories without type folder
      continue;
    }

    const prettyPath = path.split('/').join(' / ');
    writeLine('\n### ' + prettyPath, writeStream);

    const locations = docInfo['locations'];
    if (!locations.length) {
      writeLine('  No navigation path\n', writeStream);
    }

    let firstLocation = true;
    locations.forEach(location => {
      if (!firstLocation) {
        writeLine('\n  or', writeStream);
      }

      let locationText = '';
      let locationPath = '';
      let firstFolder = true;

      const folders = location.split('/');
      for(const folderText of folders) {
        const parts = folderText.split(':');  // may have a type folder
        const folder = parts[0];
        const instanceType = (parts.length > 1) ? parts[1] : null;

        if(locationPath.length) {
          locationPath += '/';
        }
        locationPath += folder;
        locationPath = ALIAS_PATH_MAP[locationPath] || locationPath;

        let isMultiple = false;

        if(!NO_ALIAS_PATHS.includes(locationPath)) {
          const locationInfo = docPathMap[locationPath];
          if(locationInfo['isMergeFolder']) {  // don't add merge folder to navText
            continue;
          }

          isMultiple = locationInfo['isMultiple'];
        }

        if(locationText.length) {
          locationText += ' => ';
        }
        const folderLabel = getFolderLabel(locationPath, messageMap);
        locationText += folderLabel;

        if(isMultiple) {
          const instanceText = instanceType ? ('instance of type ' + instanceType) : 'instance';
          locationText += ' => (' + instanceText + ')';
        }

        if(firstFolder) {  // skip top-level path and restart with next folder
          locationPath = '';
        }
        firstFolder = false;
      }

      writeLine('Navigate to: ' + locationText, writeStream);
      writeLine('', writeStream);

      firstLocation = false;
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
          const steps = attLocation.split('|').map(item => item.trim());
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
          const attLabel = getAttributeLabel(path, attKey, messageMap);
          writeLine('|' + attLabel + ' | ' + attKey + ' | ' + locationsText + ' |', writeStream);
        }
      }
    }
  }

  writeStream.end();
}

function writeIndex(docPathMap, writeStream) {
  writeLine('### Index', writeStream);

  const root = {
    label: 'root',
    link: 'root',
    children: []
  };

  // build a tree of link nodes
  for (const path of Object.keys(docPathMap)) {
    const link = path.split('/').join('--').toLowerCase();  // slash removed, spaces become hyphens

    let node = root;
    const folders = path.split('/');
    folders.forEach(folder => {
      let childNode = node.children.find(child => child.label === folder);
      if(!childNode) {
        childNode = {
          label: folder,
          link: 'link',
          children: []
        };
        node.children.push(childNode);
      }
      node = childNode;
    });

    node.link = link;
  }

  // output node tree
  writeIndexLinks(root, '', writeStream);
}

function writeIndexLinks(node, indent, writeStream) {
  node.children.forEach(childNode => {
    writeLine(`${indent}- [${childNode.label}](#${childNode.link})`, writeStream);

    writeIndexLinks(childNode, indent + '  ', writeStream);
  });
}

function getFolderLabel(locationPath, messageMap) {
  const parts = locationPath.split('/');
  const fullPrefix = 'f-' + parts.join('_');
  const folderName = parts[parts.length - 1];

  const matchKeys = [
    `${fullPrefix}-label`,      // specific to folder
    `f-any_${folderName}-label`  // specific to last folder
  ];

  for (const matchKey of matchKeys) {
    if(Object.keys(messageMap).includes(matchKey)) {
      return t(matchKey);
    }
  }

  // no translation? log and parse label
  addError('No English translation for folder ' + locationPath);
  return modelEditUtils.getReadableLabel(folderName);
}

function getAttributeLabel(locationPath, attributeName, messageMap) {
  const parts = locationPath.split('/');
  const fullPrefix = 'f-' + parts.join('_');
  const folderName = parts[parts.length - 1];

  attributeName = attributeName.replaceAll('.', '_');

  const matchKeys = [
    `${fullPrefix}-a-${attributeName}-label`,        // specific to folder + attribute
    `f-any_${folderName}-a-${attributeName}-label`,  // specific to last folder + attribute
    `a-${attributeName}-label`                       // specific to attribute
  ];

  for (const matchKey of matchKeys) {
    if(Object.keys(messageMap).includes(matchKey)) {
      return t(matchKey);
    }
  }

  // no translation? log and parse label
  addError('No English translation for attribute ' + attributeName + ' at ' + locationPath);
  return modelEditUtils.getReadableLabel(attributeName);
}

/**
 * Get the attribute click text for the location
 * @param attLocation the attribute location unformatted text
 * @param verbose if true, include hidden sections and text for empty location
 */
function getClickText(attLocation, verbose) {
  const steps = attLocation.split('|').map(item => item.trim());

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

generateMapDocument().then().catch(err => console.error(err));
