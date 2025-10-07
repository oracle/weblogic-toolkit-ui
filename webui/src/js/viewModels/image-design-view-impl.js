/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/wkt-logger', 'utils/screen-utils', 'utils/aux-image-helper'],
  function (wktLogger, screenUtils, auxImageHelper) {
    function ImageDesignViewModel(i18n, project, accUtils, ko, dialogHelper, ArrayDataProvider, wktImageInspector) {

      let subscriptions = [];

      this.connected = () => {
        accUtils.announce('Image Design View page loaded.', 'assertive');

        subscriptions.push(this.auxImageConfig.subscribe((newValue) => {
          this.applyAuxImageConfig(newValue);
          document.getElementById('designtabs').refresh();
        }));

        subscriptions.push(project.image.createPrimaryImage.observable.subscribe(() => {
          document.getElementById('create-image-switch').refresh();
          const primaryImageTag = document.getElementById('primary-image-tag');
          if (primaryImageTag) {
            primaryImageTag.refresh();
          }
        }));

        subscriptions.push(project.image.useAuxImage.observable.subscribe(() => {
          this.auxImageConfig(this.computeAuxImageConfig());
          document.getElementById('designtabs').refresh();
          // change the primary image tag's help text based on the value of the switch?
          const primaryImageTag = document.getElementById('primary-image-tag');
          if (primaryImageTag) {
            primaryImageTag.refresh();
          }
        }));

        subscriptions.push(project.image.createAuxImage.observable.subscribe(() => {
          this.auxImageConfig(this.computeAuxImageConfig());
          const auxImageTag = document.getElementById('aux-image-tag');
          if (auxImageTag) {
            auxImageTag.refresh();
          }
        }));
      };

      this.disconnected = () => {
        subscriptions.forEach((subscription) => {
          subscription.dispose();
        });
      };

      this.labelMapper = (labelId) => {
        if (labelId.startsWith('page-design-')) {
          return i18n.t(labelId);
        }
        return i18n.t(`image-design-${labelId}`);
      };

      this.miiPvLabelMapper = (labelId) => {
        if (this.targetDomainLocationIsPV()) {
          return this.labelMapper(labelId.replace(/^aux-/, 'domain-creation-'));
        }
        return this.labelMapper(labelId);
      };

      this.project = project;

      this.targetDomainLocationIsMII = () => {
        return this.project.settings.targetDomainLocation.value === 'mii';
      };

      this.targetDomainLocationIsPV = () => {
        return this.project.settings.targetDomainLocation.value === 'pv';
      };

      this.useAuxiliaryImage = () => {
        return this.project.image.useAuxImage.value;
      };

      this.supportsDomainCreationImages = () => {
        return auxImageHelper.supportsDomainCreationImages();
      };

      this.disableAuxImage = ko.computed(() => {
        let result = true;
        if (this.targetDomainLocationIsMII()) {
          result = !(this.project.image.useAuxImage.value && this.project.image.createAuxImage.value);
        } else if (auxImageHelper.supportsDomainCreationImages()) {
          result = !(this.project.image.useAuxImage.value && this.project.image.createAuxImage.value);
        }
        return result;
      }, this);

      this.mainCreateImageSwitchHelp = ko.computed(() => {
        if (this.targetDomainLocationIsMII() && this.project.image.useAuxImage.value) {
          return this.labelMapper('create-image-aux-help');
        } else if (this.targetDomainLocationIsPV()) {
          return this.labelMapper('create-image-aux-help');
        } else {
          return this.labelMapper('create-image-help');
        }
      }, this);

      this.mainImageTagHelpMII = () => {
        let key = 'image-tag-mii-use-help';
        if (this.project.image.createPrimaryImage.value) {
          key = 'image-tag-mii-create-help';
          if (this.project.image.useAuxImage.value) {
            key = 'image-tag-mii-create-with-aux-help';
          }
        } else if (this.project.image.useAuxImage.value) {
          key = 'image-tag-mii-use-with-aux-help';
        }
        return key;
      };

      this.mainImageTagHelpDII = () => {
        let key = 'image-tag-dii-use-help';
        if (this.project.image.createPrimaryImage.value) {
          key = 'image-tag-dii-create-help';
        }
        return key;
      };

      this.mainImageTagHelpPV = () => {
        let key = 'image-tag-pv-use-help';
        if (this.project.image.createPrimaryImage.value) {
          key = 'image-tag-pv-create-help';
        }
        return key;
      };

      this.mainImageTagHelp = ko.computed(() => {
        let key = 'use-image-tag-help';

        switch (this.project.settings.targetDomainLocation.value) {
          case 'mii':
            key = this.mainImageTagHelpMII();
            break;

          case 'dii':
            key = this.mainImageTagHelpDII();
            break;

          case 'pv':
            key = this.mainImageTagHelpPV();
            break;
        }
        return this.labelMapper(key);
      }, this);

      this.auxImageConfigData = this.targetDomainLocationIsPV() ?
        [
          {id: 'createOption', value: 'create', label: this.miiPvLabelMapper('aux-image-config-create-label')},
          {id: 'useOption', value: 'use', label: this.miiPvLabelMapper('aux-image-config-use-label')},
          {id: 'offOption', value: 'off', label: this.miiPvLabelMapper('aux-image-config-off-label')},
        ]
        :
        [
          {id: 'createOption', value: 'create', label: this.miiPvLabelMapper('aux-image-config-create-label')},
          {id: 'useOption', value: 'use', label: this.miiPvLabelMapper('aux-image-config-use-label')},
        ];

      this.applyAuxImageConfig = (newValue) => {
        switch (newValue) {
          case 'off':
            project.image.useAuxImage.observable(false);
            break;

          case 'use':
            project.image.useAuxImage.observable(true);
            project.image.createAuxImage.observable(false);
            break;

          case 'create':
            project.image.useAuxImage.observable(true);
            project.image.createAuxImage.observable(true);
            break;
        }
      };

      this.computeAuxImageConfig = () => {
        let value = 'off';
        if (this.project.image.useAuxImage.value) {
          value = 'use';
          if (this.project.image.createAuxImage.value) {
            value = 'create';
          }
        }
        return value;
      };

      this.auxImageConfigDP = ko.computed(() => {
        return new ArrayDataProvider(this.auxImageConfigData, {keyAttributes: 'id'});
      });
      this.auxImageConfig = ko.observable(this.computeAuxImageConfig());

      this.subviews = [
        {id: 'primaryImage', name: this.labelMapper('image-tab')},
        {id: 'auxiliaryImage', name: this.miiPvLabelMapper('aux-image-tab'), disabled: this.disableAuxImage}
      ];

      this.subviewsDP = new ArrayDataProvider(this.subviews, {keyAttributes: 'id'});
      screenUtils.setImageDesignViewSelectedSubview('primaryImage', true);
      this.selectedSubview = screenUtils.getImageDesignViewSelectedSubviewObservable();
      this.selectedSubviewValueChangedHandler = (event) => {
        screenUtils.setImageDesignViewSelectedSubview(event.detail.value);
      };

      this.mainImagePageTitle = ko.computed(() => {
        if (this.targetDomainLocationIsMII() && this.project.image.useAuxImage.value || this.targetDomainLocationIsPV()) {
          return this.labelMapper('fmw-title');
        } else {
          return this.labelMapper('title');
        }
      }, this);

      this.isBuildingImage = () => {
        return this.project.image.createPrimaryImage.value;
      };

      this.isBuildingAuxImage = () => {
        return this.project.image.createAuxImage.value;
      };

      this.imageRegistryPushRequiresAuthentication = () => {
        return this.project.image.imageRegistryPushRequireAuthentication.observable();
      };

      this.auxImageRegistryPushRequiresAuthentication = () => {
        return this.project.image.auxImageRegistryPushRequireAuthentication.observable();
      };

      this.inspectBaseImage = () => {
        wktImageInspector.startInspectBaseImage().then(isSuccess => {
          if (isSuccess) {
            this.project.image.baseImageInspected.observable(true);
          }
        }).catch(err => {
          const errTitle = i18n.t('wit-inspector-inspect-failed-title');
          const errMessage = i18n.t('wit-inspector-inspect-catch-all-error-message',
            { error: err.message ? err.message : err});
          wktLogger.error(err);
          window.api.ipc.invoke('show-error-message', errTitle, errMessage).then().catch(displayErr => {
            // best effort to display the error
            wktLogger.warn(displayErr);
          });
        });
      };

      // a computed observable, true if useCustomBaseImage is true and baseImageInspected is false.
      this.waitForCustomBaseImageInspection = ko.computed(function() {
        return this.project.image.useCustomBaseImage.observable() && !this.project.image.baseImageInspected.observable();
      }, this);

      this.customImageDoesNotContainJDK = () => {
        return !this.project.image.baseImageContentsIncludesJava();
      };

      this.customImageDoesNotContainsOracleHome = () => {
        return !this.project.image.baseImageContentsIncludesMiddleware();
      };

      this.needsInstallers = ko.computed(function() {
        let result = true;
        if (this.project.image.useCustomBaseImage.observable()) {
          if (this.project.image.baseImageContentsIncludesMiddleware()) {
            result = false;
          }
        }
        return result;
      }, this);

      this.chooseJDK = () => {
        window.api.ipc.invoke('get-jdk-installer-location')
          .then(jdkInstaller => {
            // no value indicates the chooser was cancelled
            if(jdkInstaller) {
              this.project.image.jdkInstaller.observable(jdkInstaller);
            }
          });
      };

      this.chooseFMW = () => {
        window.api.ipc.invoke('get-fmw-installer-location')
          .then(oracleInstaller => {
            // no value indicates the chooser was cancelled
            if(oracleInstaller) {
              this.project.image.oracleInstaller.observable(oracleInstaller);
            }
          });
      };

      this.chooseWDT = () => {
        window.api.ipc.invoke('get-wdt-installer-location')
          .then(wdtInstaller => {
            // no value indicates the chooser was cancelled
            if(wdtInstaller) {
              this.project.image.wdtInstaller.observable(wdtInstaller);
            }
          });
      };

      this.oracleInstallerTypes = [
        { key: 'WLS', label: this.labelMapper('fmw-installer-type-wls-label') },
        { key: 'WLSDEV', label: this.labelMapper('fmw-installer-type-wlsdev-label') },
        { key: 'WLSSLIM', label: this.labelMapper('fmw-installer-type-wlsslim-label') },
        { key: 'FMW', label: this.labelMapper('fmw-installer-type-fmw-label') },
        { key: 'SOA', label: this.labelMapper('fmw-installer-type-soa-label') },
        { key: 'SOA_OSB', label: this.labelMapper('fmw-installer-type-soa_osb-label') },
        { key: 'OSB', label: this.labelMapper('fmw-installer-type-osb-label') },
        { key: 'IDM', label: this.labelMapper('fmw-installer-type-idm-label') },
        { key: 'OAM', label: this.labelMapper('fmw-installer-type-oam-label') },
        { key: 'OIG', label: this.labelMapper('fmw-installer-type-oig-label') },
        { key: 'OUD_WLS', label: this.labelMapper('fmw-installer-type-oud_wls-label') },
        { key: 'OUD', label: this.labelMapper('fmw-installer-type-oud-label') },
        { key: 'WCP', label: this.labelMapper('fmw-installer-type-wcp-label') },
        { key: 'WCC', label: this.labelMapper('fmw-installer-type-wcc-label') },
        { key: 'WCS', label: this.labelMapper('fmw-installer-type-wcs-label') },
      ];
      this.oracleInstallerTypesDP = new ArrayDataProvider(this.oracleInstallerTypes, { keyAttributes: 'key' });

      this.patchOptions = [
        { id: 'noneOption', value: 'none', label: this.labelMapper('psu-rec-none-option-label') },
        { id: 'psuOnlyOption', value: 'psu', label: this.labelMapper('psu-rec-psu-only-option-label') },
        { id: 'recommendedOption', value: 'recommended', label: this.labelMapper('psu-rec-recommended-option-label') },
      ];

      // Disable JRF as the domain type since the application does not (yet?) provide the mechanisms required
      // to specify the JRF schemas or the database connectivity and credential information needed to run RCU.
      //
      this.wdtDomainTypes = [
        { key: 'WLS', label: this.labelMapper('wls-domain-type-label') },
        { key: 'RestrictedJRF', label: this.labelMapper('restricted-jrf-domain-type-label') },
        // { key: 'JRF', label: this.labelMapper('jrf-domain-type-label') },
      ];
      this.wdtDomainTypesDP = new ArrayDataProvider(this.wdtDomainTypes, { keyAttributes: 'key' });

      this.chooseAdditionalBuildCommandsFile = () => {
        window.api.ipc.invoke('get-additional-image-build-commands-file').then(filePath => {
          if (filePath) {
            this.project.image.additionalBuildCommandsFile.observable(filePath);
          }
        });
      };

      this.chooseAuxAdditionalBuildCommandsFile = () => {
        window.api.ipc.invoke('get-additional-image-build-commands-file').then(filePath => {
          if (filePath) {
            this.project.image.auxAdditionalBuildCommandsFile.observable(filePath);
          }
        });
      };

      this.chooseAuxAdditionalBuildFiles = () => {
        window.api.ipc.invoke('get-additional-image-build-files').then(fileList => {
          if (fileList && fileList.length > 0) {
            this.project.image.auxAdditionalBuildFiles.observable(fileList);
          }
        });
      };

      this.chooseAdditionalBuildFiles = () => {
        window.api.ipc.invoke('get-additional-image-build-files').then(fileList => {
          if (fileList && fileList.length > 0) {
            this.project.image.additionalBuildFiles.observable(fileList);
          }
        });
      };
    }

    /*
     * Returns a constructor for the ViewModel.
     */
    return ImageDesignViewModel;
  }
);
