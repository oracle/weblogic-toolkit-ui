/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter',
  'ojs/ojarraydataprovider', 'utils/wit-creator', 'utils/image-pusher'
],
function(i18n, accUtils, ko, CoreRouter, ModuleRouterAdapter, ArrayDataProvider,
  witCreator, imagePusher) {
  function ImageViewModel(args) {

    this.connected = () => {
      accUtils.announce('Image page loaded.', 'assertive');
      // document.title = "Image";
      // Implement further logic if needed
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`image-page-${labelId}`);
    };

    this.disableCreateImage = ko.observable(false);
    this.disablePushImage = ko.observable(false);

    this.createImage = async () => {
      await witCreator.startCreateImage();
    };

    this.pushImage = async () => {
      await imagePusher.startPushImage();
    };

    let navData = [
      { path: '', redirect: 'image-design-view' },
      { path: 'image-design-view', detail: { label: i18n.t('page-design-view') } },
      { path: 'image-code-view', detail: { label: i18n.t('page-code-view') } }
    ];

    this.selectedItem = ko.observable('image-design-view');
    this.dataProvider = new ArrayDataProvider(navData.slice(1), { keyAttributes: 'path' });

    // Router setup
    let router = args.parentRouter.createChildRouter(navData);
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router);

    this.selectedItem.subscribe((newValue) => {
      router.go({ path: newValue });
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ImageViewModel;
});
