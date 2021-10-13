/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'api',
  {
    ipc: {
      sendSync: (channel, ...args) => {
        return ipcRenderer.sendSync(channel, ...args);
      }
    }
  }
);
