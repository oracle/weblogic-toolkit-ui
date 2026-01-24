/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'models/wkt-project', 'utils/operator-script-generator', 'ojs/ojarraydataprovider',
  'ojs/ojformlayout', 'ojs/ojinputtext', 'ojs/ojselectsingle'],
function(i18n, accUtils, ko, project, OperatorScriptGenerator, ArrayDataProvider) {
  function OperatorCodeViewModel() {

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Operator Code View page loaded.', 'assertive');

      // update code text if project changes
      subscriptions.push(project.postOpen.subscribe(() => {
        this.updateCodeText(this.shellScriptType());
      }));
      this.updateCodeText(this.shellScriptType());
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.codeText = ko.observable();

    this.updateCodeText = (scriptType) => {
      const generator = new OperatorScriptGenerator(scriptType);
      const text = generator.generate();
      this.codeText(text.join('\n'));
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.shellScriptType = ko.observable(window.api.process.isWindows() ? 'ps1' : 'sh');
    this.shellScriptTypes = [
      { key: 'sh', label: this.shellLabelMapper('sh-label') },
      { key: 'ps1', label: this.shellLabelMapper('ps1-label') },
      { key: 'cmd', label: this.shellLabelMapper('cmd-label') }
    ];
    this.shellScriptTypesDP = new ArrayDataProvider(this.shellScriptTypes, { keyAttributes: 'key' });

    this.shellScriptTypeValueChangedHandler = (event) => {
      this.shellScriptType(event.detail.value);
      this.updateCodeText(event.detail.value);
    };

    this.download = () => {
      const format = this.shellScriptType();
      const generator = new OperatorScriptGenerator(format);
      const lines = generator.generate();
      const fileType = i18n.t('script-file-type-label', {
        type: i18n.t('nav-operator'),
        subType: i18n.t('domain-code-script-title')
      });
      const formatLabel = this.shellLabelMapper(format + '-label');

      window.api.ipc.send('download-file', lines, fileType, format, formatLabel);
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return OperatorCodeViewModel;
});
