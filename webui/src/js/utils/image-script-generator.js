/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base'],
  function(project, ScriptGeneratorBase) {
    const primaryScriptDescription = [
      'This script uses the WebLogic Image Tool to generate a new primary image that will be',
      'used to start containers running an Oracle Fusion Middleware-based application.'
    ];

    const auxiliaryScriptDescription = [
      'This script uses the WebLogic Image Tool to generate a new auxiliary image that will be',
      'used to start containers running an Oracle Fusion Middleware-based application.'
    ];

    class ImageScriptGenerator extends ScriptGeneratorBase {
      constructor(scriptType) {
        super(scriptType);
      }

      generatePrimary() {
        const httpsProxyUrl = this.project.getHttpsProxyUrl();
        const bypassProxyHosts = this.project.getBypassProxyHosts();
        const requiresImagePushCredentials = this.project.image.imageRegistryPushRequireAuthentication.value;
        const usingCustomBaseImage = this.project.image.useCustomBaseImage.value;
        const requiresBaseImagePullCredentials = this.project.image.baseImagePullRequiresAuthentication.value;
        const requiresJdkInstaller = this._requiresJdkInstaller(usingCustomBaseImage);
        const requiresOracleInstaller = this._requiresOracleInstaller(usingCustomBaseImage);
        const usingWdt = this._usingWdt();
        const patchOracleHome = this._patchOracleHome(requiresOracleInstaller);
        const baseImageRegistryName = this.adapter.getImageRegistryName(this.project.image.internal.baseImageRegistryAddress.value);
        const imageRegistryName = this.adapter.getImageRegistryName(this.project.image.internal.imageRegistryAddress.value);

        const imageBuilderName = this.project.settings.builderType.value;
        const imageBuilderExe =
          this.adapter.getExecutable(this.project.settings.builderExecutableFilePath.value, imageBuilderName);
        const imageToolScript = this.adapter.fixWktToolsShellScriptExtension(this.project.getImageToolScript());

        this.adapter.addScriptHeader(primaryScriptDescription);
        if (!this.project.image.createPrimaryImage.value) {
          this.adapter.addEchoLine('Create New Primary Image is disabled...nothing to do');
          this.adapter.addEmptyLine();
          return this.adapter.getScript();
        }

        this.adapter.addVariableStartBanner();
        this.adapter.addEnvironmentVariableDefinition('DOCKER_BUILDKIT', '0');
        this.adapter.addEnvironmentVariableDefinition('WLSIMG_BLDDIR', this.getTempDirectoryEnvironmentVariableReference());
        this.adapter.addEnvironmentVariableDefinition('JAVA_HOME', this.project.settings.javaHome.value);
        this.adapter.addEmptyLine();

        let comment = [
          'Leave blank if no proxy is required or comment out this line if',
          'inheriting HTTPS_PROXY from the environment.'
        ];
        this.adapter.addEnvironmentVariableDefinition('HTTPS_PROXY', httpsProxyUrl, comment);
        this.adapter.addEmptyLine();

        comment = [
          'Leave blank if no proxy bypass is required or comment out this line if',
          'inheriting NO_PROXY from the environment.'
        ];
        this.adapter.addEnvironmentVariableDefinition('NO_PROXY', bypassProxyHosts);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('IMAGE_BUILDER_NAME', imageBuilderName);
        this.adapter.addVariableDefinition('IMAGE_BUILDER_EXE', imageBuilderExe);
        this.adapter.addVariableDefinition('IMAGETOOL_SCRIPT', imageToolScript);
        this.adapter.addVariableDefinition('IMAGE_TAG', this.project.image.imageTag.value);
        this.adapter.addVariableDefinition('ALWAYS_PULL_BASE_IMAGE', this.project.image.alwaysPullBaseImage.value);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('IMAGE_PUSH_REQUIRES_AUTH', requiresImagePushCredentials);
        if (requiresImagePushCredentials) {
          comment = 'The hostname of the image registry (leave empty for Docker Hub)';
          this.adapter.addVariableDefinition('IMAGE_REGISTRY_HOST',
            this.project.image.internal.imageRegistryAddress.value, comment);
          this.adapter.addVariableDefinition('IMAGE_REGISTRY_PUSH_USER', this.credentialMask);
          this.adapter.addVariableDefinition('IMAGE_REGISTRY_PUSH_PASS', this.credentialMask);
          this.adapter.addEmptyLine();
        }

        if (usingCustomBaseImage) {
          this.adapter.addVariableDefinition('BASE_IMAGE_TAG', this.project.image.baseImage.value);
          this.adapter.addVariableDefinition('BASE_IMAGE_PULL_REQUIRES_AUTH', requiresImagePushCredentials);
          if (requiresBaseImagePullCredentials) {
            comment = 'The image registry hostname for the base image (leave empty for Docker Hub)';
            this.adapter.addVariableDefinition('BASE_IMAGE_REGISTRY_HOST',
              this.project.image.internal.baseImageRegistryAddress.value, comment);
            this.adapter.addVariableDefinition('BASE_IMAGE_REGISTRY_PULL_USER', this.credentialMask);
            this.adapter.addVariableDefinition('BASE_IMAGE_REGISTRY_PULL_PASS', this.credentialMask);
          }
          this.adapter.addEmptyLine();
        }

        if (requiresJdkInstaller) {
          this.adapter.addVariableDefinition('JDK_INSTALLER', this.project.image.jdkInstaller.value);
          this.adapter.addVariableDefinition('JDK_VERSION', this.project.image.jdkInstallerVersion.value);
          this.adapter.addEmptyLine();
        }

        if (requiresOracleInstaller) {
          this.adapter.addVariableDefinition('ORACLE_INSTALLER', this.project.image.oracleInstaller.value);
          this.adapter.addVariableDefinition('ORACLE_VERSION', this.project.image.oracleInstallerVersion.value);
          this.adapter.addVariableDefinition('ORACLE_INSTALLER_TYPE', this.project.image.oracleInstallerType.value);
          this.adapter.addEmptyLine();
        }

        if (patchOracleHome) {
          this.adapter.addVariableDefinition('ORACLE_SUPPORT_USER', this.credentialMask);
          this.adapter.addEnvironmentVariableDefinition('ORACLE_SUPPORT_PASS', this.credentialMask);
          this.adapter.addVariableDefinition('ORACLE_PSU_PATCH_ARG', this._getOracleRecommendedPsuPatchArg());
          this.adapter.addVariableDefinition('ORACLE_PATCHES_ARG', this._getOraclePatchesArg());
          this.adapter.addEmptyLine();
        }

        if (usingWdt) {
          const wdtInstallerValue = this.project.image.wdtInstaller.value || this.fillMeInMask;
          const wdtInstallerVersion = this.project.image.wdtInstallerVersion.value || this.fillMeInMask;
          this.adapter.addVariableDefinition('WDT_INSTALLER', wdtInstallerValue);
          this.adapter.addVariableDefinition('WDT_VERSION', wdtInstallerVersion);
          this.adapter.addEmptyLine();

          if (this.project.settings.targetDomainLocation.value === 'dii') {
            this.adapter.addVariableDefinition('WDT_DOMAIN_TYPE', this.project.image.targetDomainType.value);
          }
          this.adapter.addVariableDefinition('WDT_TARGET_TYPE', this.project.settings.targetDomainLocation.value);
          this.adapter.addVariableDefinition('WDT_DOMAIN_HOME', this.project.image.domainHomePath.value);
          this.adapter.addVariableDefinition('WDT_HOME', this._getWdtHome());
          this.adapter.addVariableDefinition('WDT_MODEL_HOME', this._getWdtModelHome());
          this.adapter.addVariableDefinition('WDT_MODEL_FILE', this._getModelPathString(this.project.wdtModel.modelFiles.value));
          this.adapter.addVariableDefinition('WDT_VARIABLE_FILE', this._getModelPathString(this.project.wdtModel.propertiesFiles.value));
          this.adapter.addVariableDefinition('WDT_ARCHIVE_FILE', this._getModelPathString(this.project.wdtModel.archiveFiles.value));
          this.adapter.addEmptyLine();
        }

        // Advanced args definitions
        this.adapter.addVariableDefinition('TARGET', this._getTargetArg(this.project.image.targetOpenShift));
        this.adapter.addVariableDefinition('CHOWN', this._getChownArg(this.project.image.fileOwner, this.project.image.fileGroup));
        this.adapter.addVariableDefinition('BUILD_NETWORK', this.project.image.builderNetworkName.value);
        if (this.project.image.extendBuild.value) {
          this.adapter.addVariableDefinition('ADDITIONAL_BUILD_COMMANDS_FILE', this.project.image.additionalBuildCommandsFile.value);
          this.adapter.addVariableDefinition('ADDITIONAL_BUILD_FILES', this._getAdditionalBuildFilesArg(this.project.image.additionalBuildFiles));
        }
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addExportEnvironmentVariable('DOCKER_BUILDKIT');
        this.adapter.addExportEnvironmentVariable('WLSIMG_BLDDIR');
        this.adapter.addExportEnvironmentVariable('JAVA_HOME');
        if (patchOracleHome) {
          this.adapter.addExportEnvironmentVariable('ORACLE_SUPPORT_PASS');
        }

        const script = this.adapter.getVariableReference('IMAGETOOL_SCRIPT');
        const jdkVersion = this.adapter.getVariableReference('JDK_VERSION');
        if (requiresJdkInstaller) {
          comment = 'Add JDK installer to the WebLogic Image Tool cache';
          const installer = this.adapter.getVariableReference('JDK_INSTALLER');
          const errMessage = `Failed to add JDK ${installer} with version ${jdkVersion} to the WebLogic Image Tool cache`;
          this.adapter.addWitCacheCommandBlock(comment, script, 'jdk', installer, jdkVersion, errMessage);
        }

        const oracleInstallerType = this.adapter.getVariableReference('ORACLE_INSTALLER_TYPE');
        const oracleInstallerVersion = this.adapter.getVariableReference('ORACLE_VERSION');
        if (requiresOracleInstaller) {
          comment = 'Add Oracle FMW installer to the WebLogic Image Tool cache';
          const installer = this.adapter.getVariableReference('ORACLE_INSTALLER');
          const errMessage = `Failed to add ${oracleInstallerType} installer ${installer} with version ` +
            `${oracleInstallerVersion} to the WebLogic Image Tool cache`;
          this.adapter.addWitCacheCommandBlock(comment, script, oracleInstallerType, installer, oracleInstallerVersion, errMessage);
        }

        const wdtVersion = this.adapter.getVariableReference('WDT_VERSION');
        if (usingWdt) {
          comment = 'Add WebLogic Deploy Tooling installer to the WebLogic Image Tool cache';
          const wdtInstaller = this.adapter.getVariableReference('WDT_INSTALLER');
          let errMessage = `Failed to add WebLogic Deploy Tooling installer ${wdtInstaller} with version ` +
            `${wdtVersion} to the WebLogic Image Tool cache`;
          this.adapter.addWitCacheCommandBlock(comment, script, 'wdt', wdtInstaller, wdtVersion, errMessage);
        }

        const builder = this.adapter.getVariableReference('IMAGE_BUILDER_EXE');
        const imageTag = this.adapter.getVariableReference('IMAGE_TAG');

        this.adapter.addVariableDefinition('WIT_CREATE_ARGS', `create "--builder=${builder}" --tag=${imageTag}`,
          'Collect arguments for creating the image');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_ARGS',
          this.adapter.getEnvironmentVariableReference('HTTPS_PROXY'), '--httpsProxyUrl=');

        if (usingCustomBaseImage) {
          const baseImageTag = this.adapter.getVariableReference('BASE_IMAGE_TAG');
          const baseImagePullRequiresAuthentication = this.adapter.getVariableReference('BASE_IMAGE_PULL_REQUIRES_AUTH');
          const host = this.adapter.getVariableReference('BASE_IMAGE_REGISTRY_HOST');
          const user = this.adapter.getVariableReference('BASE_IMAGE_REGISTRY_USER');
          const password = this.adapter.getVariableReference('BASE_IMAGE_REGISTRY_PASS');
          const loginErrorMessage = `Failed to log into the base image registry ${baseImageRegistryName}`;
          this.adapter.addWitBaseImageArgsBlock('WIT_CREATE_ARGS', 'Handle Custom Base Image, if needed.',
            baseImageTag, baseImagePullRequiresAuthentication, host, user, password, builder, loginErrorMessage);
        }

        this.adapter.addIfEqualCollectArgsBlock('WIT_CREATE_ARGS',
          this.adapter.getVariableReference('ALWAYS_PULL_BASE_IMAGE'), 'true', '--pull');
        this.adapter.addCollectArgs('WIT_CREATE_ARGS', `--jdkVersion=${jdkVersion}`,
          `--type=${oracleInstallerType}`, `--version=${oracleInstallerVersion}`);

        if (patchOracleHome) {
          const oraclePsuPatchArg = this.adapter.getVariableReference('ORACLE_PSU_PATCH_ARG');
          const oraclePatchesArg = this.adapter.getVariableReference('ORACLE_PATCHES_ARG');
          const oracleSupportUser = this.adapter.getVariableReference('ORACLE_SUPPORT_USER');
          const oracleSupportPass = this.adapter.getEnvironmentVariableReference('ORACLE_SUPPORT_PASS');
          this.adapter.addWitPatchArgsBlock('WIT_CREATE_ARGS', oraclePsuPatchArg, oraclePatchesArg, oracleSupportUser, oracleSupportPass);
        }

        if (usingWdt) {
          const wdtTargetType = this.adapter.getVariableReference('WDT_TARGET_TYPE');
          const wdtDomainType = this.adapter.getVariableReference('WDT_DOMAIN_TYPE');
          const wdtDomainHome = this.adapter.getVariableReference('WDT_DOMAIN_HOME');
          const wdtHome = this.adapter.getVariableReference('WDT_HOME');
          const wdtModelHome = this.adapter.getVariableReference('WDT_MODEL_HOME');
          const modelFile = this.adapter.getVariableReference('WDT_MODEL_FILE');
          const variableFile = this.adapter.getVariableReference('WDT_VARIABLE_FILE');
          const archiveFile = this.adapter.getVariableReference('WDT_ARCHIVE_FILE');
          this.adapter.addWitCreateWdtArgs('WIT_CREATE_ARGS', 'Gather WDT-related arguments.',
            wdtVersion, wdtTargetType, wdtDomainType, wdtHome, wdtDomainHome, wdtHome, wdtModelHome, modelFile, variableFile, archiveFile);
        }

        // Add any advanced args
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_ARGS',
          this.adapter.getEnvironmentVariableReference('TARGET'), '--target=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_ARGS',
          this.adapter.getEnvironmentVariableReference('CHOWN'), '--chown=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_ARGS',
          this.adapter.getEnvironmentVariableReference('BUILD_NETWORK'), '--buildNetwork=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_ARGS',
          this.adapter.getEnvironmentVariableReference('ADDITIONAL_BUILD_COMMANDS_FILE'), '--additionalBuildCommands=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_ARGS',
          this.adapter.getEnvironmentVariableReference('ADDITIONAL_BUILD_FILES'), '--additionalBuildFiles=');

        const witCreateArgs = this.adapter.getVariableReference('WIT_CREATE_ARGS');
        const createErrorMessage = `Failed to create image ${imageTag}`;
        this.adapter.addRunCommandBlock('Create the image.', script, witCreateArgs, createErrorMessage);

        const imageRegistryHost = this.adapter.getVariableReference('IMAGE_REGISTRY_HOST');
        if (requiresImagePushCredentials) {
          const imagePushRequiresAuthentication = this.adapter.getVariableReference('IMAGE_PUSH_REQUIRES_AUTH');
          const user = this.adapter.getVariableReference('IMAGE_REGISTRY_PUSH_USER');
          const password = this.adapter.getVariableReference('IMAGE_REGISTRY_PUSH_PASS');
          const errMessage = `Failed to log in to the image registry ${imageRegistryName}`;
          this.adapter.addDockerLoginBlock(imagePushRequiresAuthentication, imageRegistryHost, user, password, builder, errMessage);
        }

        const pushComment = `Push image ${imageTag}`;
        const args = `push ${imageTag}`;
        const pushErrorMessage = `Failed to push image ${imageTag} to the image registry ${imageRegistryName}`;
        const pushSuccessMessage = `Pushed image ${imageTag} to image registry ${imageRegistryName}`;
        this.adapter.addRunCommandBlock(pushComment, builder, args, pushErrorMessage, pushSuccessMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }

      generateAuxiliary() {
        const httpsProxyUrl = this.project.getHttpsProxyUrl();
        const bypassProxyHosts = this.project.getBypassProxyHosts();
        const requiresImagePushCredentials = this.project.image.auxImageRegistryPushRequireAuthentication.value;
        const usingCustomBaseImage = this.project.image.auxUseCustomBaseImage.value;
        const requiresBaseImagePullCredentials = this.project.image.auxBaseImagePullRequiresAuthentication.value;
        const baseImageRegistryName = this.adapter.getImageRegistryName(this.project.image.internal.auxBaseImageRegistryAddress.value);
        const imageRegistryName = this.adapter.getImageRegistryName(this.project.image.internal.auxImageRegistryAddress.value);

        const imageBuilderName = this.project.settings.builderType.value;
        const imageBuilderExe =
          this.adapter.getExecutable(this.project.settings.builderExecutableFilePath.value, imageBuilderName);
        const imageToolScript = this.adapter.fixWktToolsShellScriptExtension(this.project.getImageToolScript());

        this.adapter.addScriptHeader(auxiliaryScriptDescription);
        if (!this.project.image.createAuxImage.value) {
          this.adapter.addEchoLine('Create New Auxiliary Image is disabled...nothing to do');
          this.adapter.addEmptyLine();
          return this.adapter.getScript();
        }

        this.adapter.addVariableStartBanner();
        this.adapter.addEnvironmentVariableDefinition('DOCKER_BUILDKIT', '0');
        this.adapter.addEnvironmentVariableDefinition('WLSIMG_BLDDIR', this.getTempDirectoryEnvironmentVariableReference());
        this.adapter.addEnvironmentVariableDefinition('JAVA_HOME', this.project.settings.javaHome.value);
        this.adapter.addEmptyLine();

        let comment = [
          'Leave blank if no proxy is required or comment out this line if',
          'inheriting HTTPS_PROXY from the environment.'
        ];
        this.adapter.addEnvironmentVariableDefinition('HTTPS_PROXY', httpsProxyUrl, comment);
        this.adapter.addEmptyLine();

        comment = [
          'Leave blank if no proxy bypass is required or comment out this line if',
          'inheriting NO_PROXY from the environment.'
        ];
        this.adapter.addEnvironmentVariableDefinition('NO_PROXY', bypassProxyHosts);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('IMAGE_BUILDER_NAME', imageBuilderName);
        this.adapter.addVariableDefinition('IMAGE_BUILDER_EXE', imageBuilderExe);
        this.adapter.addVariableDefinition('IMAGETOOL_SCRIPT', imageToolScript);
        this.adapter.addVariableDefinition('IMAGE_TAG', this.project.image.auxImageTag.value);
        this.adapter.addVariableDefinition('ALWAYS_PULL_BASE_IMAGE', this.project.image.auxAlwaysPullBaseImage.value);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('IMAGE_PUSH_REQUIRES_AUTH', requiresImagePushCredentials);
        if (requiresImagePushCredentials) {
          comment = 'The hostname of the image registry (leave empty for Docker Hub)';
          this.adapter.addVariableDefinition('IMAGE_REGISTRY_HOST',
            this.project.image.internal.auxImageRegistryAddress.value, comment);
          this.adapter.addVariableDefinition('IMAGE_REGISTRY_PUSH_USER', this.credentialMask);
          this.adapter.addVariableDefinition('IMAGE_REGISTRY_PUSH_PASS', this.credentialMask);
          this.adapter.addEmptyLine();
        }

        if (usingCustomBaseImage) {
          this.adapter.addVariableDefinition('BASE_IMAGE_TAG', this.project.image.auxBaseImage.value);
          this.adapter.addVariableDefinition('BASE_IMAGE_PULL_REQUIRES_AUTH', requiresImagePushCredentials);
          if (requiresBaseImagePullCredentials) {
            comment = 'The image registry hostname for the base image (leave empty for Docker Hub)';
            this.adapter.addVariableDefinition('BASE_IMAGE_REGISTRY_HOST',
              this.project.image.internal.auxBaseImageRegistryAddress.value, comment);
            this.adapter.addVariableDefinition('BASE_IMAGE_REGISTRY_PULL_USER', this.credentialMask);
            this.adapter.addVariableDefinition('BASE_IMAGE_REGISTRY_PULL_PASS', this.credentialMask);
          }
          this.adapter.addEmptyLine();
        }

        const wdtInstallerValue = this.project.image.wdtInstaller.value || this.fillMeInMask;
        const wdtInstallerVersion = this.project.image.wdtInstallerVersion.value || this.fillMeInMask;
        this.adapter.addVariableDefinition('WDT_INSTALLER', wdtInstallerValue);
        this.adapter.addVariableDefinition('WDT_VERSION', wdtInstallerVersion);
        this.adapter.addEmptyLine();

        this.adapter.addVariableDefinition('WDT_HOME', this._getWdtHome());
        this.adapter.addVariableDefinition('WDT_MODEL_HOME', this._getWdtModelHome());
        this.adapter.addVariableDefinition('WDT_MODEL_FILE', this._getModelPathString(this.project.wdtModel.modelFiles.value));
        this.adapter.addVariableDefinition('WDT_VARIABLE_FILE', this._getModelPathString(this.project.wdtModel.propertiesFiles.value));
        this.adapter.addVariableDefinition('WDT_ARCHIVE_FILE', this._getModelPathString(this.project.wdtModel.archiveFiles.value));
        this.adapter.addEmptyLine();

        // Advanced args definitions
        this.adapter.addVariableDefinition('TARGET', this._getTargetArg(this.project.image.auxTargetOpenShift));
        this.adapter.addVariableDefinition('CHOWN', this._getChownArg(this.project.image.auxFileOwner, this.project.image.auxFileGroup));
        this.adapter.addVariableDefinition('BUILD_NETWORK', this.project.image.auxBuilderNetworkName.value);
        if (this.project.image.extendBuild.value) {
          this.adapter.addVariableDefinition('ADDITIONAL_BUILD_COMMANDS_FILE', this.project.image.additionalBuildCommandsFile.value);
          this.adapter.addVariableDefinition('ADDITIONAL_BUILD_FILES', this._getAdditionalBuildFilesArg(this.project.image.additionalBuildFiles));
        }
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addExportEnvironmentVariable('DOCKER_BUILDKIT');
        this.adapter.addExportEnvironmentVariable('WLSIMG_BLDDIR');
        this.adapter.addExportEnvironmentVariable('JAVA_HOME');

        const script = this.adapter.getVariableReference('IMAGETOOL_SCRIPT');
        const wdtVersion = this.adapter.getVariableReference('WDT_VERSION');
        comment = 'Add WebLogic Deploy Tooling installer to the WebLogic Image Tool cache';
        const wdtInstaller = this.adapter.getVariableReference('WDT_INSTALLER');
        let errMessage = `Failed to add WebLogic Deploy Tooling installer ${wdtInstaller} with version ` +
          `${wdtVersion} to the WebLogic Image Tool cache`;
        this.adapter.addWitCacheCommandBlock(comment, script, 'wdt', wdtInstaller, wdtVersion, errMessage);

        const builder = this.adapter.getVariableReference('IMAGE_BUILDER_EXE');
        const imageTag = this.adapter.getVariableReference('IMAGE_TAG');

        this.adapter.addVariableDefinition('WIT_CREATE_AUX_IMAGE_ARGS', `createAuxImage "--builder=${builder}" --tag=${imageTag}`,
          'Collect arguments for creating the image');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS',
          this.adapter.getEnvironmentVariableReference('HTTPS_PROXY'), '--httpsProxyUrl=');

        if (usingCustomBaseImage) {
          const baseImageTag = this.adapter.getVariableReference('BASE_IMAGE_TAG');
          const baseImagePullRequiresAuthentication = this.adapter.getVariableReference('BASE_IMAGE_PULL_REQUIRES_AUTH');
          const host = this.adapter.getVariableReference('BASE_IMAGE_REGISTRY_HOST');
          const user = this.adapter.getVariableReference('BASE_IMAGE_REGISTRY_USER');
          const password = this.adapter.getVariableReference('BASE_IMAGE_REGISTRY_PASS');
          const loginErrorMessage = `Failed to log into the base image registry ${baseImageRegistryName}`;
          this.adapter.addWitBaseImageArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS', 'Handle Custom Base Image, if needed.',
            baseImageTag, baseImagePullRequiresAuthentication, host, user, password, builder, loginErrorMessage);
        }

        this.adapter.addIfEqualCollectArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS',
          this.adapter.getVariableReference('ALWAYS_PULL_BASE_IMAGE'), 'true', '--pull');
        const wdtHome = this.adapter.getVariableReference('WDT_HOME');
        const wdtModelHome = this.adapter.getVariableReference('WDT_MODEL_HOME');
        const modelFile = this.adapter.getVariableReference('WDT_MODEL_FILE');
        const variableFile = this.adapter.getVariableReference('WDT_VARIABLE_FILE');
        const archiveFile = this.adapter.getVariableReference('WDT_ARCHIVE_FILE');
        this.adapter.addWitCreateAuxImageWdtArgs('WIT_CREATE_AUX_IMAGE_ARGS',
          'Gather WDT-related arguments.', wdtVersion, wdtHome, wdtModelHome, modelFile, variableFile, archiveFile);

        // Add any advanced args
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS',
          this.adapter.getEnvironmentVariableReference('TARGET'), '--target=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS',
          this.adapter.getEnvironmentVariableReference('CHOWN'), '--chown=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS',
          this.adapter.getEnvironmentVariableReference('BUILD_NETWORK'), '--buildNetwork=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS',
          this.adapter.getEnvironmentVariableReference('ADDITIONAL_BUILD_COMMANDS_FILE'), '--additionalBuildCommands=');
        this.adapter.addNotEmptyCollectArgsBlock('WIT_CREATE_AUX_IMAGE_ARGS',
          this.adapter.getEnvironmentVariableReference('ADDITIONAL_BUILD_FILES'), '--additionalBuildFiles=');

        const witCreateArgs = this.adapter.getVariableReference('WIT_CREATE_AUX_IMAGE_ARGS');
        const createErrorMessage = `Failed to create image ${imageTag}`;
        this.adapter.addRunCommandBlock('Create the image.', script, witCreateArgs, createErrorMessage);

        const imageRegistryHost = this.adapter.getVariableReference('IMAGE_REGISTRY_HOST');
        if (requiresImagePushCredentials) {
          const imagePushRequiresAuthentication = this.adapter.getVariableReference('IMAGE_PUSH_REQUIRES_AUTH');
          const user = this.adapter.getVariableReference('IMAGE_REGISTRY_PUSH_USER');
          const password = this.adapter.getVariableReference('IMAGE_REGISTRY_PUSH_PASS');
          const errMessage = `Failed to log in to the image registry ${imageRegistryName}`;
          this.adapter.addDockerLoginBlock(imagePushRequiresAuthentication, imageRegistryHost, user, password, builder, errMessage);
        }

        const pushComment = `Push image ${imageTag}`;
        const args = `push ${imageTag}`;
        const pushErrorMessage = `Failed to push image ${imageTag} to the image registry ${imageRegistryName}`;
        const pushSuccessMessage = `Pushed image ${imageTag} to image registry ${imageRegistryName}`;
        this.adapter.addRunCommandBlock(pushComment, builder, args, pushErrorMessage, pushSuccessMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }

      _usingWdt() {
        let result;
        switch (this.project.settings.targetDomainLocation.value) {
          case 'mii':
            result = !this.project.image.useAuxImage.value;
            break;

          case 'dii':
            result = true;
            break;

          case 'pv':
            result = false;
            break;
        }
        return result;
      }

      _requiresJdkInstaller(usingCustomBaseImage) {
        let result = true;
        if (usingCustomBaseImage && this.project.image.customBaseImageContents.value.includes('javaHome')) {
          result = false;
        }
        return result;
      }

      _requiresOracleInstaller(usingCustomBaseImage) {
        let result = true;
        if (usingCustomBaseImage && this.project.image.customBaseImageContents.value.includes('oracleHome')) {
          result = false;
        }
        return result;
      }

      _patchOracleHome(requiresOracleInstaller) {
        let result = this.project.image.applyOraclePatches.value;
        if (!requiresOracleInstaller) {
          result = false;
        }
        return result;
      }

      _getOracleRecommendedPsuPatchArg() {
        let result;
        switch(this.project.image.oraclePatchOptions.value) {
          case 'recommended':
            result = '--recommendedPatches';
            break;

          case 'psu':
            result = '--latestPSU';
            break;

          case 'none':
            result = '';
            break;
        }
        return result;
      }

      _getOraclePatchesArg() {
        let result = '';
        const patchList = this.project.image.oraclePatchesToApply.value;
        if (Array.isArray(patchList) && patchList.length > 0) {
          result = `--patches=${patchList.join(',')}`;
        }
        return result;
      }

      _getModelPathString(files) {
        const baseDirectory = this.project.getProjectFileName() ? window.api.path.dirname(this.project.getProjectFileName())
          : window.api.path.join('path', 'to', 'project', 'directory');
        return this._getAbsolutePaths(baseDirectory, ...files).join(',');
      }

      _getWdtHome() {
        return this.project.image.wdtHomePath.hasValue() ? this.project.image.wdtHomePath.value : '';
      }

      _getWdtModelHome() {
        return this.project.image.modelHomePath.hasValue() ? this.project.image.modelHomePath.value : '';
      }

      _getTargetArg(property) {
        return property.value ? 'OpenShift' : '';
      }

      _getChownArg(ownerProperty, groupProperty) {
        const owner = ownerProperty.hasValue() ? ownerProperty.value : undefined;
        const group = groupProperty.hasValue() ? groupProperty.value : undefined;
        return owner && group ? `${owner}:${group}` : '';
      }

      _getAdditionalBuildFilesArg(property) {
        let arg;
        const value = property.value;
        if (value && value.length > 0) {
          arg = value.join(',');
        }
        return arg;
      }
    }

    return ImageScriptGenerator;
  }
);