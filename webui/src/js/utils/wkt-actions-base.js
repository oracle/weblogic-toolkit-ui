/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io', 'utils/dialog-helper',
  'utils/validation-helper', 'utils/wkt-logger'],
function(project, wktConsole, i18n, projectIo, dialogHelper) {
  class WktActionsBase {
    constructor() {
      this.project = project;
    }
    getKubectlExe() {
      return this.project.kubectl.executableFilePath.value;
    }

    getHelmExe() {
      return this.project.kubectl.helmExecutableFilePath.value;
    }

    getKubectlOptions() {
      return {
        kubeConfig: this.project.kubectl.kubeConfig.value,
        extraPathDirectories: this.getExtraPathDirectoriesArray(this.project.kubectl.extraPathDirectories.value)
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

    async saveProject(errTitle, errPrefix) {
      try {
        const saveResult = await projectIo.saveProject();
        if (!saveResult.saved) {
          const errKey = `${errPrefix}-project-not-saved-error-prefix`;
          const errMessage = `${i18n.t(errKey)}: ${saveResult.reason}`;
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateJavaHome(javaHome, errTitle, errPrefix) {
      try {
        let errContext = i18n.t(`${errPrefix}-invalid-java-home-error-prefix`);
        const javaHomeValidationResult =
          await window.api.ipc.invoke('validate-java-home', javaHome, errContext);
        if (!javaHomeValidationResult.isValid) {
          const errMessage = javaHomeValidationResult.reason;
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateImageBuilderExe(imageBuilderExe, errTitle, errPrefix) {
      try {
        const imageBuilderExeResults =
          await window.api.ipc.invoke('validate-image-builder-exe', imageBuilderExe);
        if (!imageBuilderExeResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-image-builder-invalid-error-message`,
            {fileName: imageBuilderExe, error: imageBuilderExeResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateKubectlExe(kubectlExe, errTitle, errPrefix) {
      try {
        const exeResults = await window.api.ipc.invoke('validate-kubectl-exe', kubectlExe);
        if (!exeResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-kubectl-exe-invalid-error-message`, {error: exeResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateHelmExe(helmExe, errTitle, errPrefix) {
      try {
        const exeResults = await window.api.ipc.invoke('validate-helm-exe', helmExe);
        if (!exeResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-helm-exe-invalid-error-message`, {error: exeResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateFile(projectDirectory, file, errTitle, errMessageKey) {
      try {
        const existsResult = await window.api.ipc.invoke('verify-files-exist', projectDirectory, file);
        if (!existsResult.isValid) {
          const errMessage = i18n.t(errMessageKey, {projectFile: this.project.getProjectFileName(), invalidFile: file});
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix) {
      try {
        if (kubectlContext) {
          const setResults =
            await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
          if (!setResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-set-context-error-message`, {error: setResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createKubernetesNamespace(kubectlExe, kubectlOptions, namespace, errTitle, errPrefix) {
      try {
        const createNsResults = await window.api.ipc.invoke('k8s-create-namespace', kubectlExe, namespace, kubectlOptions);
        if (!createNsResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-create-ns-error-message`,
            {operatorNamespace: namespace, error: createNsResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async validateKubernetesNamespaceExists(kubectlExe, kubectlOptions, namespace, errTitle, errPrefix) {
      try {
        if (namespace) {
          let validationResults = await window.api.ipc.invoke('validate-k8s-namespaces-exist', kubectlExe,
            kubectlOptions, namespace);

          if (!validationResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-validate-ns-failed-error-message`, {
              namespace: namespace,
              error: validationResults.reason
            });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else if (!validationResults.isValid) {
            const errMessage = i18n.t(`${errPrefix}-ns-not-exist-error-message`, {
              namespace: namespace,
              error: validationResults.reason
            });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createPullSecret(kubectlExe, kubectlOptions, namespace, secretName, secretData, errTitle, errPrefix) {
      try {
        const createResults =
          await window.api.ipc.invoke('k8s-create-pull-secret', kubectlExe, namespace, secretName, secretData, kubectlOptions);
        if (!createResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-create-image-pull-secret-error-message`,
            {namespace: namespace, secretName: secretName, error: createResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createGenericSecret(kubectlExe, kubectlOptions, namespace, secretName, secretData, errTitle, errKey) {
      try {
        const createResults = await window.api.ipc.invoke('k8s-create-generic-secret', kubectlExe, namespace,
          secretName, secretData, kubectlOptions);
        if (!createResults.isSuccess) {
          const errMessage = i18n.t(errKey, {namespace: namespace, secretName: secretName, error: createResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async loginToImageRegistry(imageBuilderExe, loginConfig, errTitle, errPrefix) {
      try {
        const loginResults = await window.api.ipc.invoke('do-image-registry-login', imageBuilderExe, loginConfig);
        if (!loginResults.isSuccess) {
          const imageRegistry = loginConfig.host || i18n.t('docker-hub');

          const errMessage = i18n.t(`${errPrefix}-image-registry-login-failed-error-message`, {
            host: imageRegistry,
            error: loginResults.reason
          });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }
  }

  return WktActionsBase;
});
