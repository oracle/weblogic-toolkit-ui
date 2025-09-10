/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'models/wkt-project', 'utils/vz-install-script-generator',
  'utils/vz-install-resource-generator', 'utils/i18n', 'ojs/ojarraydataprovider', 'utils/wkt-logger',
  'ojs/ojinputtext', 'ojs/ojnavigationlist', 'ojs/ojswitcher', 'ojs/ojknockout'],
function (accUtils, ko, project, VerrazzanoInstallScriptGenerator, VerrazzanoInstallResourceGenerator, i18n,
  ArrayDataProvider, wktLogger) {
  function VerrazzanoInstallCodeViewModel () {
    this.project = project;

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Image code view loaded.', 'assertive');

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
      return i18n.t(`vz-install-code-${labelId}`);
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.shellScriptType = ko.observable(VerrazzanoInstallScriptGenerator.getDefaultScriptingLanguage());
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

    this.subviews = [
      {id: 'script', name: this.labelMapper('script-title')},
      {id: 'verrazzano', name: this.labelMapper('verrazzano-resource-title')},
    ];

    this.subviewsDP = new ArrayDataProvider(this.subviews, {keyAttributes: 'id'});
    this.selectedSubview = ko.observable('script');
    this.selectedSubviewValueChangedHandler = (event) => {
      wktLogger.debug('selectedSubviewValueChangedHandler() called for %s', event.detail.value);
      this.selectedSubview(event.detail.value);
      this.renderScript(event.detail.value);
    };

    this.scriptText = ko.observable();
    this.verrazzanoResourceText = ko.observable();

    this.vzInstallResourceGenerator = new VerrazzanoInstallResourceGenerator();

    this.renderScript = (selectedSubview) => {
      switch (selectedSubview) {
        case 'script':
          this.renderShellScript(this.shellScriptType());
          break;

        case 'verrazzano':
          this.renderVerrazzanoResource();
      }
    };

    this.renderShellScript = (scriptLanguage) => {
      const generator = new VerrazzanoInstallScriptGenerator(scriptLanguage);
      this.scriptText(generator.generate().join('\n'));
    };

    this.renderVerrazzanoResource = () => {
      this.verrazzanoResourceText(this.vzInstallResourceGenerator.generate().join('\n'));
    };

    this.renderScript(this.selectedSubview());

    this.downloadInstaller = () => {
      const format = this.shellScriptType();
      const generator = new VerrazzanoInstallScriptGenerator(format);
      const lines = generator.generate();
      const fileType = i18n.t('script-file-type-label', {
        type: i18n.t('nav-verrazzano'),
        subType: i18n.t('vz-install-code-script-title')
      });
      const formatLabel = this.shellLabelMapper(format + '-label');

      window.api.ipc.send('download-file', lines, fileType, format, formatLabel);
    };

    this.downloadResource = () => {
      const generator = this.vzInstallResourceGenerator;
      const lines = generator.generate();
      const fileType = i18n.t('vz-install-code-verrazzano-resource-title');
      const formatLabel = this.shellLabelMapper('resource-file-format');

      window.api.ipc.send('download-file', lines, fileType, 'yaml', formatLabel);
    };
  }

  return VerrazzanoInstallCodeViewModel;
});
