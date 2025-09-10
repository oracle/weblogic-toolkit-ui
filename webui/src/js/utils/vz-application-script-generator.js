/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base'],
  function(project, ScriptGeneratorBase) {
    const scriptDescription = [
      'This script deploys the Verrazzano application for this WebLogic domain into',
      'Kubernetes.  It depends on having the Kubernetes client configuration',
      'correctly configured to authenticate to the cluster with sufficient',
      'permissions to run the commands.'
    ];

    class VerrazzanoApplicationScriptGenerator extends ScriptGeneratorBase {
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

        const shouldCreateProject = this.project.vzApplication.useMultiClusterApplication.value &&
          this.project.vzApplication.createProject.value;
        this.adapter.addVariableDefinition('VERRAZZANO_INSTALL_NAME', this.project.vzInstall.installationName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_CREATE_PROJECT', shouldCreateProject);
        this.adapter.addVariableDefinition('VERRAZZANO_APPLICATION_NAME', this.project.vzApplication.applicationName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_PROJECT_NAME', this.project.vzApplication.projectName.value);
        this.adapter.addVariableDefinition('VERRAZZANO_RESOURCE_YAML', this.fillInFileNameMask);
        this.adapter.addVariableDefinition('VERRAZZANO_PROJECT_RESOURCE_YAML', this.fillInFileNameMask);
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

        comment = [ 'Create the Verrazzano Project, if needed' ];
        const createProject = this.adapter.getVariableReference('VERRAZZANO_CREATE_PROJECT');
        const vzProjectName = this.adapter.getVariableReference('VERRAZZANO_PROJECT_NAME');
        const vzProjectYaml = this.adapter.getVariableReference('VERRAZZANO_PROJECT_RESOURCE_YAML');
        let errorMessage = `Failed to create the Verrazzano project ${vzProjectName}`;
        this.adapter.addVerrazzanoProjectCreateBlock(comment, kubectlExe, createProject, vzProjectYaml, errorMessage);

        comment = [ 'Create the Verrazzano Application for the WebLogic Domain' ];
        const vzResourceYaml = this.adapter.getVariableReference('VERRAZZANO_RESOURCE_YAML');
        const vzApplicationName = this.adapter.getVariableReference('VERRAZZANO_APPLICATION_NAME');
        errorMessage = `Failed to create the Verrazzano application ${vzApplicationName}`;
        this.adapter.addKubectlApplyBlock(comment, kubectlExe, vzResourceYaml, errorMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }
    }

    return VerrazzanoApplicationScriptGenerator;
  }
);
