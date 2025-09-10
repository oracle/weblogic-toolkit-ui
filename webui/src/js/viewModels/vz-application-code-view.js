/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'models/wkt-project', 'utils/vz-application-script-generator',
  'utils/vz-application-resource-generator', 'utils/vz-application-project-generator', 'utils/i18n',
  'ojs/ojarraydataprovider', 'utils/wkt-logger', 'ojs/ojinputtext', 'ojs/ojnavigationlist', 'ojs/ojswitcher',
  'ojs/ojknockout'],
function (accUtils, ko, project, VerrazzanoApplicationScriptGenerator, VerrazzanoApplicationResourceGenerator,
  VerrazzanoProjectResourceGenerator, i18n, ArrayDataProvider) {
  function VerrazzanoApplicationCodeViewModel () {
    this.project = project;

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Verrazzano Application code view loaded.', 'assertive');

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

    this.createProjectResource = ko.computed(() => {
      return !(this.project.vzApplication.useMultiClusterApplication.observable() && this.project.vzApplication.createProject.observable());
    });

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-application-code-${labelId}`);
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.shellScriptType = ko.observable(VerrazzanoApplicationScriptGenerator.getDefaultScriptingLanguage());
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
      {id: 'application', name: this.labelMapper('application-resource-title')},
      {id: 'project', name: this.labelMapper('project-resource-title'), disabled: this.createProjectResource()},
    ];

    this.subviewsDP = new ArrayDataProvider(this.subviews, {keyAttributes: 'id'});
    this.selectedSubview = ko.observable('script');
    this.selectedSubviewValueChangedHandler = (event) => {
      this.selectedSubview(event.detail.value);
      this.renderScript(event.detail.value);
    };

    this.scriptText = ko.observable();
    this.applicationText = ko.observable();
    this.projectText = ko.observable();

    this.vzApplicationResourceGenerator = new VerrazzanoApplicationResourceGenerator();
    this.vzProjectResourceGenerator = new VerrazzanoProjectResourceGenerator();

    this.renderScript = (selectedSubview) => {
      switch (selectedSubview) {
        case 'script':
          this.renderShellScript(this.shellScriptType());
          break;

        case 'application':
          this.renderApplicationResource();
          break;

        case 'project':
          this.renderProjectResource();
          break;
      }
    };

    this.renderShellScript = (scriptLanguage) => {
      const generator = new VerrazzanoApplicationScriptGenerator(scriptLanguage);
      this.scriptText(generator.generate().join('\n'));
    };

    this.renderApplicationResource = () => {
      this.applicationText(this.vzApplicationResourceGenerator.generate().join('\n'));
    };

    this.renderProjectResource = () => {
      this.projectText(this.vzProjectResourceGenerator.generate().join('\n'));
    };

    this.renderScript(this.selectedSubview());

    this.downloadDeployer = () => {
      const format = this.shellScriptType();
      const generator = new VerrazzanoApplicationScriptGenerator(format);
      const lines = generator.generate();
      const fileType = i18n.t('script-file-type-label', {
        type: i18n.t('nav-vz-component'),
        subType: i18n.t('vz-install-code-script-title')
      });
      const formatLabel = this.shellLabelMapper(format + '-label');

      window.api.ipc.send('download-file', lines, fileType, format, formatLabel);
    };

    this.downloadApplicationResource = () => {
      const generator = this.vzApplicationResourceGenerator;
      const lines = generator.generate();
      const fileType = i18n.t('vz-application-code-application-resource-title');
      const formatLabel = this.shellLabelMapper('resource-file-format');

      window.api.ipc.send('download-file', lines, fileType, 'yaml', formatLabel);
    };

    this.downloadProjectResource = () => {
      const generator = this.vzProjectResourceGenerator;
      const lines = generator.generate();
      const fileType = i18n.t('vz-application-code-project-resource-title');
      const formatLabel = this.shellLabelMapper('resource-file-format');

      window.api.ipc.send('download-file', lines, fileType, 'yaml', formatLabel);
    };
  }

  return VerrazzanoApplicationCodeViewModel;
});
