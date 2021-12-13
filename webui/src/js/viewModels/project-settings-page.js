/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'ojs/ojarraydataprovider', 'utils/wkt-logger',
  'utils/url-catalog', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout', 'ojs/ojradioset',
  'ojs/ojswitch', 'ojs/ojselectsingle' ],
function(accUtils, ko, i18n, project, ArrayDataProvider) {
  function ProjectSettingsViewModel() {

    this.connected = () => {
      accUtils.announce('Project settings page loaded.', 'assertive');
    };

    this.project = project;

    this.labelMapper = (labelId) => {
      return i18n.t(`project-settings-${labelId}`);
    };

    this.credentialStorePolicies = [
      { key: 'native', label: this.labelMapper('credential-store-native-label') },
      { key: 'passphrase', label: this.labelMapper('credential-store-passphrase-label') },
      { key: 'none', label: this.labelMapper('credential-store-none-label') },
    ];
    this.credentialStorePoliciesDP = new ArrayDataProvider(this.credentialStorePolicies, { keyAttributes: 'key' });

    this.targetDomainLocations = [
      { id: 'miiOption', value: 'mii', label: this.labelMapper('domain-location-mii-label') },
      { id: 'diiOption', value: 'dii', label: this.labelMapper('domain-location-dii-label') },
      { id: 'pvOption', value: 'pv', label: this.labelMapper('domain-location-pv-label') },
    ];

    this.getTargetDomainLocationMessage = () => {
      const key = this.project.settings.targetDomainLocation.observable();
      return this.labelMapper(`domain-location-${key}-message`);
    };

    this.targetDomainLocationIsPV = () => {
      return this.project.settings.targetDomainLocation.observable() === 'pv';
    };

    this.wdtTargetTypes = [
      { key: 'vz', label: this.labelMapper('wdt-target-type-vz-label') },
      { key: 'wko', label: this.labelMapper('wdt-target-type-wko-label') },
      // { key: 'k8s', label: this.labelMapper('wdt-target-type-k8s-label') },
      // { key: 'none', label: this.labelMapper('wdt-target-type-none-label') }
    ];
    this.wdtTargetTypesDP = new ArrayDataProvider(this.wdtTargetTypes, { keyAttributes: 'key' });

    this.javaDirectoryLocationAnswer = ko.computed(() => {
      let key = 'java-directory-location-answer-message';
      if (this.project.settings.targetDomainLocation.value === 'pv') {
        key = 'java-directory-location-with-pv-answer-message';
      }
      return this.labelMapper(key);
    });

    this.requiresOracleHome = () => {
      return this.project.settings.targetDomainLocation.value !== 'pv';
    };

    this.chooseJavaHome = () => {
      const currentJavaHomeValue = this.project.settings.javaHome.value;
      window.api.ipc.invoke('choose-java-home', currentJavaHomeValue)
        .then(directory => {
          if (directory) {
            project.settings.javaHome.observable(directory);
          }
        });
    };

    this.chooseOracleHome = () => {
      const currentOracleHomeValue = this.project.settings.oracleHome.value;
      window.api.ipc.invoke('choose-oracle-home', currentOracleHomeValue)
        .then(directory => {
          if (directory) {
            project.settings.oracleHome.observable(directory);
          }
        });
    };

    this.builderTypes = [
      { key: 'docker', label: 'Docker' },
      { key: 'podman', label: 'Podman' }
    ];
    this.builderTypesDP = new ArrayDataProvider(this.builderTypes, { keyAttributes: 'key' });
    this.getDockerLabelForBuilderType = (type) => {
      let label;
      for (const builderType of this.builderTypes) {
        if (builderType.key && builderType.key === type) {
          label = builderType.label;
          break;
        }
      }
      return label;
    };

    this.buildToolTypeAnswer = ko.computed(() => {
      let key = 'build-tool-type-answer-message';
      if (this.project.settings.targetDomainLocation.value === 'pv') {
        key = 'build-tool-type-with-pv-answer-message';
      }
      return this.labelMapper(key);
    });

    this.getBuilderExecutableFilePathLabel = () => {
      let name = this.getDockerLabelForBuilderType(this.project.settings.builderType.value) || '<Unknown>';
      return i18n.t('project-settings-build-tool-label', {toolName: name});
    };

    this.chooseBuilder = () => {
      const label = this.getDockerLabelForBuilderType(this.project.settings.builderType.value);
      window.api.ipc.invoke('get-image-builder-exe', label).then(exePath => {
        if (exePath) {
          this.project.settings.builderExecutableFilePath.observable(exePath);
        }
      });
    };
  }

  return ProjectSettingsViewModel;
});
