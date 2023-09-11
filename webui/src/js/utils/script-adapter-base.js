/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define([],
  function () {
    function getCopyrightYear() {
      let copyrightYear = '2021';
      const currentYear = new Date().getFullYear();
      if (currentYear > 2021) {
        copyrightYear += `, ${currentYear}`;
      }
      return copyrightYear;
    }

    function formatPullSecretData(secretData) {
      const serverArgs = secretData.host ? `--docker-server=${secretData.host}` : '';
      return `${serverArgs} --docker-username=${secretData.username} --docker-password=${secretData.password} ` +
        `--docker-email=${secretData.email}`;
    }

    function formatTlsSecretData(secretData) {
      return `--key ${secretData.key} --cert ${secretData.cert}`;
    }

    const COPYRIGHT_LINES = [
      `Copyright (c) ${getCopyrightYear()}, Oracle and/or its affiliates.`,
      'Licensed under The Universal Permissive License (UPL), Version 1.0',
      'as shown at https://oss.oracle.com/licenses/upl/.'
    ];

    const COMMENT_START = '#';

    class ShellScriptBase {
      constructor() {
        this._tab = '    ';
        this._isWindows = window.api.process.isWindows();
        this.startUserVariableBlockText = 'Start user-defined variable section (edit as needed)';
        this.endUserVariableBlockText = 'End user-defined variable section (no edits needed below this line)';

        this._lines = [];
        this.type = undefined;
      }

      // Public APIs
      getType() {
        return this.type;
      }

      getScript() {
        return this._lines;
      }

      addEmptyLine() {
        this._lines.push('');
      }

      getExecutable(projectExe, defaultExe) {
        const shellType = this.getType();
        if (!this._isWindows && shellType === 'sh' && projectExe) {
          return projectExe;
        } else if (this._isWindows && shellType !== 'sh' && projectExe) {
          return projectExe;
        } else {
          return defaultExe;
        }
      }

      fixWktToolsShellScriptExtension(shellScriptName) {
        let result = shellScriptName;
        const currentExtension = window.api.path.extname(shellScriptName);
        if (this.getType() !== 'sh' && currentExtension === '.sh') {
          result = shellScriptName.slice(0, -2) + 'cmd';
        } else if (this.getType() === 'sh' && currentExtension === '.cmd') {
          result = shellScriptName.slice(0, -3) + 'sh';
        }
        return result;
      }

      getImageRegistryName(actualValue) {
        return actualValue ? actualValue : 'Docker Hub';
      }

      addScriptHeader(scriptDescription) {
        this._lines.push(...this._formatScriptHeader(scriptDescription, COPYRIGHT_LINES), '');
      }

      addVariableStartBanner(commentStart = COMMENT_START) {
        this._lines.push(...this._getCommentBanner(this.startUserVariableBlockText, commentStart), '');
      }

      addKubectlVariablesBlock(kubectlPath, httpsProxy, noProxy, kubeConfigPath, kubeContext, helmPath, openSslPath) {
        this.addVariableDefinition('KUBECTL_EXE', this.getExecutable(kubectlPath, 'kubectl'));
        if (helmPath !== undefined) {
          this.addVariableDefinition('HELM_EXE', this.getExecutable(helmPath, 'helm'));
        }
        if (openSslPath !== undefined) {
          this.addVariableDefinition('OPENSSL_EXE', this.getExecutable(openSslPath, 'openssl'));
        }
        this.addEmptyLine();

        let comment = [
          'Leave blank if using the default Kubernetes client config file or',
          'comment out this line if inheriting KUBECONFIG from the environment.'
        ];
        this.addEnvironmentVariableDefinition('KUBECONFIG', kubeConfigPath || '', comment);
        this.addEmptyLine();

        comment = [
          'Leave blank if no proxy is required or comment out this line if',
          'inheriting HTTPS_PROXY from the environment.'
        ];
        this.addEnvironmentVariableDefinition('HTTPS_PROXY', httpsProxy || '', comment);
        this.addEmptyLine();

        comment = [
          'Leave blank if no proxy bypass is required or comment out this',
          'line if inheriting NO_PROXY from the environment.'
        ];
        this.addEnvironmentVariableDefinition('NO_PROXY', noProxy || '', comment);
        this.addEmptyLine();

        comment = [
          'The cluster context in your KUBECONFIG file to use.',
          'Set to empty if switching context is not needed.'
        ];
        this.addVariableDefinition('KUBECTL_CONTEXT', kubeContext || '', comment);
        this.addEmptyLine();
      }

      addKubectlExportAndUseContextBlock() {
        this.addExportEnvironmentVariable('KUBECONFIG');
        this.addExportEnvironmentVariable('HTTPS_PROXY');
        this.addExportEnvironmentVariable('NO_PROXY');

        const kubectlExe = this.getVariableReference('KUBECTL_EXE');
        const kubeContext = this.getVariableReference('KUBECTL_CONTEXT');
        this.addKubectlUseContextBlock(kubectlExe, kubeContext);
      }

      addVariableEndBanner(commentStart = COMMENT_START) {
        this._lines.push(...this._getCommentBanner(this.endUserVariableBlockText, commentStart), '');
      }

      addScriptFooter() {
        this._lines.push('');
      }

      addComment(comment, commentStart = COMMENT_START) {
        if (Array.isArray(comment)) {
          this._lines.push(...this.prependToLines(commentStart + ' ', ...comment));
        } else {
          this._lines.push(`${commentStart} ${comment}`);
        }
      }

      // eslint-disable-next-line no-unused-vars
      addExportEnvironmentVariable(name) { /* nothing to do */ }

      addRunCommandBlock(comment, commandReference, args, errorMessage, successMessage) {
        this._lines.push(...this._formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage), '');
      }

      addWitCacheCommandBlock(comment, imageToolScript, installerType, installerPath, installerVersion, errorMessage) {
        const args =
          `cache addInstaller --force --type=${installerType} --path="${installerPath}" --version=${installerVersion}`;
        this.addRunCommandBlock(comment, imageToolScript, args, errorMessage);
      }

      addWitBaseImageArgsBlock(collectVarName, comment, tag, requiresLogin, host, user, password, builder, loginErrorMessage) {
        if (comment) {
          this.addComment(comment);
        }
        this.addNotEmptyCollectArgsBlock(collectVarName, tag);
        this.addDockerLoginBlock(requiresLogin, host, user, password, builder, loginErrorMessage);
      }

      addWitCreateWdtArgs(collectVarName, comment, wdtVersion, wdtTargetType, wdtDomainType, wdtDomainHome,
        wdtHome, wdtModelHome, modelFile, variableFile, archiveFile) {
        if (comment) {
          this.addComment(comment);
        }
        this.addCollectArgs(collectVarName, `--wdtVersion=${wdtVersion}`);
        this.addIfEqualCollectArgsBlock(collectVarName, wdtTargetType, 'mii', '--wdtModelOnly');
        this.addNotEmptyCollectArgsBlock(collectVarName, wdtDomainType, '--wdtDomainType=');
        this.addNotEmptyCollectArgsBlock(collectVarName, wdtDomainHome, '--wdtDomainHome=');
        this.addNotEmptyCollectArgsBlock(collectVarName, wdtHome, '--wdtHome=');
        this.addNotEmptyCollectArgsBlock(collectVarName, wdtModelHome, '--wdtModelHome=');
        this.addNotEmptyCollectArgsBlock(collectVarName, modelFile, '--wdtModel=');
        this.addNotEmptyCollectArgsBlock(collectVarName, variableFile, '--wdtVariables=');
        this.addNotEmptyCollectArgsBlock(collectVarName, archiveFile, '--wdtArchive=');
      }

      addWitCreateAuxImageWdtArgs(collectVarName, comment, wdtVersion, wdtHome, wdtModelHome, modelFile, variableFile, archiveFile) {
        if (comment) {
          this.addComment(comment);
        }
        this.addCollectArgs(collectVarName, `--wdtVersion=${wdtVersion}`);
        this.addNotEmptyCollectArgsBlock(collectVarName, wdtHome, '--wdtHome=');
        this.addNotEmptyCollectArgsBlock(collectVarName, wdtModelHome, '--wdtModelHome=');
        this.addNotEmptyCollectArgsBlock(collectVarName, modelFile, '--wdtModel=');
        this.addNotEmptyCollectArgsBlock(collectVarName, variableFile, '--wdtVariables=');
        this.addNotEmptyCollectArgsBlock(collectVarName, archiveFile, '--wdtArchive=');
      }

      addOperatorInstalledCheckBlock(comment, kubectlExe, wkoName, wkoNamespace, notInstalledMessage,
        alreadyInstalledMessage, notInstalledIsError, alreadyInstalledIsError) {
        const args = `get deployment ${wkoName} --namespace ${wkoNamespace}`;
        this._lines.push(...this._formatInstallCheckBlock(comment, kubectlExe, args, notInstalledMessage,
          alreadyInstalledMessage, notInstalledIsError, alreadyInstalledIsError), '');
      }

      addVerrazzanoInstalledCheckBlock(comment, kubectlExe, vzInstallName, notInstalledMessage,
        alreadyInstalledMessage, notInstalledIsError, alreadyInstalledIsError) {
        const args = `get verrazzano ${vzInstallName}`;
        this._lines.push(...this._formatInstallCheckBlock(comment, kubectlExe, args, notInstalledMessage,
          alreadyInstalledMessage, notInstalledIsError, alreadyInstalledIsError), '');
      }

      addVerrazzanoProjectCreateBlock(comment, kubectlExe, createProject, vzProjectYaml, errorMessage) {
        this.addVariableEqualValueKubectlApplyBlock(comment, createProject, 'true', kubectlExe, vzProjectYaml, errorMessage);
      }

      addCreateNamespaceBlock(comment, kubectlExe, namespace, createErrorMessage, alreadyExistsMessage) {
        const getArgs = `get namespace ${namespace}`;
        const createArgs = `create namespace ${namespace}`;
        this._lines.push(...this._formatCreateReplaceBlock(comment, kubectlExe, {
          label: 'namespace',
          getArguments: getArgs,
          createArguments: createArgs,
          createErrorMessage: createErrorMessage,
          alreadyExistsMessage: alreadyExistsMessage
        }), '');
      }

      addCreateServiceAccountBlock(comment, kubectlExe, serviceAccount, namespace, createErrorMessage, alreadyExistsMessage) {
        const getArgs = `get serviceaccount ${serviceAccount} --namespace ${namespace}`;
        const createArgs = `create serviceaccount ${serviceAccount} --namespace ${namespace}`;
        this._lines.push(...this._formatCreateReplaceBlock(comment, kubectlExe, {
          label: 'service_account',
          getArguments: getArgs,
          createArguments: createArgs,
          createErrorMessage: createErrorMessage,
          alreadyExistsMessage: alreadyExistsMessage
        }), '');
      }

      addCreatePullSecretBlock(comment, kubectlExe, pullSecretName, namespace, pullSecretData, createErrorMessage,
        deleteErrorMessage, replaceMessage, pullRequiresAuthentication, useExistingPullSecret) {
        const getArgs = `get secret ${pullSecretName} --namespace ${namespace}`;
        const createArgs = this._getPullSecretCommandArgs(pullSecretName, namespace, pullSecretData);
        const deleteArgs = `delete secret ${pullSecretName} --namespace ${namespace}`;
        this._lines.push(...this._formatCreateSecretBlock(comment, kubectlExe, {
          label: 'pull_secret',
          getArguments: getArgs,
          createArguments: createArgs,
          deleteArguments: deleteArgs,
          createErrorMessage: createErrorMessage,
          deleteErrorMessage: deleteErrorMessage,
          alreadyExistsMessage: replaceMessage
        }, pullRequiresAuthentication, useExistingPullSecret), '');
      }

      addCreateTlsSecretBlock(comment, kubectlExe, secretName, namespace, secretData, createErrorMessage,
        deleteErrorMessage, replaceMessage, useTlsSecret, useExistingSecret) {
        const getArgs = `get secret ${secretName} --namespace ${namespace}`;
        const createArgs = this._getTlsSecretCommandArgs(secretName, namespace, secretData);
        const deleteArgs = `delete secret ${secretName} --namespace ${namespace}`;
        this._lines.push(...this._formatCreateSecretBlock(comment, kubectlExe, {
          label: 'pull_secret',
          getArguments: getArgs,
          createArguments: createArgs,
          deleteArguments: deleteArgs,
          createErrorMessage: createErrorMessage,
          deleteErrorMessage: deleteErrorMessage,
          alreadyExistsMessage: replaceMessage
        }, useTlsSecret, useExistingSecret), '');

      }

      addCreateRuntimeSecretBlock(comment, kubectlExe, runtimeSecretName, k8sDomainNamespace,
        runtimeSecretData, createErrorMessage, deleteErrorMessage, replaceMessage) {
        const options = this.getGenericSecretOptions(runtimeSecretName, k8sDomainNamespace, runtimeSecretData,
          createErrorMessage, deleteErrorMessage, replaceMessage);
        this._lines.push(...this._formatCreateReplaceBlock(comment, kubectlExe, options), '');
      }

      addCreateOpssWalletPasswordSecretBlock(comment, kubectlExe, secretName, k8sDomainNamespace, secretData,
        createErrorMessage, deleteErrorMessage, replaceMessage) {
        const options = this.getGenericSecretOptions(secretName, k8sDomainNamespace, secretData,
          createErrorMessage, deleteErrorMessage, replaceMessage);
        this._lines.push(...this._formatCreateReplaceBlock(comment, kubectlExe, options), '');
      }

      addCreateGenericSecretBlock(comment, kubectlExe, secretName, secretNamespace, secretData, createErrorMessage,
        deleteErrorMessage, replaceMessage) {
        const options = this.getGenericSecretOptions(secretName, secretNamespace, secretData, createErrorMessage,
          deleteErrorMessage, replaceMessage);
        this._lines.push(...this._formatCreateReplaceBlock(comment, kubectlExe, options), '');
      }

      addKubectlApplyBlock(comment, kubectlExe, yamlFile, errorMessage) {
        const args = `apply -f "${yamlFile}"`;
        this._lines.push(...this._formatRunCommandBlock(comment, kubectlExe, args, errorMessage), '');
      }

      addVerrazzanoPlatformOperatorRolloutBlock(comment, kubectlExe, errorMessage) {
        const args = '-n verrazzano-install rollout status deployment/verrazzano-platform-operator';
        this._lines.push(...this._formatRunCommandBlock(comment, kubectlExe, args, errorMessage), '');
      }

      addVerrazzanoInstallWaitBlock(comment, kubectlExe, vzInstallName, vzInstallTimeout, errorMessage) {
        const args = `wait --timeout=${vzInstallTimeout} --for=condition=InstallComplete verrazzano/${vzInstallName}`;
        this._lines.push(...this._formatRunCommandBlock(comment, kubectlExe, args, errorMessage), '');
      }

      addAddHelmChartToRepoBlock(comment, helmExe, chartName, chartPath, addErrorMessage) {
        const args = `repo add ${chartName} ${chartPath} --force-update`;
        this._lines.push(...this._formatRunCommandBlock(comment, helmExe, args, addErrorMessage), '');
      }

      addHelmInstallBlock(comment, helmExe, repoName, chartName, namespace, helmChartArgs, errMessage, successMessage) {
        const args = `install ${repoName} ${chartName} --namespace ${namespace} ${helmChartArgs} --wait`;
        this._lines.push(...this._formatRunCommandBlock(comment, helmExe, args, errMessage, successMessage), '');
      }

      addHelmUpgradeBlock(comment, helmExe, repoName, chartName, namespace, helmUpgradeErrorMessage) {
        const helmChartArgs = this.getVariableReference('HELM_CHART_ARGS');
        const args = `upgrade ${repoName} ${chartName} --namespace ${namespace} --reuse-values ${helmChartArgs} --wait`;
        this._lines.push(...this._formatRunCommandBlock(comment, helmExe, args, helmUpgradeErrorMessage), '');
      }

      addVoyagerHelmChartArgsBlock(comment, ingressType, voyagerProvider, voyagerApiEnableHealthCheck, voyagerApiEnableWebhook) {
        const options = {
          cloudProvider: voyagerProvider,
          'apiserver.healthcheck.enabled': voyagerApiEnableHealthCheck,
          'apiserver.enableValidationWebhook': voyagerApiEnableWebhook
        };
        this._lines.push(...this._formatVoyagerHelmChartArgsBlock(comment, 'HELM_CHART_ARGS', ingressType, options), '');
      }

      addIngressServiceTypeArgBlock(comment, ingressControllerTypeArg, serviceTypeArg) {
        this.addHelmServiceTypeCollectArgsBlock(comment, 'HELM_CHART_ARGS', ingressControllerTypeArg, serviceTypeArg);
      }

      addIngressHelmChartTimeoutArgBlock(comment, timeoutArg) {
        this.addHelmTimeoutCollectArgsBlock(comment, 'HELM_CHART_ARGS', timeoutArg);
      }

      addIngressHelmChartPullSecretArgBlock(comment, ingressType, useSecret, secretName) {
        this._lines.push(...this._formatIngressHelmChartPullSecretBlock(comment, 'HELM_CHART_ARGS',
          ingressType, useSecret, secretName), '');
      }

      addConditionalGenerateCertificateBlock(comment, conditionVarRef, conditionValue, openSslExe, subject, certOutFile,
        keyOutFile, errorMessage, successMessage) {
        const args = `req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyOutFile}" -out "${certOutFile}" -subj "${subject}"`;
        this._lines.push(...this._formatConditionalRunCommandBlock(comment, conditionVarRef, conditionValue,
          openSslExe, args, errorMessage, successMessage), '');
      }

      addConditionalCreateNamespaceBlock(comment, conditionVarRef, conditionValue, kubectlExe, namespace,
        createErrorMessage, alreadyExistsMessage) {
        const args = `create ${namespace}`;
        this._lines.push(...this._formatConditionalRunCommandBlock(comment, conditionVarRef, conditionValue,
          kubectlExe, args, createErrorMessage, alreadyExistsMessage), '');
      }

      indent(numberOfLevels) {
        let indentString = '';
        if (numberOfLevels && numberOfLevels > 0) {
          indentString = this._tab.repeat(numberOfLevels) ;
        }
        return indentString;
      }

      prependToLines(prependText, ...lines) {
        if (!prependText) {
          return lines;
        }

        const result = [];
        for (const line of lines) {
          result.push(`${prependText}${line}`);
        }
        return result;
      }

      getGenericSecretOptions(secretName, secretNamespace, secretData, createErrorMessage, deleteErrorMessage, replaceMessage) {
        const createArgs = this.formatGenericSecretData(secretData);

        return {
          label: 'generic_secret',
          getArguments: `get secret ${secretName} --namespace ${secretNamespace}`,
          deleteArguments: `delete secret ${secretName} --namespace ${secretNamespace}`,
          createArguments: `create secret generic ${secretName} --namespace=${secretNamespace} ${createArgs}`,
          createErrorMessage: createErrorMessage,
          deleteErrorMessage: deleteErrorMessage,
          alreadyExistsMessage: replaceMessage
        };
      }

      formatGenericSecretData(secretData) {
        let args = '';
        for (const [key, value] of Object.entries(secretData)) {
          args += ` --from-literal=${key}=${value}`;
        }
        return args.trim();
      }

      formatTLSSecretData(key, cert) {
        let args = '';
        if (key) {
          args = `--key ${key}`;
        }
        if (cert) {
          args += ` --cert ${cert}`;
        }
        return args.trim();
      }

      /////////////////////////////////////////////////////////////////////////
      // Internal subclass APIs that must be overridden                      //
      /////////////////////////////////////////////////////////////////////////

      // eslint-disable-next-line no-unused-vars
      addVariableDefinition(name, value, comment) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addEnvironmentVariableDefinition(name, value, comment) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      getVariableReference(name) {
        return '';
      }

      // eslint-disable-next-line no-unused-vars
      addCollectArgs(collectVarName, ...args) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addHelmServiceTypeCollectArgsBlock(comment, collectVarName, ingressControllerTypeVarName, serviceTypeVarName) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addHelmTimeoutCollectArgsBlock(comment, collectVarName, timeoutVarRef) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addNotEmptyCollectArgsBlock(collectVarName, varRef, valuePrefix) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addIfEqualCollectArgsBlock(collectVarName, varRef, varValue, arg) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addDockerLoginBlock(requiresLogin, host, user, password, builder, loginErrorMessage) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addKubectlUseContextBlock(kubectlExe, kubeContext) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addNotEmptyVariableKubectlApplyBlock(comment, variableReference, kubectlExe, yamlFile, errorMessage, successMessage) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      addVariableEqualValueKubectlApplyBlock(comment, variableReference, variableValue, kubectlExe, yamlFile, errorMessage, successMessage) {
        /* subclasses must implement. */
      }

      // eslint-disable-next-line no-unused-vars
      _formatScriptHeader(scriptDescription, copyright) {
        return [];
      }

      // eslint-disable-next-line no-unused-vars
      _formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage) {
        return [];
      }

      // eslint-disable-next-line no-unused-vars
      _formatInstallCheckBlock(comment, commandReference, args, notInstalledMessage, alreadyInstalledMessage,
        notInstalledIsError, alreadyInstalledIsError) { // eslint-disable-line no-unused-vars
        return [];
      }

      // eslint-disable-next-line no-unused-vars
      _formatCreateReplaceBlock(comment, commandReference, options) {
        return [];
      }

      // eslint-disable-next-line no-unused-vars
      _formatCreateSecretBlock(comment, commandReference, options,  pullRequiresAuthentication, useExistingPullSecret) {
        return [];
      }

      // eslint-disable-next-line no-unused-vars
      _formatVoyagerHelmChartArgsBlock(comment, collectVariableName, ingressType, options) {
        return [];
      }

      // eslint-disable-next-line no-unused-vars
      _formatIngressHelmChartPullSecretBlock(comment, collectVariableName, ingressType, useSecret, secretName) {
        return [];
      }

      // eslint-disable-next-line no-unused-vars
      _formatConditionalRunCommandBlock(comment, conditionVarRef, conditionValue, commandReference, args,
        errorMessage, successMessage) { // eslint-disable-line no-unused-vars
        return [];
      }

      /////////////////////////////////////////////////////////////////////////
      // Internal APIs                                                       //
      /////////////////////////////////////////////////////////////////////////

      _getCommentBanner(comment, commentStart) {
        const lineLength = 79;

        const result = [];
        result.push(`${commentStart}${'#'.repeat(lineLength)}`);
        result.push(...this._formatBannerComment(comment, commentStart, '#', lineLength));
        result.push(`${commentStart}${'#'.repeat(lineLength)}`);
        return result;
      }

      _formatBannerComment(comment, commentStart, commentEnd, lineLengthWithoutCommentStart) {
        const result = [];
        if (comment) {
          const commentArray = Array.isArray(comment) ? comment : [ comment ];
          for (const commentLine of commentArray) {
            let line = `${commentStart} ${commentLine}`;
            const numSpaces = lineLengthWithoutCommentStart - commentLine.length - 2;
            if (numSpaces < 1) {
              throw new Error(`Banner comment line [${commentLine}] is too long for banner`);
            }
            line += `${' '.repeat(numSpaces)}#`;
            result.push(line);
          }
        }
        return result;
      }

      _getVariableNameFromReference(varRef) {
        return varRef.slice(1);
      }

      _getPullSecretCommandArgs(secretName, secretNamespace, secretData) {
        const args = formatPullSecretData(secretData);
        return `create secret docker-registry ${secretName} --namespace ${secretNamespace} ${args}`;
      }

      _getTlsSecretCommandArgs(secretName, secretNamespace, secretData) {
        const args = formatTlsSecretData(secretData);
        return `create secret tls ${secretName} --namespace ${secretNamespace} ${args}`;
      }
    }

    return ShellScriptBase;
  }
);
