/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ko = require('knockout');
const { expect } = require('chai');
const { describe, it } = require('mocha');
const modelMessages = require('../../../electron/app/locales/en/modeledit.json');

/* global __dirname */
function loadModule(relativePath, dependencies, globals = {}) {
  let result;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js', relativePath), 'utf8'), {
    ...globals,
    define(names, factory) { result = factory(...names.map(name => dependencies[name])); }
  });
  return result;
}

function createView() {
  const updates = [];
  const children = ko.observableArray([
    { id: 'wlsdeploy/a.txt', title: 'a.txt' },
    { id: 'wlsdeploy/b.txt', title: 'b.txt' },
    { id: 'wlsdeploy/folder/', title: 'folder', children: ko.observableArray([
      { id: 'wlsdeploy/folder/nested.txt', title: 'nested.txt' }
    ]) }
  ]);
  const project = { wdtModel: {
    archiveFile: ko.observable('/tmp/archive.zip'),
    archiveRoots: ko.observableArray([{ id: 'wlsdeploy/', title: 'wlsdeploy', children }]),
    addArchiveUpdate: (operation, archivePath) => updates.push({ operation, archivePath })
  } };
  const archiveHelper = loadModule('utils/wdt-archive-helper.js', {
    knockout: ko, 'models/wkt-project': project, 'utils/wkt-logger': { debug() {} }
  });
  const tree = { currentItem: null };
  const View = loadModule('viewModels/model-archive-view.js', {
    accUtils: { announce() {} }, knockout: ko,
    'utils/i18n': { t: (key, args) => {
      if(key === 'delete-label') {
        expect(args.ns).to.equal('modeledit');
        return modelMessages[key].replace('{{item}}', args.item);
      }
      return key;
    } }, 'models/wkt-project': project,
    'utils/wdt-archive-helper': archiveHelper,
    'utils/view-helper': { themeClasses: ko.observable('') },
    'ojs/ojarraytreedataprovider': function() {}
  }, { document: { getElementById: id => {
    expect(id).to.equal('treeview');
    return tree;
  } } });
  const view = new View();
  view.connected();
  return { view, tree, children, updates };
}

describe('Archive tree context menu', () => {
  const deleteEvent = { detail: { selectedValue: 'delete' } };
  const openEvent = { preventDefault: () => { throw new Error('Menu should open'); } };

  it('deletes the context-menu target rather than the selected file or a later focus target', () => {
    const { view, tree, children, updates } = createView();
    view.selectionChanged({ detail: { value: new Set(['wlsdeploy/a.txt']) } });
    tree.currentItem = 'wlsdeploy/b.txt';
    view.beforeMenu(openEvent);
    expect(view.deleteMenuLabel()).to.equal('Delete b.txt');
    tree.currentItem = 'wlsdeploy/a.txt';
    view.menuAction(deleteEvent);
    expect(children().map(child => child.id)).to.deep.equal(['wlsdeploy/a.txt', 'wlsdeploy/folder/']);
    expect(updates).to.deep.equal([{ operation: 'remove', archivePath: 'wlsdeploy/b.txt' }]);
    expect(view.selectedItem()).to.equal('wlsdeploy/a.txt');
  });

  it('supports keyboard activation on a focused folder without a selection', () => {
    const { view, tree, children, updates } = createView();
    tree.currentItem = 'wlsdeploy/folder/';
    view.beforeMenu(openEvent);
    expect(view.deleteMenuLabel()).to.equal('Delete folder');
    view.menuAction(deleteEvent);
    expect(children().map(child => child.id)).to.deep.equal(['wlsdeploy/a.txt', 'wlsdeploy/b.txt']);
    expect(updates).to.deep.equal([{ operation: 'remove', archivePath: 'wlsdeploy/folder/' }]);
  });

  it('prevents opening without a current item and discards the previous context target', () => {
    const { view, tree, children, updates } = createView();
    tree.currentItem = 'wlsdeploy/b.txt';
    view.beforeMenu(openEvent);
    tree.currentItem = null;
    let prevented = false;
    view.beforeMenu({ preventDefault: () => { prevented = true; } });
    view.menuAction(deleteEvent);
    expect(prevented).to.equal(true);
    expect(children()).to.have.length(3);
    expect(updates).to.deep.equal([]);
  });

  it('keeps toolbar deletion tied to selection and ignores empty selection', () => {
    const { view, tree, children, updates } = createView();
    tree.currentItem = 'wlsdeploy/b.txt';
    view.selectionChanged({ detail: { value: new Set(['wlsdeploy/a.txt']) } });
    view.deleteSelected();
    view.selectionChanged({ detail: { value: new Set() } });
    view.deleteSelected();
    expect(children().map(child => child.id)).to.deep.equal(['wlsdeploy/b.txt', 'wlsdeploy/folder/']);
    expect(updates).to.deep.equal([{ operation: 'remove', archivePath: 'wlsdeploy/a.txt' }]);
  });

  it('ignores other menu actions and consumes a deletion target only once', () => {
    const { view, tree, updates } = createView();
    tree.currentItem = 'wlsdeploy/b.txt';
    view.beforeMenu(openEvent);
    view.menuAction({ detail: { selectedValue: 'other' } });
    expect(updates).to.deep.equal([]);
    view.menuAction(deleteEvent);
    view.menuAction(deleteEvent);
    expect(updates).to.have.length(1);
  });
});
