/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'utils/wkt-logger',
  'ojs/ojpagingcontrol', 'ojs/ojmodule-element', 'ojs/ojfilmstrip', 'ojs/ojformlayout', 'ojs/ojbutton',
  'ojs/ojinputtext', 'ojs/ojcheckboxset', 'ojs/ojdefer'],
function(accUtils, ko, i18n, Context, moduleElementUtils, wktLogger) {
  function QuickStartDialogModel() {

    const QUICKSTART_PAGE_COUNT = 11;
    const DIALOG_NAME = 'wktQuickStartDialog';
    const DIALOG_SELECTOR = `#${DIALOG_NAME}`;
    this.i18n = i18n;
    this.quickstartPagingModel = ko.observable(null);
    this.stopShowingQuickstart = ko.observableArray();
    this.wrcFrontendCompatibilityVersion = window.api.utils.wrcFrontendCompatibilityVersion;

    this.connected = () => {
      accUtils.announce('Discover dialog loaded.', 'assertive');
    };

    this.transitionCompleted = () => {
      const filmStrip = document.getElementById('wktQuickStartFilmStrip');
      const busyContext = Context.getContext(filmStrip).getBusyContext();
      wktLogger.debug('preparing to wait on busy context whenReady()');
      busyContext.whenReady().then(isReady => {
        wktLogger.debug('whenReady promise resolved: %s', isReady);
        if (isReady) {
          // Set the Paging Control pagingModel
          this.quickstartPagingModel(filmStrip.getPagingModel());
        } else {
          wktLogger.warn('whenReady promise resolved to not ready!');
        }
      }).catch(err => wktLogger.error('whenReady promise was rejected: %s', err));
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`quickstart-dialog-${labelId}`);
    };

    this.quickstartPagesConfig = [ ];

    for (let i = 0; i < QUICKSTART_PAGE_COUNT; i++) {
      const pageNumber = i + 1;
      this.quickstartPagesConfig.push(moduleElementUtils.createConfig({
        viewPath: `views/quickstart/page${pageNumber}-view.html`,
        viewModelPath: 'viewModels/quickstart/page',
        params: { pageNumber: pageNumber, wrcFrontendCompatibilityVersion: this.wrcFrontendCompatibilityVersion }
      }));
    }

    this.closeQuickstart = () => {
      if (this.stopShowingQuickstart().length > 0) {
        const value = this.stopShowingQuickstart()[0];
        if (!!value) {
          window.api.ipc.send('skip-quickstart-at-startup');
        }
      }

      const dialog = $(DIALOG_SELECTOR)[0];
      if (dialog) {
        // Workaround for bug JET-46381...
        //
        // WORKAROUND START
        const filmStrip = document.getElementById('wktQuickStartFilmStrip');
        const busyContext = Context.getContext(filmStrip).getBusyContext();
        busyContext.clear(); // FORCE CLEAR
        // WORKAROUND END

        dialog.close();
      }
    };
  }

  return QuickStartDialogModel;
});
