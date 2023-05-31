/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function(WktActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper) {
  class WkoActionsBase extends WktActionsBase {
    constructor() {
      super();
      this.wkoUnsupportedPattern = /^[1-2][.].*$/;
    }

    async isWkoInstalledVersionSupported(isInstalledResults, operatorNamespace, errTitle, errPrefix) {
      try {
        if (isInstalledResults.version.match(this.wkoUnsupportedPattern)) {
          const errMessage = i18n.t(`${errPrefix}-unsupported-installed-version-error-message`, {
            operatorNamespace: operatorNamespace, version: isInstalledResults.version });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async isWkoImageVersionSupported(operatorNamespace, errTitle, errPrefix) {
      try {
        // Since the default is always the latest, no need to check the version if the user hasn't changed it.
        if (this.project.wko.operatorImage.hasValue()) {
          const imageComponents = window.api.k8s.getImageTagComponents(this.project.wko.operatorImage.value);
          if (imageComponents.version.match(this.wkoUnsupportedPattern)) {
            const errMessage = i18n.t(`${errPrefix}-unsupported-new-version-error-message`, {
              operatorNamespace: operatorNamespace, version: imageComponents.version
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

    async validateOperatorNamespaces(kubectlExe, kubectlOptions, errTitle, errPrefix) {
      try {
        if (this.project.wko.operatorDomainNamespaceSelectionStrategy.value === 'List' &&
          this.project.wko.operatorDomainNamespacesList.value.length > 0) {
          const validationResults = await window.api.ipc.invoke('validate-k8s-namespaces-exist', kubectlExe,
            kubectlOptions, ...this.project.wko.operatorDomainNamespacesList.value);

          if (!validationResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-validate-ns-error-message`, {
              namespaces: this.project.wko.operatorDomainNamespacesList.value.join(', '),
              error: validationResults.reason
            });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          } else if (!validationResults.isValid) {
            const missingNamespaces = validationResults.missingNamespaces;
            // Prompt the user to see if they want to create them.
            // If so, create the namespaces for them
            // If not, abort installation...
            //
            const title = i18n.t(`${errPrefix}-namespaces-do-not-exist-title`);
            const question = i18n.t(`${errPrefix}-namespaces-do-not-exist-question`, {
              namespaces: missingNamespaces.join(', ')
            });
            const response = await window.api.ipc.invoke('yes-or-no-prompt', title, question);
            if (response) {
              const nsCreateResponse = await window.api.ipc.invoke('k8s-create-namespaces', kubectlExe,
                kubectlOptions, ...missingNamespaces);
              if (!nsCreateResponse.isSuccess) {
                const errMessage = i18n.t(`${errPrefix}-create-namespaces-failed-error`, {
                  namespaces: missingNamespaces.join(', '),
                  error: nsCreateResponse.reason
                });
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            } else {
              // user chose to not create the missing namespaces so abort the installation
              const errMessage = i18n.t(`${errPrefix}-namespaces-do-not-exist-error`, {
                namespaces: missingNamespaces.join(', ')
              });
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    async createOperatorServiceAccount(kubectlExe, kubectlOptions, operatorNamespace, operatorServiceAccount, errTitle, errPrefix) {
      try {
        const createSaResults =
          await window.api.ipc.invoke('k8s-create-service-account', kubectlExe, operatorNamespace, operatorServiceAccount, kubectlOptions);
        if (!createSaResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-create-sa-error-message`,
            {
              operatorServiceAccount: operatorServiceAccount,
              operatorNamespace: operatorNamespace,
              error: createSaResults.reason
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

    async createOperatorPullSecret(kubectlExe, kubectlOptions, operatorNamespace, operatorPullSecretName, errTitle, errPrefix) {
      try {
        if (this.project.wko.operatorImagePullRequiresAuthentication.value &&
          !this.project.wko.operatorImagePullUseExistingSecret.value) {
          const secretData = {
            server: this.project.wko.internal.operatorImagePullRegistryAddress.value,
            username: this.project.wko.operatorImagePullRegistryUsername.value,
            email: this.project.wko.operatorImagePullRegistryEmailAddress.value,
            password: this.project.wko.operatorImagePullRegistryPassword.value
          };

          const createPullSecretResults = await window.api.ipc.invoke('k8s-create-pull-secret', kubectlExe,
            operatorNamespace, operatorPullSecretName, secretData, kubectlOptions);
          if (!createPullSecretResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-create-pull-secret-error-message`,
              {
                secretName: operatorPullSecretName,
                operatorNamespace: operatorNamespace,
                error: createPullSecretResults.reason
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

    async addOperatorHelmChart(helmExe, helmOptions, errTitle, errPrefix) {
      try {
        const addChartResults = await window.api.ipc.invoke('helm-add-wko-chart', helmExe, helmOptions);
        if (!addChartResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-add-chart-error-message`, {error: addChartResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    getWkoHelmChartValues(operatorServiceAccount) {
      const helmChartValues = {
        // Only put the values in here where the UI is not following the operator helm chart's default values.
        //
        serviceAccount: operatorServiceAccount,
        domainNamespaceSelectionStrategy: this.project.wko.operatorDomainNamespaceSelectionStrategy.value,
      };

      if (!this.isValueEmpty(this.project.wko.operatorImage.value)) {
        helmChartValues.image = this.project.wko.operatorImage.value;
      }

      switch (helmChartValues.domainNamespaceSelectionStrategy) {
        case 'LabelSelector':
          helmChartValues.domainNamespaceLabelSelector = this.project.wko.operatorDomainNamespaceSelector.value;
          break;

        case 'List':
          if (this.project.wko.operatorDomainNamespacesList.hasValue()) {
            helmChartValues.domainNamespaces =
              this.convertArrayToSliceSyntax(this.project.wko.operatorDomainNamespacesList.value);
          }
          break;

        case 'Regexp':
          helmChartValues.domainNamespaceRegExp = this.project.wko.operatorDomainNamespaceRegex.value;
          break;
      }

      // Now, add other values if they are not the default;
      //
      this.addHelmChartValueIfSet(helmChartValues, 'enableClusterRoleBinding', this.project.wko.enableClusterRoleBinding);
      this.addHelmChartValueIfSet(helmChartValues, 'image', this.project.wko.operatorImage);
      this.addHelmChartValueIfSet(helmChartValues, 'imagePullPolicy', this.project.wko.operatorImagePullPolicy);
      this.addHelmChartValueIfSet(helmChartValues, 'timeout', this.project.wko.helmTimeoutMinutes);

      if (this.project.wko.operatorImagePullRequiresAuthentication.value) {
        const imagePullSecret = this.project.wko.operatorImagePullSecretName.value;
        if (imagePullSecret) {
          helmChartValues.imagePullSecrets = [{name: imagePullSecret}];
        }
      }

      if (this.project.wko.externalRestEnabled.hasValue()) {
        helmChartValues.externalRestEnabled = this.project.wko.externalRestEnabled.value;
        if (helmChartValues.externalRestEnabled) {
          this.addHelmChartValueIfSet(helmChartValues, 'externalRestHttpsPort', this.project.wko.externalRestHttpsPort);
          this.addHelmChartValueIfSet(helmChartValues, 'externalRestIdentitySecret', this.project.wko.externalRestIdentitySecret);
        }
      }

      if (this.project.wko.elkIntegrationEnabled.hasValue()) {
        helmChartValues.elkIntegrationEnabled = this.project.wko.elkIntegrationEnabled.value;
        if (helmChartValues.elkIntegrationEnabled) {
          this.addHelmChartValueIfSet(helmChartValues, 'logStashImage', this.project.wko.logStashImage);
          this.addHelmChartValueIfSet(helmChartValues, 'elasticSearchHost', this.project.wko.elasticSearchHost);
          this.addHelmChartValueIfSet(helmChartValues, 'elasticSearchPort', this.project.wko.elasticSearchPort);
        }
      }

      this.addHelmChartValueIfSet(helmChartValues, 'javaLoggingLevel', this.project.wko.javaLoggingLevel);
      this.addHelmChartValueIfSet(helmChartValues, 'javaLoggingFileCount', this.project.wko.javaLoggingFileCount);

      // Prior to WKO 4.1.0, the operator Helm charts were vulnerable to Helm bug #1707 that mangles the value of
      // large integers by putting them in scientific notation.  This causes the javaLoggingFileSizeLimit to not be
      // honored.  As a workaround, always include this parameter in the Helm chart values.  The code processing this
      // collection will use --set-string for this property to ensure that it is set correctly.
      //
      helmChartValues['javaLoggingFileSizeLimit'] = this.project.wko.javaLoggingFileSizeLimit.value;

      if (this.project.wko.nodeSelector.hasValue()) {
        const nodeSelectorMap = {};
        this.project.wko.nodeSelector.value.forEach(label => {
          nodeSelectorMap[label.name] = label.value;
        });

        if (Object.keys(nodeSelectorMap).length > 0) {
          helmChartValues['nodeSelector'] = nodeSelectorMap;
        }
      }

      return helmChartValues;
    }

    addHelmChartValueIfSet(helmChartValues, chartPropertyName, modelProperty) {
      if (modelProperty.hasValue() && !this.isValueEmpty(modelProperty.value)) {
        helmChartValues[chartPropertyName] = modelProperty.value;
      }
    }

    isValueEmpty(value) {
      return value === undefined || value === null || value === '';
    }

    convertArrayToSliceSyntax(array) {
      let results = '{}';
      if (array && Array.isArray(array) && array.length > 0) {
        results = `{${array.join(',')}}`;
      }
      return results;
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-form-name';

      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);
      validationObject.addField('kubectl-helm-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.helmExecutableFilePath.value), kubectlFormConfig);

      const wkoFormConfig = validationObject.getDefaultConfigObject();
      wkoFormConfig.formName = 'wko-design-form-name';
      validationObject.addField('wko-design-wko-deploy-name-label',
        validationHelper.validateRequiredField(this.project.wko.wkoDeployName.value), wkoFormConfig);
      validationObject.addField('wko-design-k8s-namespace-label',
        validationHelper.validateRequiredField(this.project.wko.k8sNamespace.value), wkoFormConfig);
      validationObject.addField('wko-design-k8s-service-account-label',
        validationHelper.validateRequiredField(this.project.wko.k8sServiceAccount.value), wkoFormConfig);
      validationObject.addField('wko-design-version-label',
        validationHelper.validateRequiredField(this.project.wko.versionTag.value), wkoFormConfig);

      if (this.project.wko.operatorImage.hasValue()) {
        validationObject.addField('wko-design-image-tag-title',
          this.project.wko.operatorImage.validate(true), wkoFormConfig);
      }

      if (this.project.wko.operatorImagePullRequiresAuthentication.value) {
        validationObject.addField('wko-design-image-pull-secret-title',
          this.project.wko.operatorImagePullSecretName.validate(true), wkoFormConfig);
        if (!this.project.wko.operatorImagePullUseExistingSecret.value) {
          validationObject.addField('wko-design-image-registry-username-label',
            validationHelper.validateRequiredField(this.project.wko.operatorImagePullRegistryUsername.value), wkoFormConfig);
          validationObject.addField('wko-design-image-registry-email-label',
            validationHelper.validateRequiredField(this.project.wko.operatorImagePullRegistryEmailAddress.value), wkoFormConfig);
          validationObject.addField('wko-design-image-registry-password-label',
            validationHelper.validateRequiredField(this.project.wko.operatorImagePullRegistryPassword.value), wkoFormConfig);
        }
      }

      switch(this.project.wko.operatorDomainNamespaceSelectionStrategy.value) {
        case 'LabelSelector':
          validationObject.addField('wko-design-k8s-namespace-selection-selector-label',
            validationHelper.validateRequiredField(this.project.wko.operatorDomainNamespaceSelector.value), wkoFormConfig);
          break;

        case 'Regexp':
          validationObject.addField('wko-design-k8s-namespace-selection-regexp-label',
            validationHelper.validateRequiredField(this.project.wko.operatorDomainNamespaceRegex.value), wkoFormConfig);
          break;

        case 'List':
          // Allow an empty list since operator cannot handle non-existent namespaces anyway...
          //
          // If there are namespaces, make sure that they are valid Kubernetes names.
          //
          for (const namespace of this.project.wko.operatorDomainNamespacesList.value) {
            const listConfig = validationObject.getDefaultConfigObject();
            listConfig.formName = 'wko-design-form-name';
            listConfig.fieldNamePayload = { namespace: namespace };
            validationObject.addField('wko-design-k8s-namespace-selection-list-label-ns',
              validationHelper.validateK8sName(namespace, false), listConfig);
          }
          break;
      }

      if (this.project.wko.externalRestEnabled.value) {
        validationObject.addField('wko-design-external-rest-port-label',
          this.project.wko.externalRestHttpsPort.validate(false), wkoFormConfig);
        validationObject.addField('wko-design-external-rest-secret-label',
          this.project.wko.externalRestIdentitySecret.validate(false), wkoFormConfig);
      }

      if (this.project.wko.elkIntegrationEnabled.value) {
        validationObject.addField('wko-design-3rd-party-logstash-image-label',
          this.project.wko.logStashImage.validate(false), wkoFormConfig);
        validationObject.addField('wko-design-3rd-party-elastic-host-label',
          this.project.wko.elasticSearchHost.validate(false), wkoFormConfig);
        validationObject.addField('wko-design-3rd-party-elastic-port-label',
          this.project.wko.elasticSearchPort.validate(false), wkoFormConfig);
      }

      return validationObject;
    }
  }

  return WkoActionsBase;
});
