/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io', 'utils/dialog-helper',
  'utils/wkt-logger'],
function(project, wktConsole, i18n, projectIo, dialogHelper,
  wktLogger) {

  // Name of the current action that is running.
  // No other action should start if this is a non-null value.
  // Acts as a static singleton, since it's inside this module, but outside the WktActionsBase class.
  let actionInProgress = null;

  class WktActionsBase {
    constructor() {
      this.project = project;
    }

    getImageRegistryCredential(credentialUid) {
      if (project.settings.containerImageRegistriesCredentials.hasValue()) {
        for (let credentialObject of project.settings.containerImageRegistriesCredentials.observable()) {
          if (credentialObject.uid === credentialUid) {
            return credentialObject;
          }
        }
      }
      return undefined;
    }

    // Execute the specified async action method if no other action is in progress.
    // If another action is in progress, log a message and cancel the new action.
    async executeAction(asyncMethod, ...args) {
      const description = asyncMethod.name;
      if (actionInProgress) {
        wktLogger.info('Cancelling action ' + description + ' because ' + actionInProgress + ' is in progress');
      } else {
        wktLogger.debug('starting action ' + description);
        actionInProgress = description;
        try {
          await asyncMethod.call(this, ...args);
        } finally {
          wktLogger.debug('action ' + description + ' complete');
          actionInProgress = null;
        }
      }
    }

    getKubectlExe() {
      return this.project.kubectl.executableFilePath.value;
    }

    getHelmExe() {
      return this.project.kubectl.helmExecutableFilePath.value;
    }

    getImageBuilderOptions() {
      return {
        imageBuilderExe: this.project.settings.builderExecutableFilePath.value,
        extraPathDirectories: this.getExtraPathDirectoriesArray(this.project.settings.extraPathDirectories.value),
        extraEnvironmentVariables: this.getExtraEnvironmentVariablesObject(this.project.settings.extraEnvironmentVariables.value),
        architecture: this.project.settings.imageTargetArchitecture.value
      };
    }

    getKubectlOptions() {
      return {
        kubeConfig: this.project.kubectl.kubeConfig.value,
        extraPathDirectories: this.getExtraPathDirectoriesArray(this.project.settings.extraPathDirectories.value),
        extraEnvironmentVariables: this.getExtraEnvironmentVariablesObject(this.project.settings.extraEnvironmentVariables.value)
      };
    }

    getKubectlContext() {
      return this.project.kubectl.kubeConfigContextToUse.value;
    }

    getExtraPathDirectoriesArray(extraPathDirectoriesList) {
      const results = [];
      if (extraPathDirectoriesList) {
        for (const item of extraPathDirectoriesList) {
          results.push(item.value);
        }
      }
      return results;
    }

    getExtraEnvironmentVariablesObject(extraEnvironmentVariablesList) {
      const result = {};
      if (extraEnvironmentVariablesList) {
        for (const item of extraEnvironmentVariablesList) {
          result[item.name] = item.value;
        }
      }
      return result;
    }

    async removeNamespacePrompt(promptTitle, promptQuestion, promptDetails) {
      return window.api.ipc.invoke('yes-no-or-cancel-prompt', promptTitle, promptQuestion, promptDetails);
    }

    async saveProject(errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {

        const saveResult = await projectIo.saveProject(false, true);
        if (!saveResult.saved) {
          const errKey = `${errPrefix}-project-not-saved-error-prefix`;
          const errMessage = `${i18n.t(errKey)}: ${saveResult.reason}`;
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateJavaHome(javaHome, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        let errContext = i18n.t(`${errPrefix}-invalid-java-home-error-prefix`);
        const javaHomeValidationResult =
          await window.api.ipc.invoke('validate-java-home', javaHome, errContext);
        if (!javaHomeValidationResult.isValid) {
          const errMessage = javaHomeValidationResult.reason;
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateOracleHome(oracleHome, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const errContext = i18n.t(`${errPrefix}-invalid-oracle-home-error-prefix`);
        const oracleHomeValidationResult =
          await window.api.ipc.invoke('validate-oracle-home', oracleHome, errContext);
        if (!oracleHomeValidationResult.isValid) {
          const errMessage = oracleHomeValidationResult.reason;
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const imageBuilderExeResults =
          await window.api.ipc.invoke('validate-image-builder-exe', imageBuilderExe);
        if (!imageBuilderExeResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-image-builder-invalid-error-message`,
            {fileName: imageBuilderExe, error: imageBuilderExeResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateKubectlExe(kubectlExe, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const exeResults = await window.api.ipc.invoke('validate-kubectl-exe', kubectlExe);
        if (!exeResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-kubectl-exe-invalid-error-message`, {error: exeResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateHelmExe(helmExe, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const exeResults = await window.api.ipc.invoke('validate-helm-exe', helmExe);
        if (!exeResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-helm-exe-invalid-error-message`, {error: exeResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateOpenSSLExe(openSSLExe, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const exeResults = await window.api.ipc.invoke('validate-openssl-exe', openSSLExe);
        if (!exeResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-openssl-exe-invalid-error-message`, {error: exeResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateModelFiles(projectDirectory, modelFiles, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        if (!modelFiles || modelFiles.length === 0) {
          const errMessage = i18n.t(`${errPrefix}-no-model-to-use-message`, {projectFile: this.project.getProjectFileName()});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-info-message', errTitle, errMessage);
          return Promise.resolve(false);
        } else {
          const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...modelFiles);
          if (!existsResult.isValid) {
            const invalidFiles = existsResult.invalidFiles.join(', ');
            const errMessage = i18n.t(`${errPrefix}-invalid-model-file-message`,
              {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
            this._closeBusyDialog(shouldCloseBusyDialog);
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    getVariableFilesCount() {
      let count = 0;
      if (Array.isArray(this.project.wdtModel.propertiesFiles.value)) {
        count = this.project.wdtModel.propertiesFiles.value.length;
      }
      return count;
    }

    async validateVariableFiles(projectDirectory, variableFiles, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        if (variableFiles && variableFiles.length > 0) {
          const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...variableFiles);
          if (!existsResult.isValid) {
            const invalidFiles = existsResult.invalidFiles.join(', ');
            const errMessage = i18n.t(`${errPrefix}-invalid-variable-file-message`,
              {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
            this._closeBusyDialog(shouldCloseBusyDialog);
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateArchiveFiles(projectDirectory, archiveFiles, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        if (archiveFiles && archiveFiles.length > 0) {
          const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, ...archiveFiles);
          if (!existsResult.isValid) {
            const invalidFiles = existsResult.invalidFiles.join(', ');
            const errMessage = i18n.t(`${errPrefix}-invalid-archive-file-message`,
              {projectFile: this.project.getProjectFileName(), invalidFileList: invalidFiles});
            this._closeBusyDialog(shouldCloseBusyDialog);
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateFile(projectDirectory, file, errTitle, errMessageKey, shouldCloseBusyDialog = true) {
      try {
        const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, file);
        if (!existsResult.isValid) {
          const errMessage = i18n.t(errMessageKey, {projectFile: this.project.getProjectFileName(), invalidFile: file});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix,
      shouldCloseBusyDialog = true) {
      try {
        if (kubectlContext) {
          const setResults =
            await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
          if (!setResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-set-context-error-message`, {error: setResults.reason});
            this._closeBusyDialog(shouldCloseBusyDialog);
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createKubernetesNamespace(kubectlExe, kubectlOptions, namespace, errTitle, errPrefix,
      shouldCloseBusyDialog = true) {
      try {
        const createNsResults =
          await window.api.ipc.invoke('k8s-create-namespace', kubectlExe, namespace, kubectlOptions);
        if (!createNsResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-create-ns-error-message`,
            {namespace: namespace, error: createNsResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async labelKubernetesNamespace(kubectlExe, kubectlOptions, namespace, labels, errTitle, errPrefix,
      shouldCloseBusyDialog = true) {
      try {
        const labelResults =
          await window.api.ipc.invoke('k8s-label-namespace', kubectlExe, namespace, labels, kubectlOptions);
        if (!labelResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-label-ns-error-message`, {namespace, error: labelResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateKubernetesNamespaceExists(kubectlExe, kubectlOptions, namespace, errTitle, errPrefix,
      shouldCloseBusyDialog = true) {
      try {
        if (namespace) {
          let validationResults = await window.api.ipc.invoke('validate-k8s-namespaces-exist', kubectlExe,
            kubectlOptions, namespace);

          if (!validationResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-validate-ns-failed-error-message`, {
              namespace: namespace,
              error: validationResults.reason
            });
            this._closeBusyDialog(shouldCloseBusyDialog);
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else if (!validationResults.isValid) {
            const errMessage = i18n.t(`${errPrefix}-ns-not-exist-error-message`, { namespace: namespace });
            this._closeBusyDialog(shouldCloseBusyDialog);
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createPullSecret(kubectlExe, kubectlOptions, namespace, secretName, secretData, errTitle, errPrefix,
      shouldCloseBusyDialog = true) {
      try {
        const createResults =
          await window.api.ipc.invoke('k8s-create-pull-secret', kubectlExe, namespace, secretName, secretData, kubectlOptions);
        if (!createResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-create-image-pull-secret-error-message`,
            {namespace: namespace, secretName: secretName, error: createResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createGenericSecret(kubectlExe, kubectlOptions, namespace, secretName, secretData, errTitle, errKey,
      shouldCloseBusyDialog = true) {
      try {
        const createResults = await window.api.ipc.invoke('k8s-create-generic-secret', kubectlExe, namespace,
          secretName, secretData, kubectlOptions);
        if (!createResults.isSuccess) {
          const errMessage = i18n.t(errKey, {namespace: namespace, secretName: secretName, error: createResults.reason});
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createTLSSecret(kubectlExe, kubectlOptions, secretName, secretNamespace, certificateFile, keyFile,
      errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const results = await window.api.ipc.invoke('k8s-create-tls-secret',  kubectlExe, secretNamespace,
          secretName, keyFile, certificateFile, kubectlOptions);
        if (!results.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-create-tls-secret-error-message`,
            {
              name: secretName,
              namespace: secretNamespace,
              error: results.reason
            });
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async loginToImageRegistry(imageBuilderOptions, loginConfig, errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const loginResults = await window.api.ipc.invoke('do-image-registry-login', imageBuilderOptions, loginConfig);
        if (!loginResults.isSuccess) {
          const imageRegistry = loginConfig.host || i18n.t('docker-hub');

          const errMessage = i18n.t(`${errPrefix}-image-registry-login-failed-error-message`, {
            host: imageRegistry,
            error: loginResults.reason
          });
          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async deleteKubernetesObjectIfExists(kubectlExe, kubectlOptions, objectNamespace, objectType, objectName,
      errTitle, errPrefix, shouldCloseBusyDialog = true) {
      try {
        const deleteResults = await window.api.ipc.invoke('k8s-delete-object', kubectlExe, objectNamespace,
          objectName, objectType, kubectlOptions);
        if (!deleteResults.isSuccess) {
          let errMessage;
          if (objectType === 'namespace') {
            errMessage = i18n.t(`${errPrefix}-k8s-namespace-delete-failed-error-message`, {
              namespace: objectName,
              error: deleteResults.reason
            });
          } else {
            errMessage = i18n.t(`${errPrefix}-k8s-object-delete-failed-error-message`, {
              namespace: objectNamespace,
              type: objectType,
              name: objectName,
              error: deleteResults.reason
            });
          }

          this._closeBusyDialog(shouldCloseBusyDialog);
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async getDetailsForService(kubectlExe, kubectlOptions, objectName, serviceNamespace, serviceName, errTitle, errPrefix,
      shouldCloseBusyDialog = true) {
      const results = await window.api.ipc.invoke('k8s-get-service-details', kubectlExe, serviceNamespace,
        serviceName, kubectlOptions);

      if (!results.isSuccess) {
        const errMessage = i18n.t(`${errPrefix}-service-not-exists-error-message`, {
          name: objectName,
          namespace: serviceNamespace,
          serviceName: serviceName,
          error:results.reason
        });
        this._closeBusyDialog(shouldCloseBusyDialog);
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }
      return Promise.resolve(results.serviceDetails);
    }

    async getServicesDetailsForNamespace(kubectlExe, kubectlOptions, serviceNamespace, errTitle, errPrefix,
      shouldCloseBusyDialog = true) {
      const results = await window.api.ipc.invoke('k8s-get-service-details', kubectlExe, serviceNamespace,
        '', kubectlOptions);
      if (!results.isSuccess) {
        const errMessage = i18n.t(`${errPrefix}-get-services-in-namespace-error-message`, {
          error: results.reason,
          namespace: namespace
        });
        this._closeBusyDialog(shouldCloseBusyDialog);
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }
      return Promise.resolve(results.serviceDetails);
    }

    _closeBusyDialog(shouldCloseBusyDialog) {
      if (shouldCloseBusyDialog) {
        dialogHelper.closeBusyDialog();
      }
    }
  }

  return WktActionsBase;
});
