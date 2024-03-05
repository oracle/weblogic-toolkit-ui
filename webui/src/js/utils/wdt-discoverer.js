/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which performs domain discovery.
 * Returns a singleton.
 */

define(['utils/wdt-actions-base', 'knockout', 'models/wkt-project', 'models/wkt-console', 'utils/dialog-helper',
  'utils/project-io', 'utils/i18n', 'utils/validation-helper', 'utils/wkt-logger', 'ojs/ojbootstrap', 'ojs/ojknockout',
  'ojs/ojbutton', 'ojs/ojdialog'],
function (WdtActionsBase, ko, project, wktConsole, dialogHelper, projectIO, i18n, validationHelper, wktLogger) {
  class WdtDiscoverer extends WdtActionsBase {

    // validate Java home and Oracle home settings.
    // save the current project (electron will select a new file if needed).
    // open the discover configuration dialog.
    async startDiscoverDomain(online) {
      let proceed = true;
      if (this.hasModelContext()) {
        const title = i18n.t('wdt-discoverer-replace-title');
        const message = i18n.t('wdt-discoverer-replace-message');
        proceed = await window.api.ipc.invoke('ok-or-cancel-prompt', title, message);
      }

      if (proceed) {
        const discoverConfig = {'online': online};
        dialogHelper.openDialog('discover-dialog', discoverConfig);
      }
    }

    // the dialog will call this when the OK button is clicked.
    async executeDiscover(discoverConfig, online) {
      const errTitleKey = online ? 'wdt-discoverer-online-aborted-error-title' : 'wdt-discoverer-offline-aborted-error-title';

      let errTitle = i18n.t(errTitleKey);
      let errPrefix = 'wdt-discoverer';
      const keyName = online ? 'flow-online-discover-model-name' : 'flow-offline-discover-model-name';
      const validationObject = this.getValidationObject(keyName, discoverConfig, online);
      if (validationObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validationObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 5.0;
      try {
        let busyDialogMessage = i18n.t('flow-validate-java-home-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar', 0.0);
        const javaHomeDirectory = discoverConfig.javaHome;
        const oracleHomeDirectory = discoverConfig.oracleHome;
        const domainHomeDirectory = discoverConfig.domainHome;

        if (! await this.validateJavaHome(javaHomeDirectory, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        busyDialogMessage = i18n.t('flow-validate-oracle-home-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        if (! await this.validateOracleHome(oracleHomeDirectory, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        // for online discovery, domain home is on the remote machine,
        // so don't validate the directory
        if (!online) {
          busyDialogMessage = i18n.t('flow-validate-domain-home-in-progress');
          dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
          const errContext = i18n.t('wdt-discoverer-invalid-domain-home-error-prefix');
          const domainHomeValidationResult =
            await window.api.ipc.invoke('validate-domain-home', domainHomeDirectory, errContext);
          if (!domainHomeValidationResult.isValid) {
            const errMessage = domainHomeValidationResult.reason;
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        if (! await this.saveProject(errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        // Now that the project file is saved to disk, make sure all file names are set.
        discoverConfig.projectFile = project.getProjectFileName();
        if (!discoverConfig.modelFile) {
          discoverConfig.modelFile = project.wdtModel.getDefaultModelFile();
        }
        if (!discoverConfig.propertiesFile) {
          discoverConfig.propertiesFile = project.wdtModel.getDefaultPropertiesFile();
        }
        if (!discoverConfig.archiveFile) {
          discoverConfig.archiveFile = project.wdtModel.getDefaultArchiveFile();
        }

        wktConsole.clear();
        wktConsole.show(true);

        busyDialogMessage = i18n.t('flow-discover-domain-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);
        const channel = online ? 'run-online-discover' : 'run-offline-discover';
        const discoverResults = await window.api.ipc.invoke(channel, discoverConfig);
        if (discoverResults.isSuccess) {
          wktLogger.debug('discover complete: %s', discoverResults.modelFileContent);
          project.wdtModel.setModelFiles(discoverResults.modelFileContent);

          const isRemote = discoverConfig.isRemote;
          if (isRemote) {
            const options = { resultData: discoverResults.resultData };
            dialogHelper.openDialog('discover-result-dialog', options);
          }
          return Promise.resolve(true);
        } else {
          let errMessage;
          if (online) {
            errMessage = `${i18n.t('wdt-discoverer-online-discovery-failed-error-prefix',
              { adminUrl: discoverConfig.adminUrl})}: ${discoverResults.reason}`;
          } else {
            errMessage = `${i18n.t('wdt-discoverer-offline-discovery-failed-error-prefix',
              { domainHome: domainHomeDirectory})}: ${discoverResults.reason}`;
          }
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidationObject(flowNameKey, discoverConfig, online) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const settingsFormConfig = validationObject.getDefaultConfigObject();
      settingsFormConfig.formName = 'project-settings-form-name';

      validationObject.addField('project-settings-java-home-label',
        validationHelper.validateRequiredField(discoverConfig.javaHome), settingsFormConfig);
      validationObject.addField('project-settings-oracle-home-label',
        validationHelper.validateRequiredField(discoverConfig.oracleHome), settingsFormConfig);

      const discoverFormConfig = validationObject.getDefaultConfigObject();
      discoverFormConfig.formName = online ? 'discover-dialog-online-form-name' : 'discover-dialog-offline-form-name';

      if (!online) {
        validationObject.addField('discover-dialog-domain-home-label',
          validationHelper.validateRequiredField(discoverConfig.domainHome), discoverFormConfig);
      }

      if (online) {
        validationObject.addField('discover-dialog-admin-url-label',
          validationHelper.validateRequiredField(discoverConfig.adminUrl), discoverFormConfig);
        validationObject.addField('discover-dialog-admin-user-label',
          validationHelper.validateRequiredField(discoverConfig.adminUser), discoverFormConfig);
        validationObject.addField('discover-dialog-admin-password-label',
          validationHelper.validateRequiredField(discoverConfig.adminPass), discoverFormConfig);
      }
      return validationObject;
    }

    hasModelContext() {
      return !!project.wdtModel.modelContent() ||
        project.wdtModel.internal.propertiesContent.value.length || project.wdtModel.archiveRoots().length;
    }
  }

  return new WdtDiscoverer();
});
