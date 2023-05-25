/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['utils/script-adapter-base'],
  function (ShellScriptBase) {
    const MULTI_LINE_CONMMENT_START = '<#';
    const MULTI_LINE_CONMMENT_END = '#>';
    const DESCRIPTION_HEADER = '.SYNOPSIS';
    const COPYRIGHT_HEADER = '.NOTES';

    class PowershellScriptAdapter extends ShellScriptBase {
      constructor() {
        super();
        this.type = 'ps1';
      }

      getType() {
        return this.type;
      }

      addEchoLine(text) {
        this._lines.push(`Write-Output "${text}"`);
      }

      addEnvironmentVariableDefinition(name, value, comment) {
        if (comment) {
          this.addComment(comment);
        }
        const quotedValue = this._quoteArg(value);
        this._lines.push(`$env:${name} = "${quotedValue}"`);
      }

      getEnvironmentVariableReference(name) {
        return `$env:${name}`;
      }

      addVariableDefinition(name, value, comment) {
        if (comment) {
          this.addComment(comment);
        }
        const quotedValue = this._quoteArg(value);
        this._lines.push(`$${name} = "${quotedValue}"`);
      }

      getVariableReference(name) {
        return `$${name}`;
      }

      addHelmServiceTypeCollectArgsBlock(comment, collectVarName, ingressControllerTypeVarRef, serviceTypeVarRef) {
        if (comment) {
          this.addComment(comment);
        }

        this._lines.push(
          `if ("${serviceTypeVarRef}" -ne "LoadBalancer") {`,
          `${this.indent(1)}if ("${ingressControllerTypeVarRef}" -eq "traefik") {`,
          `${this.indent(2)}$${collectVarName} = "${this.getVariableReference(collectVarName)} --set service.type=${serviceTypeVarRef}"`,
          `${this.indent(1)}elseif ("${ingressControllerTypeVarRef}" -eq "nginx) {"`,
          `${this.indent(2)}$${collectVarName} = "${this.getVariableReference(collectVarName)} --set controller.service.type=${serviceTypeVarRef}"`,
          `${this.indent(1)}}`,
          '}',
          ''
        );
      }

      addHelmTimeoutCollectArgsBlock(comment, collectVarName, timeoutVarRef) {
        if (comment) {
          this.addComment(comment);
        }

        this._lines.push(
          `if ("${timeoutVarRef}" -ne "") {`,
          `${this.indent(1)}$${collectVarName} = "${this.getVariableReference(collectVarName)} $(${timeoutVarRef})m"`,
          '}',
          ''
        );
      }

      addNotEmptyCollectArgsBlock(collectVarName, varRef, valuePrefix) {
        let value = `""${varRef}""`;
        if (valuePrefix) {
          value = `${valuePrefix}""${varRef}""`;
        }
        this._lines.push(
          `if ("${varRef}" -ne "") {`,
          `${this.indent(1)}$${collectVarName} = "${this.getVariableReference(collectVarName)} ${value}"`,
          '}',
          ''
        );
      }

      addIfEqualCollectArgsBlock(collectVarName, varRef, varValue, arg) {
        const quotedArg = this._quoteArg(arg);
        this._lines.push(
          `if ("${varRef}" -eq "${varValue}") {`,
          `${this.indent(1)}$${collectVarName} = "${this.getVariableReference(collectVarName)} ${quotedArg}"`,
          '}',
          ''
        );
      }

      addCollectArgs(collectVarName, ...args) {
        const quotedArgs = this._quoteArg(args.join(' '));
        this._lines.push(`$${collectVarName} = "${this.getVariableReference(collectVarName)} ${quotedArgs}"`, '');
      }

      addDockerLoginBlock(requiresLogin, host, user, password, builder, loginErrorMessage) {
        this.addComment('Login to the Image Registry, if required');
        const args = `login --username "${user}" --password "${password}" ${host}`;
        const commandBlock = this.prependToLines(this.indent(2),
          ...this._formatRunCommandBlock('', builder, args, loginErrorMessage));
        this._lines.push(
          `if ("${requiresLogin}" -eq "true") {`,
          `${this.indent(1)}if (("${user}" -ne "") -and ("${password}" -ne "")) {`,
          ...commandBlock,
          `${this.indent(1)}}`,
          '}',
          ''
        );
      }

      addKubectlUseContextBlock(kubectlExe, kubeContext) {
        this.addComment('Switch to configured kubectl context, if required.');
        const args = `config use-context ${kubeContext}`;
        const errMessage = `Failed to switch kubectl to use the context ${kubeContext}`;
        const commandBlock = this.prependToLines(this.indent(1),
          ...this._formatRunCommandBlock('', kubectlExe, args, errMessage));
        this._lines.push(
          `if ("${kubeContext}" -ne "") {`,
          ...commandBlock,
          '}',
          ''
        );
      }

      addWitPatchArgsBlock(collectVarName, oraclePsuPatchArg, oraclePatchesArg, oracleSupportUser, oracleSupportPass) {
        this.addVariableDefinition('PATCH_ARGS', '');
        this.addNotEmptyCollectArgsBlock('PATCH_ARGS', oraclePsuPatchArg);
        this.addNotEmptyCollectArgsBlock('PATCH_ARGS', oraclePatchesArg, '--patches=');
        this._lines.push(
          'if ("$PATCH_ARGS" -ne "") {',
          `${this.indent(1)}if (("${oracleSupportUser}" -eq "") -or ("${oracleSupportPass}" -eq "")) {`,
          `${this.indent(2)}Write-Error "Patching the Oracle Home requires the Oracle Support username and password fields to be provided"`,
          `${this.indent(2)}exit 1`,
          `${this.indent(1)}} else {`,
          `${this.indent(2)}$PATCH_ARGS = "${this.getVariableReference('PATCH_ARGS')} --user=${oracleSupportUser}` +
          ` --passwordEnv=${this._getEnvironmentVariableNameFromReference(oracleSupportPass)}"`,
          `${this.indent(1)}}`,
          '}',
        );
        this.addCollectArgs(collectVarName, this.getVariableReference('PATCH_ARGS'));
      }

      addWkoHelmChartValuesBlocks(comment, variableName, helmChartValues, wkoPullRequiresAuthentication) {
        if (comment) {
          this.addComment(comment);
        }

        const variableRef = this.getVariableReference(variableName);
        const serviceAccountLines = [
          `if ("${helmChartValues.serviceAccount}" -ne "") {`,
          `${this.indent(1)}${variableName} = "${variableRef} --set serviceAccount=${helmChartValues.serviceAccount}"`,
          '}'
        ];

        const strategyLines = [
          `if ("${helmChartValues.domainNamespaceSelectionStrategy}" -eq "LabelSelector") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set domainNamespaceLabelSelector=${helmChartValues.domainNamespaceLabelSelector}"`,
          `} elseif (("${helmChartValues.domainNamespaceSelectionStrategy}" -eq "List") -and ("${helmChartValues.domainNamespaces}" -ne "")) {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set domainNamespaces=${helmChartValues.domainNamespaces}"`,
          `} elseif ("${helmChartValues.domainNamespaceSelectionStrategy}" -eq "RegExp") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set domainNamespaceRegExp=${helmChartValues.domainNamespaceRegExp}"`,
          '}'
        ];

        const pullSecretsLines = [
          `if ("${wkoPullRequiresAuthentication}" -eq "true") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set imagePullSecrets=${helmChartValues.imagePullSecrets}"`,
          '}'
        ];

        const roleBindingLines = [
          `if ("${helmChartValues.enableClusterRoleBinding}" -eq "true") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set enableClusterRoleBinding=${helmChartValues.enableClusterRoleBinding}"`,
          '}'
        ];

        const pullPolicyLines = [
          `if ("${helmChartValues.imagePullPolicy}" -ne "") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set imagePullPolicy=${helmChartValues.imagePullPolicy}"`,
          '}'
        ];

        const externalRestLines = [
          `if ("${helmChartValues.externalRestEnabled}" -eq "true") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set externalRestEnabled=${helmChartValues.externalRestEnabled}"`,
          `${this.indent(1)}if ("${helmChartValues.externalRestHttpsPort}" -ne "") {`,
          `${this.indent(2)}$${variableName} = "${variableRef} --set externalRestHttpsPort=${helmChartValues.externalRestHttpsPort}"`,
          `${this.indent(1)}}`,
          `${this.indent(1)}if ("${helmChartValues.externalRestIdentitySecret}" -ne "") {`,
          `${this.indent(2)}$${variableName} = "${variableRef} --set externalRestIdentitySecret=${helmChartValues.externalRestIdentitySecret}"`,
          `${this.indent(1)}}`,
          '}'
        ];

        const elkIntegrationLines = [
          `if ("${helmChartValues.elkIntegrationEnabled}" -eq "true") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set elkIntegrationEnabled=${helmChartValues.elkIntegrationEnabled}"`,
          `${this.indent(1)}if ("${helmChartValues.logStashImage}" -ne "") {`,
          `${this.indent(2)}$${variableName} = "${variableRef} --set logStashImage=${helmChartValues.logStashImage}"`,
          `${this.indent(1)}}`,
          `${this.indent(1)}if ("${helmChartValues.elasticSearchHost}" -ne "") {`,
          `${this.indent(2)}$${variableName} = "${variableRef} --set elasticSearchHost=${helmChartValues.elasticSearchHost}"`,
          `${this.indent(1)}}`,
          `${this.indent(1)}if ("${helmChartValues.elasticSearchPort}" -ne "") {`,
          `${this.indent(2)}$${variableName} = "${variableRef} --set elasticSearchPort=${helmChartValues.elasticSearchPort}"`,
          `${this.indent(1)}}`,
          '}'
        ];

        const javaLoggingLines = [
          `if ("${helmChartValues.javaLoggingLevel}" -ne "") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set javaLoggingLevel=${helmChartValues.javaLoggingLevel}"`,
          '}',
          `if ("${helmChartValues.javaLoggingFileSizeLimit}" -ne "") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set javaLoggingFileSizeLimit=${helmChartValues.javaLoggingFileSizeLimit}"`,
          '}',
          `if ("${helmChartValues.javaLoggingFileCount}" -ne "") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --set javaLoggingFileCount=${helmChartValues.javaLoggingFileCount}"`,
          '}'
        ];

        const helmTimeoutLines = [
          `if ("${helmChartValues.timeout}" -ne "") {`,
          `${this.indent(1)}$${variableName} = "${variableRef} --timeout $(${helmChartValues.timeout})m"`,
          '}',
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
          '',
          ...helmTimeoutLines,
          ''
        );
      }

      addUpdateOperatorForNamespaceBlock(comment, kubectlExe, k8sDomainNamespace, wkoNamespaceStrategy,
        wkoNamespaceSelector, labelErrorMessage, wkoDomainNamespaces, regexStrategyMessage) {
        const args = `label --overwrite namespace ${k8sDomainNamespace} ${wkoNamespaceSelector}`;
        const labelBlock = this._formatRunCommandBlock('', kubectlExe, args, labelErrorMessage);

        this.addVariableDefinition('HELM_CHART_ARGS', '', comment);
        this._lines.push(
          `if ("${wkoNamespaceStrategy}" -eq "LabelSelector") {`,
          ...this.prependToLines(this.indent(1), ...labelBlock),
          `} elseif ("${wkoNamespaceStrategy}" -eq "List") {`,
          `${this.indent(1)}$HELM_CHART_ARGS="--set domainNamespaces=${wkoDomainNamespaces}"`,
          `} elseif ("${wkoNamespaceStrategy}" -eq "Regexp") {`,
          `${this.indent(1)}Write-Output "${regexStrategyMessage}"`,
          '}',
          ''
        );
      }

      addNotEmptyVariableKubectlApplyBlock(comment, variableReference, kubectlExe, yamlFile, errorMessage, successMessage) {
        const args = `apply -f ${yamlFile}`;
        const runBlock = this._formatRunCommandBlock(comment, kubectlExe, args, errorMessage, successMessage);

        this._lines.push(
          `if ("${variableReference}" -ne "") {`,
          ...this.prependToLines(this.indent(1), ...runBlock),
          '}',
          ''
        );
      }

      addVariableEqualValueKubectlApplyBlock(comment, variableReference, variableValue, kubectlExe, yamlFile, errorMessage, successMessage) {
        const args = `apply -f ${yamlFile}`;
        const runBlock = this._formatRunCommandBlock(comment, kubectlExe, args, errorMessage, successMessage);

        this._lines.push(
          `if ("${variableReference}" -eq "${variableValue}") {`,
          ...this.prependToLines(this.indent(1), ...runBlock),
          '}',
          ''
        );
      }

      _formatScriptHeader(scriptDescription, copyright) {
        return [
          MULTI_LINE_CONMMENT_START,
          `${this.indent(1)}${DESCRIPTION_HEADER}`,
          ...this.prependToLines(this.indent(1), ...scriptDescription),
          '',
          `${this.indent(1)}${COPYRIGHT_HEADER}`,
          ...this.prependToLines(this.indent(1), ...copyright),
          MULTI_LINE_CONMMENT_END
        ];
      }

      _formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage) {
        if (comment) {
          this.addComment(comment);
        }

        const quotedArgs = args.replaceAll('"', '""');
        const result = [
          `$proc = Start-Process -NoNewWindow -FilePath "${commandReference}" -ArgumentList "${quotedArgs}" -PassThru`,
          'Wait-Process -InputObject $proc',
          'if ($proc.ExitCode -ne 0) {',
          `${this.indent(1)}Write-Error "${errorMessage}"`,
          `${this.indent(1)}exit 1`,
          '}'
        ];

        if (successMessage) {
          const successBlock = [
            '} else {',
            `${this.indent(1)}Write-Output "${successMessage}"`,
            '}'
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

        const quotedArgs = args.replaceAll('"', '""');
        const result = [
          `$proc = Start-Process -NoNewWindow -FilePath "${commandReference}" -ArgumentList "${quotedArgs}" -PassThru`,
          'Wait-Process -InputObject $proc',
          'if ($proc.ExitCode -ne 0) {',
        ];

        if (notInstalledIsError) {
          result.push(
            `${this.indent(1)}Write-Error "${notInstalledMessage}"`,
            `${this.indent(1)}exit 1`
          );
        } else {
          result.push(`${this.indent(1)}Write-Output "${notInstalledMessage}"`);
        }
        result.push('} else {');

        if (installedIsError) {
          result.push(
            `${this.indent(1)}Write-Error "${installedMessage}"`,
            `${this.indent(1)}exit 1`
          );
        } else {
          result.push(`${this.indent(1)}Write-Output "${installedMessage}"`);
        }
        result.push('}');
        return result;
      }

      _formatCreateReplaceBlock(comment, commandReference, options) {
        if (comment) {
          this.addComment(comment);
        }

        const quotedGetArgs = options.getArguments.replaceAll('"', '""');
        const quotedCreateArgs = options.createArguments.replaceAll('"', '""');
        const result = [
          `$proc = Start-Process -NoNewWindow -FilePath "${commandReference}" -ArgumentList "${quotedGetArgs}" -PassThru`,
          'Wait-Process -InputObject $proc',
          'if ($proc.ExitCode -ne 0) {',
          `${this.indent(1)}$proc = Start-Process -NoNewWindow -FilePath "${commandReference}" -ArgumentList "${quotedCreateArgs}" -PassThru`,
          `${this.indent(1)}Wait-Process -InputObject $proc`,
          `${this.indent(1)}if ($proc.ExitCode -ne 0) {`,
          `${this.indent(2)}Write-Error "${options.createErrorMessage}"`,
          `${this.indent(2)}exit 1`,
          `${this.indent(1)}}`,
          '} else {',
          `${this.indent(1)}Write-Output "${options.alreadyExistsMessage}"`,
          '}'
        ];

        if (options.deleteArguments && options.deleteErrorMessage) {
          const quotedDeleteArgs = options.deleteArguments.replaceAll('"', '""');
          const elseBlock = [
            `${this.indent(1)}Write-Output "${options.alreadyExistsMessage}"`,
            `${this.indent(1)}$proc = Start-Process -NoNewWindow -FilePath "${commandReference}" -ArgumentList "${quotedDeleteArgs}" -PassThru`,
            `${this.indent(1)}Wait-Process -InputObject $proc`,
            `${this.indent(1)}if ($proc.ExitCode -ne 0) {`,
            `${this.indent(2)}Write-Error "${options.deleteErrorMessage}"`,
            `${this.indent(2)}exit 1`,
            `${this.indent(1)}}`,
            `${this.indent(1)}$proc = Start-Process -NoNewWindow -FilePath "${commandReference}" -ArgumentList "${quotedCreateArgs}" -PassThru`,
            `${this.indent(1)}Wait-Process -InputObject $proc`,
            `${this.indent(1)}if ($proc.ExitCode -ne 0) {`,
            `${this.indent(2)}Write-Error "${options.createErrorMessage}"`,
            `${this.indent(2)}exit 1`,
            `${this.indent(1)}}`,
            '}'
          ];
          result.splice(-2, 2, ...elseBlock);
        }
        return result;
      }

      _formatCreateSecretBlock(comment, commandReference, options,  pullRequiresAuthentication, useExistingPullSecret) {
        const pullAuthTest = !!pullRequiresAuthentication ? `"${pullRequiresAuthentication}" -eq "true"` : '';
        const useExistingTest = !!useExistingPullSecret ? `"${pullRequiresAuthentication}" -eq "false"` : '';

        let ifTest;
        if (pullAuthTest) {
          ifTest = pullAuthTest;
        }
        if (useExistingTest) {
          if (ifTest) {
            ifTest = `(${ifTest}) -and (${useExistingTest})`;
          } else {
            ifTest = useExistingTest;
          }
        }
        const createBlock = this._formatCreateReplaceBlock(comment, commandReference, options);

        const result = [];
        if (ifTest) {
          result.push(
            `if (${ifTest}) {`,
            ...this.prependToLines(this.indent(1), ...createBlock),
            '}'
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
          `$${collectVariableName} = ""`,
          `if ("${ingressType}" -eq "Voyager") {`,
          `${this.indent(1)}if ("${options.cloudProvider}" -ne "") {`,
          `${this.indent(2)}$${collectVariableName} = "${collectVar} --set cloudProvider=${options.cloudProvider}"`,
          `${this.indent(1)}}`,
          `${this.indent(1)}if ("${options['apiserver.healthcheck.enabled']}" -ne "") {`,
          `${this.indent(2)}$${collectVariableName} = "${collectVar} --set apiserver.healthcheck.enabled=${options['apiserver.healthcheck.enabled']}"`,
          `${this.indent(1)}}`,
          `${this.indent(1)}if ("${options['apiserver.enableValidationWebhook']}" -ne "") {`,
          `${this.indent(2)}$${collectVariableName} = "${collectVar} --set apiserver.enableValidationWebhook=${options['apiserver.enableValidationWebhook']}"`,
          `${this.indent(1)}}`,
          '}'
        ];
      }

      _formatIngressHelmChartPullSecretBlock(comment, collectVariableName, ingressType, useSecret, secretName) {
        if (comment) {
          this.addComment(comment);
        }

        const collectVar = this.getVariableReference(collectVariableName);
        return [
          `if ("${useSecret}" -eq "true") {`,
          `${this.indent(1)}if ("${ingressType}" -eq "Traefik") {`,
          `${this.indent(2)}$${collectVariableName} = "${collectVar} --set deployment.imagePullSecrets[0].name=${secretName}"`,
          `${this.indent(1)}} elseif ("${ingressType}" -eq "Voyager") {`,
          `${this.indent(2)}$${collectVariableName} = "${collectVar} --set imagePullSecrets[0].name=${secretName}"`,
          `${this.indent(1)}}`,
          '}'
        ];
      }

      _formatConditionalRunCommandBlock(comment, conditionVarRef, conditionValue, commandReference, args, errorMessage, successMessage) {
        const runBlock = this._formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage);
        return [
          `if ("${conditionVarRef}" -eq "${conditionValue}") {`,
          ...this.prependToLines(this.indent(1), ...runBlock),
          '}'
        ];
      }

      _quoteArg(arg) {
        let value = arg;
        if (typeof arg === 'string') {
          value = arg.replaceAll('"', '""');
        }
        return value;
      }

      _getEnvironmentVariableNameFromReference(envVarRef) {
        let result = envVarRef;
        if (envVarRef && envVarRef.startsWith('$env:')) {
          result = envVarRef.slice(5);
        }
        return result;
      }
    }

    return PowershellScriptAdapter;
  }
);
