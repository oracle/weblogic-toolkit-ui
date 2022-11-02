/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'models/wkt-project', 'utils/k8s-domain-script-generator',
  'utils/k8s-domain-configmap-generator', 'utils/k8s-domain-resource-generator', 'utils/i18n',
  'ojs/ojarraydataprovider', 'utils/wkt-logger', 'ojs/ojinputtext', 'ojs/ojnavigationlist', 'ojs/ojswitcher',
  'ojs/ojknockout'],
function (accUtils, ko, project, K8sDomainScriptGenerator, K8sDomainConfigMapGenerator, K8sDomainResourceGenerator, i18n,
  ArrayDataProvider, wktLogger) {
  function DomainCodeViewModel () {
    this.project = project;

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Domain code view loaded.', 'assertive');

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
      return i18n.t(`domain-code-${labelId}`);
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.shellScriptType = ko.observable(K8sDomainScriptGenerator.getDefaultScriptingLanguage());
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
      return this.project.settings.targetDomainLocation.value !== 'mii';
    };

    this.subviews = [
      {id: 'script', name: this.labelMapper('script-title')},
      {id: 'domain', name: this.labelMapper('domain-resource-title')},
      {id: 'configMap', name: this.labelMapper('configmap-resource-title'),
        disabled: this.isConfigMapDisabled()}
    ];

    this.subviewsDP = new ArrayDataProvider(this.subviews, {keyAttributes: 'id'});
    this.selectedSubview = ko.observable('script');
    this.selectedSubviewValueChangedHandler = (event) => {
      wktLogger.debug('selectedSubviewValueChangedHandler() called for %s', event.detail.value);
      this.selectedSubview(event.detail.value);
      this.renderScript(event.detail.value);
    };

    this.scriptText = ko.observable();
    this.domainText = ko.observable();
    this.configMapText = ko.observable();

    this.k8sConfigMapGenerator = new K8sDomainConfigMapGenerator();

    this.renderScript = (selectedSubview) => {
      switch (selectedSubview) {
        case 'script':
          this.renderShellScript(this.shellScriptType());
          break;

        case 'configMap':
          this.renderConfigMap();
          break;

        case 'domain':
          this.renderDomainResource();
      }
    };

    this.renderShellScript = (scriptLanguage) => {
      const generator = new K8sDomainScriptGenerator(scriptLanguage);
      this.scriptText(generator.generate().join('\n'));
    };

    this.renderConfigMap = () => {
      this.configMapText(this.k8sConfigMapGenerator.generate().join('\n'));
    };

    this.getDomainResourceGenerator = () => {
      if (this.project.wko.installedVersion.hasValue()) {
        return new K8sDomainResourceGenerator(this.project.wko.installedVersion.value);
      } else {
        return new K8sDomainResourceGenerator();
      }
    };

    this.renderDomainResource = () => {
      this.domainText(this.getDomainResourceGenerator().generate().join('\n'));
    };

    this.renderScript(this.selectedSubview());
  }

  return DomainCodeViewModel;
});
