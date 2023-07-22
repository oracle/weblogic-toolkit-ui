/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base', 'utils/aux-image-helper', 'utils/wkt-logger'],
  function(project, ScriptGeneratorBase, auxImageHelper, wktLogger) {
    const scriptDescription = [
      'This script deploys the Verrazzano components for this WebLogic domain into',
      'Kubernetes.  It depends on having the Kubernetes client configuration',
      'correctly configured to authenticate to the cluster with sufficient',
      'permissions to run the commands.'
    ];

    class VerrazzanoComponentScriptGenerator extends ScriptGeneratorBase {
      constructor(scriptType) {
        super(scriptType);
      }

      generate() {
        const httpsProxyUrl = this.project.getHttpsProxyUrl();
        const bypassProxyHosts = this.project.getBypassProxyHosts();

        this.adapter.addScriptHeader(scriptDescription);
        this.adapter.addVariableStartBanner();

        this.adapter.addKubectlVariablesBlock(this.project.kubectl.executableFilePath.value, httpsProxyUrl,
          bypassProxyHosts, this.project.kubectl.kubeConfig.value, this.project.kubectl.kubeConfigContextToUse.value);

        this.adapter.addVariableDefinition('VERRAZZANO_COMPONENT_NAMESPACE', this.project.k8sDomain.kubernetesNamespace.value);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('VERRAZZANO_INSTALL_NAME', this.project.vzInstall.installationName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_COMPONENT_NAME', this.project.vzComponent.componentName.value);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('PULL_REQUIRES_AUTHENTICATION',
          this.project.k8sDomain.imageRegistryPullRequireAuthentication.value);
        this.adapter.addVariableDefinition('USE_EXISTING_PULL_SECRET',
          this.project.k8sDomain.imageRegistryUseExistingPullSecret.value);
        this.adapter.addVariableDefinition('PULL_SECRET_NAME', this.project.k8sDomain.imageRegistryPullSecretName.value);
        this.adapter.addVariableDefinition('PULL_SECRET_HOST', this.project.image.internal.imageRegistryAddress.value);
        this.adapter.addVariableDefinition('PULL_SECRET_EMAIL', this.project.k8sDomain.imageRegistryPullEmail.value);
        this.adapter.addVariableDefinition('PULL_SECRET_USER', this.credentialMask);
        this.adapter.addVariableDefinition('PULL_SECRET_PASS', this.credentialMask);
        this.adapter.addEmptyLine();

        if (this.usingAuxImage()  || this.usingDomainCreationImage()) {
          this.adapter.addVariableDefinition('AUX_PULL_REQUIRES_AUTHENTICATION',
            this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value);
          this.adapter.addVariableDefinition('AUX_USE_EXISTING_PULL_SECRET',
            this.project.k8sDomain.auxImageRegistryUseExistingPullSecret.value);
          this.adapter.addVariableDefinition('AUX_PULL_SECRET_NAME', this.project.k8sDomain.auxImageRegistryPullSecretName.value);
          this.adapter.addVariableDefinition('AUX_PULL_SECRET_HOST', this.project.image.internal.auxImageRegistryAddress.value);
          this.adapter.addVariableDefinition('AUX_PULL_SECRET_EMAIL', this.project.k8sDomain.auxImageRegistryPullEmail.value);
          this.adapter.addVariableDefinition('AUX_PULL_SECRET_USER', this.credentialMask);
          this.adapter.addVariableDefinition('AUX_PULL_SECRET_PASS', this.credentialMask);
          this.adapter.addEmptyLine();
        }

        if (this.isModelInImage()) {
          this.adapter.addVariableDefinition('RUNTIME_SECRET_NAME', this.project.k8sDomain.runtimeSecretName.value);
          this.adapter.addVariableDefinition('RUNTIME_SECRET_PASS', this.project.k8sDomain.runtimeSecretValue.value);
          this.adapter.addEmptyLine();
        } else if (auxImageHelper.supportsDomainCreationImages() && auxImageHelper.domainUsesJRF()) {
          this.adapter.addVariableDefinition('OPSS_WALLET_PASSWORD_SECRET_NAME',
            this.project.k8sDomain.walletPasswordSecretName.value);
          this.adapter.addVariableDefinition('OPSS_WALLET_PASS', this.credentialMask);
          this.adapter.addEmptyLine();
        }

        this.adapter.addVariableDefinition('DOMAIN_SECRET_NAME', this.project.k8sDomain.credentialsSecretName.value);
        this.adapter.addVariableDefinition('DOMAIN_SECRET_USER', this.credentialMask);
        this.adapter.addVariableDefinition('DOMAIN_SECRET_PASS', this.credentialMask);
        this.adapter.addEmptyLine();

        if (auxImageHelper.projectHasModel() || auxImageHelper.projectUsingExternalImageContainingModel()) {
          if (Array.isArray(this.project.k8sDomain.secrets.value)) {
            for (const secretEntry of this.project.k8sDomain.secrets.value) {
              // For cases where the model is external and the user is constructing the Secrets,
              // we have to handle the case where the secret has no keys.  If there are no keys,
              // we will skip creating the secret altogether.
              //
              const secretName = secretEntry.name;
              if (Array.isArray(secretEntry.keys) && secretEntry.keys.length > 0) {
                this.adapter.addVariableDefinition(this.getSecretVariableName(name, 'NAME'), secretName);
                for (const secretFieldEntry of secretEntry.keys) {
                  const fieldName = secretFieldEntry.key;
                  const fieldValue = this.credentialMask;
                  this.adapter.addVariableDefinition(this.getSecretVariableName(name, fieldName), fieldValue);
                }
                this.adapter.addEmptyLine();
              } else {
                wktLogger.warn('Secret %s found without any fields...skipping', secretName);
              }
            }
          }
        }

        this.adapter.addVariableDefinition('VERRAZZANO_CONFIG_MAP_COMPONENT_NAME', this.project.k8sDomain.modelConfigMapName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_RESOURCE_YAML', this.fillInFileNameMask);
        this.adapter.addVariableDefinition('VERRAZZANO_CONFIGMAP_RESOURCE_YAML', this.fillInFileNameMask);
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addKubectlExportAndUseContextBlock();
        const kubectlExe = this.adapter.getVariableReference('KUBECTL_EXE');
        const vzInstallName = this.adapter.getVariableReference('VERRAZZANO_INSTALL_NAME');
        const componentNamespace = this.adapter.getVariableReference('VERRAZZANO_COMPONENT_NAMESPACE');

        let comment = [ 'Make sure that Verrazzano is already installed' ];
        const notInstalledMessage = 'Verrazzano is not installed';
        const alreadyInstalledMessage = 'Verrazzano is already installed';
        this.adapter.addVerrazzanoInstalledCheckBlock(comment, kubectlExe, vzInstallName,
          notInstalledMessage, alreadyInstalledMessage, true, false);

        comment = [ 'Create image pull secret, if needed.' ];
        const pullRequiresAuthentication = this.adapter.getVariableReference('PULL_REQUIRES_AUTHENTICATION');
        const useExistingPullSecret = this.adapter.getVariableReference('USE_EXISTING_PULL_SECRET');
        const pullSecretName = this.adapter.getVariableReference('PULL_SECRET_NAME');
        const pullSecretData = {
          host: this.adapter.getVariableReference('PULL_SECRET_HOST'),
          username: this.adapter.getVariableReference('PULL_SECRET_USER'),
          password: this.adapter.getVariableReference('PULL_SECRET_PASS'),
          email: this.adapter.getVariableReference('PULL_SECRET_EMAIL')
        };
        let createErrorMessage = `Failed to create pull secret ${pullSecretName} in namespace ${componentNamespace}`;
        let replaceMessage = `Replacing existing pull secret ${pullSecretName} in namespace ${componentNamespace}`;
        let deleteErrorMessage = `Failed to delete pull secret ${pullSecretName} in namespace ${componentNamespace}`;
        this.adapter.addCreatePullSecretBlock(comment, kubectlExe, pullSecretName, componentNamespace, pullSecretData,
          createErrorMessage, deleteErrorMessage, replaceMessage, pullRequiresAuthentication, useExistingPullSecret);

        if (this.usingAuxImage() || this.usingDomainCreationImage()) {
          comment = this.usingAuxImage() ? [ 'Create auxiliary image pull secret, if needed.' ]
            : [ 'Create domain creation image pull secret, if needed.' ];
          const auxPullRequiresAuthentication = this.adapter.getVariableReference('AUX_PULL_REQUIRES_AUTHENTICATION');
          const auxUseExistingPullSecret = this.adapter.getVariableReference('AUX_USE_EXISTING_PULL_SECRET');
          const auxPullSecretName = this.adapter.getVariableReference('AUX_PULL_SECRET_NAME');
          const auxPullSecretData = {
            host: this.adapter.getVariableReference('AUX_PULL_SECRET_HOST'),
            username: this.adapter.getVariableReference('AUX_PULL_SECRET_USER'),
            password: this.adapter.getVariableReference('AUX_PULL_SECRET_PASS'),
            email: this.adapter.getVariableReference('AUX_PULL_SECRET_EMAIL')
          };
          createErrorMessage = `Failed to create pull secret ${auxPullSecretName} in namespace ${componentNamespace}`;
          replaceMessage = `Replacing existing pull secret ${auxPullSecretName} in namespace ${componentNamespace}`;
          deleteErrorMessage = `Failed to delete pull secret ${auxPullSecretName} in namespace ${componentNamespace}`;
          this.adapter.addCreatePullSecretBlock(comment, kubectlExe, auxPullSecretName, componentNamespace, auxPullSecretData,
            createErrorMessage, deleteErrorMessage, replaceMessage, auxPullRequiresAuthentication, auxUseExistingPullSecret);
        }

        if (this.isModelInImage()) {
          comment = ['Create runtime encryption secret.'];
          const runtimeSecretName = this.adapter.getVariableReference('RUNTIME_SECRET_NAME');
          const runtimeSecretData = {
            password: this.adapter.getVariableReference('RUNTIME_SECRET_PASS')
          };
          createErrorMessage = `Failed to create runtime encryption secret ${runtimeSecretName} in namespace ${componentNamespace}`;
          replaceMessage = `Replacing existing runtime encryption secret ${runtimeSecretName} in namespace ${componentNamespace}`;
          deleteErrorMessage = `Failed to delete runtime encryption secret ${runtimeSecretName} in namespace ${componentNamespace}`;
          this.adapter.addCreateRuntimeSecretBlock(comment, kubectlExe, runtimeSecretName, componentNamespace,
            runtimeSecretData, createErrorMessage, deleteErrorMessage, replaceMessage);
        } else if (auxImageHelper.supportsDomainCreationImages() && auxImageHelper.domainUsesJRF()) {
          comment = ['Create OPSS wallet password secret.'];
          const opssWalletPasswordSecretName = this.adapter.getVariableReference('OPSS_WALLET_PASSWORD_SECRET_NAME');
          const opssWalletPasswordSecretData = {
            walletPassword: this.adapter.getVariableReference('OPSS_WALLET_PASS')
          };
          createErrorMessage = `Failed to create OPSS wallet password secret ${opssWalletPasswordSecretName} in namespace ${componentNamespace}`;
          replaceMessage = `Replacing existing OPSS wallet password secret ${opssWalletPasswordSecretName} in namespace ${componentNamespace}`;
          deleteErrorMessage = `Failed to delete OPSS wallet password secret ${opssWalletPasswordSecretName} in namespace ${componentNamespace}`;
          this.adapter.addCreateOpssWalletPasswordSecretBlock(comment, kubectlExe, opssWalletPasswordSecretName, componentNamespace,
            opssWalletPasswordSecretData, createErrorMessage, deleteErrorMessage, replaceMessage);
        }

        comment = [ 'Create WebLogic domain credentials secret.' ];
        const domainSecretName = this.adapter.getVariableReference('DOMAIN_SECRET_NAME');
        const domainSecretData = {
          username: this.adapter.getVariableReference('DOMAIN_SECRET_USER'),
          password: this.adapter.getVariableReference('DOMAIN_SECRET_PASS')
        };
        createErrorMessage = `Failed to create WebLogic domain credentials secret ${domainSecretName} in namespace ${componentNamespace}`;
        replaceMessage = `Replacing existing WebLogic domain credentials secret ${domainSecretName} in namespace ${componentNamespace}`;
        deleteErrorMessage = `Failed to delete WebLogic domain credentials secret ${domainSecretName} in namespace ${componentNamespace}`;
        this.adapter.addCreateGenericSecretBlock(comment, kubectlExe, domainSecretName, componentNamespace,
          domainSecretData, createErrorMessage, deleteErrorMessage, replaceMessage);

        if (auxImageHelper.projectHasModel() || auxImageHelper.projectUsingExternalImageContainingModel()) {
          if (Array.isArray(this.project.k8sDomain.secrets.value)) {
            for (const secretEntry of this.project.k8sDomain.secrets.value) {
              // For cases where the model is external and the user is constructing the Secrets,
              // we have to handle the case where the secret has no keys.  If there are no keys,
              // we will skip creating the secret altogether.
              //
              const secretName = this.adapter.getVariableReference(this.getSecretVariableName(secretEntry.name, 'NAME'));
              const secretData = { };
              if (Array.isArray(secretEntry.keys) && secretEntry.keys.length > 0) {
                for (const secretField of secretEntry.keys) {
                  const fieldName = secretField.key;
                  secretData[fieldName] = this.adapter.getVariableReference(this.getSecretVariableName(secretEntry.name, fieldName));
                }
                createErrorMessage = `Failed to create secret ${secretEntry.name} in namespace ${componentNamespace}`;
                replaceMessage = `Replacing existing secret ${secretEntry.name} in namespace ${componentNamespace}`;
                deleteErrorMessage = `Failed to delete secret ${secretEntry.name} in namespace ${componentNamespace}`;
                comment = [ `Create the ${secretEntry.name} secret` ];
                this.adapter.addCreateGenericSecretBlock(comment, kubectlExe, secretName, componentNamespace, secretData,
                  createErrorMessage, deleteErrorMessage, replaceMessage);
              } else {
                this.adapter.addComment(`Skipping secret ${secretEntry.name} due to no fields present...`);
                this.adapter.addEmptyLine();
              }
            }
          }
        }

        comment = [ 'Create the ConfigMap component, if needed' ];
        const vzConfigMapResourceYaml = this.adapter.getVariableReference('VERRAZZANO_CONFIGMAP_RESOURCE_YAML');
        const configMapComponentName = this.adapter.getVariableReference('VERRAZZANO_CONFIG_MAP_COMPONENT_NAME');
        let successMessage = `Created ConfigMap component ${configMapComponentName}`;
        let errorMessage = `Failed to create the ConfigMap component ${configMapComponentName}`;
        this.adapter.addNotEmptyVariableKubectlApplyBlock(comment, configMapComponentName, kubectlExe,
          vzConfigMapResourceYaml, errorMessage, successMessage);

        comment = [ 'Create the Verrazzano Component for the WebLogic Domain' ];
        const vzResourceYaml = this.adapter.getVariableReference('VERRAZZANO_RESOURCE_YAML');
        const vzComponentName = this.adapter.getVariableReference('VERRAZZANO_COMPONENT_NAME');
        errorMessage = `Failed to create the Verrazzano component ${vzComponentName}`;
        this.adapter.addKubectlApplyBlock(comment, kubectlExe, vzResourceYaml, errorMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }
    }

    return VerrazzanoComponentScriptGenerator;
  }
);
