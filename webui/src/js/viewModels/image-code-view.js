/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/image-script-generator',
  'ojs/ojarraydataprovider', 'ojs/ojinputtext', 'ojs/ojformlayout', 'ojs/ojselectsingle'  ],
function(accUtils, ko, i18n, project, ImageScriptGenerator, ArrayDataProvider) {
  function ImageCodeViewModel() {

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Image code view loaded.', 'assertive');

      // update code text if project changes
      subscriptions.push(project.postOpen.subscribe(() => {
        this.renderScript(this.codeViewScriptLanguage());
      }));

      this.renderScript(this.codeViewScriptLanguage());
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.shellLabelMapper = (labelId) => {
      return i18n.t(`script-${labelId}`);
    };

    this.codeViewScriptLanguage = ko.observable(ImageScriptGenerator.getDefaultScriptingLanguage());
    this.codeViewScriptLanguages = [
      { key: 'sh', label: this.shellLabelMapper('sh-label') },
      { key: 'ps1', label: this.shellLabelMapper('ps1-label') },
      { key: 'cmd', label: this.shellLabelMapper('cmd-label') }
    ];
    this.codeViewScriptLanguagesDP = new ArrayDataProvider(this.codeViewScriptLanguages, { keyAttributes: 'key' });
    this.codeViewScriptLanguageSelectValueChangedHandler = (event) =>  {
      this.codeViewScriptLanguage(event.detail.value);
      this.renderScript(event.detail.value);
    };

    this.renderScript = (scriptType) => {
      const imageScriptGenerator = new ImageScriptGenerator(scriptType);
      const lines = imageScriptGenerator.generate();
      this.codeText(lines.join('\n'));
    };

    this.codeText = ko.observable();
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ImageCodeViewModel;
});
