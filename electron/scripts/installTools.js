/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
const installer = require('../app/js/wktToolsInstaller');
const path = require('path');
const process = require('node:process');
const { verifyTools } = require('../build/verifyTools');

/* global __dirname */
async function installTools() {
  const toolsPath = path.normalize(path.join(__dirname, '..', '..', 'tools'));
  const proxy = process.env.WKTUI_DEV_PROXY;
  console.log(`Installing tools to ${toolsPath} for packaging with installer`);

  await installer.installWdtRelease(toolsPath, { httpsProxyUrl: proxy });
  console.log('WebLogic Deploy Tooling installed');
  await installer.installWitRelease(toolsPath, { httpsProxyUrl: proxy });
  console.log('WebLogic Image Tool installed');
  await verifyTools(toolsPath, process.platform);
}

installTools().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
