/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout','utils/i18n', 'models/wkt-project', 'utils/ingress-install-script-generator',
  'utils/ingress-routes-script-generator', 'utils/ingress-resource-generator', 'ojs/ojarraydataprovider',
  'ojs/ojinputtext', 'ojs/ojnavigationlist', 'ojs/ojswitcher', 'ojs/ojknockout'],
function(accUtils, ko, i18n, project, IngressInstallScriptGenerator, IngressRoutesScriptGenerator,
  IngressResourceGenerator, ArrayDataProvider) {
  function IngressCodeViewModel() {

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Ingress Code View page loaded.', 'assertive');

      // update code text if project changes
      subscriptions.push(project.postOpen.subscribe(() => {
        this.renderScript(this.selectedSubview());
      }));

      // changes to enable/disable a tab require refresh() on the tab component
      subscriptions.push(project.ingress.ingressRoutesConfigured.subscribe((configured) => {
        this.disableRoutes(!configured);
        document.getElementById('codetabs').refresh();
      }));

      this.renderScript(this.selectedSubview());
    };

    this.disconnected = () => {
      // remove any subscriptions when leaving page
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`ingress-code-${labelId}`);
    };

    this.ingressRoutesYamlText = ko.observable();
    this.installScriptText = ko.observable();
    this.addRoutesScriptText = ko.observable();

    // changes to enable/disable a tab require refresh() on the tab component
    this.disableRoutes = ko.observable(!project.ingress.ingressRoutesConfigured());

    this.subviews = [
      {id: 'installScript', name: this.labelMapper('install-script-title')},
      {id: 'addRoutesScript', name: this.labelMapper('add-routes-script-title')},
      {
        id: 'routesYaml',
        name: this.labelMapper('ingress-yaml-title'),
        disabled: this.disableRoutes
      }
    ];
    this.subviewsDP = new ArrayDataProvider(this.subviews, {keyAttributes: 'id'});
    this.selectedSubview = ko.observable('installScript');

    this.selectedSubview.subscribe((subview) => {
      this.renderScript(subview);
    });

    this.shellScriptType = ko.observable(IngressInstallScriptGenerator.getDefaultScriptingLanguage());
    const shellScriptTypes = [
      {key: 'sh', label: this.shellLabelMapper('sh-label')},
      {key: 'ps1', label: this.shellLabelMapper('ps1-label')},
      {key: 'cmd', label: this.shellLabelMapper('cmd-label')}
    ];
    this.shellScriptTypesDP = new ArrayDataProvider(shellScriptTypes, {keyAttributes: 'key'});
    this.shellScriptType.subscribe(() => {
      this.renderScript(this.selectedSubview());
    });

    this.renderScript = (selectedSubview) => {
      switch (selectedSubview) {
        case 'installScript':
          this.renderInstallShellScript(this.shellScriptType());
          break;

        case 'addRoutesScript':
          this.renderAddRoutesShellScript(this.shellScriptType());
          break;

        case 'routesYaml':
          this.renderIngressRoutesResource();
          break;
      }
    };

    this.renderInstallShellScript = (scriptType) => {
      const generator = new IngressInstallScriptGenerator(scriptType);
      const lines = generator.generate();
      this.installScriptText(lines.join('\n'));
    };

    this.renderAddRoutesShellScript = (scriptType) => {
      const generator = new IngressRoutesScriptGenerator(scriptType);
      const lines = generator.generate();
      this.addRoutesScriptText(lines.join('\n'));
    };

    this.renderIngressRoutesResource = () => {
      const generator = new IngressResourceGenerator();
      const lines = generator.generate();
      this.ingressRoutesYamlText(lines.join('\n'));
    };

    this.downloadInstaller = () => {
      const format = this.shellScriptType();
      const generator = new IngressInstallScriptGenerator(format);
      const lines = generator.generate();
      const fileType = i18n.t('script-file-type-label', {
        type: i18n.t('nav-ingress'),
        subType: i18n.t('ingress-code-install-script-title')
      });
      const formatLabel = this.shellLabelMapper(format + '-label');

      window.api.ipc.send('download-file', lines, fileType, format, formatLabel);
    };

    this.downloadAddRoutesScript = () => {
      const format = this.shellScriptType();
      const generator = new IngressRoutesScriptGenerator(format);
      const lines = generator.generate();
      const fileType = i18n.t('ingress-code-add-routes-script-title');
      const formatLabel = this.shellLabelMapper(format + '-label');

      window.api.ipc.send('download-file', lines, fileType, format, formatLabel);
    };

    this.downloadRoutesResource = () => {
      const generator = new IngressResourceGenerator();
      const lines = generator.generate();
      const fileType = i18n.t('ingress-code-ingress-yaml-title');
      const formatLabel = this.shellLabelMapper('resource-file-format');

      window.api.ipc.send('download-file', lines, fileType, 'yaml', formatLabel);
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return IngressCodeViewModel;
});
