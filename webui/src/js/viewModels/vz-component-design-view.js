/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['models/wkt-project', 'accUtils', 'utils/common-utilities', 'knockout', 'utils/i18n', 'utils/screen-utils',
  'ojs/ojbufferingdataprovider', 'ojs/ojarraydataprovider', 'ojs/ojconverter-number', 'utils/dialog-helper',
  'utils/view-helper', 'utils/vz-get-installed-version', 'utils/wkt-logger', 'ojs/ojmessaging', 'ojs/ojinputtext',
  'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout', 'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojlistview',
  'ojs/ojtable', 'ojs/ojswitch', 'ojs/ojinputnumber', 'ojs/ojradioset'],
function (project, accUtils, utils, ko, i18n, screenUtils, BufferingDataProvider, ArrayDataProvider,
  ojConverterNumber, dialogHelper, viewHelper, verrazzanoInstallVersionChecker) {
  function VerrazzanoComponentDesignViewModel() {

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Verrazzano Component Design View page loaded.', 'assertive');

      subscriptions.push(this.auxImageConfig.subscribe((newValue) => {
        this.applyAuxImageConfig(newValue);
      }));

      subscriptions.push(this.project.k8sDomain.domainNodeSelector.observable.subscribe(() => {
        document.getElementById('domain-node-selector-table').refresh();
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
          viewHelper.componentReady(auxImageTag).then(() => {
            auxImageTag.refresh();
          });
        }
      }));
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      if (labelId.startsWith('page-design-')) {
        return i18n.t(labelId);
      }
      return i18n.t(`vz-component-design-${labelId}`, payload);
    };

    this.domainLabelMapper = (labelId, payload) => {
      return i18n.t(`domain-design-${labelId}`, payload);
    };

    this.imageLabelMapper = (labelId, payload) => {
      return i18n.t(`image-design-${labelId}`, payload);
    };

    this.project = project;
    this.i18n = i18n;

    this.getInstalledVersionNumber = () => {
      verrazzanoInstallVersionChecker.startVerrazzanoInstallVersionCheck().then();
    };

    this.mainCreateImageSwitchHelp = ko.computed(() => {
      if (this.project.image.useAuxImage.value) {
        return this.imageLabelMapper('create-image-aux-help');
      } else {
        return this.imageLabelMapper('create-image-help');
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
      return this.domainLabelMapper(key);
    }, this);

    this.isPrimaryImageTagReadOnly = ko.computed(() => {
      return this.project.image.createPrimaryImage.observable();
    }, this);

    this.isAuxImageTagReadOnly = ko.computed(() => {
      return this.project.image.createAuxImage.observable();
    }, this);

    this.auxImageTagHelp = ko.computed(() => {
      let key = 'use-aux-image-tag-help';
      if (this.project.image.createAuxImage.observable()) {
        key = 'create-aux-image-tag-help';
      }
      return this.domainLabelMapper(key);
    });

    this.targetDomainLocationIsMII = () => {
      return this.project.settings.targetDomainLocation.value === 'mii';
    };

    this.gotoCreateImage = () => {
      screenUtils.gotoImageDesignPrimaryImageScreen();
    };

    this.gotoCreateAuxImage = () => {
      screenUtils.gotoImageDesignAuxiliaryImageScreen();
    };

    this.auxImageConfigData = [
      { id: 'offOption', value: 'off', label: this.imageLabelMapper('aux-image-config-off-label')},
      { id: 'useOption', value: 'use', label: this.imageLabelMapper('aux-image-config-use-label')},
      { id: 'createOption', value: 'create', label: this.imageLabelMapper('aux-image-config-create-label')}
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

    this.auxImageConfigDP = new ArrayDataProvider(this.auxImageConfigData, { keyAttributes: 'id' });
    this.auxImageConfig = ko.observable(this.computeAuxImageConfig());

    this.integerConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0
    });

    this.isDomainInPV = ko.computed(() => {
      return this.project.settings.targetDomainLocation.observable() === 'pv';
    }, this);

    this.isDomainInImage = ko.computed(() => {
      return this.project.settings.targetDomainLocation.observable() === 'dii';
    }, this);

    this.isModelInImage = ko.computed(() => {
      return this.project.settings.targetDomainLocation.observable() === 'mii';
    }, this);

    // Disable JRF as the domain type since the application does not (yet?) provide the mechanisms required
    // to specify the JRF schemas or the database connectivity and credential information needed to run RCU.
    //
    this.wdtDomainTypes = [
      { key: 'WLS', label: i18n.t('image-design-wls-domain-type-label') },
      { key: 'RestrictedJRF', label: i18n.t('image-design-restricted-jrf-domain-type-label') },
      // { key: 'JRF', label: i18n.t('image-design-jrf-domain-type-label') },
    ];
    this.wdtDomainTypesDP = new ArrayDataProvider(this.wdtDomainTypes, { keyAttributes: 'key' });

    this.imageRegistryPullRequiresAuthentication = () => {
      return this.project.k8sDomain.imageRegistryPullRequireAuthentication.observable();
    };

    this.auxImageRegistryPullRequiresAuthentication = () => {
      return this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.observable();
    };

    this.imagePullPolicies = [
      {key: 'IfNotPresent', label: i18n.t('wko-design-image-pull-if-not-present-label')},
      {key: 'Always', label: i18n.t('wko-design-image-pull-always-label')},
      {key: 'Never', label: i18n.t('wko-design-image-pull-never-label')}
    ];
    this.imagePullPoliciesDP = new ArrayDataProvider(this.imagePullPolicies, {keyAttributes: 'key'});

    this.usingAuxImage = ko.computed(() => {
      return this.isModelInImage() && this.project.image.useAuxImage.value;
    }, this);

    this.hasNoClusters = () => {
      return this.project.k8sDomain.clusters.value.length === 0;
    };

    this.clusterColumnData = [
      {
        headerText: this.domainLabelMapper('clusters-name-heading'),
        sortProperty: 'name',
        resizable: 'enabled'
      },
      {
        headerText: this.domainLabelMapper('clusters-replicas-heading'),
        sortProperty: 'replicas',
        resizable: 'enabled'
      },
      {
        headerText: this.domainLabelMapper('clusters-min-heap-heading'),
        sortProperty: 'minHeap',
        resizable: 'enabled'
      },
      {
        headerText: this.domainLabelMapper('clusters-max-heap-heading'),
        sortProperty: 'maxHeap',
        resizable: 'enabled'
      },
      {
        headerText: this.domainLabelMapper('clusters-cpu-request-heading'),
        sortProperty: 'cpuRequest',
        resizable: 'enabled'
      },
      {
        headerText: this.domainLabelMapper('clusters-memory-request-heading'),
        sortProperty: 'memoryRequest',
        resizable: 'enabled'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'chooseHeaderTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
    ];

    const clusterComparators = viewHelper.getSortComparators(this.clusterColumnData);

    this.clustersDP = new ArrayDataProvider(this.project.k8sDomain.clusters.observable,
      { keyAttributes: 'uid', sortComparators: clusterComparators });

    this.clustersEditRow = ko.observable();

    this.handleEditCluster = (event, context) => {
      const index = context.item.index;
      const cluster = this.project.k8sDomain.clusters.observable()[index];
      const existingClusterNames = this.project.k8sDomain.clusters.observable()
        .filter(item => item.name !== cluster.name).map(item => { return item.name; });

      const options = { cluster: cluster, existingNames: existingClusterNames, isDomainInPV: this.isDomainInPV() };

      dialogHelper.promptDialog('cluster-edit-dialog', options).then(result => {
        if (result) {
          let changed = false;
          project.k8sDomain.clusterKeys.forEach(key => {
            if (key !== 'uid' && result.hasOwnProperty(key)) {
              cluster[key] = result[key];
              changed = true;
            }
          });
          if (changed) {
            // FIXME - deal with cluster name changes that conflict with existing names...
            this.project.k8sDomain.clusters.observable.replace(cluster, cluster);
          }
        }
      });
    };

    this.handleClusterEditCancel = () => {
      this.cancelClusterEdit = true;
      this.clustersEditRow({ rowKey: null });
    };

    const generatedClusterNameRegex = /^new-cluster-(\d+)$/;

    this.generateNewClusterName = () => {
      let index = 1;
      this.project.k8sDomain.clusters.observable().forEach(cluster => {
        const match = cluster.name.match(generatedClusterNameRegex);
        if (match) {
          const indexFound = Number(match[1]);
          if (indexFound >= index) {
            index = indexFound + 1;
          }
        }
      });
      return `new-cluster-${index}`;
    };

    this.handleAddCluster = () => {
      const clusterToAdd = {
        uid: utils.getShortUuid(),
        name: this.generateNewClusterName(),
        // In the case of Domain in PV where the user is adding a cluster definition
        // without running PrepareModel, we have no information on the cluster size
        // so just set replicas to zero and maxServers to the max value possible.
        //
        replicas: 0,
        maxServers: Number.MAX_SAFE_INTEGER
      };
      this.project.k8sDomain.clusters.addNewItem(clusterToAdd);
    };

    this.handleDeleteCluster = (event, context) => {
      const index = context.item.index;
      this.project.k8sDomain.clusters.observable.splice(index, 1);
    };

    this.modelHasNoProperties = () => {
      return this.project.wdtModel.getMergedPropertiesContent().value.length === 0;
    };

    this.propertyTableColumnMetadata = () => {
      return [
        {'headerText': this.domainLabelMapper('propname-header'), sortProperty: 'Name', resizable: 'enabled'},
        {'headerText': this.domainLabelMapper('propvalue-header'), sortProperty: 'Value', resizable: 'enabled'},
        {'headerText': this.domainLabelMapper('propoverride-header'), sortProperty: 'Override', resizable: 'enabled'},
      ];
    };

    const propertyComparators = viewHelper.getSortComparators(this.propertyTableColumnMetadata());

    this.configMapDP = new BufferingDataProvider(new ArrayDataProvider(
      this.project.wdtModel.getMergedPropertiesContent().observable,
      {keyAttributes: 'uid', sortComparators: propertyComparators}));

    this.hasEncryptionSecret = () => {
      return this.isModelInImage();
    };

    this.handleRegenerateEncryptionValue = () => {
      const newValue = window.api.utils.generateUuid();
      this.project.k8sDomain.runtimeSecretValue.observable(newValue);
    };

    this.secretsTableColumnMetadata = () => {
      return [
        {'headerText': this.domainLabelMapper('secretname-header'), sortProperty: 'name', resizable: 'enabled'},
        {'headerText': this.domainLabelMapper('username-header'), 'sortable': 'disabled', resizable: 'enabled'},
        {'headerText': this.domainLabelMapper('password-header'), 'sortable': 'disabled', resizable: 'enabled'},
      ];
    };

    this.secretsDP = new BufferingDataProvider(new ArrayDataProvider(
      this.project.k8sDomain.secrets.observable, {keyAttributes: 'name'}));

    this.nodeSelectorColumnMetadata = [
      {
        headerText: this.domainLabelMapper('domain-node-selector-label-name-header'),
        sortProperty: 'name',
        resizable: 'enabled'
      },
      {
        headerText: this.domainLabelMapper('domain-node-selector-label-value-header'),
        sortable: 'disabled',
        resizable: 'enabled'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
    ];

    this.domainNodeSelectorDP =
      new BufferingDataProvider(new ArrayDataProvider(this.project.k8sDomain.domainNodeSelector.observable, { keyAttributes: 'name' }));

    this.handleAddDomainNodeSelector = () => {
      const labelNames = [];
      this.project.k8sDomain.domainNodeSelector.observable().forEach(label => {
        labelNames.push(label.name);
      });

      let nextIndex = 0;
      while (labelNames.indexOf(`new-label-${nextIndex + 1}`) !== -1) {
        nextIndex++;
      }

      this.project.k8sDomain.domainNodeSelector.addNewItem({
        uid: utils.getShortUuid(),
        name: `new-label-${nextIndex + 1}`,
        value: ''
      });
    };
  }

  return VerrazzanoComponentDesignViewModel;
});
