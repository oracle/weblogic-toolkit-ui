/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

async function verifyTools(toolsDirectory, platform) {
  const extension = platform === 'win32' ? '.cmd' : '.sh';
  const requiredFiles = [
    'weblogic-deploy/VERSION.txt',
    `weblogic-deploy/bin/discoverDomain${extension}`,
    'weblogic-deploy/lib/weblogic-deploy-core.jar',
    'imagetool/VERSION.txt',
    `imagetool/bin/imagetool${extension}`,
    'imagetool/lib/imagetool.jar'
  ];

  for (const relativePath of requiredFiles) {
    const file = path.join(toolsDirectory, relativePath);
    try {
      const stat = await fs.stat(file);
      if (!stat.isFile() || stat.size === 0) {
        throw new Error('expected a nonempty file');
      }
    } catch (err) {
      throw new Error(`WKT tools installation is incomplete: ${file}: ${err.message}. Run npm run install-tools successfully before packaging.`, { cause: err });
    }
  }
}

exports.verifyTools = verifyTools;
exports.default = async context => {
  await verifyTools(path.resolve(context.packager.projectDir, '..', 'tools'), context.electronPlatformName);
};
