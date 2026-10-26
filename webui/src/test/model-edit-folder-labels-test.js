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

// Load the AMD module with explicit dependencies, without starting the application or JET widgets.
function loadModule(relativePath, dependencies) {
  let result;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', relativePath), 'utf8'), {
    define(names, factory) {
      result = factory(...names.map(name => dependencies[name]));
    }
  });
  return result;
}

describe('Model editor folder labels', () => {
  it('adds merged navigation paths without modifying alias folders, even on repeat processing', () => {
    const aliasFolders = Object.freeze(['JmsResource']);
    const aliases = {
      JMSSystemResource: { isMultiple: true, folders: aliasFolders },
      'JMSSystemResource/JmsResource': { folders: Object.freeze(['Queue', 'ConnectionFactory']) },
      'JMSSystemResource/JmsResource/Queue': { isMultiple: true, folders: [] },
      'JMSSystemResource/JmsResource/ConnectionFactory': { isMultiple: true, folders: [] }
    };
    const navigation = [{ path: 'resources', children: [{ path: 'JMSSystemResource' }] }];
    const helper = loadModule('utils/modelEdit/navigation-helper.js', {
      knockout: ko,
      'utils/wkt-logger': { warn() {} },
      'models/wkt-project': {},
      'utils/modelEdit/navigation/all-navigation': navigation,
      'utils/modelEdit/model-edit-helper': { dataLoaded: ko.observable(false) },
      'utils/modelEdit/alias-helper': { getAliasNode: parts => aliases[parts.join('/')] },
      'utils/modelEdit/meta-helper': {
        getMergeFolder: parts => parts.join('/') === 'JMSSystemResource' ? 'JmsResource' : null
      },
      'ojs/ojarraytreedataprovider': function() {}
    });

    helper.updateNavigationData(navigation, [], true);
    helper.updateNavigationData(navigation, [], true);

    expect(navigation[0].children[0].instanceChildren.map(entry => entry.path))
      .to.deep.equal(['JmsResource/Queue', 'JmsResource/ConnectionFactory']);
    expect(aliases.JMSSystemResource.folders).to.equal(aliasFolders);
    expect(aliasFolders).to.deep.equal(['JmsResource']);
  });

  function createDialog(usesTypeFolders) {
    const requestedLabels = [];
    const aliasPath = usesTypeFolders ? ['SecurityConfiguration', 'Realm', 'AuthenticationProvider'] :
      ['JMSSystemResource'];
    const providerOnly = () => {
      if (!usesTypeFolders) throw new Error('Ordinary beans must not request provider metadata');
    };
    const Dialog = loadModule('viewModels/modelEdit/new-instance-dialog.js', {
      knockout: ko,
      'utils/modelEdit/instance-helper': {
        getNewInstanceName: () => 'NewInstance', getNameValidators: () => []
      },
      'utils/modelEdit/alias-helper': {
        getAliasPath: () => aliasPath,
        usesTypeFolders: () => usesTypeFolders,
        getFolderNames: () => { providerOnly(); return ['DefaultAuthenticator']; }
      },
      'utils/modelEdit/message-helper': {
        getFolderTypeLabel: parts => {
          providerOnly();
          expect(parts).to.deep.equal(aliasPath);
          return 'Authentication Provider';
        },
        getProviderTypeLabel: () => { providerOnly(); return 'Provider Type'; },
        getProviderTypeHelp: () => { providerOnly(); return 'Choose a provider type'; },
        getFolderLabel: parts => { requestedLabels.push(parts.join('/')); return 'Default Authenticator'; },
        getAddInstanceMessage: () => 'Add instance',
        getInstanceNameLabel: () => 'Name',
        getInstanceNameHelp: () => 'Instance name'
      },
      'utils/modelEdit/meta-helper': { getNameDetails: () => ({}) },
      'utils/modelEdit/meta-options': { getOptions: () => [] },
      'utils/view-helper': {},
      'ojs/ojarraydataprovider': function() {}
    });
    return { dialog: new Dialog({ modelPath: ['resources', 'JMSSystemResource'] }), requestedLabels };
  }

  it('does not request provider labels or folder names for an ordinary bean', () => {
    const { dialog, requestedLabels } = createDialog(false);
    expect(requestedLabels).to.deep.equal([]);
    expect(dialog.providerTypeOptions).to.deep.equal([]);
    expect(dialog.instanceName()).to.equal('NewInstance');
  });

  it('still supplies translated provider choices for beans with type folders', () => {
    const { dialog, requestedLabels } = createDialog(true);
    expect(requestedLabels).to.deep.equal([
      'SecurityConfiguration/Realm/AuthenticationProvider/DefaultAuthenticator'
    ]);
    expect(dialog.providerTypeOptions).to.deep.equal([
      { value: 'DefaultAuthenticator', label: 'Default Authenticator' }
    ]);
    expect(dialog.providerTypeLabel).to.equal('Provider Type');
  });
});
