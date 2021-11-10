/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base', 'utils/k8s-domain-configmap-generator'],
  function(project, ScriptGeneratorBase, K8sDomainConfigMapGenerator) {
    const scriptDescription = [
      'This script installs a WebLogic domain into Kubernetes to be managed by',
      'the WebLogic Kubernetes Operator.  It depends on having the Kubernetes',
      'client configuration correctly configured to authenticate to the cluster',
      'with sufficient permissions to run the commands.'
    ];

    const operatorChartName = 'weblogic-operator/weblogic-operator';

    class K8sDomainScriptGenerator extends ScriptGeneratorBase {
      constructor(scriptType) {
        super(scriptType);
        this.configMapGenerator = new K8sDomainConfigMapGenerator();
      }

      generate() {
        const httpsProxyUrl = this.project.getHttpsProxyUrl();
        const bypassProxyHosts = this.project.getBypassProxyHosts();

        this.adapter.addScriptHeader(scriptDescription);
        this.adapter.addVariableStartBanner();

        this.adapter.addKubectlVariablesBlock(this.project.kubectl.executableFilePath.value, httpsProxyUrl,
          bypassProxyHosts, this.project.kubectl.kubeConfig.value, this.project.kubectl.kubeConfigContextToUse.value,
          this.project.kubectl.helmExecutableFilePath.value);

        this.adapter.addVariableDefinition('DOMAIN_NAMESPACE', this.project.k8sDomain.kubernetesNamespace.value);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('WKO_NAME', this.project.wko.wkoDeployName.value);
        this.adapter.addVariableDefinition('WKO_CHART_NAME', operatorChartName);
        this.adapter.addVariableDefinition('WKO_NAMESPACE', this.project.wko.k8sNamespace.value);
        this.adapter.addVariableDefinition('WKO_NS_STRATEGY',
          this.project.wko.operatorDomainNamespaceSelectionStrategy.value);
        if (this.project.wko.operatorDomainNamespaceSelectionStrategy.value === 'LabelSelector') {
          this.adapter.addVariableDefinition('WKO_NS_LABEL_SELECTOR',
            this.project.wko.operatorDomainNamespaceSelector.value);
        } else if (this.project.wko.operatorDomainNamespaceSelectionStrategy.value === 'List') {
          const domainNamespaces = this.project.wko.operatorDomainNamespacesList.value;
          if (!domainNamespaces.includes(this.project.k8sDomain.kubernetesNamespace.value)) {
            domainNamespaces.push(this.project.k8sDomain.kubernetesNamespace.value);
          }
          this.adapter.addVariableDefinition('WKO_DOMAIN_NAMESPACES', `{${domainNamespaces.join(',')}}`);
        }
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

        if (this.isModelInImage()) {
          this.adapter.addVariableDefinition('RUNTIME_SECRET_NAME', this.project.k8sDomain.runtimeSecretName.value);
          this.adapter.addVariableDefinition('RUNTIME_SECRET_PASS', this.project.k8sDomain.runtimeSecretValue.value);
          this.adapter.addEmptyLine();
        }

        this.adapter.addVariableDefinition('DOMAIN_SECRET_NAME', this.project.k8sDomain.credentialsSecretName.value);
        this.adapter.addVariableDefinition('DOMAIN_SECRET_USER', this.credentialMask);
        this.adapter.addVariableDefinition('DOMAIN_SECRET_PASS', this.credentialMask);
        this.adapter.addEmptyLine();

        if (this.isModelInImage() && this.project.k8sDomain.secrets.value && this.project.k8sDomain.secrets.value.length > 0) {
          for (const secretEntry of this.project.k8sDomain.secrets.value) {
            const name = secretEntry.name;
            const user = this.credentialMask;
            const pass = this.credentialMask;
            this.adapter.addVariableDefinition(getSecretVariableName(name, 'NAME'), name);
            this.adapter.addVariableDefinition(getSecretVariableName(name, 'USER'), user);
            this.adapter.addVariableDefinition(getSecretVariableName(name, 'PASS'), pass);
            this.adapter.addEmptyLine();
          }
        }

        if (this.isModelInImage() && this.configMapGenerator.shouldCreateConfigMap()) {
          this.adapter.addVariableDefinition('DOMAIN_CONFIG_MAP_YAML', this.fillInFileNameMask);
        }
        this.adapter.addVariableDefinition('DOMAIN_RESOURCE_YAML', this.fillInFileNameMask);
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addKubectlExportAndUseContextBlock();
        const kubectlExe = this.adapter.getVariableReference('KUBECTL_EXE');

        let comment = [ 'Make sure that Operator is already installed.' ];
        const wkoName = this.adapter.getVariableReference('WKO_NAME');
        const wkoNamespace = this.adapter.getVariableReference('WKO_NAMESPACE');
        const notInstalledMessage = `WebLogic Kubernetes Operator ${wkoName} is not installed in namespace ${wkoNamespace}`;
        const alreadyInstalledMessage = `WebLogic Kubernetes Operator ${wkoName} is already installed in namespace ${wkoNamespace}`;
        this.adapter.addOperatorInstalledCheckBlock(comment, kubectlExe, wkoName, wkoNamespace, notInstalledMessage,
          alreadyInstalledMessage, true, false);

        comment = [ 'Create the domain namespace if it does not already exist.' ];
        const k8sDomainNamespace = this.adapter.getVariableReference('DOMAIN_NAMESPACE');
        let createErrorMessage = `Failed to create namespace ${k8sDomainNamespace}`;
        let alreadyExistsMessage = `Namespace ${k8sDomainNamespace} already exists`;
        this.adapter.addCreateNamespaceBlock(comment, kubectlExe, k8sDomainNamespace, createErrorMessage, alreadyExistsMessage);

        comment = [ 'Prepare for operator upgrade to pick up domain namespace.' ];
        const wkoNamespaceStrategy = this.adapter.getVariableReference('WKO_NS_STRATEGY');
        const wkoNamespaceSelector = this.adapter.getVariableReference('WKO_NS_LABEL_SELECTOR');
        const wkoDomainNamespaces = this.adapter.getVariableReference('WKO_DOMAIN_NAMESPACES');
        let labelErrorMessage =
          `Failed to add label "${this.project.wko.operatorDomainNamespaceSelector.value}" to namespace ${k8sDomainNamespace}`;
        let regexStrategyMessage = 'WebLogic Kubernetes Operator is configured to use the Regexp namespace selection ' +
          `strategy so please make sure the namespace ${k8sDomainNamespace} matches the regular expression`;
        this.adapter.addUpdateOperatorForNamespaceBlock(comment, kubectlExe, k8sDomainNamespace, wkoNamespaceStrategy,
          wkoNamespaceSelector, labelErrorMessage, wkoDomainNamespaces, regexStrategyMessage);

        comment = [ 'Run operator upgrade to pick up domain namespace.' ];
        const helmExe = this.adapter.getVariableReference('HELM_EXE');
        const wkoChartName = this.adapter.getVariableReference('WKO_CHART_NAME');
        let helmUpgradeErrorMessage = `Failed to upgrade WebLogic Kubernetes Operator ${wkoName} in namespace ${wkoNamespace}`;
        this.adapter.addHelmUpgradeBlock(comment, helmExe, wkoName, wkoChartName, wkoNamespace, helmUpgradeErrorMessage);

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
        createErrorMessage = `Failed to create pull secret ${pullSecretName} in namespace ${k8sDomainNamespace}`;
        let replaceMessage = `Replacing existing pull secret ${pullSecretName} in namespace ${k8sDomainNamespace}`;
        let deleteErrorMessage = `Failed to delete pull secret ${pullSecretName} in namespace ${k8sDomainNamespace}`;
        this.adapter.addCreatePullSecretBlock(comment, kubectlExe, pullSecretName, k8sDomainNamespace, pullSecretData,
          createErrorMessage, deleteErrorMessage, replaceMessage, pullRequiresAuthentication, useExistingPullSecret);

        if (this.isModelInImage()) {
          comment = ['Create runtime encryption secret, if needed.'];
          const targetDomainLocation = this.adapter.getVariableReference('TARGET_DOMAIN_LOCATION');
          const runtimeSecretName = this.adapter.getVariableReference('RUNTIME_SECRET_NAME');
          const runtimeSecretData = {
            password: this.adapter.getVariableReference('RUNTIME_SECRET_PASS')
          };
          createErrorMessage = `Failed to create runtime encryption secret ${runtimeSecretName} in namespace ${k8sDomainNamespace}`;
          replaceMessage = `Replacing existing runtime encryption secret ${runtimeSecretName} in namespace ${k8sDomainNamespace}`;
          deleteErrorMessage = `Failed to delete runtime encryption secret ${runtimeSecretName} in namespace ${k8sDomainNamespace}`;
          this.adapter.addCreateRuntimeSecretBlock(comment, kubectlExe, targetDomainLocation, runtimeSecretName,
            k8sDomainNamespace, runtimeSecretData, createErrorMessage, deleteErrorMessage, replaceMessage);
        }

        comment = [ 'Create WebLogic domain credentials secret.' ];
        const domainSecretName = this.adapter.getVariableReference('DOMAIN_SECRET_NAME');
        const domainSecretData = {
          username: this.adapter.getVariableReference('DOMAIN_SECRET_USER'),
          password: this.adapter.getVariableReference('DOMAIN_SECRET_PASS')
        };
        createErrorMessage = `Failed to create WebLogic domain credentials secret ${domainSecretName} in namespace ${k8sDomainNamespace}`;
        replaceMessage = `Replacing existing WebLogic domain credentials secret ${domainSecretName} in namespace ${k8sDomainNamespace}`;
        deleteErrorMessage = `Failed to delete WebLogic domain credentials secret ${domainSecretName} in namespace ${k8sDomainNamespace}`;
        this.adapter.addCreateGenericSecretBlock(comment, kubectlExe, domainSecretName, k8sDomainNamespace,
          domainSecretData, createErrorMessage, deleteErrorMessage, replaceMessage);

        if (this.isModelInImage() && this.project.k8sDomain.secrets.value && this.project.k8sDomain.secrets.value.length > 0) {
          for (const secretEntry of this.project.k8sDomain.secrets.value) {
            const name = this.adapter.getVariableReference(getSecretVariableName(secretEntry.name, 'NAME'));
            const data = {
              username: this.adapter.getVariableReference(getSecretVariableName(secretEntry.name, 'USER')),
              password: this.adapter.getVariableReference(getSecretVariableName(secretEntry.name, 'PASS'))
            };
            createErrorMessage = `Failed to create secret ${secretEntry.name} in namespace ${k8sDomainNamespace}`;
            replaceMessage = `Replacing existing secret ${secretEntry.name} in namespace ${k8sDomainNamespace}`;
            deleteErrorMessage = `Failed to delete secret ${secretEntry.name} in namespace ${k8sDomainNamespace}`;
            comment = [ `Create the ${secretEntry.name} secret` ];
            this.adapter.addCreateGenericSecretBlock(comment, kubectlExe, name, k8sDomainNamespace, data,
              createErrorMessage, deleteErrorMessage, replaceMessage);
          }
        }

        if (this.isModelInImage() && this.configMapGenerator.shouldCreateConfigMap()) {
          const configMapName = this.project.k8sDomain.modelConfigMapName.value;
          const yamlFile = this.adapter.getVariableReference('DOMAIN_CONFIG_MAP_YAML');
          const errorMessage = `Failed to create domain ConfigMap ${configMapName}`;
          comment = [ `Create domain ConfigMap ${configMapName}` ];
          this.adapter.addKubectlApplyBlock(comment, kubectlExe, yamlFile, errorMessage);
        }

        const domainYamlFile = this.adapter.getVariableReference('DOMAIN_RESOURCE_YAML');
        const applyErrorMessage = 'Failed to create domain resource';
        comment = [ 'Create domain resource' ];
        this.adapter.addKubectlApplyBlock(comment, kubectlExe, domainYamlFile, applyErrorMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }
    }

    function getSecretVariableName(secretName, suffix) {
      return `${secretName.replace(/-/g, '_').toUpperCase()}_${suffix.toUpperCase()}`;
    }

    return K8sDomainScriptGenerator;
  }
);
