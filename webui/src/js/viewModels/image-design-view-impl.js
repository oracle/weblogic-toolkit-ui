/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['utils/wkt-logger'],
  function (wktLogger) {
    function ImageDesignViewModel(i18n, project, accUtils, ko, dialogHelper, ArrayDataProvider, wktImageInspector) {

      this.connected = async () => {
        accUtils.announce('Image Design View page loaded.', 'assertive');
      };

      this.labelMapper = (labelId) => {
        if (labelId.startsWith('page-design-')) {
          return i18n.t(labelId);
        }
        return i18n.t(`image-design-${labelId}`);
      };

      this.project = project;

      this.targetDomainLocationIsPV = () => {
        return this.project.settings.targetDomainLocation.value === 'pv';
      };

      this.requiresWdt = () => {
        return !this.targetDomainLocationIsPV();
      };

      this.isBuildingImage = () => {
        return !this.targetDomainLocationIsPV() || this.project.image.createCustomImageForPV.value;
      };

      this.imageRegistryPushRequiresAuthentication = () => {
        return this.project.image.imageRegistryPushRequireAuthentication.observable();
      };

      this.inspectBaseImage = () => {
        wktImageInspector.startInspectImage().then(isSuccess => {
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
