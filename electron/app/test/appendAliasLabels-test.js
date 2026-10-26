/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * @ignore
 */
'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const { analyzeLabels, appendLabels, createVisibilityFilter } = require('../../scripts/appendAliasLabels');

describe('Append alias labels', () => {
  it('skips hidden fields and omitted beans, but retains new children and visible shared attributes', () => {
    const visibility = createVisibilityFilter([{ children: [{ path: 'JMSServer' }, { path: 'Server' }] }], {
      JMSServer: { sections: [{ type: 'tab', sections: [
        { type: 'hidden', attributes: ['BytesPagingEnabled', 'SharedValue'] }
      ] }] },
      'Server/WebServer': { sections: [{ type: 'hidden', attributes: ['MaxRequestParamterCount'] }] }
    });
    const { labels, optional, skipped } = analyzeLabels({
      JMSServer: { attributes: { BytesPagingEnabled: {}, SharedValue: {} } },
      'Server/WebServer': { attributes: { MaxRequestParamterCount: {} } },
      'Server/NewChild': { attributes: { SharedValue: {}, NewValue: {} } },
      'VirtualTarget/WebServer': { attributes: { MaxRequestParamterCount: {} } }
    }, {
      'f-any_JMSServer-label': 'JMS Servers',
      'f-any_WebServer-label': 'Web Server',
      'f-any_NewChild-label': 'New Child'
    }, visibility);
    expect(labels).to.deep.equal({ 'a-SharedValue-label': 'Shared Value', 'a-NewValue-label': 'New Value' });
    expect(skipped).to.include('JMSServer/BytesPagingEnabled: explicitly hidden attribute');
    expect(skipped).to.include('VirtualTarget/WebServer/MaxRequestParamterCount: bean omitted from top-level navigation');
    expect(optional.some(entry => entry.startsWith('VirtualTarget/'))).to.equal(false);
  });

  it('uses parent-page hiding for merged attributes and conservatively keeps explicit visible uses', () => {
    const visibility = createVisibilityFilter([{ children: [{ path: 'JMSSystemResource' }] }], {
      JMSSystemResource: {
        mergeFolder: 'JmsResource',
        sections: [
          { type: 'hidden', attributes: ['HiddenValue', 'VisibleValue'] },
          { type: 'attributes', attributes: ['VisibleValue'] }
        ]
      }
    });
    const { labels } = analyzeLabels({
      'JMSSystemResource/JmsResource': { attributes: { HiddenValue: {}, VisibleValue: {} } }
    }, { 'f-any_JmsResource-label': 'JMS Resource' }, visibility);
    expect(labels).to.deep.equal({ 'a-VisibleValue-label': 'Visible Value' });
  });

  it('normalizes technical names in newly generated labels', () => {
    const { labels } = analyzeLabels({
      FeatureCompatibility: {
        attributes: {
          IiopStrictRemoteBusinessInterfaceValidationEnabled: {},
          JaxwsRejectUnknownSeiOperationsEnabled: {},
          WorkContextInputMaximumAsciiFieldSize: {}
        }
      }
    }, { 'f-any_FeatureCompatibility-label': 'Feature Compatibility' });
    expect(labels).to.deep.equal({
      'a-IiopStrictRemoteBusinessInterfaceValidationEnabled-label':
        'IIOP Strict Remote Business Interface Validation Enabled',
      'a-JaxwsRejectUnknownSeiOperationsEnabled-label': 'JAX-WS Reject Unknown SEI Operations Enabled',
      'a-WorkContextInputMaximumAsciiFieldSize-label': 'Work Context Input Maximum ASCII Field Size'
    });
  });

  it('accepts every attribute label override supported by the UI', () => {
    const paths = {
      'Server/SSL': {
        attributes: {
          FullPath: {}, LastFolder: {}, Generic: {}, 'custom.Value': {}, Missing: {}
        }
      }
    };
    const { labels } = analyzeLabels(paths, {
      'f-Server_SSL-a-FullPath-label': 'Full path label',
      'f-any_SSL-a-LastFolder-label': 'Last folder label',
      'a-Generic-label': 'Generic label',
      'f-any_SSL-label': 'SSL',
      'a-custom_Value-label': 'Custom value'
    });
    expect(labels).to.deep.equal({ 'a-Missing-label': 'Missing' });
  });

  it('adds a generic label if another use of the same attribute is uncovered', () => {
    const paths = {
      One: { attributes: { SharedValue: {} } },
      Two: { attributes: { SharedValue: {} } }
    };
    const { labels } = analyzeLabels(paths, {
      'f-One-a-SharedValue-label': 'Custom label', 'f-any_One-label': 'One', 'f-any_Two-label': 'Two'
    });
    expect(labels).to.deep.equal({ 'a-SharedValue-label': 'Shared Value' });
  });

  it('reports collection wording gaps without generating singulars or plurals', () => {
    const paths = {
      Policy: {
        isMultiple: true,
        attributes: { Policies: { wlstType: '${list:jarray}' }, Properties: { wlstType: 'properties' } }
      }
    };
    const { labels, optional, collections } = analyzeLabels(paths, {
      'a-Policies-label': 'Policies',
      'a-Properties-label': 'Properties',
      'f-Policy-a-any-keyLabel': 'Custom key'
    });
    expect(labels).to.deep.equal({ 'f-any_Policy-label': 'Policy' });
    expect(collections).to.deep.equal([
      'Policy: review f-any_Policy-label ("Policy") for collection wording'
    ]);
    expect(optional).to.deep.equal([
      'Policy/Policies: itemLabel (uses generic wording)',
      'Policy/Properties: entryLabel (uses generic wording)',
      'Policy/Properties: valueLabel (uses generic wording)',
      'Policy: singular folder typeLabel (defaults to "Instance")'
    ]);
  });

  it('generates readable folder drafts, respects overrides, and flags only generated collection labels', () => {
    const { labels, collections } = analyzeLabels({
      'One/Queue': { isMultiple: true },
      'Two/Queue': { isMultiple: true },
      'One/Policy': { isMultiple: true },
      FeatureCompatibility: {},
      Server: { isMultiple: true }
    }, { 'f-One_Policy-label': 'Policies', 'f-any_Server-label': 'Servers' });
    expect(labels).to.deep.equal({
      'f-any_Queue-label': 'Queue',
      'f-any_FeatureCompatibility-label': 'Feature Compatibility'
    });
    expect(collections).to.deep.equal([
      'One/Queue: review f-any_Queue-label ("Queue") for collection wording',
      'Two/Queue: review f-any_Queue-label ("Queue") for collection wording'
    ]);
  });

  it('preserves existing formatting and order, sorts only additions, and safely escapes text', () => {
    const source = '{\r\n    "z": "Last",\r\n\r\n    "a": "First"\r\n}\r\n';
    const labels = { 'a-Z-label': 'A "quote"', 'a-B-label': 'B', a: 'Do not replace' };
    const updated = appendLabels(source, labels);
    expect(updated).to.equal(
      '{\r\n    "z": "Last",\r\n\r\n    "a": "First",\r\n\r\n' +
      '    "a-B-label": "B",\r\n    "a-Z-label": "A \\"quote\\""\r\n}\r\n');
    expect(JSON.parse(updated).a).to.equal('First');
    expect(appendLabels(updated, labels)).to.equal(updated);
  });

  it('leaves a complete file byte-for-byte unchanged and handles an empty object', () => {
    expect(appendLabels('{ "existing": "Label" }\n', {})).to.equal('{ "existing": "Label" }\n');
    expect(JSON.parse(appendLabels('{}\n', { 'a-New-label': 'New' })))
      .to.deep.equal({ 'a-New-label': 'New' });
  });
});
