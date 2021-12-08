/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['models/wkt-project', 'accUtils', 'utils/common-utilities', 'knockout', 'utils/i18n',
  'ojs/ojbufferingdataprovider', 'ojs/ojarraydataprovider', 'ojs/ojconverter-number', 'utils/dialog-helper', 'utils/k8s-helper',
  'utils/view-helper', 'utils/wkt-logger', 'ojs/ojmessaging', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout',
  'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojlistview', 'ojs/ojtable', 'ojs/ojswitch', 'ojs/ojinputnumber'],
function (project, accUtils, utils, ko, i18n, BufferingDataProvider,
  ArrayDataProvider, ojConverterNumber, dialogHelper, k8sHelper, viewHelper, wktLogger) {
  function DomainDesignViewModel() {

    this.connected = async () => {
      accUtils.announce('Domain Design View page loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      if (labelId.startsWith('page-design-')) {
        return i18n.t(labelId);
      }
      return i18n.t(`domain-design-${labelId}`, payload);
    };

    this.project = project;
    this.i18n = i18n;

    this.integerConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0
    });

    this.isDomainInPV = ko.computed(() => {
      return this.project.settings.targetDomainLocation.observable() === 'pv';
    });

    this.isDomainInImage = ko.computed(() => {
      return this.project.settings.targetDomainLocation.observable() === 'dii';
    });

    this.isModelInImage = ko.computed(() => {
      return this.project.settings.targetDomainLocation.observable() === 'mii';
    });

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
    });

    this.hasNoClusters = () => {
      return this.project.k8sDomain.clusters.value.length === 0;
    };

    this.clusterColumnData = [
      {
        headerText: this.labelMapper('clusters-name-heading'),
        sortProperty: 'name'
      },
      {
        headerText: this.labelMapper('clusters-replicas-heading'),
        sortProperty: 'replicas'
      },
      {
        headerText: this.labelMapper('clusters-min-heap-heading'),
        sortProperty: 'minHeap'
      },
      {
        headerText: this.labelMapper('clusters-max-heap-heading'),
        sortProperty: 'maxHeap'
      },
      {
        headerText: this.labelMapper('clusters-cpu-request-heading'),
        sortProperty: 'cpuRequest'
      },
      {
        headerText: this.labelMapper('clusters-memory-request-heading'),
        sortProperty: 'memoryRequest'
      },
      {
        'className': 'wkt-table-delete-cell',
        'headerClassName': 'wkt-table-add-header',
        'headerTemplate': 'headerTemplate',
        'template': 'actionTemplate',
        'sortable': 'disable',
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
      const options = { cluster: cluster };

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
            this.project.k8sDomain.clusters.observable.replace(cluster, cluster);
          }
        }
      });
    };

    this.handleClusterEditCancel = () => {
      this.cancelClusterEdit = true;
      this.clustersEditRow({ rowKey: null });
    };


    this.modelHasNoProperties = () => {
      return this.project.wdtModel.getMergedPropertiesContent().value.length === 0;
    };

    this.propertyTableColumnMetadata = () => {
      return [
        {'headerText': this.labelMapper('propname-header'), 'sortProperty': 'Name', 'resizable': 'enabled'},
        {'headerText': this.labelMapper('propvalue-header'), 'sortProperty': 'Value', 'resizable': 'enabled'},
        {'headerText': this.labelMapper('propoverride-header'), 'sortProperty': 'Override', 'resizable': 'enabled'},
      ];
    };

    const propertyComparators = viewHelper.getSortComparators(this.propertyTableColumnMetadata());

    this.configMapDP = new BufferingDataProvider(new ArrayDataProvider(
      this.project.wdtModel.getMergedPropertiesContent().observable,
      {keyAttributes: 'uid', sortComparators: propertyComparators}));

    this.hasEncryptionSecret = () => {
      return this.isModelInImage();
    };

    this.secretsTableColumnMetadata = () => {
      return [
        {'headerText': this.labelMapper('secretname-header'), 'sortProperty': 'name', 'resizable': 'enabled'},
        {'headerText': this.labelMapper('username-header'), 'sortable': 'disabled', 'resizable': 'enabled'},
        {'headerText': this.labelMapper('password-header'), 'sortable': 'disabled', 'resizable': 'enabled'},
      ];
    };

    this.secretsDP = new BufferingDataProvider(new ArrayDataProvider(
      this.project.k8sDomain.secrets.observable, {keyAttributes: 'name'}));
  }

  return DomainDesignViewModel;
});
