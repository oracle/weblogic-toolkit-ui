/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { describe, it, beforeEach, afterEach } = require('mocha');
const { verifyTools, default: beforePack } = require('../../build/verifyTools');

describe('Bundled WKT tools verification', () => {
  let root;
  let tools;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wktui-tools-'));
    tools = path.join(root, 'tools');
    for (const file of [
      'weblogic-deploy/VERSION.txt', 'weblogic-deploy/bin/discoverDomain.sh',
      'weblogic-deploy/bin/discoverDomain.cmd', 'weblogic-deploy/lib/weblogic-deploy-core.jar',
      'imagetool/VERSION.txt', 'imagetool/bin/imagetool.sh', 'imagetool/bin/imagetool.cmd',
      'imagetool/lib/imagetool.jar'
    ]) {
      const filename = path.join(tools, file);
      await fs.mkdir(path.dirname(filename), { recursive: true });
      await fs.writeFile(filename, 'fixture');
    }
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  for (const platform of ['darwin', 'linux', 'win32']) {
    it(`accepts complete tools for ${platform}`, async () => {
      await verifyTools(tools, platform);
    });
  }

  it('blocks packaging when the entire image tool is missing', async () => {
    await fs.rm(path.join(tools, 'imagetool'), { recursive: true });
    await assert.rejects(beforePack({ packager: { projectDir: path.join(root, 'electron') },
      electronPlatformName: 'darwin' }), /WKT tools installation is incomplete:.*imagetool.*VERSION.txt/);
  });

  it('rejects a partial WDT installation', async () => {
    await fs.rm(path.join(tools, 'weblogic-deploy/lib/weblogic-deploy-core.jar'));
    await assert.rejects(verifyTools(tools, 'darwin'), /weblogic-deploy-core.jar/);
  });

  it('rejects empty tool jars', async () => {
    await fs.writeFile(path.join(tools, 'imagetool/lib/imagetool.jar'), '');
    await assert.rejects(verifyTools(tools, 'darwin'), /imagetool.jar: expected a nonempty file/);
  });

  it('requires the launcher for the target platform', async () => {
    await fs.rm(path.join(tools, 'imagetool/bin/imagetool.cmd'));
    await verifyTools(tools, 'darwin');
    await assert.rejects(verifyTools(tools, 'win32'), /imagetool.cmd/);
  });
});
