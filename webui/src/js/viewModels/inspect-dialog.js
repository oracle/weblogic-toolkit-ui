/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/view-helper', 'ojs/ojarraydataprovider', 'ojs/ojknockout',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout' ],
function(accUtils, ko, i18n, ViewHelper) {
  function InspectDialogModel(config) {
    const DIALOG_SELECTOR = '#wktInspectDialog';

    this.connected = () => {
      accUtils.announce('Validation Error dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`inspect-dialog-${labelId}`, payload);
    };

    this.i18n = i18n;
    this.config = config;
    this.contents = config.contents;

    this.getTitle = () => {
      return this.config.title || this.labelMapper('default-title');
    };

    this.getMessage = () => {
      return this.config.message || this.labelMapper('default-message');
    };

    this.hasOsInfo = () => {
      return !!this.contents.os && !!this.contents.os.name && !!this.contents.os.version;
    };

    this.getOsName = () => {
      return this.contents.os.name;
    };

    this.getOsVersion = () => {
      return this.contents.os.version;
    };

    this.hasJavaHome = () => {
      return !!this.contents.javaHome;
    };

    this.getJavaHome = () => {
      return this.contents.javaHome;
    };

    this.getJavaVersion = () => {
      return this.contents.javaVersion;
    };

    this.hasOracleHome = () => {
      return !!this.contents.oracleHome;
    };

    this.getOracleHome = () => {
      return this.contents.oracleHome;
    };

    this.getWlsVersion = () => {
      return this.contents.wlsVersion;
    };

    this.getOpatchVersion = () => {
      return this.contents.opatchVersion;
    };

    this.hasOraclePatches = () => {
      return !!this.contents.oraclePatches && this.contents.oraclePatches.length > 0;
    };

    this.patches = { };

    this.buildPatchesData = () => {
      const namedPatches = [ ];
      const oneOffPatches = [ ];

      if (this.hasOraclePatches()) {
        this.contents.oraclePatches.forEach(patch => {
          if (patch.description.toLowerCase() === 'one-off') {
            oneOffPatches.push({ number: patch.patch });
          } else {
            namedPatches.push({ name: patch.description, number: patch.patch });
          }
        });
        if (namedPatches.length > 0) {
          this.patches['namedPatches'] = namedPatches;
        }
        if (oneOffPatches.length > 0) {
          this.patches['oneOffPatches'] = oneOffPatches;
        }
      }
    };

    this.hasNamedPatches = () => {
      return !!this.patches.namedPatches;
    };

    this.hasOneOffPatches = () => {
      return !!this.patches.oneOffPatches;
    };

    this.getNamedPatches = () => {
      return this.patches.namedPatches;
    };

    this.getOneOffPatches = () => {
      return this.patches.oneOffPatches;
    };

    this.dismissDialog = () => {
      const dialog = this.dialogContainer;
      if (dialog) {
        dialog.close();
      }
    };

    this.buildPatchesData();
  }

  return InspectDialogModel;
});
