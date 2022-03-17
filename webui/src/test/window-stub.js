/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

const os = require('os');

class WindowStub {
  constructor() {
    // This is intentionally empty
  }

  trial() { /* This is intentionally empty */ }

  static install(jsDom) {
    this._isWindows = false;
    this.setOSWindows = isWindows => { this._isWindows = isWindows; };

    function getValueFrom(channelFunction) {
      return channelFunction ? channelFunction() : undefined;
    }

    global._wktExecutionMode = 'dev';
    global._isWindows = false;
    global.setOSWindows = isWindows => { global._isWindows = isWindows; };
    const api = {
      k8s : {
        getKubeConfig: () => {
          return 'fake-kube-config';
        },
        getKubectlFilePath: () => {
          return '/fake/kubectl';
        },
        getHelmFilePath: () => {
          return '/helm/file';
        },
        getOpenSSLFilePath: () => {
          return '/openssl/file';
        },
        getRegistryAddressFromImageTag: (tag) => {
          return tag;
        }
      },
      ipc: {
        channels: {},
        invoke: function(channel) {
          const value = getValueFrom(this.channels[channel]);
          return Promise.resolve(value);
        },
        // eslint-disable-next-line no-unused-vars
        send: function(channel) {
          // do nothing
        }
      },
      process: {
        getVersion: () => {
          return '1.1.0';
        },
        isWindows: () => {
          return _isWindows;
        },
        isMac: () => {
          return os.platform() === 'darwin';
        },
        argv: [ 'abc', '--mode=dev']
      },
      wkt: {
        getWkoLatestImageName: () => {
          return 'wko-image';
        }
      },
      i18n: {
        // eslint-disable-next-line no-unused-vars
        t: (key, options) => {
          return key;
        }
      },
      utils: {
        generateUuid: () => {
          return '0e157b47-49df-49d0-b983-263f959a4d96';
        }
      }
    };

    global.window = jsDom ? jsDom : {};
    if (jsDom) {
      global.document = jsDom.window.document;
    }
    global.window.api = api;
    global.window.Set = Set;
    global.Node = {
      prototype: {}
    };

    global.Element = {
      prototype: {}
    };

    global._windowId = 1;
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36'
    };
  }

  static initialize() {
    if (!global.window) this.install();
    global.window.api.ipc.channels = {};
  }

  static remove() {
    global.window = undefined;
    global.document = undefined;
    global.Node = undefined;
    global.Element = undefined;
    global._windowId = undefined;
    global.navigator = undefined;
  }

  static defineChannel(channelName, callBack) {
    window.api.ipc.channels[channelName] = callBack;
  }
}

module.exports = { WindowStub };
