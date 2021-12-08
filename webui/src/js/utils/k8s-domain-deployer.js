/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'models/wkt-console', 'utils/k8s-helper', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/k8s-domain-resource-generator', 'utils/k8s-domain-configmap-generator',
  'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function (project, wktConsole, k8sHelper, i18n, projectIo, dialogHelper, K8sDomainResourceGenerator,
  K8sDomainConfigMapGenerator, validationHelper, helmHelper, wktLogger) {
  function K8sDomainDeployer() {
    this.project = project;
    this.k8sDomainResourceGenerator = new K8sDomainResourceGenerator();
    this.k8sDomainConfigMapGenerator = new K8sDomainConfigMapGenerator();

    this.startDeployDomain = async () => {
      return this.callDeployDomain();
    };

    this.callDeployDomain = async (options) => {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('k8s-domain-deployer-aborted-error-title');
      const validatableObject = this.getValidatableObject('flow-deploy-domain-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 14.0;
      const domainUid = this.project.k8sDomain.uid.value;
      const domainNamespace = this.project.k8sDomain.kubernetesNamespace.value;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

        const kubectlExe = k8sHelper.getKubectlExe();
        if (!options.skipKubectlExeValidation) {
          const exeResults = await window.api.ipc.invoke('validate-kubectl-exe', kubectlExe);
          if (!exeResults.isValid) {
            const errMessage = i18n.t('k8s-domain-deployer-kubectl-exe-invalid-error-message', {error: exeResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        busyDialogMessage = i18n.t('flow-validate-helm-exe-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);
        const helmExe = k8sHelper.getHelmExe();
        if (!options.skipHelmExeValidation) {
          const exeResults = await window.api.ipc.invoke('validate-helm-exe', helmExe);
          if (!exeResults.isValid) {
            const errMessage = i18n.t('k8s-domain-deployer-helm-exe-invalid-error-message', {error: exeResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // While technically not required, we force saving the project for Go Menu item behavior consistency.
        //
        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);
        if (!options.skipProjectSave) {
          const saveResult = await projectIo.saveProject();
          if (!saveResult.saved) {
            const errMessage = `${i18n.t('k8s-domain-deployer-project-not-saved-error-prefix')}: ${saveResult.reason}`;
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // Set the Kubernetes context, if needed
        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);
        const kubectlContext = k8sHelper.getKubectlContext();
        const kubectlOptions = k8sHelper.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          if (kubectlContext) {
            const setResults =
              await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
            if (!setResults.isSuccess) {
              const errMessage = i18n.t('k8s-domain-deployer-set-context-error-message', {error: setResults.reason});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
          }
        }

        // Make sure that operator is already installed
        const operatorName = this.project.wko.wkoDeployName.value;
        const operatorNamespace = this.project.wko.k8sNamespace.value;
        busyDialogMessage = i18n.t('flow-checking-operator-installed-in-progress',
          {operatorName: operatorName, Namespace: operatorNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);
        if (!options.skipCheckOperatorAlreadyInstalled) {
          const isInstalledResults =
            await window.api.ipc.invoke('is-wko-installed', kubectlExe, operatorName, operatorNamespace, kubectlOptions);
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
        }

        // Create the domain namespace
        busyDialogMessage = i18n.t('k8s-domain-deployer-create-ns-in-progress', {domainNamespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 5 / totalSteps);
        const createNsResults = await window.api.ipc.invoke('k8s-create-namespace', kubectlExe, domainNamespace, kubectlOptions);
        if (!createNsResults.isSuccess) {
          const errMessage = i18n.t('k8s-domain-deployer-create-ns-error-message',
            {domainNamespace: domainNamespace, error: createNsResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        // Determine how the operator is selecting the namespaces to monitor and take the appropriate action.
        busyDialogMessage = i18n.t('k8s-domain-deployer-update-operator-config-in-progress',
          {operatorName: operatorName, operatorNamespace: operatorNamespace, domainName: domainUid});
        dialogHelper.updateBusyDialog(busyDialogMessage, 6 / totalSteps);
        const operatorNamespaceStrategy = this.project.wko.operatorDomainNamespaceSelectionStrategy.value;
        const helmChartValues = {};
        switch (operatorNamespaceStrategy) {
          case 'LabelSelector':
            const label = this.project.wko.operatorDomainNamespaceSelector.value;
            const labelResults =
              await window.api.ipc.invoke('k8s-label-namespace', kubectlExe, domainNamespace, label, kubectlOptions);
            if (!labelResults.isSuccess) {
              const errMessage = i18n.t('k8s-domain-deployer-label-ns-error-message',
                {label: label, domainNamespace: domainNamespace, error: labelResults.reason});
              dialogHelper.closeBusyDialog();
              await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
              return Promise.resolve(false);
            }
            break;

          case 'List':
            const list = this.project.wko.operatorDomainNamespacesList.value;
            this.addDomainNamespaceToList(list, this.project.k8sDomain.kubernetesNamespace.value);
            helmChartValues.domainNamespaces = `{${list.join(',')}}`;
            break;

          default:
            // Should be nothing to do for Regexp or Dedicated, right?
            break;
        }

        // Run helm upgrade so that operator picks up the new namespace.
        const helmOptions = helmHelper.getHelmOptions();
        const upgradeResults =
          await window.api.ipc.invoke('helm-upgrade-wko', helmExe, operatorName, operatorNamespace, helmChartValues, helmOptions);
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
        if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value && !this.project.k8sDomain.imageRegistryUseExistingPullSecret.value) {
          const secret = this.project.k8sDomain.imageRegistryPullSecretName.value;
          const secretData = {
            server: this.project.image.internal.imageRegistryAddress.value,
            username: this.project.k8sDomain.imageRegistryPullUser.value,
            email: this.project.k8sDomain.imageRegistryPullEmail.value,
            password: this.project.k8sDomain.imageRegistryPullPassword.value
          };
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-image-pull-secret-in-progress',
            {domainNamespace: domainNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 7 / totalSteps);
          const createResults =
            await window.api.ipc.invoke('k8s-create-pull-secret', kubectlExe, domainNamespace, secret, secretData, kubectlOptions);
          if (!createResults.isSuccess) {
            const errMessage = i18n.t('k8s-domain-deployer-create-image-pull-secret-error-message',
              {domainNamespace: domainNamespace, secretName: secret, error: createResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value && !this.project.k8sDomain.auxImageRegistryUseExistingPullSecret.value) {
          const secret = this.project.k8sDomain.auxImageRegistryPullSecretName.value;
          const secretData = {
            server: this.project.image.internal.auxImageRegistryAddress.value,
            username: this.project.k8sDomain.auxImageRegistryPullUser.value,
            email: this.project.k8sDomain.auxImageRegistryPullEmail.value,
            password: this.project.k8sDomain.auxImageRegistryPullPassword.value
          };
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-image-pull-secret-in-progress',
            {domainNamespace: domainNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 8 / totalSteps);
          const createResults =
            await window.api.ipc.invoke('k8s-create-pull-secret', kubectlExe, domainNamespace, secret, secretData, kubectlOptions);
          if (!createResults.isSuccess) {
            const errMessage = i18n.t('k8s-domain-deployer-create-image-pull-secret-error-message',
              {domainNamespace: domainNamespace, secretName: secret, error: createResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // Create the MII runtime encryption secret, if needed.
        if (this.project.settings.targetDomainLocation.value === 'mii') {
          const secret = this.project.k8sDomain.runtimeSecretName.value;
          const secretData = {
            password: this.project.k8sDomain.runtimeSecretValue.value
          };
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-runtime-secret-in-progress',
            {domainNamespace: domainNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 9 / totalSteps);
          const createResults =
            await window.api.ipc.invoke('k8s-create-generic-secret', kubectlExe, domainNamespace, secret, secretData, kubectlOptions);
          if (!createResults.isSuccess) {
            const errMessage = i18n.t('k8s-domain-deployer-create-runtime-secret-error-message',
              {domainNamespace: domainNamespace, secretName: secret, error: createResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // Create the WebLogic Credential secret
        const wlSecretName = this.project.k8sDomain.credentialsSecretName.value;
        busyDialogMessage = i18n.t('k8s-domain-deployer-create-wl-secret-in-progress',
          {secretName: wlSecretName, domainName: domainUid, namespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
        const wlSecretData = {
          username: this.project.k8sDomain.credentialsUserName.value,
          password: this.project.k8sDomain.credentialsPassword.value
        };
        const secretResults =
          await window.api.ipc.invoke('k8s-create-generic-secret', kubectlExe, domainNamespace, wlSecretName, wlSecretData, kubectlOptions);
        if (!secretResults.isSuccess) {
          const errMessage = i18n.t('k8s-domain-deployer-create-wl-secret-failed-error-message',
            {secretName: wlSecretName, domainName: domainUid, namespace: domainNamespace, error: secretResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }

        // Create Secrets, if needed
        if (this.project.settings.targetDomainLocation.value === 'mii') {
          busyDialogMessage = i18n.t('k8s-domain-deployer-create-secrets-in-progress',
            {domainName: domainUid, namespace: domainNamespace});
          dialogHelper.updateBusyDialog(busyDialogMessage, 11 / totalSteps);
          const secrets = this.project.k8sDomain.secrets.value;
          if (secrets && secrets.length > 0) {
            for (const secret of secrets) {
              let secretName = '';
              const secretData = {};
              for (const [key, value] of Object.entries(secret)) {
                if (key === 'name') {
                  secretName = value;
                } else if (key !== 'uid') {
                  // skip artificial uid field...
                  secretData[key] = value;
                }
              }
              wktLogger.debug('Creating secret %s', secretName);

              const createSecretResults =
                await window.api.ipc.invoke('k8s-create-generic-secret', kubectlExe, domainNamespace, secretName, secretData, kubectlOptions);
              if (!createSecretResults.isSuccess) {
                const errMessage = i18n.t('k8s-domain-deployer-create-secret-failed-error-message',
                  {secretName: secretName, namespace: domainNamespace, error: createSecretResults.reason});
                dialogHelper.closeBusyDialog();
                await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
                return Promise.resolve(false);
              }
            }
          }
        }

        // Create ConfigMap, if needed
        if (this.project.settings.targetDomainLocation.value === 'mii') {
          if (!this.project.k8sDomain.configMapIsEmpty()) {
            const configMapData = this.k8sDomainConfigMapGenerator.generate().join('\n');
            wktLogger.debug(configMapData);
            busyDialogMessage = i18n.t('k8s-domain-deployer-create-config-map-in-progress',
              {domainName: domainUid, domainNamespace: domainNamespace});
            dialogHelper.updateBusyDialog(busyDialogMessage, 12 / totalSteps);
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
        }

        // Deploy domain
        busyDialogMessage = i18n.t('k8s-domain-deployer-deploy-in-progress',
          {domainName: domainUid, domainNamespace: domainNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 13 / totalSteps);
        const domainSpecData = this.k8sDomainResourceGenerator.generate().join('\n');
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
    };

    this.addDomainNamespaceToList = (domainNamespaceList, domainNamespace) => {
      if (!domainNamespaceList.includes(domainNamespace)) {
        domainNamespaceList.push(domainNamespace);
      }
    };

    this.getValidatableObject = (flowNameKey) => {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const domainFormConfig = validationObject.getDefaultConfigObject();
      domainFormConfig.formName = 'domain-design-form-name';

      validationObject.addField('domain-design-uid-label', this.project.k8sDomain.uid.validate(true), domainFormConfig);
      validationObject.addField('domain-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), domainFormConfig);

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
      }

      if (this.project.settings.targetDomainLocation.value === 'mii') {
        validationObject.addField('domain-design-encryption-secret-label',
          this.project.k8sDomain.runtimeSecretName.validate(true), domainFormConfig);
        validationObject.addField('domain-design-encryption-value-label',
          validationHelper.validateRequiredField(this.project.k8sDomain.runtimeSecretValue.value), domainFormConfig);
      }
      validationObject.addField('domain-design-wls-credential-label',
        this.project.k8sDomain.credentialsSecretName.validate(true), domainFormConfig);
      validationObject.addField('domain-design-wls-credential-username-label',
        validationHelper.validateRequiredField(this.project.k8sDomain.credentialsUserName.value), domainFormConfig);
      validationObject.addField('domain-design-wls-credential-password-label',
        validationHelper.validateRequiredField(this.project.k8sDomain.credentialsPassword.value), domainFormConfig);

      if (this.project.k8sDomain.secrets.value && this.project.k8sDomain.secrets.value.length > 0) {
        let i = 0;
        for (const secret of this.project.k8sDomain.secrets.value) {
          i++;
          const secretConfig = validationObject.getDefaultConfigObject();
          secretConfig.fieldNameIsKey = false;
          const nameFieldName = i18n.t('domain-design-secrets-cell-field-name',
            {position: i, uid: secret.uid, name: i18n.t('domain-design-secretname-header')});
          const userFieldName = i18n.t('domain-design-secrets-cell-field-name',
            {position: i, uid: secret.uid, name: i18n.t('domain-design-username-header')});
          const passFieldName = i18n.t('domain-design-secrets-cell-field-name',
            {position: i, uid: secret.uid, name: i18n.t('domain-design-password-header')});

          validationObject.addField(nameFieldName, validationHelper.validateK8sName(secret.name, true), secretConfig);
          validationObject.addField(userFieldName, validationHelper.validateRequiredField(secret.username), secretConfig);
          validationObject.addField(passFieldName, validationHelper.validateRequiredField(secret.password), secretConfig);
        }
      }

      if (!this.project.k8sDomain.configMapIsEmpty()) {
        validationObject.addField('domain-design-configmap-label',
          this.project.k8sDomain.modelConfigMapName.validate(true), domainFormConfig);
        // The fields in the table should not require validation since no empty override values should be in this computed table.
      }

      return validationObject;
    };

    this.getDomainStatusValidatableObject = (flowNameKey) => {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);

      validationObject.addField('domain-design-uid-label', this.project.k8sDomain.uid.validate(true));
      validationObject.addField('domain-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true));

      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-title';
      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);
      validationObject.addField('kubectl-helm-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.helmExecutableFilePath.value), kubectlFormConfig);

      const settingsFormConfig = validationObject.getDefaultConfigObject();
      settingsFormConfig.formName = 'project-settings-title';
      validationObject.addField('image-design-image-tag-label',
        this.project.image.imageTag.validate(true), settingsFormConfig);

      return validationObject;
    };


    this.getDomainStatus = async () => {

      const kubectlExe = k8sHelper.getKubectlExe();
      const kubectlOptions = k8sHelper.getKubectlOptions();
      const kubectlContext = k8sHelper.getKubectlContext();
      let operatorMajorVersion = '';

      let errTitle = i18n.t('domain-design-get-domain-status-failed-title-message');
      const validatableObject = this.getDomainStatusValidatableObject('flow-get-domain-status-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 4.0;
      let busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
      dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
      dialogHelper.updateBusyDialog(busyDialogMessage, 0 / totalSteps);

      if (kubectlContext) {
        const setResults = await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
        if (!setResults.isSuccess) {
          const errMessage = i18n.t('domain-design-get-domain-status-set-context-error-message', {error: setResults.reason});
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        }
      }

      busyDialogMessage = i18n.t('flow-validate-k8s-namespace-in-progress',
        {namespace: this.project.k8sDomain.kubernetesNamespace.value});
      dialogHelper.updateBusyDialog(busyDialogMessage, 1 / totalSteps);

      let validationResults = await window.api.ipc.invoke('validate-k8s-namespaces-exist', kubectlExe,
        kubectlOptions, [this.project.k8sDomain.kubernetesNamespace.value]);

      if (!validationResults.isSuccess) {
        const errMessage = i18n.t('k8s-domain-validate-ns-sys-error-message', {
          namespace: this.project.k8sDomain.kubernetesNamespace.value,
          error: validationResults.reason
        });
        dialogHelper.closeBusyDialog();
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      } else if (!validationResults.isValid) {
        const errMessage = i18n.t('k8s-domain-validate-ns-error-message', {
          namespace: this.project.k8sDomain.kubernetesNamespace.value,
          error: validationResults.reason
        });
        dialogHelper.closeBusyDialog();
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      busyDialogMessage = i18n.t('flow-validate-k8s-domain-in-progress', {domain: this.project.k8sDomain.uid.value});
      dialogHelper.updateBusyDialog(busyDialogMessage, 2 / totalSteps);

      validationResults = await window.api.ipc.invoke('validate-wko-domain-exist', kubectlExe,
        kubectlOptions, this.project.k8sDomain.uid.value, this.project.k8sDomain.kubernetesNamespace.value);
      if (!validationResults.isSuccess) {
        const errMessage = i18n.t('k8s-domain-validate-domain-sys-error-message', {
          domain: this.project.k8sDomain.uid.value,
          error: validationResults.reason
        });
        dialogHelper.closeBusyDialog();
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      } else if (!validationResults.isValid) {
        const errMessage = i18n.t('k8s-domain-validate-domain-error-message', {
          domain: this.project.k8sDomain.uid.value,
          error: validationResults.reason
        });
        dialogHelper.closeBusyDialog();
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      busyDialogMessage = i18n.t('flow-getting-k8s-domain-status-in-progress', {domain: this.project.k8sDomain.uid.value});
      dialogHelper.updateBusyDialog(busyDialogMessage, 3 / totalSteps);

      const domainStatusResult = await window.api.ipc.invoke('k8s-get-wko-domain-status', kubectlExe, this.project.k8sDomain.uid.value,
        this.project.k8sDomain.kubernetesNamespace.value, kubectlOptions);
      if (!domainStatusResult.isSuccess) {
        const errMessage = i18n.t('domain-design-get-domain-status-message', {error: domainStatusResult.reason});
        dialogHelper.closeBusyDialog();
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve(false);
      }

      busyDialogMessage = i18n.t('flow-checking-operator-version-in-progress');
      dialogHelper.updateBusyDialog(busyDialogMessage, 4 / totalSteps);

      const operatorVersionResult = await window.api.ipc.invoke('k8s-get-operator-version-from-dm', kubectlExe,
        this.project.k8sDomain.kubernetesNamespace.value, kubectlOptions);
      if (operatorVersionResult.isSuccess) {
        operatorMajorVersion = operatorVersionResult.operatorVersion.split('.')[0];
      }

      dialogHelper.closeBusyDialog();

      let wkoDomainStatus = domainStatusResult.domainStatus;
      if (typeof wkoDomainStatus === 'undefined') {
        wkoDomainStatus = {};
      }
      const results = this.setDomainStatus(wkoDomainStatus, operatorMajorVersion);
      results['domainStatus'] = wkoDomainStatus;
      const options = {domainStatus: results.domainStatus, domainOverallStatus: results.domainOverallStatus};
      dialogHelper.openDialog('domain-status-dialog', options);

      return Promise.resolve(true);

    };

    this.setDomainStatus = (wkoDomainStatus, operatorMajorVersion) => {

      const status = wkoDomainStatus.status;
      let result = {isSuccess: true, domainOverallStatus: 'Unknown'};

      if (typeof status !== 'undefined' && 'conditions' in status && status['conditions'].length > 0) {
        const conditions = status['conditions'];
        // default status
        result['domainOverallStatus'] = i18n.t('domain-design-domain-status-unknown');
        conditions.sort((a, b) => {
          if (a.lastTransitionTime < b.lastTransitionTime) {
            return 1;
          }
          if (a.lastTransitionTime > b.lastTransitionTime) {
            return -1;
          }
          return 0;
        });
        
        if (operatorMajorVersion < 4) {
          const hasErrors = this.hasErrorConditions(conditions);

          const latestCondition = conditions[0];

          if (hasErrors.error) {
            //  There seems to be a problem in the operator where the latest condition is progressing but
            // there is an error previously but
            result['domainOverallStatus'] = i18n.t('domain-design-domain-status-failed',
              {reason: hasErrors.reason});
          } else if (latestCondition.type === 'Failed') {
            result['domainOverallStatus'] = i18n.t('domain-design-domain-status-failed',
              {reason: latestCondition.reason});
          } else if (latestCondition.type === 'Progressing') {
            // Progressing maybe the domain is coming up, maybe the introspector is running
            result['domainOverallStatus'] = i18n.t('domain-design-domain-status-progressing',
              {reason: latestCondition.reason});
          } else if (latestCondition.type === 'Available') {

            result['domainOverallStatus'] = 'Progressing';
            if (status['clusters'].length > 0) {
              const clusters = status['clusters'];
              let ready = true;
              clusters.forEach((cluster) => {
                if (Number(cluster['replicasGoal']) !== Number(cluster['readyReplicas'])) {
                  ready = false;
                }
              });

              if (ready) {
                result['domainOverallStatus'] = i18n.t('domain-design-domain-status-complete');
              } else {
                result['domainOverallStatus'] = i18n.t('domain-design-domain-status-available');
              }
            } else {
              // remain in progressing
            }
          }

        } else {
          ///
          const hasErrors = this.hasErrorConditions(conditions);
          const completeCondition = this.getCompletedCondition(conditions);
          const availableCondition = this.getAvailableCondition(conditions);

          if (hasErrors.error) {
            result['domainOverallStatus'] = i18n.t('domain-design-domain-status-failed', {reason: hasErrors.reason});
          } else if (completeCondition.status === 'True' && availableCondition.status === 'True') {
            result['domainOverallStatus'] = i18n.t('domain-design-domain-status-complete');
          } else {
            // Assume this is introspection progressing
            if (completeCondition.status === 'False' && !this.hasAvailableCondition(conditions)) {
              result['domainOverallStatus'] = i18n.t('domain-design-domain-status-progressing');
            } else if (completeCondition.status === 'False' && availableCondition.status === 'False') {
              result['domainOverallStatus'] = i18n.t('domain-design-domain-status-available');
            } else {
              // should never happened?
              result['domainOverallStatus'] = i18n.t('domain-design-domain-status-unknown');
            }
          }
        }

      } else {
        // status not defined or no conditions - error in operator or namespace is not monitored
        result['domainOverallStatus'] = i18n.t('domain-design-domain-status-unknown');
      }
      return result;
    };

    this.hasErrorConditions = (conditions) => {
      for (const condition of conditions) {
        if (condition.type === 'Failed') {
          return {error: true, reason: condition.reason};
        }
      }
      return {error: false, reason: ''};
    };

    this.getCompletedCondition = (conditions) => {
      const defaultCondition = {type: 'Completed', status: 'False'};
      for (const condition of conditions) {
        if (condition.type === 'Completed') {
          return condition;
        }
      }
      return defaultCondition;
    };

    this.getAvailableCondition = (conditions) => {
      const defaultCondition = {type: 'Available', status: 'False'};
      for (const condition of conditions) {
        if (condition.type === 'Available') {
          return condition;
        }
      }
      return defaultCondition;
    };

    this.hasAvailableCondition = (conditions) => {
      for (const condition of conditions) {
        if (condition.type === 'Available') {
          return true;
        }
      }
      return false;
    };

  }
  return new K8sDomainDeployer();
});
