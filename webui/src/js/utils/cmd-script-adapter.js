/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['utils/script-adapter-base'],
  function (ShellScriptBase) {
    const ECHO_OFF = '@ECHO OFF';
    const SET_LOCAL = '@SETLOCAL';
    const END_LOCAL = '@ENDLOCAL';
    const COMMENT_START = '@REM';

    const SCRIPT_EXIT_LABEL = 'exit_script';
    const SCRIPT_EXIT = `GOTO ${SCRIPT_EXIT_LABEL}`;

    class CmdScriptAdapter extends ShellScriptBase {
      constructor() {
        super();
        this.type = 'cmd';
        this.labelCount = 0;
      }

      getType() {
        return this.type;
      }

      addEchoLine(text) {
        this._lines.push(`ECHO ${text}`);
      }

      addVariableStartBanner() {
        super.addVariableStartBanner(`${COMMENT_START} #`);
      }

      addVariableEndBanner() {
        super.addVariableEndBanner(`${COMMENT_START} #`);
      }

      addScriptFooter() {
        const result =  [
          `:${SCRIPT_EXIT_LABEL}`,
          'IF DEFINED USE_CMD_EXIT (',
          `${this.indent(1)}EXIT %RETURN_CODE%`,
          ') ELSE (',
          `${this.indent(1)}EXIT /B %RETURN_CODE%`,
          ')',
          '',
          END_LOCAL,
          '',
          ''
        ];
        this._lines.push(...result);
      }

      addComment(comment, commentStart = COMMENT_START) {
        super.addComment(comment, commentStart);
      }

      addEnvironmentVariableDefinition(name, value, comment) {
        if (comment) {
          this.addComment(comment);
        }
        this._lines.push(`SET "${name}=${value}"`);
      }

      getEnvironmentVariableReference(name) {
        return `%${name}%`;
      }

      addVariableDefinition(name, value, comment) {
        this.addEnvironmentVariableDefinition(name, value, comment);
      }

      getVariableReference(name) {
        return this.getEnvironmentVariableReference(name);
      }

      addNotEmptyCollectArgsBlock(collectVarName, varRef, valuePrefix) {
        let value = `"${varRef}"`;
        if (valuePrefix) {
          value = `${valuePrefix}"${varRef}"`;
        }
        this._lines.push(
          `IF DEFINED ${this._getVariableNameFromReference(varRef)} (`,
          `${this.indent(1)}SET "${collectVarName}=${this.getVariableReference(collectVarName)} ${value}"`,
          ')',
          ''
        );
      }

      addIfEqualCollectArgsBlock(collectVarName, varRef, varValue, arg) {
        this._lines.push(
          `IF "${varRef}" == "${varValue}" (`,
          `${this.indent(1)}SET "${collectVarName}=${this.getVariableReference(collectVarName)} ${arg}"`,
          ')',
          ''
        );
      }

      addCollectArgs(collectVarName, ...args) {
        this._lines.push(`SET "${collectVarName}=${this.getVariableReference(collectVarName)} ${args.join(' ')}"`, '');
      }

      addDockerLoginBlock(requiresLogin, host, user, password, builder, loginErrorMessage) {
        this.addComment('Login to the Image Registry, if required');
        const args = `login --username "${user}" --password "${password}" ${host}`;
        const commandBlock = this._formatRunCommandBlock('', builder, args, loginErrorMessage);
        this._lines.push(
          `IF "${requiresLogin}" NEQ "true" (`,
          `${this.indent(1)}GOTO skip_docker_login`,
          ')',
          ...this._getNotDefinedIsErrorBlock(user,
            'Image registry requires authentication but the username was not defined.'),
          ...this._getNotDefinedIsErrorBlock(password,
            'Image registry requires authentication but the password was not defined.'),
          ...commandBlock,
          '',
          ':skip_docker_login'
        );
      }

      addKubectlUseContextBlock(kubectlExe, kubeContext) {
        const comment = 'Switch to configured kubectl context, if required.';
        const args = `config use-context ${kubeContext}`;
        const errMessage = `Failed to switch kubectl to use the context ${kubeContext}`;
        this.labelCount++;
        const labelName = `skip_kubectl_use_context_${this.labelCount}`;
        this._lines.push(
          `IF NOT DEFINED ${this._getVariableNameFromReference(kubeContext)} (`,
          `${this.indent(1)}GOTO ${labelName}`,
          ')',
          '',
          ...this._formatRunCommandBlock(comment, kubectlExe, args, errMessage),
          '',
          `:${labelName}`,
          ''
        );
      }

      addWitPatchArgsBlock(collectVarName, oraclePsuPatchArg, oraclePatchesArg, oracleSupportUser, oracleSupportPass) {
        this.addVariableDefinition('PATCH_ARGS', '');
        this.addNotEmptyCollectArgsBlock('PATCH_ARGS', oraclePsuPatchArg);
        this.addNotEmptyCollectArgsBlock('PATCH_ARGS', oraclePatchesArg, '--patches=');
        this._lines.push(
          'IF NOT DEFINED PATCH_ARGS (',
          `${this.indent(1)}GOTO skip_support_credentials`,
          ')',
          '',
          `IF DEFINED ${this._getVariableNameFromReference(oracleSupportUser)} (`,
          `${this.indent(1)}SET "PATCH_ARGS=${this.getVariableReference('PATCH_ARGS')} --user=${oracleSupportUser}"`,
          ') ELSE (',
          `${this.indent(1)}ECHO "Patching the Oracle Home requires the Oracle Support username field to be provided">&2`,
          `${this.indent(1)}SET RETURN_CODE=1`,
          `${this.indent(1)}${SCRIPT_EXIT}`,
          ')',
          '',
          `IF DEFINED ${this._getVariableNameFromReference(oracleSupportPass)} (`,
          `${this.indent(1)}SET "PATCH_ARGS=${this.getVariableReference('PATCH_ARGS')} ` +
          `--passwordEnv=${this._getVariableNameFromReference(oracleSupportPass)}"`,
          ') ELSE (',
          `${this.indent(1)}ECHO "Patching the Oracle Home requires the Oracle Support password field to be provided">&2`,
          `${this.indent(1)}SET RETURN_CODE=1`,
          `${this.indent(1)}${SCRIPT_EXIT}`,
          ')',
          ''
        );
        this.addCollectArgs(collectVarName, this.getVariableReference('PATCH_ARGS'));
        this.addEmptyLine();
        this._lines.push(':skip_support_credentials');
      }

      addWkoHelmChartValuesBlocks(comment, variableName, helmChartValues, wkoPullRequiresAuthentication) {
        if (comment) {
          this.addComment(comment);
        }

        const variableRef = this.getVariableReference(variableName);
        const serviceAccountLines = [
          `IF "${helmChartValues.serviceAccount}" NEQ "" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set serviceAccount=${helmChartValues.serviceAccount}"`,
          ')'
        ];

        const strategyLines = [
          `IF "${helmChartValues.domainNamespaceSelectionStrategy}" EQU "LabelSelector" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set domainNamespaceLabelSelector=${helmChartValues.domainNamespaceLabelSelector}"`,
          ') ELSE (',
          `${this.indent(1)}IF "${helmChartValues.domainNamespaceSelectionStrategy}" EQU "List" (`,
          `${this.indent(2)}IF "${helmChartValues.domainNamespaces}" NEQ "" (`,
          `${this.indent(3)}SET "${variableName}=${variableRef} --set domainNamespaces=${helmChartValues.domainNamespaces}"`,
          `${this.indent(2)})`,
          `${this.indent(1)}) ELSE (`,
          `${this.indent(2)}IF "${helmChartValues.domainNamespaceSelectionStrategy}" EQU "RegExp" (`,
          `${this.indent(3)}SET "${variableName}=${variableRef} --set domainNamespaceRegExp=${helmChartValues.domainNamespaceRegExp}"`,
          `${this.indent(2)})`,
          `${this.indent(1)})`,
          ')'
        ];

        const pullSecretsLines = [
          `IF "${wkoPullRequiresAuthentication}" EQU "true" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set imagePullSecrets=${helmChartValues.imagePullSecrets}"`,
          ')'
        ];

        const roleBindingLines = [
          `IF "${helmChartValues.enableClusterRoleBinding}" EQU "true" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set enableClusterRoleBinding=${helmChartValues.enableClusterRoleBinding}"`,
          ')'
        ];

        const pullPolicyLines = [
          `IF "${helmChartValues.imagePullPolicy}" NEQ "" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set imagePullPolicy=${helmChartValues.imagePullPolicy}"`,
          ')'
        ];

        const externalRestLines = [
          `IF "${helmChartValues.externalRestEnabled}" EQU "true" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set externalRestEnabled=${helmChartValues.externalRestEnabled}"`,
          `${this.indent(1)}IF "${helmChartValues.externalRestHttpsPort}" NEQ "" (`,
          `${this.indent(2)}SET "${variableName}=${variableRef} --set externalRestHttpsPort=${helmChartValues.externalRestHttpsPort}"`,
          `${this.indent(1)})`,
          `${this.indent(1)}IF "${helmChartValues.externalRestIdentitySecret}" NEQ "" (`,
          `${this.indent(2)}SET "${variableName}=${variableRef} --set externalRestIdentitySecret=${helmChartValues.externalRestIdentitySecret}"`,
          `${this.indent(1)})`,
          ')'
        ];

        const elkIntegrationLines = [
          `IF "${helmChartValues.elkIntegrationEnabled}" EQU "true" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set elkIntegrationEnabled=${helmChartValues.elkIntegrationEnabled}"`,
          `${this.indent(1)}IF "${helmChartValues.logStashImage}" NEQ "" (`,
          `${this.indent(2)}SET "${variableName}=${variableRef} --set logStashImage=${helmChartValues.logStashImage}"`,
          `${this.indent(1)})`,
          `${this.indent(1)}IF "${helmChartValues.elasticSearchHost}" NEQ "" (`,
          `${this.indent(2)}SET "${variableName}=${variableRef} --set elasticSearchHost=${helmChartValues.elasticSearchHost}"`,
          `${this.indent(1)})`,
          `${this.indent(1)}IF "${helmChartValues.elasticSearchPort}" NEQ "" (`,
          `${this.indent(2)}SET "${variableName}=${variableRef} --set elasticSearchPort=${helmChartValues.elasticSearchPort}"`,
          `${this.indent(1)})`,
          ')'
        ];

        const javaLoggingLines = [
          `IF "${helmChartValues.javaLoggingLevel}" NEQ "" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set javaLoggingLevel=${helmChartValues.javaLoggingLevel}"`,
          ')',
          `IF "${helmChartValues.javaLoggingFileSizeLimit}" NEQ "" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set javaLoggingFileSizeLimit=${helmChartValues.javaLoggingFileSizeLimit}"`,
          ')',
          `IF "${helmChartValues.javaLoggingFileCount}" NEQ "" (`,
          `${this.indent(1)}SET "${variableName}=${variableRef} --set javaLoggingFileCount=${helmChartValues.javaLoggingFileCount}"`,
          ')'
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
        const labelArgs = `label --overwrite namespace ${k8sDomainNamespace} ${wkoNamespaceSelector}`;
        const labelBlock = this._formatRunCommandBlock('', kubectlExe, labelArgs, labelErrorMessage);
        this.labelCount++;
        const labelLabel = `label_namespace_${this.labelCount}`;
        const skipLabel = `skip_label_namespace_${this.labelCount}`;

        this.addVariableDefinition('HELM_CHART_ARGS', '', comment);
        this._lines.push(
          `IF "${wkoNamespaceStrategy}" EQU "LabelSelector" (`,
          `${this.indent(1)}GOTO ${labelLabel}`,
          ')',
          `IF "${wkoNamespaceStrategy}" EQU "List" (`,
          `${this.indent(1)}$HELM_CHART_ARGS="--set domainNamespaces=${wkoDomainNamespaces}"`,
          `${this.indent(1)}GOTO ${skipLabel}`,
          ')',
          `IF "${wkoNamespaceStrategy}" EQU "Regexp" (`,
          `${this.indent(1)}ECHO ${regexStrategyMessage}`,
          `${this.indent(1)}GOTO ${skipLabel}`,
          ')',
          '',
          `:${labelLabel}`,
          '',
          ...labelBlock,
          '',
          `:${skipLabel}`,
          ''
        );
      }

      addNotEmptyVariableKubectlApplyBlock(comment, variableReference, kubectlExe, yamlFile, errorMessage, successMessage) {
        const args = `apply -f ${yamlFile}`;
        const runBlock = this._formatRunCommandBlock(comment, kubectlExe, args, errorMessage, successMessage);

        this._lines.push(
          `IF "${variableReference}" NEQ "" (`,
          ...this.prependToLines(this.indent(1), ...runBlock),
          ')',
          ''
        );
      }

      _formatScriptHeader(scriptDescription, copyright) {
        return [
          ECHO_OFF,
          '',
          ...this.prependToLines(COMMENT_START + ' ', ...scriptDescription),
          COMMENT_START,
          ...this.prependToLines(COMMENT_START + ' ', ...copyright),
          COMMENT_START,
          '',
          SET_LOCAL
        ];
      }

      _formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage) {
        if (comment) {
          this.addComment(comment);
        }

        const result = [
          `CALL "${commandReference}" ${args}`,
          'SET RETURN_CODE=%ERRORLEVEL%',
          'IF %RETURN_CODE% NEQ 0 (',
          `${this.indent(1)}ECHO ${errorMessage}>&2`,
          `${this.indent(1)}${SCRIPT_EXIT}`,
          ')'
        ];

        if (successMessage) {
          const successBlock = [
            ') ELSE (',
            `${this.indent(1)}ECHO ${successMessage}`,
            ')'
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
          `CALL "${commandReference}" ${args}`,
          'SET RETURN_CODE=%ERRORLEVEL%',
          'IF %RETURN_CODE% NEQ 0 (',
        ];

        if (notInstalledIsError) {
          result.push(
            `${this.indent(1)}ECHO ${notInstalledMessage}>&2`,
            `${this.indent(1)}${SCRIPT_EXIT}`
          );
        } else {
          result.push(`${this.indent(1)}ECHO ${notInstalledMessage}`);
        }
        result.push(') ELSE (');

        if (installedIsError) {
          result.push(
            `${this.indent(1)}ECHO ${installedMessage}>&2`,
            `${this.indent(1)}${SCRIPT_EXIT}`
          );
        } else {
          result.push(`${this.indent(1)}ECHO ${installedMessage}`);
        }
        result.push(')');
        return result;
      }

      _formatCreateReplaceBlock(comment, commandReference, options) {
        if (comment) {
          this.addComment(comment);
        }

        const hasDelete = options.deleteArguments && options.deleteErrorMessage;
        this.labelCount++;
        const labelName = (hasDelete ? 'delete' : 'skip') + `_${options.label}_${this.labelCount}`;
        const createLabelName = `create_${options.label}_${this.labelCount}`;
        const result = [
          `CALL "${commandReference}" ${options.getArguments}`,
          'SET RETURN_CODE=%ERRORLEVEL%',
          'IF %RETURN_CODE% EQU 0 (',
          `${this.indent(1)}ECHO ${options.alreadyExistsMessage}`,
          `${this.indent(1)}GOTO ${labelName}`,
          ') ELSE (',
          `${this.indent(1)}GOTO ${createLabelName}`,
          ')',
          ''
        ];

        if (hasDelete) {
          result.push(
            `:${labelName}`,
            '',
            `CALL "${commandReference}" ${options.deleteArguments}`,
            'SET RETURN_CODE=%ERRORLEVEL%',
            'IF %RETURN_CODE% NEQ 0 (',
            `${this.indent(1)}ECHO ${options.deleteErrorMessage}>&2`,
            `${this.indent(1)}${SCRIPT_EXIT}`,
            ')',
            ''
          );
        }
        result.push(
          `:${createLabelName}`,
          '',
          `CALL "${commandReference}" ${options.createArguments}`,
          'SET RETURN_CODE=%ERRORLEVEL%',
          'IF %RETURN_CODE% NEQ 0 (',
          `${this.indent(1)}ECHO ${options.createErrorMessage}>&2`,
          `${this.indent(1)}${SCRIPT_EXIT}`,
          ')'
        );

        if (!hasDelete) {
          result.push('', `:${labelName}`);
        }
        return result;
      }

      _formatCreateSecretBlock(comment, commandReference, options,  pullRequiresAuthentication, useExistingPullSecret) {
        const ifTest = !!pullRequiresAuthentication && !!useExistingPullSecret;
        const createBlock = this._formatCreateReplaceBlock(comment, commandReference, options);

        const result = [];
        if (ifTest) {
          this.labelCount++;
          const labelName = options.label ? `get_${options.label}_${this.labelCount}` : `get_pull_secret_${this.labelCount}`;
          result.push(
            `IF "${pullRequiresAuthentication}" EQU "true" (`,
            `${this.indent(1)}IF "${useExistingPullSecret}" EQU "false" (`,
            `${this.indent(2)}GOTO ${labelName}`,
            `${this.indent(1)})`,
            ')',
            `GOTO skip_${labelName}`,
            '',
            `:${labelName}`,
            '',
            ...createBlock,
            '',
            `:skip_${labelName}`
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
          `SET "${collectVariableName}="`,
          `IF "${ingressType}" EQU "Voyager" (`,
          `${this.indent(1)}IF "${options.cloudProvider}" NEQ "" (`,
          `${this.indent(2)}SET "${collectVariableName}=${collectVar} --set cloudProvider=${options.cloudProvider}"`,
          `${this.indent(1)})`,
          `${this.indent(1)}IF "${options['apiserver.healthcheck.enabled']}" NEQ "" (`,
          `${this.indent(2)}SET "${collectVariableName}=${collectVar} --set apiserver.healthcheck.enabled=${options['apiserver.healthcheck.enabled']}"`,
          `${this.indent(1)})`,
          `${this.indent(1)}IF "${options['apiserver.enableValidationWebhook']}" NEQ "" (`,
          `${this.indent(2)}SET "${collectVariableName}=${collectVar} --set apiserver.enableValidationWebhook=${options['apiserver.enableValidationWebhook']}"`,
          `${this.indent(1)})`,
          ')'
        ];
      }

      _formatIngressHelmChartPullSecretBlock(comment, collectVariableName, ingressType, useSecret, secretName) {
        if (comment) {
          this.addComment(comment);
        }

        const collectVar = this.getVariableReference(collectVariableName);
        return [
          `IF "${useSecret}" EQU "true" (`,
          `${this.indent(1)}IF "${ingressType}" EQU "Traefik" (`,
          `${this.indent(2)}SET "${collectVariableName}=${collectVar} --set deployment.imagePullSecrets[0].name=${secretName}"`,
          `${this.indent(1)}) ELSE (`,
          `${this.indent(2)}IF "${ingressType}" EQU "Voyager" (`,
          `${this.indent(3)}SET "${collectVariableName}=${collectVar} --set imagePullSecrets[0].name=${secretName}"`,
          `${this.indent(2)})`,
          `${this.indent(1)})`,
          ')'
        ];
      }

      _formatConditionalRunCommandBlock(comment, conditionVarRef, conditionValue, commandReference, args, errorMessage, successMessage) {
        const runBlock = this._formatRunCommandBlock(comment, commandReference, args, errorMessage, successMessage);
        this.labelCount++;
        const label = `skip_run_block_${this.labelCount}`;
        return [
          `IF "${conditionVarRef}" NEQ "${conditionValue}" (`,
          `${this.indent(1)}GOTO ${label}`,
          ')',
          ...runBlock,
          '',
          `:${label}`
        ];
      }

      _getNotDefinedIsErrorBlock(varRef, errorMessage, indentLevel = 1) {
        return [
          `IF NOT DEFINED ${varRef} (`,
          `${this.indent(indentLevel)}ECHO ${errorMessage}>&2`,
          `${this.indent(indentLevel)}SET RETURN_CODE=1`,
          `${this.indent(indentLevel)}${SCRIPT_EXIT}`,
          ')',
        ];
      }

      _getVariableNameFromReference(varRef) {
        return varRef.slice(1, -1);
      }
    }

    return CmdScriptAdapter;
  }
);
