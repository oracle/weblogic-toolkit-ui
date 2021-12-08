/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

/**
 * An object which defines creation of Mii images to be used by the WebLogic Kubernetes Operator.
 *
 * Returns a constructor for the object.
 */
define(['knockout', 'utils/observable-properties', 'utils/validation-helper'],
  function (ko, props, validationHelper) {
    /**
     * The object constructor.
     */
    return function (name, wdtModel) {
      function ImageModel() {
        this.imageTag = props.createProperty();
        this.imageTag.addValidator(...validationHelper.getImageTagValidators());
        this.createPrimaryImage = props.createProperty(false);

        // deprecated and no longer used as of version 1.1.0
        this.createCustomImageForPV = props.createProperty(false);

        this.imageRegistryPushRequireAuthentication = props.createProperty(true);
        this.imageRegistryPushUser = props.createProperty().asCredential();
        this.imageRegistryPushPassword = props.createProperty().asCredential();

        this.useCustomBaseImage = props.createProperty(false);

        // this needs to be declared before baseImageInspected and customBaseImageContents
        // to clear them when this is set, and allow them to be reset later in project open.
        this.baseImage = props.createProperty();
        this.baseImage.addValidator(...validationHelper.getImageTagValidators());

        this.baseImagePullRequiresAuthentication = props.createProperty(false);
        this.baseImagePullUsername = props.createProperty().asCredential();
        this.baseImagePullPassword = props.createProperty().asCredential();
        this.baseImageInspected = props.createProperty(false);
        this.customBaseImageContents = props.createArrayProperty([]);

        this.jdkInstaller = props.createProperty();
        this.jdkInstallerVersion = props.createProperty();
        this.oracleInstallerType = props.createProperty('WLS');
        this.oracleInstaller = props.createProperty();
        this.oracleInstallerVersion = props.createProperty();
        this.useLatestWdtVersion = props.createProperty(true);
        this.wdtInstaller = props.createProperty();
        this.wdtInstallerVersion = props.createProperty();

        this.applyOraclePatches = props.createProperty(true);
        this.oracleSupportUserName = props.createProperty().asCredential();
        this.oracleSupportPassword = props.createProperty().asCredential();
        this.oraclePatchOptions = props.createProperty('recommended');
        this.oraclePatchesToApply = props.createArrayProperty([]);

        this.targetDomainType = props.createProperty('WLS');
        this.domainHomePath = props.createProperty('/u01/domains/${1}', wdtModel.domainName);
        this.modelHomePath = props.createProperty('/u01/wdt/models');
        this.wdtHomePath = props.createProperty('/u01/wdt');

        this.targetOpenShift = props.createProperty(false);
        this.defaultGroupName = ko.computed(() => {
          return this.targetOpenShift.value ? 'root' : 'oracle';
        });

        this.fileOwner = props.createProperty('oracle');
        this.fileGroup = props.createProperty('${1}', this.defaultGroupName);
        this.alwaysPullBaseImage = props.createProperty(false);
        this.builderNetworkName = props.createProperty();
        this.extendBuild = props.createProperty(false);
        this.additionalBuildCommandsFile = props.createProperty();
        this.additionalBuildFiles = props.createArrayProperty([]);

        // aux image versions of the variables
        this.useAuxImage = props.createProperty(true);
        this.auxImageTag = props.createProperty();
        this.auxImageTag.addValidator(...validationHelper.getImageTagValidators());
        this.createAuxImage = props.createProperty(true);

        this.auxImageRegistryPushRequireAuthentication = props.createProperty(true);
        this.auxImageRegistryPushUser = props.createProperty().asCredential();
        this.auxImageRegistryPushPassword = props.createProperty().asCredential();

        this.auxUseCustomBaseImage = props.createProperty(false);
        this.auxBaseImage = props.createProperty();
        this.auxBaseImage.addValidator(...validationHelper.getImageTagValidators());
        this.auxBaseImagePullRequiresAuthentication = props.createProperty(false);
        this.auxBaseImagePullUsername = props.createProperty().asCredential();
        this.auxBaseImagePullPassword = props.createProperty().asCredential();

        this.auxTargetOpenShift = props.createProperty(false);
        this.auxDefaultGroupName = ko.computed(() => {
          return this.auxTargetOpenShift.value ? 'root' : 'oracle';
        });

        this.auxFileOwner = props.createProperty('oracle');
        this.auxFileGroup = props.createProperty('${1}', this.auxDefaultGroupName);
        this.auxAlwaysPullBaseImage = props.createProperty(false);
        this.auxBuilderNetworkName = props.createProperty();
        this.auxExtendBuild = props.createProperty(false);
        this.auxAdditionalBuildCommandsFile = props.createProperty();
        this.auxAdditionalBuildFiles = props.createArrayProperty([]);

        // internal fields that should not be read or written to the project file.
        this.internal = {
          auxImageRegistryAddress: props.createProperty(),
          imageRegistryAddress: props.createProperty(),
          auxBaseImageRegistryAddress: props.createProperty(),
          baseImageRegistryAddress: props.createProperty()
        };

        // imageRegistryAddress is always derived from imageTag
        this.imageTag.observable.subscribe(value => {
          let host;
          if (value && value.length > 0) {
            host = window.api.k8s.getRegistryAddressFromImageTag(value);
          }
          this.internal.imageRegistryAddress.observable(host);
        });

        this.auxImageTag.observable.subscribe(value => {
          let host;
          if (value && value.length > 0) {
            host = window.api.k8s.getRegistryAddressFromImageTag(value);
          }
          this.internal.auxImageRegistryAddress.observable(host);
        });

        this.baseImage.observable.subscribe(value => {
          let host;
          if (value && value.length > 0) {
            host = window.api.k8s.getRegistryAddressFromImageTag(value);
          }
          this.internal.baseImageRegistryAddress.observable(host);
        });

        this.auxBaseImage.observable.subscribe(value => {
          let host;
          if (value && value.length > 0) {
            host = window.api.k8s.getRegistryAddressFromImageTag(value);
          }
          this.internal.auxBaseImageRegistryAddress.observable(host);
        });

        this.readFrom = (json) => {
          props.createGroup(name, this).readFrom(json);
        };

        this.writeTo = (json) => {
          props.createGroup(name, this).writeTo(json);
        };

        this.isChanged = () => {
          return props.createGroup(name, this).isChanged();
        };

        this.setNotChanged = () => {
          props.createGroup(name, this).setNotChanged();
        };

        // when baseImage changes, clear 'inspected' flag and custom contents.
        // if this is due to a project open, those values should be reset AFTER this.
        // this is dependent on the ordering of the property attributes above.
        this.baseImage.observable.subscribe(() => {
          this.baseImageInspected.observable(false);
          this.customBaseImageContents.observable([]);
        });

        this.setBaseImageContents = (inspectionContents) => {
          if (inspectionContents) {
            const results = [];
            if ('javaHome' in inspectionContents) {
              results.push('javaHome');
            }
            if ('oracleHome' in inspectionContents) {
              results.push('oracleHome');
            }
            this.customBaseImageContents.observable(results);
            this.baseImageInspected.observable(true);
          }
        };

        this.baseImageContentsIncludesJava = () => {
          return this.customBaseImageContents.value.includes('javaHome');
        };

        this.baseImageContentsIncludesMiddleware = () => {
          return this.customBaseImageContents.value.includes('oracleHome');
        };
      }

      return new ImageModel();
    };
  });
