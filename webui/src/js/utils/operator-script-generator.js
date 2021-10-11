/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base', 'utils/helm-helper'],
  function(project, ScriptGeneratorBase, helmHelper) {
    const scriptDescription = [
      'This script installs the WebLogic Kubernetes Operator into a Kubernetes cluster.',
      'It depends on having the Kubernetes client configuration correctly configured to',
      'authenticate to the cluster with sufficient permissions to run the installation.'
    ];

    class OperatorScriptGenerator extends ScriptGeneratorBase {
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

        this.adapter.addVariableDefinition('WKO_NAME', this.project.wko.wkoDeployName.value);
        this.adapter.addVariableDefinition('WKO_NAMESPACE', this.project.wko.k8sNamespace.value);
        this.adapter.addVariableDefinition('WKO_SERVICE_ACCOUNT', this.project.wko.k8sServiceAccount.value);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('WKO_IMAGE_TAG', this.project.wko.operatorImage.value);
        this.adapter.addVariableDefinition('WKO_PULL_REQUIRES_AUTHENTICATION',
          this.project.wko.operatorImagePullRequiresAuthentication.value);
        let comment = [ 'This field must not be empty if WKO_PULL_REQUIRES_AUTHENTICATION is set to true.' ];
        this.adapter.addVariableDefinition('WKO_PULL_SECRET_NAME', this.project.wko.operatorImagePullSecretName.value, comment);
        comment = [ 'Setting this to "false" will result in the secret being overwritten if it already exists.' ];
        this.adapter.addVariableDefinition('WKO_USE_EXISTING_PULL_SECRET',
          this.project.wko.operatorImagePullUseExistingSecret.value, comment);
        this.adapter.addEmptyLine();

        comment = [ 'This field must be set to match the registry address in the WKO_IMAGE_TAG value.' ];
        this.adapter.addVariableDefinition('WKO_PULL_HOST',
          this.project.wko.internal.operatorImagePullRegistryAddress.value, comment);
        this.adapter.addVariableDefinition('WKO_PULL_USER', this.project.wko.operatorImagePullRegistryUsername.value);
        this.adapter.addVariableDefinition('WKO_PULL_PASS', this.project.wko.operatorImagePullRegistryPassword.value);
        this.adapter.addVariableDefinition('WKO_PULL_EMAIL',
          this.project.wko.operatorImagePullRegistryEmailAddress.value);
        this.adapter.addEmptyLine();

        comment = [
          'Operator helm chart values',
          '',
          'Allowed values are LabelSelector, List, Regexp, Dedicated'
        ];
        // Note, the operator default is still List but the UI default is LabelSelector so this must be set.
        this.adapter.addVariableDefinition('WKO_DOMAIN_NAMESPACE_SELECTION_STRATEGY',
          this.project.wko.operatorDomainNamespaceSelectionStrategy.value, comment);
        this.adapter.addEmptyLine();

        this.adapter.addComment('Only used if WKO_DOMAIN_NAMESPACE_SELECTION_STRATEGY is set to LabelSelector.');
        let wkoLabelSelector = this.project.wko.operatorDomainNamespaceSelector.value;
        if (this.project.wko.operatorDomainNamespaceSelectionStrategy.value !== 'LabelSelector') {
          wkoLabelSelector = this._getOptionalScalarFieldValue(this.project.wko.operatorDomainNamespaceSelector);
        }
        this.adapter.addVariableDefinition('WKO_DOMAIN_NAMESPACE_LABEL_SELECTOR', wkoLabelSelector);
        this.adapter.addEmptyLine();

        comment = [
          'Only used if WKO_DOMAIN_NAMESPACE_SELECTION_STRATEGY is set to List.',
          'If set, the value must be of the form "{<name>[,<name>]*}"'
        ];
        const wkoDomainNamespaces = this._getOptionalArrayFieldValue(this.project.wko.operatorDomainNamespacesList).join(',');
        const domainNamespacesString = wkoDomainNamespaces ? `{${wkoDomainNamespaces}}` : '';
        this.adapter.addVariableDefinition('WKO_DOMAIN_NAMESPACES', domainNamespacesString, comment);
        this.adapter.addEmptyLine();

        comment = [ 'Only used if WKO_DOMAIN_NAMESPACE_SELECTION_STRATEGY is set to Regexp.' ];
        this.adapter.addVariableDefinition('WKO_DOMAIN_NAMESPACE_REGEX',
          this._getOptionalScalarFieldValue(this.project.wko.operatorDomainNamespaceRegex), comment);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('WKO_ENABLE_CLUSTER_ROLE_BINDING',
          this._getOptionalScalarFieldValue(this.project.wko.enableClusterRoleBinding));
        this.adapter.addVariableDefinition('WKO_IMAGE_PULL_POLICY',
          this._getOptionalScalarFieldValue(this.project.wko.operatorImagePullPolicy));
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('WKO_EXTERNAL_REST_ENABLED',
          this._getOptionalScalarFieldValue(this.project.wko.externalRestEnabled));
        comment = [ 'Only used if WKO_EXTERNAL_REST_ENABLED is set to true' ];
        this.adapter.addVariableDefinition('WKO_EXTERNAL_REST_HTTPS_PORT',
          this._getOptionalScalarFieldValue(this.project.wko.externalRestHttpsPort), comment);
        this.adapter.addVariableDefinition('WKO_EXTERNAL_REST_IDENTITY_SECRET',
          this._getOptionalScalarFieldValue(this.project.wko.externalRestIdentitySecret));
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('WKO_ELK_INTEGRATION_ENABLED',
          this._getOptionalScalarFieldValue(this.project.wko.elkIntegrationEnabled));
        comment = [ 'These three fields are only used if WKO_ELK_INTEGRATION_ENABLED is set to true.' ];
        this.adapter.addVariableDefinition('WKO_LOGSTASH_IMAGE',
          this._getOptionalScalarFieldValue(this.project.wko.logStashImage), comment);
        this.adapter.addVariableDefinition('WKO_ELASTICSEARCH_HOST',
          this._getOptionalScalarFieldValue(this.project.wko.elasticSearchHost));
        this.adapter.addVariableDefinition('WKO_ELASTICSEARCH_PORT',
          this._getOptionalScalarFieldValue(this.project.wko.elasticSearchPort));
        this.adapter.addEmptyLine();

        comment = [
          'Legal values are "SEVERE", "WARNING", "INFO", "CONFIG", "FINE", "FINER", and "FINEST".',
          'An empty value will use the default value of INFO.'
        ];
        this.adapter.addVariableDefinition('WKO_JAVA_LOGGING_LEVEL',
          this._getOptionalScalarFieldValue(this.project.wko.javaLoggingLevel), comment);
        comment = [ 'The maximum size in bytes for a single log file.' ];
        this.adapter.addVariableDefinition('WKO_JAVA_LOGGING_FILE_SIZE_LIMIT',
          this._getOptionalScalarFieldValue(this.project.wko.javaLoggingFileSizeLimit), comment);
        comment = [ 'The maximum number of retained log files.' ];
        this.adapter.addVariableDefinition('WKO_JAVA_LOGGING_FILE_COUNT',
          this._getOptionalScalarFieldValue(this.project.wko.javaLoggingFileCount), comment);
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        const wkoHelmChartData = helmHelper.getOperatorHelmChartData();
        this.adapter.addVariableDefinition('WKO_CHART_REPO_NAME', wkoHelmChartData.repoName);
        this.adapter.addVariableDefinition('WKO_CHART_NAME', wkoHelmChartData.chartName);
        this.adapter.addVariableDefinition('WKO_CHART_URL', wkoHelmChartData.chartUrl);
        this.adapter.addEmptyLine();

        this.adapter.addKubectlExportAndUseContextBlock();
        const kubectlExe = this.adapter.getVariableReference('KUBECTL_EXE');

        const wkoName = this.adapter.getVariableReference('WKO_NAME');
        const wkoNamespace = this.adapter.getVariableReference('WKO_NAMESPACE');
        const notInstalledMessage = `WebLogic Kubernetes Operator ${wkoName} is not installed in namespace ${wkoNamespace}`;
        const alreadyInstalledMessage = `WebLogic Kubernetes Operator ${wkoName} is already installed in namespace ${wkoNamespace}`;
        this.adapter.addOperatorInstalledCheckBlock('', kubectlExe, wkoName, wkoNamespace, notInstalledMessage,
          alreadyInstalledMessage, false, true);

        let createErrorMessage = `Failed to create namespace ${wkoNamespace}`;
        let alreadyExistsMessage = `Namespace ${wkoNamespace} already exists`;
        this.adapter.addCreateNamespaceBlock('', kubectlExe, wkoNamespace, createErrorMessage, alreadyExistsMessage);

        const wkoServiceAccount = this.adapter.getVariableReference('WKO_SERVICE_ACCOUNT');
        createErrorMessage = `Failed to create service account ${wkoServiceAccount}`;
        alreadyExistsMessage = `Service account ${wkoServiceAccount} already exists`;
        this.adapter.addCreateServiceAccountBlock('', kubectlExe, wkoServiceAccount, wkoNamespace, createErrorMessage,
          alreadyExistsMessage);

        const wkoPullRequiresAuthentication = this.adapter.getVariableReference('WKO_PULL_REQUIRES_AUTHENTICATION');
        const wkoUseExistingPullSecret = this.adapter.getVariableReference('WKO_USE_EXISTING_PULL_SECRET');
        const wkoPullSecretName = this.adapter.getVariableReference('WKO_PULL_SECRET_NAME');
        const wkoPullSecretData = {
          host: this.adapter.getVariableReference('WKO_PULL_HOST'),
          username: this.adapter.getVariableReference('WKO_PULL_USER'),
          password: this.adapter.getVariableReference('WKO_PULL_PASS'),
          email: this.adapter.getVariableReference('WKO_PULL_EMAIL')
        };
        createErrorMessage = `Failed to create pull secret ${wkoPullSecretName} in namespace ${wkoNamespace}`;
        const replaceMessage = `Replacing existing pull secret ${wkoPullSecretName} in namespace ${wkoNamespace}`;
        const deleteErrorMessage = `Failed to delete pull secret ${wkoPullSecretName} in namespace ${wkoNamespace}`;
        this.adapter.addCreatePullSecretBlock('', kubectlExe, wkoPullSecretName,
          wkoNamespace, wkoPullSecretData, createErrorMessage, deleteErrorMessage, replaceMessage,
          wkoPullRequiresAuthentication, wkoUseExistingPullSecret);

        const helmExe = this.adapter.getVariableReference('HELM_EXE');
        const wkoChartRepoName = this.adapter.getVariableReference('WKO_CHART_REPO_NAME');
        const wkoChartUrl = this.adapter.getVariableReference('WKO_CHART_URL');
        let errMessage = 'Failed to add WebLogic Kubernetes Operator helm chart to the local repo';
        this.adapter.addAddHelmChartToRepoBlock('', helmExe, wkoChartRepoName, wkoChartUrl, errMessage);

        comment = [ 'Prepare the Helm Chart values arguments.' ];
        const helmChartValues = this._gatherHelmChartArgs();
        this.adapter.addWkoHelmChartValuesBlocks(comment, 'HELM_CHART_ARGS', helmChartValues, wkoPullRequiresAuthentication);

        const wkoChartName = this.adapter.getVariableReference('WKO_CHART_NAME');
        const helmChartArgs = this.adapter.getVariableReference('HELM_CHART_ARGS');
        errMessage = `Failed to install WebLogic Kubernetes Operator ${wkoName} to namespace ${wkoNamespace}`;
        const successMessage = `Successfully installed WebLogic Kubernetes Operator ${wkoName} to namespace ${wkoNamespace}`;
        this.adapter.addHelmInstallBlock('', helmExe, wkoName, wkoChartName, wkoNamespace, helmChartArgs, errMessage, successMessage);

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

      _getOptionalArrayFieldValue(property) {
        let result = [];
        if (this._isSet(property)) {
          result = property.value;
        }
        return result;
      }

      _gatherHelmChartArgs() {
        return {
          domainNamespaceSelectionStrategy: this.adapter.getVariableReference('WKO_DOMAIN_NAMESPACE_SELECTION_STRATEGY'),
          domainNamespaceLabelSelector: this.adapter.getVariableReference('WKO_DOMAIN_NAMESPACE_LABEL_SELECTOR'),
          domainNamespaces: this.adapter.getVariableReference('WKO_DOMAIN_NAMESPACES'),
          domainNamespaceRegExp: this.adapter.getVariableReference('WKO_DOMAIN_NAMESPACE_REGEX'),
          imagePullSecrets: this.adapter.getVariableReference('WKO_PULL_SECRET_NAME'),
          enableClusterRoleBinding: this.adapter.getVariableReference('WKO_ENABLE_CLUSTER_ROLE_BINDING'),
          imagePullPolicy: this.adapter.getVariableReference('WKO_IMAGE_PULL_POLICY'),
          externalRestEnabled: this.adapter.getVariableReference('WKO_EXTERNAL_REST_ENABLED'),
          externalRestHttpsPort: this.adapter.getVariableReference('WKO_EXTERNAL_REST_HTTPS_PORT'),
          externalRestIdentitySecret: this.adapter.getVariableReference('WKO_EXTERNAL_REST_IDENTITY_SECRET'),
          elkIntegrationEnabled: this.adapter.getVariableReference('WKO_ELK_INTEGRATION_ENABLED'),
          logStashImage: this.adapter.getVariableReference('WKO_LOGSTASH_IMAGE'),
          elasticSearchHost: this.adapter.getVariableReference('WKO_ELASTICSEARCH_HOST'),
          elasticSearchPort: this.adapter.getVariableReference('WKO_ELASTICSEARCH_PORT'),
          javaLoggingLevel: this.adapter.getVariableReference('WKO_JAVA_LOGGING_LEVEL'),
          javaLoggingFileSizeLimit: this.adapter.getVariableReference('WKO_JAVA_LOGGING_FILE_SIZE_LIMIT'),
          javaLoggingFileCount: this.adapter.getVariableReference('WKO_JAVA_LOGGING_FILE_COUNT')
        };
      }

    }

    return OperatorScriptGenerator;
  }
);
