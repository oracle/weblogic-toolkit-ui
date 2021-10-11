/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const skipReadyCheckChannels = [ 'get-window-id' ];

function sendToWindow(currentWindow, channel, ...args) {
  if (skipReadyCheckChannels.includes(channel) || currentWindow.isReady) {
    currentWindow.webContents.send(channel, ...args);
  }
}

module.exports = {
  sendToWindow
};
