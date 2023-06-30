/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/aux-image-helper',
  'utils/image-script-generator', 'ojs/ojarraydataprovider', 'ojs/ojinputtext', 'ojs/ojformlayout',
  'ojs/ojselectsingle'],
function(accUtils, ko, i18n, project, auxImageHelper, ImageScriptGenerator, ArrayDataProvider) {
  function ImageCodeViewModel() {

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Image code view loaded.', 'assertive');

      // update code text if project changes
      subscriptions.push(project.postOpen.subscribe(() => {
        this.renderSubviewScript(this.selectedSubview(), this.codeViewScriptLanguage());
      }));

      if (!this.project.image.createPrimaryImage.value) {
        this.selectedSubview('auxiliaryImageScript');
      }
      this.renderSubviewScript(this.selectedSubview(), this.codeViewScriptLanguage());
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.project = project;

    this.labelMapper = (labelId) => {
      return i18n.t(`image-code-${labelId}`);
    };

    this.miiPvLabelMapper = (labelId) => {
      if (auxImageHelper.supportsDomainCreationImages()) {
        return this.labelMapper(labelId.replace(/^auxiliary-/, 'domain-creation-'));
      }
      return this.labelMapper(labelId);
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.disablePrimaryImageScript = ko.computed(() => {
      return !this.project.image.createPrimaryImage.value;
    }, this);

    this.disableAuxiliaryImageScript = ko.computed(() => {
      let result = true;
      if (this.project.settings.targetDomainLocation.value === 'mii') {
        result = !(this.project.image.useAuxImage.value && this.project.image.createAuxImage.value);
      } else if (auxImageHelper.supportsDomainCreationImages()) {
        result = !(this.project.image.useAuxImage.value && this.project.image.createAuxImage.value);
      }
      return result;
    }, this);

    this.subviews = [
      {
        id: 'primaryImageScript',
        name: this.labelMapper('primary-image-script-tab'),
        disabled: this.disablePrimaryImageScript
      },
      {
        id: 'auxiliaryImageScript',
        name: this.miiPvLabelMapper('auxiliary-image-script-tab'),
        disabled: this.disableAuxiliaryImageScript
      }
    ];
    this.subviewsDP = new ArrayDataProvider(this.subviews, {keyAttributes: 'id'});
    this.selectedSubview = ko.observable('primaryImageScript');
    this.selectedSubview.subscribe((subview) => {
      this.renderSubviewScript(subview);
    });

    this.tabsStatus = ko.computed(() => {
      return this.disablePrimaryImageScript() && this.disableAuxiliaryImageScript() ? 'disabled' : 'enabled';
    }, this);

    this.codeViewScriptLanguage = ko.observable(ImageScriptGenerator.getDefaultScriptingLanguage());
    this.codeViewScriptLanguages = [
      { key: 'sh', label: this.shellLabelMapper('sh-label') },
      { key: 'ps1', label: this.shellLabelMapper('ps1-label') },
      { key: 'cmd', label: this.shellLabelMapper('cmd-label') }
    ];
    this.codeViewScriptLanguagesDP = new ArrayDataProvider(this.codeViewScriptLanguages, { keyAttributes: 'key' });
    this.codeViewScriptLanguageSelectValueChangedHandler = (event) =>  {
      this.codeViewScriptLanguage(event.detail.value);
      this.renderSubviewScript(this.selectedSubview(), event.detail.value);
    };

    this.renderPrimaryImageScript = (scriptType) => {
      if (this.disablePrimaryImageScript()) {
        this.codeText(this.labelMapper('primary-image-script-no-content'));
      } else {
        const imageScriptGenerator = new ImageScriptGenerator(scriptType);
        const lines = imageScriptGenerator.generatePrimary();
        this.codeText(lines.join('\n'));
      }
    };

    this.renderAuxiliaryImageScript = (scriptType) => {
      if (this.disableAuxiliaryImageScript()) {
        this.codeText(this.miiPvLabelMapper('auxiliary-image-script-no-content'));
      } else {
        const imageScriptGenerator = new ImageScriptGenerator(scriptType);
        const lines = imageScriptGenerator.generateAuxiliary(auxImageHelper.supportsDomainCreationImages());
        this.codeText(lines.join('\n'));
      }
    };

    this.renderSubviewScript = (subview, scriptType = this.codeViewScriptLanguage()) => {
      switch (subview) {
        case 'primaryImageScript':
          this.renderPrimaryImageScript(scriptType);
          break;

        case 'auxiliaryImageScript':
          this.renderAuxiliaryImageScript(scriptType);
          break;
      }
    };

    this.codeText = ko.observable();

    this.downloadScript = () => {
      const format = this.codeViewScriptLanguage();
      const generator = new ImageScriptGenerator(format);
      const auxiliary = this.selectedSubview() === 'auxiliaryImageScript';
      const lines = auxiliary ? generator.generateAuxiliary() : generator.generatePrimary();
      const typeName = this.labelMapper(auxiliary ? 'auxiliary-image-script-tab' : 'primary-image-script-tab');
      const fileType = i18n.t('image-code-script-title', {type: typeName});
      const formatLabel = this.shellLabelMapper(format + '-label');

      window.api.ipc.send('download-file', lines, fileType, format, formatLabel);
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ImageCodeViewModel;
});
