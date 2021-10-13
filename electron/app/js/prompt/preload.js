/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { contextBridge, ipcRenderer } = require('electron');
const i18n = require('../i18next.webui.config');
const osUtils = require('../osUtils');

const language = osUtils.getArgv('--lang');
const i18nReady = i18n.changeLanguage(language);

contextBridge.exposeInMainWorld(
  'api',
  {
    ipc: {
      sendSync: (channel, ...args) => {
        return ipcRenderer.sendSync(channel, ...args);
      }
    },
    i18n: {
      ready: i18nReady,
      t: (keys, options) => {
        return i18n.t(keys, options);
      }
    }
  }
);
