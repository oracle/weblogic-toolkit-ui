/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/model-helper', 'utils/validation-helper', 'utils/observable-properties',
  'ojs/ojconverter-number',
  'ojs/ojinputtext',  'ojs/ojinputnumber',  'ojs/ojlabel', 'ojs/ojformlayout'],
function(accUtils, i18n, modelHelper, validationHelper, props, ojConverterNumber) {
  function DomainView(args) {
    const defaultDomainName = 'base_domain';
    const defaultAdminPort = 9002;

    this.nav = args.nav;
    this.modelObject = this.nav.modelObject;

    this.connected = () => {
      accUtils.announce('Domain design view loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-domain-${labelId}`, payload);
    };

    const fields = {
      domainName: {
        attribute: 'Name',
        defaultValue: defaultDomainName,
        folderPath: ['topology']
      },
      adminPortEnabled: {
        attribute: 'AdministrationPortEnabled',
        defaultValue: false,
        folderPath: ['topology']
      },
      adminPort: {
        attribute: 'AdministrationPort',
        defaultValue: defaultAdminPort,
        folderPath: ['topology']
      },
      productionMode: {
        attribute: 'ProductionModeEnabled',
        defaultValue: false,
        folderPath: ['topology']
      }
    };

    modelHelper.createUpdateProperties(this, this.modelObject(), fields);

    this.adminPortValidator = validationHelper.getPortNumberValidators();

    this.portNumberConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0,
      useGrouping: false
    });
  }

  return DomainView;
});
