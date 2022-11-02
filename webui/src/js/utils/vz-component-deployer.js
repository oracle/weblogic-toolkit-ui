/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/vz-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n', 'utils/project-io',
  'utils/dialog-helper', 'utils/validation-helper', 'utils/vz-component-resource-generator',
  'utils/vz-component-configmap-generator', 'utils/wkt-logger'],
function(VzActionsBase, project, wktConsole, i18n, projectIo, dialogHelper, validationHelper,
  VerrazzanoComponentResourceGenerator, VerrazzanoComponentConfigMapGenerator, wktLogger) {
  class VzComponentDeployer extends VzActionsBase {
    constructor() {
      super();
    }

    async startDeployComponent() {
      await this.executeAction(this.callDeployComponent);
    }

    async callDeployComponent(options) {
      if (!options) {
        options = {};
      }

      let errTitle = i18n.t('vz-component-deployer-aborted-error-title');
      const errPrefix = 'vz-component-deployer';
      const validatableObject = this.getValidatableObject('flow-verrazzano-deploy-component-name');
      if (validatableObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validatableObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve(false);
      }

      const totalSteps = 12.0;
      const kubectlExe = this.getKubectlExe();
      const domainUid = this.project.k8sDomain.uid.value;
      try {
        let busyDialogMessage = i18n.t('flow-validate-kubectl-exe-in-progress');
        dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
        dialogHelper.updateBusyDialog(busyDialogMessage, 0/totalSteps);

        if (!options.skipKubectlExeValidation) {
          if (! await this.validateKubectlExe(kubectlExe, errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // While technically not required, we force saving the project for Go Menu item behavior consistency.
        //
        busyDialogMessage = i18n.t('flow-save-project-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 1/totalSteps);
        if (!options.skipProjectSave) {
          if (! await this.saveProject(errTitle, errPrefix)) {
            return Promise.resolve(false);
          }
        }

        // Apply the Kubernetes context, if needed.
        busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 2/totalSteps);
        const kubectlContext = this.getKubectlContext();
        const kubectlOptions = this.getKubectlOptions();
        if (!options.skipKubectlSetContext) {
          const status = await this.useKubectlContext(kubectlExe, kubectlOptions, kubectlContext, errTitle, errPrefix);
          if (!status) {
            return Promise.resolve(false);
          }
        }

        /// Make sure Verrazzano is installed
        busyDialogMessage = i18n.t('flow-checking-vz-already-installed-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 3/totalSteps);
        if (!options.skipVzInstallCheck) {
          const result = await this.isVerrazzanoInstalled(kubectlExe, kubectlOptions, errTitle, errPrefix);
          if (!result) {
            return Promise.resolve(false);
          }
          if (!result.isInstalled) {
            dialogHelper.closeBusyDialog();
            const errMessage = i18n.t('vz-component-deployer-not-installed-error-message');
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }
        }

        // Create the namespace
        const componentNamespace = this.project.k8sDomain.kubernetesNamespace.value;
        busyDialogMessage = i18n.t('vz-component-deployer-create-ns-in-progress', {componentNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 4/totalSteps);
        if (! await this.createKubernetesNamespace(kubectlExe, kubectlOptions, componentNamespace, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        // Label the namespace
        busyDialogMessage = i18n.t('vz-component-deployer-label-ns-in-progress', {componentNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 5/totalSteps);
        const labels = [ 'verrazzano-managed=true', 'istio-injection=enabled' ];
        if (! await this.labelKubernetesNamespace(kubectlExe, kubectlOptions, componentNamespace, labels, errTitle, errPrefix)) {
          return Promise.resolve(false);
        }

        // Create the primary image pull secret, if needed.
        if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value &&
          !this.project.k8sDomain.imageRegistryUseExistingPullSecret.value) {
          const secret = this.project.k8sDomain.imageRegistryPullSecretName.value;
          busyDialogMessage = i18n.t('vz-component-deployer-create-image-pull-secret-in-progress',
            {namespace: componentNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 6/totalSteps);
          const secretData = {
            server: this.project.image.internal.imageRegistryAddress.value,
            username: this.project.k8sDomain.imageRegistryPullUser.value,
            email: this.project.k8sDomain.imageRegistryPullEmail.value,
            password: this.project.k8sDomain.imageRegistryPullPassword.value
          };
          const createResult = await this.createPullSecret(kubectlExe, kubectlOptions, componentNamespace, secret,
            secretData, errTitle, errPrefix);
          if (!createResult) {
            return Promise.resolve(false);
          }
        }

        // Create the auxiliary image pull secret, if needed.
        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value &&
          !this.project.k8sDomain.auxImageRegistryUseExistingPullSecret.value) {
          const secret = this.project.k8sDomain.auxImageRegistryPullSecretName.value;
          busyDialogMessage = i18n.t('vz-component-deployer-create-image-pull-secret-in-progress',
            {namespace: componentNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 7/totalSteps);
          const secretData = {
            server: this.project.image.internal.auxImageRegistryAddress.value,
            username: this.project.k8sDomain.auxImageRegistryPullUser.value,
            email: this.project.k8sDomain.auxImageRegistryPullEmail.value,
            password: this.project.k8sDomain.auxImageRegistryPullPassword.value
          };
          const createResult = await this.createPullSecret(kubectlExe, kubectlOptions, componentNamespace, secret,
            secretData, errTitle, errPrefix);
          if (!createResult) {
            return Promise.resolve(false);
          }
        }

        // Create the MII runtime encryption secret, if needed.
        if (this.project.settings.targetDomainLocation.value === 'mii') {
          const secret = this.project.k8sDomain.runtimeSecretName.value;
          busyDialogMessage = i18n.t('vz-component-deployer-create-runtime-secret-in-progress',
            {namespace: componentNamespace, secretName: secret});
          dialogHelper.updateBusyDialog(busyDialogMessage, 8/totalSteps);
          const secretData = {
            password: this.project.k8sDomain.runtimeSecretValue.value
          };
          const createResult = await this.createGenericSecret(kubectlExe, kubectlOptions, componentNamespace, secret,
            secretData, errTitle, 'vz-component-deployer-create-runtime-secret-error-message');
          if (!createResult) {
            return Promise.resolve(false);
          }
        }

        // Create the WebLogic Credential secret
        const wlSecretName = this.project.k8sDomain.credentialsSecretName.value;
        busyDialogMessage = i18n.t('vz-component-deployer-create-wl-secret-in-progress',
          {secretName: wlSecretName, domainName: domainUid, namespace: componentNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 9/totalSteps);
        const wlSecretData = {
          username: this.project.k8sDomain.credentialsUserName.value,
          password: this.project.k8sDomain.credentialsPassword.value
        };
        const wlsSecretResult = await this.createGenericSecret(kubectlExe, kubectlOptions, componentNamespace, wlSecretName,
          wlSecretData, errTitle, 'vz-component-deployer-create-wl-secret-failed-error-message');
        if (!wlsSecretResult) {
          return Promise.resolve(false);
        }

        // Create Secrets, if needed
        busyDialogMessage = i18n.t('vz-component-deployer-create-secrets-in-progress',
          {domainName: domainUid, namespace: componentNamespace});
        dialogHelper.updateBusyDialog(busyDialogMessage, 10 / totalSteps);
        if (this.project.settings.targetDomainLocation.value === 'mii') {
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

              const domainSecretResult = await this.createGenericSecret(kubectlExe, kubectlOptions, componentNamespace,
                secretName, secretData, errTitle, 'vz-component-deployer-create-secret-failed-error-message');
              if (!domainSecretResult) {
                return Promise.resolve(false);
              }
            }
          }
        }

        // Create the components needed for deployment
        const vzResourceGenerator = new VerrazzanoComponentResourceGenerator();
        const vzConfigMapGenerator = new VerrazzanoComponentConfigMapGenerator();
        const components = [ vzResourceGenerator.generate().join('\n') ];
        if (vzConfigMapGenerator.shouldCreateConfigMap()) {
          wktLogger.debug('Adding ConfigMap for component deployment');
          components.push(vzConfigMapGenerator.generate().join('\n'));
        }

        // Deploy the components
        busyDialogMessage = i18n.t('vz-component-deployer-deploy-component-in-progress');
        dialogHelper.updateBusyDialog(busyDialogMessage, 11/totalSteps);
        const deployResult = await window.api.ipc.invoke('deploy-verrazzano-components', kubectlExe, components, kubectlOptions);
        dialogHelper.closeBusyDialog();
        const message = this.getResponseMessage(deployResult, components, vzConfigMapGenerator);
        if (deployResult.isSuccess) {
          const title = i18n.t('vz-component-deployer-deploy-success-title');
          await window.api.ipc.invoke('show-info-message', title, message);
          return Promise.resolve(true);
        } else {
          const errTitle = i18n.t('vz-component-deployer-deploy-failed-title');
          await window.api.ipc.invoke('show-error-message', errTitle, message);
          return Promise.resolve(false);
        }
      } catch (err) {
        dialogHelper.closeBusyDialog();
        throw err;
      } finally {
        dialogHelper.closeBusyDialog();
      }
    }

    getValidatableObject(flowNameKey) {
      const validationObject = this.getValidationObject(flowNameKey);
      const vzComponentFormConfig = validationObject.getDefaultConfigObject();
      vzComponentFormConfig.formName = 'vz-component-design-form-name';

      validationObject.addField('vz-component-design-name-label',
        this.project.vzComponent.componentName.validate(true), vzComponentFormConfig);
      validationObject.addField('vz-component-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), vzComponentFormConfig);
      validationObject.addField('vz-component-design-installed-version-label',
        validationHelper.validateRequiredField(this.project.vzInstall.actualInstalledVersion.value), vzComponentFormConfig);
      validationObject.addField('domain-design-uid-label', this.project.k8sDomain.uid.validate(true), vzComponentFormConfig);

      validationObject.addField('domain-design-image-tag-label',
        this.project.image.imageTag.validate(true), vzComponentFormConfig);

      if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value) {
        validationObject.addField('domain-design-image-registry-pull-secret-name-label',
          this.project.k8sDomain.imageRegistryPullSecretName.validate(true), vzComponentFormConfig);

        if (!this.project.k8sDomain.imageRegistryUseExistingPullSecret.value) {
          validationObject.addField('domain-design-image-registry-address-label',
            validationHelper.validateHostName(this.project.image.internal.imageRegistryAddress.value, false),
            vzComponentFormConfig);
          validationObject.addField('domain-design-image-registry-pull-username-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.imageRegistryPullUser.value),
            vzComponentFormConfig);
          validationObject.addField('domain-design-image-registry-pull-email-label',
            this.project.k8sDomain.imageRegistryPullEmail.validate(true),
            vzComponentFormConfig);
          validationObject.addField('domain-design-image-registry-pull-password-label',
            validationHelper.validateRequiredField(this.project.k8sDomain.imageRegistryPullPassword.value),
            vzComponentFormConfig);
        }
      }

      if (this.project.settings.targetDomainLocation.value === 'mii' && this.project.image.useAuxImage.value) {
        validationObject.addField('domain-design-aux-image-tag-label',
          this.project.image.auxImageTag.validate(true), vzComponentFormConfig);

        if (this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value) {
          validationObject.addField('domain-design-aux-image-registry-pull-secret-name-label',
            this.project.k8sDomain.auxImageRegistryPullSecretName.validate(true), vzComponentFormConfig);

          if (!this.project.k8sDomain.auxImageRegistryUseExistingPullSecret.value) {
            validationObject.addField('domain-design-aux-image-registry-address-label',
              validationHelper.validateHostName(this.project.image.internal.auxImageRegistryAddress.value, false),
              vzComponentFormConfig);
            validationObject.addField('domain-design-aux-image-registry-pull-username-label',
              validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullUser.value),
              vzComponentFormConfig);
            validationObject.addField('domain-design-aux-image-registry-pull-email-label',
              this.project.k8sDomain.auxImageRegistryPullEmail.validate(true),
              vzComponentFormConfig);
            validationObject.addField('domain-design-aux-image-registry-pull-password-label',
              validationHelper.validateRequiredField(this.project.k8sDomain.auxImageRegistryPullPassword.value),
              vzComponentFormConfig);
          }
        }
      }

      if (this.project.settings.targetDomainLocation.value === 'mii') {
        validationObject.addField('domain-design-encryption-secret-label',
          this.project.k8sDomain.runtimeSecretName.validate(true), vzComponentFormConfig);
        validationObject.addField('domain-design-encryption-value-label',
          validationHelper.validateRequiredField(this.project.k8sDomain.runtimeSecretValue.value), vzComponentFormConfig);
      }
      validationObject.addField('domain-design-wls-credential-label',
        this.project.k8sDomain.credentialsSecretName.validate(true), vzComponentFormConfig);
      validationObject.addField('domain-design-wls-credential-username-label',
        validationHelper.validateRequiredField(this.project.k8sDomain.credentialsUserName.value), vzComponentFormConfig);
      validationObject.addField('domain-design-wls-credential-password-label',
        validationHelper.validateRequiredField(this.project.k8sDomain.credentialsPassword.value), vzComponentFormConfig);

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

      if (this.project.settings.targetDomainLocation.value === 'mii') {
        validationObject.addField('domain-design-configmap-label',
          this.project.k8sDomain.modelConfigMapName.validate(true), vzComponentFormConfig);
      }

      return validationObject;
    }

    getResponseMessage(deployResult, components, vzConfigMapGenerator) {
      let message;
      const resourceName = this.project.vzComponent.componentName.value;
      const namespace = this.project.k8sDomain.kubernetesNamespace.value;
      if (deployResult.isSuccess) {
        if (components.length === 2) {
          const configMapName = vzConfigMapGenerator.getConfigMapComponentName();
          message = i18n.t('vz-component-deployer-deploy-success-message',
            { resourceName, configMapName, namespace });
        } else {
          message = i18n.t('vz-component-deployer-deploy-resource-only-success-message', { resourceName, namespace });
        }
      } else {
        const error = deployResult.reason;
        if (components.length === 2) {
          const configMapName = vzConfigMapGenerator.getConfigMapComponentName();
          message = i18n.t('vz-component-deployer-deploy-failed-message',
            { resourceName, configMapName, namespace, error });
        } else {
          message = i18n.t('vz-component-deployer-deploy-resource-only-success-message', { resourceName, namespace, error });
        }
      }
      return message;
    }
  }
  return new VzComponentDeployer();
});
