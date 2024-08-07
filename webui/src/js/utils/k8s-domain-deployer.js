/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/k8s-domain-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/k8s-domain-resource-generator', 'utils/k8s-domain-configmap-generator',
  'utils/validation-helper', 'utils/helm-helper', 'utils/aux-image-helper', 'utils/wkt-logger'],
function (K8sDomainActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, K8sDomainResourceGenerator,
  K8sDomainConfigMapGenerator, validationHelper, helmHelper, auxImageHelper, wktLogger) {
  class K8sDomainDeployer extends K8sDomainActionsBase {
    constructor() {
      super();
      this.k8sDomainResourceGenerator = new K8sDomainResourceGenerator();
      this.k8sDomainConfigMapGenerator = new K8sDomainConfigMapGenerator();
    }

    async startDeployDomain() {
      await this.executeAction(this.callDeployDomain);
    }

    async callDeployDomain(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('k8s-domain-deployer-aborted-error-title');
      const errPrefix = 'k8s-domain-deployer';
      const validatableObject = this.getValidatableObject('flow-deploy-domain-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 16.0;
      const domainUid = this.project.k8sDomain.uid.value;
      const domainNamespace = this.project.k8sDomain.kubernetesNamespace.value;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

        const kubectlExe = this.getKubectlExe();
        if (!options.skipKubectlExeValidation) {
          if (! await this.validateKubectlExe(kubectlExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-validate-helm-exe-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);
        const helmExe = this.getHelmExe();
        if (!options.skipHelmExeValidation) {
          if (! await this.validateHelmExe(helmExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // With the new WDT 4.2.0 features to discover the DefaultAuthenticator users, it is more likely that the
        // model's domainInfo:/AdminUserName value also appears in the topology:/Security/User section of the model.
        // If this happens, we want to override the Password attribute in the user's topology:/Security/User entry
        // to be the same as the domainInfo:/AdminPassword value so that when the secrets are created, we make sure
        // that the password for the user is the expected value in both secrets.  In an ideal world, the model would
        // use the same secret; however, it is too late to update the model at this point.
        //
        const adminUserName = this.project.k8sDomain.credentialsUserName.value;
        busyDialogMessage = i18n.t('k8s-domain-deployer-update-admin-user-password-in-progress', { adminUserName: adminUserName });
        dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
        const userSecretKey = this.project.wdtModel.getAdminUserTopologySecurityUserSecretKey(adminUserName);
        if (userSecretKey) {
          this.updateUserSecretPasswordField(userSecretKey);
        }

        // While technically not required, we force saving the project for Go Menu item behavior consistency.
        //
        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // Set the Kubernetes context, if needed
        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          if (! await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // Make sure that operator is already installed
        const operatorName = this.project.wko.wkoDeployName.value;
        const operatorNamespace = this.project.wko.k8sNamespace.value;
        busyDialogMessage = i18n.t('flow-checking-operator-installed-in-progress',
          {operatorName: operatorName, operatorNamespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        if (!options.skipCheckOperatorAlreadyInstalled) {
          if (! await this.checkOperatorIsInstalled(kubectlExe, kubectlOptions, operatorName, operatorNamespace, errTitle)) {
            return Promise.resolve(false);
          }
        }

        // Create the domain namespace
        busyDialogMessage = i18n.t('k8s-domain-deployer-create-ns-in-progress', {domainNamespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
        if (! await this.createKubernetesNamespace(kubectlExe, kubectlOptions, domainNamespace, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        // Determine how the operator is selecting the namespaces to monitor and take the appropriate action.
        busyDialogMessage = i18n.t('k8s-domain-deployer-update-operator-config-in-progress',
          {operatorName: operatorName, operatorNamespace: operatorNamespace, domainName: domainUid});
        dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
        const operatorNamespaceStrategy = this.project.wko.operatorDomainNamespaceSelectionStrategy.value;
        const helmChartValues = {};
        switch (operatorNamespaceStrategy) {
          case 'LabelSelector':
            const labels = [ this.project.wko.operatorDomainNamespaceSelector.value ];
            if (! await this.labelKubernetesNamespace(kubectlExe, kubectlOptions, domainNamespace, labels, errTitle, errPrefix)) {
              return Promise.resolve(false);
            }
            break;

          case 'List':
            const list = this.addDomainNamespaceToList(this.project.k8sDomain.kubernetesNamespace.value);
            helmChartValues.domainNamespaces = `{${list.join(',')}}`;
            break;

          default:
            // Should be nothing to do for Regexp or Dedicated, right?
            break;
        }

        // Prior to WKO 4.1.0, the operator Helm charts were vulnerable to Helm bug #1707 that mangles the value of
        // large integers by putting them in scientific notation.  This causes the javaLoggingFileSizeLimit to not be
        // honored.  As a workaround, always include this parameter in the Helm chart values.  The code processing this
        // collection will use --set-string for this property to ensure that it is set correctly.
        //
        helmChartValues['javaLoggingFileSizeLimit'] = this.project.wko.javaLoggingFileSizeLimit.value;

        // Run helm upgrade so that operator picks up the new namespace.
        //
        // Skip passing kubectlExe and kubectlOptions args since the installed version
        // of operator was already set.
        //
        const operatorVersion = this.project.wko.installedVersion.value;
        const helmOptions = helmHelper.getHelmOptions();
        const upgradeResults = await window.api.ipc.invoke('helm-update-wko', helmExe, operatorName,
          operatorVersion, operatorNamespace, helmChartValues, helmOptions);
        if (!upgradeResults.isSuccess) {
          const errMessage = i18n.t('k8s-domain-deployer-add-domain-error-message',
            {
              domainNamespace: domainNamespace,
              operatorName: operatorName,
              operatorNamespace: operatorNamespace,
              error: upgradeResults.reason
            });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        // Create the image pull secret, if needed.
        if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value &&
          !this.project.k8sDomain.imageRegistryUseExistingPullSecret.value) {
          const secret = this.project.k8sDomain.imageRegistryPullSecretName.value;
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-image-pull-secret-in-progress',
            {domainNamespace: domainNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 8 / totalSteps);
          const secretData = {
            server: this.project.image.internal.imageRegistryAddress.value,
            username: this.project.k8sDomain.imageRegistryPullUser.value,
            email: this.project.k8sDomain.imageRegistryPullEmail.value,
            password: this.project.k8sDomain.imageRegistryPullPassword.value
          };
          const createResult = await this.createPullSecret(kubectlExe, kubectlOptions, domainNamespace, secret,
            secretData, errTitle, errPrefix);
          if (!createResult) {
            return Promise.resolve(false);
          }
        }

        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value &&
          !this.project.k8sDomain.auxImageRegistryUseExistingPullSecret.value) {
          const secret = this.project.k8sDomain.auxImageRegistryPullSecretName.value;
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-image-pull-secret-in-progress',
            {domainNamespace: domainNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 9 / totalSteps);
          const secretData = {
            server: this.project.image.internal.auxImageRegistryAddress.value,
            username: this.project.k8sDomain.auxImageRegistryPullUser.value,
            email: this.project.k8sDomain.auxImageRegistryPullEmail.value,
            password: this.project.k8sDomain.auxImageRegistryPullPassword.value
          };
          const createResult = await this.createPullSecret(kubectlExe, kubectlOptions, domainNamespace, secret,
            secretData, errTitle, errPrefix);
          if (!createResult) {
            return Promise.resolve(false);
          }
        }

        // Create the MII runtime encryption secret or OPSS wallet password secret, if needed.
        if (this.project.settings.targetDomainLocation.value === 'mii') {
          const secret = this.project.k8sDomain.runtimeSecretName.value;
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-runtime-secret-in-progress',
            {domainNamespace: domainNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
          const secretData = {
            password: this.project.k8sDomain.runtimeSecretValue.value
          };
          const createResult = await this.createGenericSecret(kubectlExe, kubectlOptions, domainNamespace, secret,
            secretData, errTitle, 'k8s-domain-deployer-create-runtime-secret-error-message');
          if (!createResult) {
            return Promise.resolve(false);
          }
        } else if (auxImageHelper.supportsDomainCreationImages() && auxImageHelper.domainUsesJRF()) {
          const secret = this.project.k8sDomain.walletPasswordSecretName.value;
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-wallet-password-secret-in-progress',
            {domainNamespace: domainNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
          const secretData = {
            walletPassword: this.project.k8sDomain.walletPassword.value
          };
          const createResult = await this.createGenericSecret(kubectlExe, kubectlOptions, domainNamespace, secret,
            secretData, errTitle, 'k8s-domain-deployer-create-wallet-password-secret-error-message');
          if (!createResult) {
            return Promise.resolve(false);
          }
        }

        // Create the WebLogic Credential secret
        const wlSecretName = this.project.k8sDomain.credentialsSecretName.value;
        busyDialogMessage = i18n.t('k8s-domain-deployer-create-wl-secret-in-progress',
          {secretName: wlSecretName, domainName: domainUid, namespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 11 / totalSteps);
        const wlSecretData = {
          username: this.project.k8sDomain.credentialsUserName.value,
          password: this.project.k8sDomain.credentialsPassword.value
        };
        const wlsSecretResult = await this.createGenericSecret(kubectlExe, kubectlOptions, domainNamespace, wlSecretName,
          wlSecretData, errTitle, 'k8s-domain-deployer-create-wl-secret-failed-error-message');
        if (!wlsSecretResult) {
          return Promise.resolve(false);
        }

        // Create the WDT Encryption secret, if needed.
        const wdtEncryptionSecretName = this.project.k8sDomain.wdtEncryptionSecretName();
        if (wdtEncryptionSecretName) {
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-wdt-secret-in-progress',
            {secretName: wdtEncryptionSecretName, domainName: domainUid, namespace: domainNamespace});
          dialogHelper.updateBusyDialog(busyDialogMessage, 12 / totalSteps);
          const wdtEncryptionSecretData = {
            passphrase: this.project.wdtModel.wdtPassphrase.value
          };
          const wdtEncryptionSecretResult =
            await this.createGenericSecret(kubectlExe, kubectlOptions, domainNamespace, wdtEncryptionSecretName,
              wdtEncryptionSecretData, errTitle,'k8s-domain-deployer-create-wdt-secret-failed-error-message');
          if (!wdtEncryptionSecretResult) {
            return Promise.resolve(false);
          }
        }

        // Create Other Secrets, if needed
        busyDialogMessage = i18n.t('k8s-domain-deployer-create-secrets-in-progress',
          {domainName: domainUid, namespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 13 / totalSteps);
        if (auxImageHelper.projectHasModel() || auxImageHelper.projectUsingExternalImageContainingModel()) {
          const secrets = this.project.k8sDomain.secrets.value;
          if (Array.isArray(secrets) && secrets.length > 0) {
            for (const secret of secrets) {
              const secretName = secret.name;
              if (Array.isArray(secret.keys) && secret.keys.length > 0) {
                const secretData = {};
                for (const secretKey of secret.keys) {
                  secretData[secretKey.key] = secretKey.value;
                }
                wktLogger.debug('Creating secret %s', secretName);

                const domainSecretResult = await this.createGenericSecret(kubectlExe, kubectlOptions, domainNamespace,
                  secretName, secretData, errTitle, 'k8s-domain-deployer-create-secret-failed-error-message');
                if (!domainSecretResult) {
                  return Promise.resolve(false);
                }
              } else {
                wktLogger.warning('Secret %s did not contain any data...skipping', secretName);
              }
            }
          }
        }

        // Create ConfigMap, if needed
        busyDialogMessage = i18n.t('k8s-domain-deployer-create-config-map-in-progress',
          {domainName: domainUid, domainNamespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 14 / totalSteps);
        if (this.k8sDomainConfigMapGenerator.shouldCreateConfigMap()) {
          const configMapData = this.k8sDomainConfigMapGenerator.generate().join('\n');
          wktLogger.debug(configMapData);
          const mapResults = await (window.api.ipc.invoke('k8s-apply', kubectlExe, configMapData, kubectlOptions));
          if (!mapResults.isSuccess) {
            const configMapName = this.project.k8sDomain.modelConfigMapName.value;
            const errMessage = i18n.t('k8s-domain-deployer-create-config-map-failed-error-message',
              {configMapName: configMapName, domainNamespace: domainNamespace, error: mapResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // Deploy domain
        busyDialogMessage = i18n.t('k8s-domain-deployer-deploy-in-progress',
          {domainName: domainUid, domainNamespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 15 / totalSteps);
        const domainSpecData = new K8sDomainResourceGenerator(this.project.wko.installedVersion.value).generate().join('\n');
        const domainResult = await (window.api.ipc.invoke('k8s-apply', kubectlExe, domainSpecData, kubectlOptions));
        dialogHelper.closeBusyDialog();
        if (domainResult.isSuccess) {
          const title = i18n.t('k8s-domain-deployer-deploy-complete-title');
          const message = i18n.t('k8s-domain-deployer-deploy-complete-message',
            {domainName: domainUid, domainNamespace: domainNamespace});
          await window.api.ipc.invoke('show-info-message', title, message);
          return Promise.resolve(true);
        } else {
          errTitle = i18n.t('k8s-domain-deployer-deploy-failed-title');
          const errMessage = i18n.t('k8s-domain-deployer-deploy-failed-error-message',
            {domainName: domainUid, domainNamespace: domainNamespace, error: domainResult.reason});
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

    addDomainNamespaceToList(domainNamespace) {
      const domainNamespaceList = this.project.wko.operatorDomainNamespacesList.value;
      if (!domainNamespaceList.includes(domainNamespace)) {
        domainNamespaceList.push(domainNamespace);
        this.project.wko.operatorDomainNamespacesList.value = domainNamespaceList;
      }
      return this.project.wko.operatorDomainNamespacesList.value;
    }

    getValidatableObject(flowNameKey) {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const domainFormConfig = validationObject.getDefaultConfigObject();
      domainFormConfig.formName = 'domain-design-form-name';

      validationObject.addField('domain-design-uid-label', this.project.k8sDomain.uid.validate(true), domainFormConfig);
      validationObject.addField('domain-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), domainFormConfig);
      validationObject.addField('domain-design-wko-installed-version-label',
        validationHelper.validateRequiredField(this.project.wko.installedVersion.value), domainFormConfig);

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

      switch (this.project.wko.operatorDomainNamespaceSelectionStrategy.value) {
        case 'LabelSelector':
          validationObject.addField('wko-design-k8s-namespace-selection-selector-label',
            validationHelper.validateRequiredField(this.project.wko.operatorDomainNamespaceSelector.value),
            wkoFormConfig);
          break;

        case 'List':
        default:
          // List - domain namespace, operator name and operator namespace already added...nothing else to validate
          break;
      }

      validationObject.addField('domain-design-image-tag-label',
        this.project.image.imageTag.validate(true), domainFormConfig);

      if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value) {
        validationObject.addField('domain-design-image-registry-pull-secret-name-label',
          this.project.k8sDomain.imageRegistryPullSecretName.validate(true), domainFormConfig);

        if (!this.project.k8sDomain.imageRegistryUseExistingPullSecret.value) {
          validationObject.addField('domain-design-image-registry-address-label',
            validationHelper.validateHostName(this.project.image.internal.imageRegistryAddress.value, false),
            domainFormConfig);
          validationObject.addField('domain-design-image-registry-pull-username-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.imageRegistryPullUser.value),
            domainFormConfig);
          validationObject.addField('domain-design-image-registry-pull-email-label',
            this.project.k8sDomain.imageRegistryPullEmail.validate(true),
            domainFormConfig);
          validationObject.addField('domain-design-image-registry-pull-password-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.imageRegistryPullPassword.value),
            domainFormConfig);
        }
      }

      if (this.project.settings.targetDomainLocation.value === 'mii' && this.project.image.useAuxImage.value) {
        validationObject.addField('domain-design-aux-image-tag-label',
          this.project.image.auxImageTag.validate(true), domainFormConfig);

        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value) {
          validationObject.addField('domain-design-aux-image-registry-pull-secret-name-label',
            this.project.k8sDomain.auxImageRegistryPullSecretName.validate(true), domainFormConfig);

          if (!this.project.k8sDomain.auxImageRegistryUseExistingPullSecret.value) {
            validationObject.addField('domain-design-aux-image-registry-address-label',
              validationHelper.validateHostName(this.project.image.internal.auxImageRegistryAddress.value, false),
              domainFormConfig);
            validationObject.addField('domain-design-aux-image-registry-pull-username-label',
              validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullUser.value),
              domainFormConfig);
            validationObject.addField('domain-design-aux-image-registry-pull-email-label',
              this.project.k8sDomain.auxImageRegistryPullEmail.validate(true),
              domainFormConfig);
            validationObject.addField('domain-design-aux-image-registry-pull-password-label',
              validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullPassword.value),
              domainFormConfig);
          }
        }
      } else if (auxImageHelper.supportsDomainCreationImages() && this.project.image.useAuxImage.value) {
        validationObject.addField('domain-design-domain-creation-image-tag-label',
          this.project.image.auxImageTag.validate(true), domainFormConfig);

        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value) {
          validationObject.addField('domain-design-domain-creation-image-registry-pull-secret-name-label',
            this.project.k8sDomain.auxImageRegistryPullSecretName.validate(true), domainFormConfig);

          if (!this.project.k8sDomain.auxImageRegistryUseExistingPullSecret.value) {
            validationObject.addField('domain-design-domain-creation-image-registry-address-label',
              validationHelper.validateHostName(this.project.image.internal.auxImageRegistryAddress.value, false),
              domainFormConfig);
            validationObject.addField('domain-design-domain-creation-image-registry-pull-username-label',
              validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullUser.value),
              domainFormConfig);
            validationObject.addField('domain-design-domain-creation-image-registry-pull-email-label',
              this.project.k8sDomain.auxImageRegistryPullEmail.validate(true),
              domainFormConfig);
            validationObject.addField('domain-design-domain-creation-image-registry-pull-password-label',
              validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullPassword.value),
              domainFormConfig);
          }

          if (this.project.k8sDomain.createPvc.value) {
            if (this.project.k8sDomain.createPv.value) {
              const pvType = this.project.k8sDomain.pvType.value;
              if (pvType === 'nfs') {
                validationObject.addField('domain-design-domain-creation-image-pv-nfs-server-label',
                  validationHelper.validateRequiredField(this.project.k8sDomain.pvNfsServer.value),
                  domainFormConfig);
                validationObject.addField('domain-design-domain-creation-image-pv-nfs-path-label',
                  validationHelper.validateRequiredField(this.project.k8sDomain.pvPath.value),
                  domainFormConfig);
              } else if (pvType === 'hostPath') {
                validationObject.addField('domain-design-domain-creation-image-pv-host-path-label',
                  validationHelper.validateRequiredField(this.project.k8sDomain.pvPath.value),
                  domainFormConfig);
              }
            }
          }
        }
      }

      if (this.project.settings.targetDomainLocation.value === 'mii') {
        validationObject.addField('domain-design-encryption-secret-label',
          this.project.k8sDomain.runtimeSecretName.validate(true), domainFormConfig);
        validationObject.addField('domain-design-encryption-value-label',
          validationHelper.validateRequiredField(this.project.k8sDomain.runtimeSecretValue.value), domainFormConfig);
      } else if (auxImageHelper.supportsDomainCreationImages() && auxImageHelper.domainUsesJRF()) {
        validationObject.addField('domain-design-domain-creation-image-wallet-password-label',
          validationHelper.validateRequiredField(this.project.k8sDomain.walletPassword.value),
          domainFormConfig);
      }

      validationObject.addField('domain-design-wls-credential-label',
        this.project.k8sDomain.credentialsSecretName.validate(true), domainFormConfig);
      validationObject.addField('domain-design-wls-credential-username-label',
        validationHelper.validateRequiredField(this.project.k8sDomain.credentialsUserName.value), domainFormConfig);
      validationObject.addField('domain-design-wls-credential-password-label',
        validationHelper.validateRequiredField(this.project.k8sDomain.credentialsPassword.value), domainFormConfig);

      if (Array.isArray(this.project.k8sDomain.secrets.value) && this.project.k8sDomain.secrets.value.length > 0) {
        for (const secret of this.project.k8sDomain.secrets.value) {
          const secretConfig = validationObject.getDefaultConfigObject();
          secretConfig.formName = 'domain-design-form-name';
          secretConfig.fieldNameIsKey = false;
          const nameFieldName = i18n.t('domain-design-secret-name-field-name');
          validationObject.addField(nameFieldName, validationHelper.validateK8sName(secret.name, true), secretConfig);

          for (const field of secret.keys) {
            const fieldNameName = i18n.t('domain-design-secret-key-name', { secretName: secret.name });
            const fieldValueName = i18n.t('domain-design-secret-value-name', { secretName: secret.name, fieldName: field.key });

            validationObject.addField(fieldNameName, validationHelper.validateRequiredField(field.key), secretConfig);
            validationObject.addField(fieldValueName, validationHelper.validateRequiredField(field.value), secretConfig);
          }
        }
      }

      if (this.project.settings.targetDomainLocation.value === 'mii' ||
        (auxImageHelper.supportsDomainCreationImages() && this.project.image.useAuxImage.value)) {
        validationObject.addField('domain-design-configmap-label',
          this.project.k8sDomain.modelConfigMapName.validate(true), domainFormConfig);
      }

      return validationObject;
    }

    async checkOperatorIsInstalled(kubectlExe, kubectlOptions, operatorName, operatorNamespace, errTitle) {
      try {
        const isInstalledResults =
          await window.api.ipc.invoke('is-wko-installed', kubectlExe, operatorNamespace, kubectlOptions);
        if (!isInstalledResults.isInstalled) {
          let errMessage;
          if (isInstalledResults.reason) {
            // error from backend
            errMessage = i18n.t('k8s-domain-deployer-operator-installed-check-failed-error-message',
              {operatorName: operatorName, operatorNamespace: operatorNamespace, error: isInstalledResults.reason});
            wktLogger.error(errMessage);
          } else {
            errMessage = i18n.t('k8s-domain-deployer-operator-not-installed-error-message',
              {
                operatorName: operatorName,
                operatorNamespace: operatorNamespace
              });
          }
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve(true);
    }

    updateUserSecretPasswordField(userSecretKey) {
      const originalSecret = this.project.k8sDomain.secrets.observable().find(secret => secret.name === userSecretKey);
      if (originalSecret) {
        const clonedSecret = JSON.parse(JSON.stringify(originalSecret));
        for (const key of clonedSecret.keys) {
          if (key.key === 'password') {
            key.value = this.project.k8sDomain.credentialsPassword.value;
            break;
          }
        }
        this.project.k8sDomain.secrets.observable.replace(originalSecret, clonedSecret);
      }
    }
  }

  return new K8sDomainDeployer();
});
