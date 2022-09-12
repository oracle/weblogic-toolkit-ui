/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base'],
  function(project, ScriptGeneratorBase) {
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

        this.adapter.addVariableDefinition('VERRAZZANO_INSTALL_NAME', this.project.vzInstall.installationName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_COMPONENT_NAME', this.project.vzComponent.componentName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_CONFIG_MAP_COMPONENT_NAME', this.project.k8sDomain.modelConfigMapName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_RESOURCE_YAML', this.fillInFileNameMask);
        this.adapter.addVariableDefinition('VERRAZZANO_CONFIGMAP_RESOURCE_YAML', this.fillInFileNameMask);
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addKubectlExportAndUseContextBlock();
        const kubectlExe = this.adapter.getVariableReference('KUBECTL_EXE');
        const vzInstallName = this.adapter.getVariableReference('VERRAZZANO_INSTALL_NAME');

        let comment = [ 'Make sure that Verrazzano is already installed' ];
        const notInstalledMessage = 'Verrazzano is not installed';
        const alreadyInstalledMessage = 'Verrazzano is already installed';
        this.adapter.addVerrazzanoInstalledCheckBlock(comment, kubectlExe, vzInstallName,
          notInstalledMessage, alreadyInstalledMessage, true, false);

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
