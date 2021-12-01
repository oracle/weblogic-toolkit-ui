/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'utils/i18n', 'utils/model-helper', 'utils/validation-helper', 'ojs/ojconverter-number',
  'ojs/ojinputtext',  'ojs/ojinputnumber',  'ojs/ojlabel', 'ojs/ojformlayout'],
function(accUtils, i18n, modelHelper, validationHelper, ojConverterNumber) {
  function ServerView(args) {
    this.nav = args.nav;
    this.modelObject = this.nav.modelObject;
    this.server = args.server;

    this.connected = () => {
      accUtils.announce('Server health design view loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-server-${labelId}`, payload);
    };

    const folderPath = ['topology', 'Server', this.server.name];

    const fields = {
      autoRestart: {
        attribute: 'AutoRestart',
        defaultValue: true,
        folderPath: folderPath,
        type: 'boolean'
      },
      restartDelay: {
        attribute: 'RestartDelaySeconds',
        defaultValue: 0,
        folderPath: folderPath
      }
    };

    modelHelper.createUpdateProperties(this, this.modelObject(), fields);

    this.delayNumberConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0
    });
  }

  return ServerView;
});
