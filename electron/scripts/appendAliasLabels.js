/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

// Run from the repository root: node electron/scripts/appendAliasLabels.js [--dry-run]
// Generated labels need human review. Collection wording is reported, never inflected.
const fs = require('fs');
const path = require('path');
const process = require('process');
const modelEditUtils = require('../app/js/modelEdit/modelEditUtils');

/* global __dirname */

// This deliberately checks only explicit hiding and configured top-level beans.
// Unknown child folders stay eligible; this is not a full simulation of the UI.
function createVisibilityFilter(navigation, metadata) {
  const roots = new Set(['DomainInfo', 'Topology', 'Resources', 'Deployments']);
  for (const group of navigation) {
    for (const entry of group.children || []) {
      roots.add(entry.path.split('/')[0]);
    }
  }

  const hiddenAttributes = {};
  for (const [aliasPath, details] of Object.entries(metadata)) {
    const hidden = new Set();
    const visible = new Set();
    function visit(sections) {
      for (const section of sections) {
        const target = section.type === 'hidden' ? hidden : visible;
        for (const attribute of section.attributes || []) {
          target.add(attribute);
        }
        visit(section.sections || []);
      }
    }
    visit(details.sections || []);
    hiddenAttributes[aliasPath] = new Set([...hidden].filter(attribute => !visible.has(attribute)));
  }

  return (aliasPath, attribute) => {
    if (!roots.has(aliasPath.split('/')[0])) {
      return 'bean omitted from top-level navigation';
    }
    let pagePath = aliasPath;
    const parent = aliasPath.split('/').slice(0, -1).join('/');
    if (metadata[parent]?.mergeFolder && `${parent}/${metadata[parent].mergeFolder}` === aliasPath) {
      pagePath = parent;
    }
    return hiddenAttributes[pagePath]?.has(attribute) ? 'explicitly hidden attribute' : null;
  };
}

function loadUiVisibility() {
  const modelEditDir = path.join(__dirname, '..', '..', 'webui', 'src', 'js', 'utils', 'modelEdit');
  function readRegisteredJson(directory, manifest) {
    // Read the JSON files registered as RequireJS text dependencies, in registration order.
    const source = fs.readFileSync(path.join(modelEditDir, directory, manifest), 'utf8');
    const dependencies = [...source.matchAll(/text!\.\/([^'"]+\.json)/g)];
    if (!dependencies.length) {
      throw new Error(`No JSON dependencies found in ${manifest}`);
    }
    return dependencies.map(match => JSON.parse(fs.readFileSync(
      path.join(modelEditDir, directory, match[1]), 'utf8')));
  }
  const navigation = readRegisteredJson('navigation', 'all-navigation.js');
  const metadata = Object.assign({}, ...readRegisteredJson('metadata', 'all-metadata.js'));
  return createVisibilityFilter(navigation, metadata);
}

function analyzeLabels(paths, messages, skipReason = () => null) {
  const labels = {};
  const optional = new Set();
  const skipped = new Set();
  const collections = new Set();
  const hasAny = keys => keys.some(key => Object.hasOwn(messages, key));

  for (const [aliasPath, details] of Object.entries(paths)) {
    const folderPrefix = 'f-' + aliasPath.replaceAll('/', '_');
    const folderName = aliasPath.split('/').pop();
    const anyFolderPrefix = 'f-any_' + folderName;

    if (!skipReason(aliasPath) && !hasAny([`${folderPrefix}-label`, `${anyFolderPrefix}-label`])) {
      const folderKey = `${anyFolderPrefix}-label`;
      labels[folderKey] = modelEditUtils.getReadableLabel(folderName);
      if (details.isMultiple) {
        collections.add(`${aliasPath}: review ${folderKey} (${JSON.stringify(labels[folderKey])}) for collection wording`);
      }
    }
    if (!skipReason(aliasPath) && details.isMultiple &&
      !hasAny([`${folderPrefix}-typeLabel`, `${anyFolderPrefix}-typeLabel`])) {
      optional.add(`${aliasPath}: singular folder typeLabel (defaults to "Instance")`);
    }

    for (const [attribute, attributeDetails] of Object.entries(details.attributes || {})) {
      const key = attribute.replaceAll('.', '_');
      const prefixes = [`${folderPrefix}-a-${key}`, `${anyFolderPrefix}-a-${key}`, `a-${key}`];
      const missingLabel = !hasAny(prefixes.map(prefix => prefix + '-label'));
      const reason = skipReason(aliasPath, attribute);
      if (reason) {
        if (missingLabel) skipped.add(`${aliasPath}/${attribute}: ${reason}`);
        continue;
      }
      if (missingLabel) {
        labels[`a-${key}-label`] = modelEditUtils.getReadableLabel(attribute);
      }

      // Match MessageHelper's optional-message lookup, including the folder-wide override.
      const rawType = attributeDetails.wlstType || '';
      const type = rawType.match(/^\$\{(.*):(.*)}$/)?.[1] || rawType;
      const isList = ['list', 'jarray'].includes(type) || type.startsWith('delimited_string');
      const isDict = ['dict', 'properties'].includes(type) || type.startsWith('delimited_map');
      const suffixes = isList ? ['itemLabel'] : isDict ? ['entryLabel', 'keyLabel', 'valueLabel'] : [];
      for (const suffix of suffixes) {
        const keys = prefixes.map(prefix => `${prefix}-${suffix}`);
        keys.push(`${folderPrefix}-a-any-${suffix}`);
        if (!hasAny(keys)) {
          optional.add(`${aliasPath}/${attribute}: ${suffix} (uses generic wording)`);
        }
      }
    }
  }
  return { labels, optional: [...optional].sort(), skipped: [...skipped].sort(),
    collections: [...collections].sort() };
}

function appendLabels(source, labels) {
  const messages = JSON.parse(source);
  const keys = Object.keys(labels).filter(key => !Object.hasOwn(messages, key)).sort();
  if (!keys.length) {
    return source;
  }

  const closingBrace = source.lastIndexOf('}');
  const prefix = source.slice(0, closingBrace);
  const whitespace = prefix.match(/\s*$/)[0];
  const end = prefix.length - whitespace.length;
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const indent = source.match(/^([ \t]+)"/m)?.[1] || '  ';
  const entries = keys.map(key => `${indent}${JSON.stringify(key)}: ${JSON.stringify(labels[key])}`);
  const comma = Object.keys(messages).length ? ',' : '';

  // Preserve existing entries verbatim; only insert a comma and a new block at the end.
  const updated = source.slice(0, end) + comma + newline + newline + entries.join(',' + newline) +
    (whitespace || newline) + source.slice(closingBrace);
  JSON.parse(updated);
  return updated;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--dry-run')) {
    throw new Error('Usage: node electron/scripts/appendAliasLabels.js [--dry-run]');
  }
  const dryRun = args.includes('--dry-run');
  const messagesFile = modelEditUtils.getMessagesFile();
  const source = fs.readFileSync(messagesFile, 'utf8');
  const wdtLibraryJar = path.join(__dirname, '..', '..', 'tools', 'weblogic-deploy', 'lib',
    'weblogic-deploy-core.jar');
  const aliases = await modelEditUtils.getAliasInfo(wdtLibraryJar);
  const { labels, optional, skipped, collections } =
    analyzeLabels(aliases.paths, JSON.parse(source), loadUiVisibility());
  const updated = appendLabels(source, labels);
  if (!dryRun && updated !== source) {
    fs.writeFileSync(messagesFile, updated, 'utf8');
  }

  const keys = Object.keys(labels).sort();
  const attributeCount = keys.filter(key => key.startsWith('a-')).length;
  const folderCount = keys.length - attributeCount;
  console.log(`${dryRun ? 'Would append' : 'Appended'} ${attributeCount} attribute labels and ` +
    `${folderCount} folder labels to ${messagesFile}.`);
  for (const key of keys) {
    console.log(`${key}: ${JSON.stringify(labels[key])}`);
  }
  console.log(`\nGenerated collection labels requiring human review: ${collections.length}.`);
  for (const entry of collections) {
    console.log(entry);
  }
  console.log(`\nOptional wording gaps from WDT aliases: ${optional.length} (not generated).`);
  for (const gap of optional) {
    console.log(gap);
  }
  console.log(`\nSkipped missing-label occurrences: ${skipped.length}.`);
  for (const entry of skipped) {
    console.log(entry);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { analyzeLabels, appendLabels, createVisibilityFilter };
