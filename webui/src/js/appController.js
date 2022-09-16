/**
 * @license
 * Copyright (c) 2014, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */

define(['knockout', 'ojs/ojcontext', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils',
  'ojs/ojmodule-element-utils', 'ojs/ojmodule-element', 'ojs/ojknockout'],
function(ko, Context, ResponsiveUtils, ResponsiveKnockoutUtils, ModuleElementUtils) {

  function ControllerViewModel() {

    // Electron-related initialization
    this.appName = ko.observable(window.api.process.getApplicationName());

    // Handle announcements sent when pages change, for Accessibility.
    this.manner = ko.observable('polite');
    this.message = ko.observable();
    let announcementHandler = (event) => {
      this.message(event.detail.message);
      this.manner(event.detail.manner);
    };

    document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);

    // Media queries for responsive layouts
    const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
    this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

    this.clickHandler = (event) => {
      if (event.target.matches('.wkt-link-container a')) {
        event.preventDefault();
        let link = event.target.href;
        if(link) {
          window.api.ipc.invoke('open-external-link', link).then();
        }
      }
    };

    document.body.addEventListener('click', this.clickHandler);

    let mainModule = window.api.utils.mainModule;
    mainModule = mainModule ? mainModule: 'app-main';

    this.mainModuleConfig = ModuleElementUtils.createConfig({
      name: mainModule,
      params: {}
    });
  }

  // release the application bootstrap busy state
  Context.getPageContext().getBusyContext().applicationBootstrapComplete();

  return new ControllerViewModel();
});
