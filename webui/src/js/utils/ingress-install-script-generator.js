/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base', 'utils/helm-helper'],
  function(project, ScriptGeneratorBase, helmHelper) {
    const scriptDescription = [
      'This script installs an Kubernetes ingress controller and/or',
      'adds ingress routes to your application.'
    ];

    const dockerHubHost = 'docker.io';

    class IngressInstallScriptGenerator extends ScriptGeneratorBase {
      constructor(scriptType) {
        super(scriptType);
      }

      generate() {
        const httpsProxyUrl = this.project.getHttpsProxyUrl();
        const bypassProxyHosts = this.project.getBypassProxyHosts();

        this.adapter.addScriptHeader(scriptDescription);
        this.adapter.addVariableStartBanner();

        this.adapter.addKubectlVariablesBlock(this.project.kubectl.executableFilePath.value, httpsProxyUrl,
          bypassProxyHosts, this.project.kubectl.kubeConfig.value, this.project.kubectl.kubeConfigContextToUse.value,
          this.project.kubectl.helmExecutableFilePath.value);

        const helmChartDetails = helmHelper.getIngressHelmChartData(this.project.ingress.ingressControllerProvider.value);
        this.adapter.addVariableDefinition('INGRESS_CONTROLLER_TYPE', this.project.ingress.ingressControllerProvider.value);
        this.adapter.addVariableDefinition('INGRESS_REPO_NAME', helmChartDetails.repoName);
        this.adapter.addVariableDefinition('INGRESS_CHART_URL', helmChartDetails.chartUrl);
        this.adapter.addVariableDefinition('INGRESS_CHART_NAME', helmChartDetails.chartName);
        this.adapter.addVariableDefinition('INGRESS_RELEASE_NAME', this.project.ingress.ingressControllerName.value);
        this.adapter.addVariableDefinition('INGRESS_CONTROLLER_NAMESPACE', this.project.ingress.ingressControllerNamespace.value);
        this.adapter.addEmptyLine();

        if (this.project.ingress.ingressControllerProvider.value === 'voyager') {
          const voyagerCloudProvider =
            this.project.ingress.voyagerProviderMappedValue(this.project.ingress.voyagerProvider.value);
          this.adapter.addVariableDefinition('VOYAGER_PROVIDER', voyagerCloudProvider);
          this.adapter.addVariableDefinition('API_SERVER_ENABLE_HEALTH_CHECK', 'false');
          this.adapter.addVariableDefinition('API_SERVER_ENABLE_VALIDATING_WEBHOOK', 'false');
          this.adapter.addEmptyLine();
        }

        let comment = [
          'Voyager and Traefik ingress images are located in Docker Hub.',
          'Docker Hub is throttling anonymous pull requests.  To workaround',
          'that issue, Set this value to true and provide the appropriate',
          'values in this set of environment variables.'
        ];
        this.adapter.addVariableDefinition('USE_DOCKER_HUB_SECRET', this.project.ingress.specifyDockerRegSecret.value, comment);
        this.adapter.addVariableDefinition('USE_EXISTING_DOCKER_HUB_SECRET', !this.project.ingress.createDockerRegSecret.value);
        this.adapter.addVariableDefinition('DOCKER_HUB_SECRET_NAME', this.project.ingress.dockerRegSecretName.value);
        this.adapter.addVariableDefinition('DOCKER_HUB_USER', this.credentialMask);
        this.adapter.addVariableDefinition('DOCKER_HUB_PASS', this.credentialMask);
        const dockerRegImageCredentialReference =
          this.getImageRegistryCredential(this.project.ingress.dockerRegImageCredentialReference.value);
        const email =
          !!dockerRegImageCredentialReference ? (dockerRegImageCredentialReference.email || '') : '';
        this.adapter.addVariableDefinition('DOCKER_HUB_EMAIL', email);
        this.adapter.addEmptyLine();

        comment = [ 'If not using an external load balancer, the ingress controller service type to use (e.g., NodePort)' ];
        this.adapter.addVariableDefinition('SERVICE_TYPE',
          this._getOptionalScalarFieldValue(this.project.ingress.ingressServiceType), comment);
        this.adapter.addEmptyLine();

        comment = [ 'The number of minutes for the helm command to wait for completion (e.g., 10)' ];
        this.adapter.addVariableDefinition('HELM_TIMEOUT',
          this._getOptionalScalarFieldValue(this.project.ingress.helmTimeoutMinutes), comment);
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addKubectlExportAndUseContextBlock();

        comment = [ 'Create the namespace for the installation, if needed.' ];
        const kubectlExe = this.adapter.getVariableReference('KUBECTL_EXE');
        const ingressNamespace = this.adapter.getVariableReference('INGRESS_CONTROLLER_NAMESPACE');
        let createErrorMessage = `Failed to create namespace ${ingressNamespace}`;
        let alreadyExistsMessage = `Namespace ${ingressNamespace} already exists`;
        this.adapter.addCreateNamespaceBlock(comment, kubectlExe, ingressNamespace, createErrorMessage, alreadyExistsMessage);

        comment = [ 'Create Docker Hub credentials secret, if needed.' ];
        const useDockerHubSecret = this.adapter.getVariableReference('USE_DOCKER_HUB_SECRET');
        const useExistingDockerHubSecret = this.adapter.getVariableReference('USE_EXISTING_DOCKER_HUB_SECRET');
        const dockerHubSecretName = this.adapter.getVariableReference('DOCKER_HUB_SECRET_NAME');
        const dockerHubSecretData = {
          host: dockerHubHost,
          username: this.adapter.getVariableReference('DOCKER_HUB_USER'),
          password: this.adapter.getVariableReference('DOCKER_HUB_PASS'),
          email: this.adapter.getVariableReference('DOCKER_HUB_EMAIL')
        };
        createErrorMessage = `Failed to create pull secret ${dockerHubSecretName} in namespace ${ingressNamespace}`;
        let deleteErrorMessage = `Failed to delete pull secret ${dockerHubSecretName} in namespace ${ingressNamespace}`;
        let replaceMessage = `Replacing existing pull secret ${dockerHubSecretName} in namespace ${ingressNamespace}`;
        this.adapter.addCreatePullSecretBlock(comment, kubectlExe, dockerHubSecretName, ingressNamespace,
          dockerHubSecretData, createErrorMessage, deleteErrorMessage, replaceMessage, useDockerHubSecret,
          useExistingDockerHubSecret);

        comment = [ 'If using Voyager, add Helm chart value overrides' ];
        const ingressControllerType = this.adapter.getVariableReference('INGRESS_CONTROLLER_TYPE');
        const voyagerProvider = this.adapter.getVariableReference('VOYAGER_PROVIDER');
        const voyagerApiEnableHealthCheck = this.adapter.getVariableReference('API_SERVER_ENABLE_HEALTH_CHECK');
        const voyagerApiEnableWebhook = this.adapter.getVariableReference('API_SERVER_ENABLE_VALIDATING_WEBHOOK');
        this.adapter.addVoyagerHelmChartArgsBlock(comment, ingressControllerType, voyagerProvider,
          voyagerApiEnableHealthCheck, voyagerApiEnableWebhook);

        comment = [ 'If not using an external load balancer, set the service type for the ingress controller' ];
        const serviceType = this.adapter.getVariableReference('SERVICE_TYPE');
        this.adapter.addIngressServiceTypeArgBlock(comment, ingressControllerType, serviceType);

        comment = [ 'The number of minutes for the helm command to wait for completion (e.g., 10)' ];
        const helmTimeout = this.adapter.getVariableReference('HELM_TIMEOUT');
        this.adapter.addIngressHelmChartTimeoutArgBlock(comment, helmTimeout);

        comment = [ 'Add Docker Hub pull secret, if specified' ];
        this.adapter.addIngressHelmChartPullSecretArgBlock(comment, ingressControllerType, useDockerHubSecret,
          dockerHubSecretName);

        comment = [ 'Add or update the ingress controller helm chart in the local repository.' ];
        const helmExe = this.adapter.getVariableReference('HELM_EXE');
        const repoName = this.adapter.getVariableReference('INGRESS_REPO_NAME');
        const chartUrl = this.adapter.getVariableReference('INGRESS_CHART_URL');
        const addChartErrorMessage = `Failed to add ingress controller to the local repo ${repoName}`;
        this.adapter.addAddHelmChartToRepoBlock(comment, helmExe, repoName, chartUrl, addChartErrorMessage);

        comment = [ 'Install ingress controller.' ];
        const helmChartArgs = this.adapter.getVariableReference('HELM_CHART_ARGS');
        const chartName = this.adapter.getVariableReference('INGRESS_CHART_NAME');
        const installName = this.adapter.getVariableReference('INGRESS_RELEASE_NAME');
        const errorMessage = `Failed to install ${ingressControllerType} ingress controller to namespace ${ingressNamespace}`;
        const successMessage = `Installed ${ingressControllerType} ingress controller to namespace ${ingressNamespace}`;
        this.adapter.addHelmInstallBlock(comment, helmExe, installName, chartName, ingressNamespace, helmChartArgs,
          errorMessage, successMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }

      _getOptionalScalarFieldValue(property) {
        let result = '';
        if (this._isSet(property)) {
          result = property.value;
        }
        return result;
      }
    }

    return IngressInstallScriptGenerator;
  }
);
