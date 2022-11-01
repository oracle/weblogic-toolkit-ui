/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'models/wkt-project', 'utils/vz-component-script-generator',
  'utils/vz-component-configmap-generator', 'utils/vz-component-resource-generator', 'utils/i18n',
  'ojs/ojarraydataprovider', 'utils/wkt-logger', 'ojs/ojinputtext', 'ojs/ojnavigationlist', 'ojs/ojswitcher',
  'ojs/ojknockout'],
function (accUtils, ko, project, VerrazzanoComponentScriptGenerator, VerrazzanoComponentConfigMapGenerator,
  VerrazzanoComponentResourceGenerator, i18n, ArrayDataProvider, wktLogger) {
  function VerrazzanoComponentCodeViewModel () {
    this.project = project;

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Verrazzano Component code view loaded.', 'assertive');

      // update code text if project changes
      subscriptions.push(project.postOpen.subscribe(() => {
        this.renderScript(this.selectedSubview());
      }));

      this.renderScript(this.selectedSubview());
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.project = project;

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-component-code-${labelId}`);
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.shellScriptType = ko.observable(VerrazzanoComponentScriptGenerator.getDefaultScriptingLanguage());
    const shellScriptTypes = [
      {key: 'sh', label: this.shellLabelMapper('sh-label')},
      {key: 'ps1', label: this.shellLabelMapper('ps1-label')},
      {key: 'cmd', label: this.shellLabelMapper('cmd-label')}
    ];
    this.shellScriptTypesDP = new ArrayDataProvider(shellScriptTypes, {keyAttributes: 'key'});
    this.shellScriptTypeSelectValueChangedHandler = (event) =>  {
      this.shellScriptType(event.detail.value);
      this.renderShellScript(event.detail.value);
    };


    this.isConfigMapDisabled = () => {
      return this.project.vzComponent.configMapIsEmpty();
    };

    this.subviews = [
      {id: 'script', name: this.labelMapper('script-title')},
      {id: 'component', name: this.labelMapper('component-resource-title')},
      {id: 'configMap', name: this.labelMapper('configmap-resource-title'), disabled: this.project.vzComponent.configMapIsEmpty()}
    ];

    this.subviewsDP = new ArrayDataProvider(this.subviews, {keyAttributes: 'id'});
    this.selectedSubview = ko.observable('script');
    this.selectedSubviewValueChangedHandler = (event) => {
      wktLogger.debug('selectedSubviewValueChangedHandler() called for %s', event.detail.value);
      this.selectedSubview(event.detail.value);
      this.renderScript(event.detail.value);
    };

    this.scriptText = ko.observable();
    this.componentText = ko.observable();
    this.configMapText = ko.observable();

    this.vzComponentConfigMapGenerator = new VerrazzanoComponentConfigMapGenerator();
    this.vzComponentResourceGenerator = new VerrazzanoComponentResourceGenerator();

    this.renderScript = (selectedSubview) => {
      switch (selectedSubview) {
        case 'script':
          this.renderShellScript(this.shellScriptType());
          break;

        case 'configMap':
          this.renderConfigMap();
          break;

        case 'component':
          this.renderComponentResource();
      }
    };

    this.renderShellScript = (scriptLanguage) => {
      const generator = new VerrazzanoComponentScriptGenerator(scriptLanguage);
      this.scriptText(generator.generate().join('\n'));
    };

    this.renderConfigMap = () => {
      this.configMapText(this.vzComponentConfigMapGenerator.generate().join('\n'));
    };

    this.renderComponentResource = () => {
      this.componentText(this.vzComponentResourceGenerator.generate().join('\n'));
    };

    this.renderScript(this.selectedSubview());

    this.downloadInstaller = () => {
      const format = this.shellScriptType();
      const generator = new VerrazzanoComponentScriptGenerator(format);
      const lines = generator.generate();
      const fileType = i18n.t('script-file-type-label', {
        type: i18n.t('nav-vz-component'),
        subType: i18n.t('vz-install-code-script-title')
      });
      const formatLabel = this.shellLabelMapper(format + '-label');

      window.api.ipc.send('download-file', lines, fileType, format, formatLabel);
    };

    this.downloadComponentResource = () => {
      const generator = this.vzComponentResourceGenerator;
      const lines = generator.generate();
      const fileType = i18n.t('vz-component-code-component-resource-title');
      const formatLabel = this.shellLabelMapper('resource-file-format');

      window.api.ipc.send('download-file', lines, fileType, 'yaml', formatLabel);
    };

    this.downloadConfigMap = () => {
      const generator = this.vzComponentConfigMapGenerator;
      const lines = generator.generate();
      const fileType = i18n.t('vz-component-code-configmap-resource-title');
      const formatLabel = this.shellLabelMapper('resource-file-format');

      window.api.ipc.send('download-file', lines, fileType, 'yaml', formatLabel);
    };
  }

  return VerrazzanoComponentCodeViewModel;
});
