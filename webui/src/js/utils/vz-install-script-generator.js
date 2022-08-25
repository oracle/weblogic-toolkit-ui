/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

const REPLACEMENT_TEXT = '@@RELEASE_VERSION_TAG@@';
const URL_TEMPLATE = `https://github.com/verrazzano/verrazzano/releases/download/${ REPLACEMENT_TEXT }/operator.yaml`;

define(['models/wkt-project', 'utils/script-generator-base'],
  function(project, ScriptGeneratorBase) {
    const scriptDescription = [
      'This script installs Verrazzano into Kubernetes.  It depends on having',
      'the Kubernetes client configuration correctly configured to authenticate',
      'to the cluster with sufficient permissions to run the commands.'
    ];

    class VerrazzanoInstallScriptGenerator extends ScriptGeneratorBase {
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

        this.adapter.addVariableDefinition('VERRAZZANO_INSTALL_NAME', this.project.vzInstall.installationName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_RELEASE_TAG', this.project.vzInstall.versionTag.value);
        this.adapter.addVariableDefinition('VERRAZZANO_INSTALL_WAIT_TIME', '20m');
        this.adapter.addVariableDefinition('VERRAZZANO_RESOURCE_YAML', this.fillInFileNameMask);
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addKubectlExportAndUseContextBlock();
        const kubectlExe = this.adapter.getVariableReference('KUBECTL_EXE');
        const vzInstallName = this.adapter.getVariableReference('VERRAZZANO_INSTALL_NAME');

        let comment = [ 'Make sure that Verrazzano is not already installed' ];
        const notInstalledMessage = 'Verrazzano is not installed';
        const alreadyInstalledMessage = 'Verrazzano is already installed';
        this.adapter.addVerrazzanoInstalledCheckBlock(comment, kubectlExe, vzInstallName,
          notInstalledMessage, alreadyInstalledMessage, false, true);

        this.adapter.addVariableDefinition('VERRAZZANO_OPERATOR_URL',
          this._getPlatformOperatorUrl(this.adapter.getVariableReference('VERRAZZANO_RELEASE_TAG')));
        comment = [ 'Install the Verrazzano Platform Operator version requested' ];
        let errorMessage = 'Failed to install the Verrazzano Platform Operator';
        const vzPlatformOperatorUrl = this.adapter.getVariableReference('VERRAZZANO_OPERATOR_URL');
        this.adapter.addKubectlApplyBlock(comment, kubectlExe, vzPlatformOperatorUrl, errorMessage);

        comment = [ 'Wait for the Verrazzano Platform Operator deployment to complete' ];
        errorMessage = 'Failed to verify the Verrazzano Platform Operator rollout status';
        this.adapter.addVerrazzanoPlatformOperatorRolloutBlock(comment, kubectlExe, errorMessage);

        comment = [ 'Start the Verrazzano installation' ];
        const vzResourceYaml = this.adapter.getVariableReference('VERRAZZANO_RESOURCE_YAML');
        errorMessage = 'Failed to start the Verrazzano installation';
        this.adapter.addKubectlApplyBlock(comment, kubectlExe, vzResourceYaml, errorMessage);

        comment = [ 'Wait for the Verrazzano installation to complete' ];
        const vzWaitTime = this.adapter.getVariableReference('VERRAZZANO_INSTALL_WAIT_TIME');
        errorMessage = 'Failed to determine if the Verrazzano installation has completed';
        this.adapter.addVerrazzanoInstallWaitBlock(comment, kubectlExe, vzInstallName, vzWaitTime, errorMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }

      _getPlatformOperatorUrl(releaseTagReference) {
        return URL_TEMPLATE.replace(REPLACEMENT_TEXT, releaseTagReference);
      }
    }

    return VerrazzanoInstallScriptGenerator;
  }
);
