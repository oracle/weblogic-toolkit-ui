/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { describe, it } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();

function createWindowHarness(isMac) {
  let focusedWindow;
  let nextWindowId = 1;
  let applicationMenu;
  const messages = [];

  class BrowserWindow extends EventEmitter {
    constructor() {
      super();
      this.id = nextWindowId++;
      this.webContents = { session: { resolveProxy: async () => 'DIRECT' } };
    }

    static getFocusedWindow() { return focusedWindow; }
    getPosition() { return [0, 0]; }
    isFocused() { return focusedWindow === this; }
    async loadFile() {}
    focus() {
      focusedWindow = this;
      this.emit('focus');
    }
  }

  function buildMenu(template) {
    const menu = new EventEmitter();
    menu.items = template.map(item => ({
      ...item,
      submenu: item.submenu ? buildMenu(item.submenu) : undefined
    }));
    menu.getMenuItemById = id => {
      for (const item of menu.items) {
        if (item.id === id) {
          return item;
        }
        const nested = item.submenu?.getMenuItemById(id);
        if (nested) {
          return nested;
        }
      }
    };
    return menu;
  }

  const windowModule = proxyquire('../js/wktWindow', {
    electron: {
      app: { setAboutPanelOptions() {} },
      BrowserWindow,
      Menu: {
        buildFromTemplate: buildMenu,
        setApplicationMenu: menu => { applicationMenu = menu; }
      }
    },
    './i18next.config': { t: key => key },
    './userSettings': {
      getWindowSize: () => undefined,
      getInitialBackgroundColor: () => '#ffffff',
      getHttpsProxyUrl: () => undefined
    },
    './windowUtils': { sendToWindow: (window, channel) => messages.push({ window, channel }) },
    './wdtDiscovery': {},
    './wktTools': {},
    './osUtils': { isMac: () => isMac },
    './wktLogging': { getLogger: () => ({ debug() {} }) },
    './promptUtils': {},
    './appUpdater': {},
    './project': {}
  });
  windowModule.initialize(false, {
    getApplicationName: () => 'WKTUI',
    getApplicationVersion: () => '2.0.5',
    getApplicationCopyright: () => 'Oracle',
    getApplicationBuildVersion: () => 'test',
    getApplicationWebsite: () => 'https://example.com'
  }, { isExecutableMode: () => false });

  return {
    windowModule,
    messages,
    getMenu: () => applicationMenu,
    getItem: id => applicationMenu.getMenuItemById(id)
  };
}

const editCommands = [
  ['undo', 'undo', 'CommandOrControl+Z'],
  ['redo', 'redo', 'Shift+CommandOrControl+Z'],
  ['cut', 'cut', 'CommandOrControl+X'],
  ['copy', 'copy', 'CommandOrControl+C'],
  ['paste', 'paste', 'CommandOrControl+V'],
  ['selectAll', 'selectall', 'CommandOrControl+A']
];

describe('Application menu text editing', () => {
  for (const isMac of [true, false]) {
    describe(isMac ? 'macOS menus' : 'Windows/Linux menus', () => {
      it('keeps native edit commands available when a dialog opens, closes, and reopens', async () => {
        const harness = createWindowHarness(isMac);
        const window = await harness.windowModule.createWindow();
        window.focus();

        for (const hasOpenDialog of [false, true, false, true]) {
          harness.windowModule.setWindowAttribute(window, 'hasOpenDialog', hasOpenDialog);

          for (const [id, role, accelerator] of editCommands) {
            const item = harness.getItem(id);
            assert.notEqual(item.enabled, false, `${id} must remain available with dialog=${hasOpenDialog}`);
            assert.equal(item.role.toLowerCase(), role);
            assert.equal(item.accelerator, accelerator);
          }
          for (const id of ['newProject', 'openProject', 'saveAll', 'saveAs', 'preferences']) {
            assert.equal(harness.getItem(id).enabled, !hasOpenDialog, `${id} must respect the dialog state`);
          }
        }
      });

      it('preserves input focus for Edit while other action menus still commit field values', async () => {
        const harness = createWindowHarness(isMac);
        const window = await harness.windowModule.createWindow();
        window.focus();

        for (const hasOpenDialog of [false, true]) {
          harness.windowModule.setWindowAttribute(window, 'hasOpenDialog', hasOpenDialog);
          harness.messages.length = 0;

          harness.getItem('edit').submenu.emit('menu-will-show');
          assert.deepEqual(harness.messages, []);

          harness.getItem('file').submenu.emit('menu-will-show');
          harness.getItem('go').submenu.emit('menu-will-show');
          assert.deepEqual(harness.messages, [
            { window, channel: 'blur-focused-item' },
            { window, channel: 'blur-focused-item' }
          ]);
        }
      });

      it('uses the focused window dialog state without disabling text editing', async () => {
        const harness = createWindowHarness(isMac);
        const dialogWindow = await harness.windowModule.createWindow();
        const otherWindow = await harness.windowModule.createWindow();
        dialogWindow.focus();
        harness.windowModule.setWindowAttribute(dialogWindow, 'hasOpenDialog', true);
        otherWindow.focus();
        harness.windowModule.setWindowAttribute(otherWindow, 'hasOpenDialog', false);
        const otherMenu = harness.getMenu();

        harness.windowModule.setWindowAttribute(dialogWindow, 'hasOpenDialog', false);
        harness.windowModule.setWindowAttribute(dialogWindow, 'hasOpenDialog', true);
        assert.equal(harness.getMenu(), otherMenu, 'background status updates must not replace the active menu');
        assert.equal(harness.getItem('saveAll').enabled, true);

        dialogWindow.focus();
        assert.equal(harness.getItem('saveAll').enabled, false);
        assert.notEqual(harness.getItem('copy').enabled, false);
        assert.notEqual(harness.getItem('paste').enabled, false);

        otherWindow.focus();
        assert.equal(harness.getItem('saveAll').enabled, true);
        assert.notEqual(harness.getItem('copy').enabled, false);
        assert.notEqual(harness.getItem('paste').enabled, false);
      });
    });
  }
});
