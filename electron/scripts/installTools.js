/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
const installer = require('../app/js/wktToolsInstaller');
const path = require('path');

async function installTools() {
  const toolsPath = path.normalize(path.join(__dirname, '..', '..', 'tools'));
  const proxy = process.env.WKTUI_DEV_PROXY;
  console.log(`Installing tools to ${toolsPath} for packaging with installer`);

  return new Promise((resolve, reject) => {
    installer.installWdtRelease(toolsPath, {
        httpsProxyUrl: proxy
      })
      .then(() => {
        console.log('WebLogic Deploy Tooling installed');
        installer.installWitRelease(toolsPath, {
            httpsProxyUrl: proxy
          })
          .then(() => {
            console.log('WebLogic Image Tool installed');
            resolve();
          })
          .catch(err => reject(`WebLogic Image Tool install failed: ${err}`));
      })
      .catch(err => reject(`WebLogic Deploy Tooling install failed: ${err}`));
  });
}

installTools().then().catch(err => console.error(err));
