/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter',
  'utils/aux-image-helper', 'ojs/ojarraydataprovider', 'utils/wit-creator', 'utils/wit-aux-creator',
  'utils/image-pusher', 'utils/aux-image-pusher', 'models/wkt-project'
],
function(i18n, accUtils, ko, CoreRouter, ModuleRouterAdapter, auxImageHelper, ArrayDataProvider,
  witImageCreator, WitAuxImageCreator, imagePusher, AuxImagePusher, project) {
  function ImageViewModel(args) {
    this.project = project;

    this.connected = () => {
      accUtils.announce('Image page loaded.', 'assertive');
      // document.title = "Image";
      // Implement further logic if needed
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`image-page-${labelId}`);
    };

    this.miiPvLabelMapper = (labelId) => {
      if (auxImageHelper.supportsDomainCreationImages()) {
        return this.labelMapper(labelId.replace(/AuxImage$/, 'DomainCreationImage'));
      }
      return this.labelMapper(labelId);
    };

    this.isCreatingPrimaryImage = ko.computed(() => {
      return this.project.image.createPrimaryImage.value;
    });

    this.isCreatingAuxImage = ko.computed(() => {
      if (this.project.settings.targetDomainLocation.observable() === 'mii' ||
        auxImageHelper.supportsDomainCreationImages()) {
        return this.project.image.useAuxImage.observable() && this.project.image.createAuxImage.observable();
      }
      return false;
    });

    this.disableCreateImage = ko.observable(false);
    this.disablePushImage = ko.observable(false);
    this.disableCreateAuxImage = ko.observable(false);
    this.disablePushAuxImage = ko.observable(false);

    this.createImage = async () => {
      await witImageCreator.startCreateImage();
    };

    this.pushImage = async () => {
      await imagePusher.startPushImage();
    };

    this.createAuxImage = async () => {
      await new WitAuxImageCreator().startCreateAuxImage();
    };

    this.pushAuxImage = async () => {
      await new AuxImagePusher().startPushAuxImage();
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
