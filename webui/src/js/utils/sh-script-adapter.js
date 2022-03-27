/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['utils/script-adapter-base'],
  function (ShellScriptBase) {
    const SHEBANG = '#!/usr/bin/env sh';
    const COMMENT_START = '# ';

    class ShScriptAdapter extends ShellScriptBase {
      constructor() {
        super();
        this.type = 'sh';
      }

      getType() {
        return this.type;
      }

      addEchoLine(text) {
        this._lines.push(`echo "${text}"`);
      }

      addEnvironmentVariableDefinition(name, value, comment) {
        if (comment) {
          this.addComment(comment);
        }

        const quotedValue = this._quoteArg(value);
        this._lines.push(`${name}="${quotedValue}"`);
      }

      getEnvironmentVariableReference(name) {
        return '${' + name + '}';
      }

      addVariableDefinition(name, value, comment) {
        this.addEnvironmentVariableDefinition(name, value, comment);
      }

      getVariableReference(name) {
        return this.getEnvironmentVariableReference(name);
      }

      addExportEnvironmentVariable(name) {
        const block = [
          `if [ "$${name}" != "" ]; then`,
          `${this.indent(1)}export ${name}`,
          'fi'
        ];
        this._lines.push(...block, '');
      }

      addNotEmptyCollectArgsBlock(collectVarName, varRef, valuePrefix) {
        let value = `"${varRef}"`;
        if (valuePrefix) {
          value = `${valuePrefix}\\"${varRef}\\"`;
        }
        this._lines.push(
          `if [ "${varRef}" != "" ]; then`,
          `${this.indent(1)}${collectVarName}="${this.getVariableReference(collectVarName)} ${value}"`,
          'fi',
          ''
        );
      }

      addIfEqualCollectArgsBlock(collectVarName, varRef, varValue, arg) {
        const quotedArg = this._quoteArg(arg);
        this._lines.push(
          `if [ "${varRef}" = "${varValue}" ]; then`,
          `${this.indent(1)}${collectVarName}="${this.getVariableReference(collectVarName)} ${quotedArg}"`,
          'fi',
          ''
        );
      }

      addCollectArgs(collectVarName, ...args) {
        const quotedArgs = this._quoteArg(args.join(' '));
        this._lines.push(`${collectVarName}="${this.getVariableReference(collectVarName)} ${quotedArgs}"`, '');
      }

      addDockerLoginBlock(requiresLogin, host, user, password, builder, loginErrorMessage) {
        this.addComment('Login to the Image Registry, if required');
        this._lines.push(
          `if [ "${requiresLogin}" = "true" ]; then`,
          `${this.indent(1)}if [ "${user}" != "" ] && [ "${password}" != "" ]; then`,
          `${this.indent(2)}if ! echo "${password}" | ${builder} login --username ${user} --password-stdin ${host}; then`,
          `${this.indent(3)}echo "${loginErrorMessage}">&2`,
          `${this.indent(3)}exit 1`,
          `${this.indent(2)}fi`,
          `${this.indent(1)}fi`,
          'fi',
          ''
        );
      }

      addKubectlUseContextBlock(kubectlExe, kubeContext) {
        this.addComment('Switch to configured kubectl context, if required.');
        this._lines.push(
          `if [ "${kubeContext}" != "" ]; then`,
          `${this.indent(1)}if ! "${kubectlExe}" config use-context ${kubeContext}; then`,
          `${this.indent(2)}echo "Failed to switch kubectl to use the context ${kubeContext}">&2`,
          `${this.indent(2)}exit 1`,
          `${this.indent(1)}fi`,
          'fi',
          ''
        );
      }

      addWitPatchArgsBlock(collectVarName, oraclePsuPatchArg, oraclePatchesArg, oracleSupportUser, oracleSupportPass) {
        this.addVariableDefinition('PATCH_ARGS', '');
        this.addNotEmptyCollectArgsBlock('PATCH_ARGS', oraclePsuPatchArg);
        this.addNotEmptyCollectArgsBlock('PATCH_ARGS', oraclePatchesArg, '--patches=');
        this._lines.push(
          'if [ "$PATCH_ARGS" != "" ]; then',
          `${this.indent(1)}if [ "${oracleSupportUser}" = "" ] || [ "${oracleSupportPass}" = "" ]; then`,
          `${this.indent(2)}echo "Patching the Oracle Home requires the Oracle Support username and password fields to be provided">&2`,
          `${this.indent(2)}exit 1`,
          `${this.indent(1)}else`,
          `${this.indent(2)}PATCH_ARGS="${this.getVariableReference('PATCH_ARGS')} --user=${oracleSupportUser}` +
          ` --passwordEnv=${this._getVariableNameFromReference(oracleSupportPass)}"`,
          `${this.indent(1)}fi`,
          'fi',
        );
        this.addCollectArgs(collectVarName, this.getVariableReference('PATCH_ARGS'));
      }

      addWkoHelmChartValuesBlocks(comment, variableName, helmChartValues, wkoPullRequiresAuthentication) {
        if (comment) {
          this.addComment(comment);
        }

        const variableRef = this.getVariableReference(variableName);
        const serviceAccountLines = [
          `if [ "${helmChartValues.serviceAccount}" != "" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set serviceAccount=${helmChartValues.serviceAccount}"`,
          'fi'
        ];

        const strategyLines = [
          `if [ "${helmChartValues.domainNamespaceSelectionStrategy}" = "LabelSelector" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set domainNamespaceLabelSelector=${helmChartValues.domainNamespaceLabelSelector}"`,
          `elif [ "${helmChartValues.domainNamespaceSelectionStrategy}" = "List" ] && [ "${helmChartValues.domainNamespaces}" != "" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set domainNamespaces=${helmChartValues.domainNamespaces}"`,
          `elif [ "${helmChartValues.domainNamespaceSelectionStrategy}" = "RegExp" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set domainNamespaceRegExp=${helmChartValues.domainNamespaceRegExp}"`,
          'fi'
        ];

        const pullSecretsLines = [
          `if [ "${wkoPullRequiresAuthentication}" = "true" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set imagePullSecrets=${helmChartValues.imagePullSecrets}"`,
          'fi'
        ];

        const roleBindingLines = [
          `if [ "${helmChartValues.enableClusterRoleBinding}" = "true" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set enableClusterRoleBinding=${helmChartValues.enableClusterRoleBinding}"`,
          'fi'
        ];

        const pullPolicyLines = [
          `if [ "${helmChartValues.imagePullPolicy}" != "" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set imagePullPolicy=${helmChartValues.imagePullPolicy}"`,
          'fi'
        ];

        const externalRestLines = [
          `if [ "${helmChartValues.externalRestEnabled}" = "true" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set externalRestEnabled=${helmChartValues.externalRestEnabled}"`,
          `${this.indent(1)}if [ "${helmChartValues.externalRestHttpsPort}" != "" ]; then`,
          `${this.indent(2)}${variableName}="${variableRef} --set externalRestHttpsPort=${helmChartValues.externalRestHttpsPort}"`,
          `${this.indent(1)}fi`,
          `${this.indent(1)}if [ "${helmChartValues.externalRestIdentitySecret}" != "" ]; then`,
          `${this.indent(2)}${variableName}="${variableRef} --set externalRestIdentitySecret=${helmChartValues.externalRestIdentitySecret}"`,
          `${this.indent(1)}fi`,
          'fi'
        ];

        const elkIntegrationLines = [
          `if [ "${helmChartValues.elkIntegrationEnabled}" = "true" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set elkIntegrationEnabled=${helmChartValues.elkIntegrationEnabled}"`,
          `${this.indent(1)}if [ "${helmChartValues.logStashImage}" != "" ]; then`,
          `${this.indent(2)}${variableName}="${variableRef} --set logStashImage=${helmChartValues.logStashImage}"`,
          `${this.indent(1)}fi`,
          `${this.indent(1)}if [ "${helmChartValues.elasticSearchHost}" != "" ]; then`,
          `${this.indent(2)}${variableName}="${variableRef} --set elasticSearchHost=${helmChartValues.elasticSearchHost}"`,
          `${this.indent(1)}fi`,
          `${this.indent(1)}if [ "${helmChartValues.elasticSearchPort}" != "" ]; then`,
          `${this.indent(2)}${variableName}="${variableRef} --set elasticSearchPort=${helmChartValues.elasticSearchPort}"`,
          `${this.indent(1)}fi`,
          'fi'
        ];

        const javaLoggingLines = [
          `if [ "${helmChartValues.javaLoggingLevel}" != "" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set javaLoggingLevel=${helmChartValues.javaLoggingLevel}"`,
          'fi',
          `if [ "${helmChartValues.javaLoggingFileSizeLimit}" != "" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set javaLoggingFileSizeLimit=${helmChartValues.javaLoggingFileSizeLimit}"`,
          'fi',
          `if [ "${helmChartValues.javaLoggingFileCount}" != "" ]; then`,
          `${this.indent(1)}${variableName}="${variableRef} --set javaLoggingFileCount=${helmChartValues.javaLoggingFileCount}"`,
          'fi'
        ];

        const initialValue = `--set domainNamespaceSelectionStrategy=${helmChartValues.domainNamespaceSelectionStrategy}`;
        this.addVariableDefinition(variableName, initialValue);
        this._lines.push(
          ...strategyLines,
          '',
          ...serviceAccountLines,
          '',
          ...pullSecretsLines,
          '',
          ...roleBindingLines,
          '',
          ...pullPolicyLines,
          '',
          ...externalRestLines,
          '',
          ...elkIntegrationLines,
          '',
          ...javaLoggingLines,
          ''
        );
      }

      addUpdateOperatorForNamespaceBlock(comment, kubectlExe, k8sDomainNamespace, wkoNamespaceStrategy,
        wkoNamespaceSelector, labelErrorMessage, wkoDomainNamespaces, regexStrategyMessage) {
        const args = `label --overwrite namespace ${k8sDomainNamespace} ${wkoNamespaceSelector}`;
        const labelBlock = this._formatRunCommandBlock('', kubectlExe, args, labelErrorMessage);

        this.addVariableDefinition('HELM_CHART_ARGS', '', comment);
        this._lines.push(
          `if [ "${wkoNamespaceStrategy}" = "LabelSelector" ]; then`,
          ...this.prependToLines(this.indent(1), ...labelBlock),
          `elif [ "${wkoNamespaceStrategy}" = "List" ]; then`,
          `${this.indent(1)}HELM_CHART_ARGS="--set domainNamespaces=${wkoDomainNamespaces}"`,
          `elif [ "${wkoNamespaceStrategy}" = "Regexp" ]; then`,
          `${this.indent(1)}echo "${regexStrategyMessage}"`,
          'fi',
          ''
        );
      }

      _formatScriptHeader(scriptDescription, copyright) {
        return [
          SHEBANG,
          COMMENT_START,
          ...this.prependToLines(COMMENT_START, ...scriptDescription),
          COMMENT_START,
          ...this.prependToLines(COMMENT_START, ...copyright),
          COMMENT_START
        ];
      }

      _formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage) {
        if (comment) {
          this.addComment(comment);
        }

        const result = [
          `if ! "${commandReference}" ${args}; then`,
          `${this.indent(1)}echo "${errorMessage}">&2`,
          `${this.indent(1)}exit 1`,
          'fi'
        ];

        if (successMessage) {
          const successBlock = [
            'else',
            `${this.indent(1)}echo "${successMessage}"`,
            'fi'
          ];
          result.splice(-1, 1, ...successBlock);
        }
        return result;
      }

      _formatInstallCheckBlock(comment, commandReference, args, notInstalledMessage, installedMessage,
        notInstalledIsError, installedIsError) {
        if (comment) {
          this.addComment(comment);
        }

        const result = [
          `if ! "${commandReference}" ${args}; then`
        ];

        if (notInstalledIsError) {
          result.push(
            `${this.indent(1)}echo "${notInstalledMessage}">&2`,
            `${this.indent(1)}exit 1`
          );
        } else {
          result.push(`${this.indent(1)}echo "${notInstalledMessage}"`);
        }
        result.push('else');

        if (installedIsError) {
          result.push(
            `${this.indent(1)}echo "${installedMessage}">&2`,
            `${this.indent(1)}exit 1`
          );
        } else {
          result.push(`${this.indent(1)}echo "${installedMessage}"`);
        }
        result.push('fi');
        return result;
      }

      _formatCreateReplaceBlock(comment, commandReference, options) {
        if (comment) {
          this.addComment(comment);
        }

        const result = [
          `if ! "${commandReference}" ${options.getArguments}; then`,
          `${this.indent(1)}if ! "${commandReference}" ${options.createArguments}; then`,
          `${this.indent(2)}echo "${options.createErrorMessage}">&2`,
          `${this.indent(2)}exit 1`,
          `${this.indent(1)}fi`,
          'else',
          `${this.indent(1)}echo "${options.alreadyExistsMessage}"`,
          'fi'
        ];

        if (options.deleteArguments && options.deleteErrorMessage) {
          const elseBlock = [
            `${this.indent(1)}echo "${options.alreadyExistsMessage}"`,
            `${this.indent(1)}if ! "${commandReference}" ${options.deleteArguments}; then`,
            `${this.indent(2)}echo "${options.deleteErrorMessage}">&2`,
            `${this.indent(2)}exit 1`,
            `${this.indent(1)}fi`,
            `${this.indent(1)}if ! "${commandReference}" ${options.createArguments}; then`,
            `${this.indent(2)}echo "${options.createErrorMessage}">&2`,
            `${this.indent(2)}exit 1`,
            `${this.indent(1)}fi`,
            'fi'
          ];

          result.splice(-2, 2, ...elseBlock);
        }
        return result;
      }

      _formatCreateSecretBlock(comment, commandReference, options,  pullRequiresAuthentication, useExistingPullSecret) {
        const pullAuthTest = !!pullRequiresAuthentication ? `[ "${pullRequiresAuthentication}" = "true" ]` : '';
        const useExistingTest = !!useExistingPullSecret ? `[ "${useExistingPullSecret}" = "false" ]` : '';

        let ifTest;
        if (pullAuthTest) {
          ifTest = pullAuthTest;
        }
        if (useExistingTest) {
          if (ifTest) {
            ifTest += ` && ${useExistingTest}`;
          } else {
            ifTest = useExistingTest;
          }
        }
        const createBlock = this._formatCreateReplaceBlock(comment, commandReference, options);

        const result = [];
        if (ifTest) {
          result.push(
            `if ${ifTest}; then`,
            ...this.prependToLines(this.indent(1), ...createBlock),
            'fi'
          );
        } else {
          result.push(...createBlock);
        }
        return result;
      }

      _formatVoyagerHelmChartArgsBlock(comment, collectVariableName, ingressType, options) {
        if (comment) {
          this.addComment(comment);
        }

        const collectVar = this.getVariableReference(collectVariableName);
        return [
          `${collectVariableName}=""`,
          `if [ "${ingressType}" = "Voyager" ]; then`,
          `${this.indent(1)}if [ "${options.cloudProvider}" != "" ]; then `,
          `${this.indent(2)}${collectVariableName}="${collectVar} --set cloudProvider=${options.cloudProvider}"`,
          `${this.indent(1)}fi`,
          `${this.indent(1)}if [ "${options['apiserver.healthcheck.enabled']}" != "" ]; then `,
          `${this.indent(2)}${collectVariableName}="${collectVar} --set apiserver.healthcheck.enabled=${options['apiserver.healthcheck.enabled']}"`,
          `${this.indent(1)}fi`,
          `${this.indent(1)}if [ "${options['apiserver.enableValidationWebhook']}" != "" ]; then `,
          `${this.indent(2)}${collectVariableName}="${collectVar} --set apiserver.enableValidationWebhook=${options['apiserver.enableValidationWebhook']}"`,
          `${this.indent(1)}fi`,
          'fi'
        ];
      }

      _formatIngressHelmChartPullSecretBlock(comment, collectVariableName, ingressType, useSecret, secretName) {
        if (comment) {
          this.addComment(comment);
        }

        const collectVar = this.getVariableReference(collectVariableName);
        return [
          `if [ "${useSecret}" = "true" ]; then`,
          `${this.indent(1)}if [ "${ingressType}" = "Traefik" ]; then`,
          `${this.indent(2)}${collectVariableName}="${collectVar} --set deployment.imagePullSecrets[0].name=${secretName}"`,
          `${this.indent(1)}elif [ "${ingressType}" = "Voyager" ]; then`,
          `${this.indent(2)}${collectVariableName}="${collectVar} --set imagePullSecrets[0].name=${secretName}"`,
          `${this.indent(1)}fi`,
          'fi'
        ];
      }

      _formatConditionalRunCommandBlock(comment, conditionVarRef, conditionValue, commandReference, args,
        errorMessage, successMessage) {
        const runBlock = this._formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage);
        return [
          `if [ "${conditionVarRef}" = "${conditionValue}" ]; then`,
          ...this.prependToLines(this.indent(1), ...runBlock),
          'fi'
        ];
      }

      _quoteArg(arg) {
        let value = arg;
        if (typeof arg === 'string') {
          value = arg.replaceAll('"', '\\"');
        }
        return value;
      }
    }

    return ShScriptAdapter;
  }
);
