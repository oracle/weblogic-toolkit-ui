/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/observable-properties', 'ojs/ojconverter-number', 'utils/validation-helper',
  'utils/view-helper', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout',
  'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, ArrayDataProvider,
  BufferingDataProvider, props, ojConverterNumber, validationHelper, viewHelper) {
  function ClusterEditDialogModel(args) {
    const DIALOG_SELECTOR = '#clusterEditDialog';
    const DEFAULT_CLUSTER_REPLICAS = 2;

    let EXCLUDE_PROPERTIES = ['uid', 'maxServers', 'additionalArguments'];
    let SIMPLE_PROPERTIES = project.k8sDomain.clusterKeys.filter(key => !EXCLUDE_PROPERTIES.includes(key));

    this.connected = () => {
      accUtils.announce('Cluster edit dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, arg) => {
      return i18n.t(`domain-design-cluster-${labelId}`, arg);
    };

    this.project = project;
    this.cluster = args.cluster;
    this.existingClusterNames = args.existingNames;
    this.isDomainOnPV = args.isDomainOnPV;
    this.i18n = i18n;

    this.nameIsUnique = {
      validate: (value) => {
        const existingNames = this.existingClusterNames;
        if (!value) {
          throw new Error(this.labelMapper('name-is-empty-error'));
        } else if (Array.isArray(existingNames) && existingNames.length > 0 && existingNames.includes(value)) {
          throw new Error(this.labelMapper('name-not-unique-error',
            { name: value, existingNames: existingNames.join(',')}));
        }
      },
    };
    this.integerConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0,
      useGrouping: false
    });


    // create an observable property for each simple field
    this['maxServers'] = this.cluster.maxServers;
    SIMPLE_PROPERTIES.forEach(propertyName => {
      let defaultValue = this.cluster[propertyName];
      if ((propertyName === 'replicas') && (defaultValue === undefined)) {
        defaultValue = this['maxServers'] === undefined || this['maxServers'] === null ? DEFAULT_CLUSTER_REPLICAS : this['maxServers'];
      }
      this[propertyName] = props.createProperty(defaultValue);

      // Add field-level validators, where appropriate.
      switch (propertyName) {
        case 'replicas':
          this[propertyName].addValidator(validationHelper.getNumberRangeValidator({ min: 0, max: this['maxServers'] }));
          break;

        case 'cpuRequest':
        case 'cpuLimit':
          this[propertyName].addValidator(...validationHelper.getK8sCpuValidators());
          break;

        case 'memoryRequest':
        case 'memoryLimit':
          this[propertyName].addValidator(...validationHelper.getK8sMemoryValidators());
          break;

        case 'minHeap':
        case 'maxHeap':
          this[propertyName].addValidator(...validationHelper.getJavaMemoryValidators());
          break;
      }
    });

    this.additionalArguments = props.createArrayProperty(this.cluster['additionalArguments']);

    this.okInput = () => {
      let tracker = document.getElementById('domainTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      const result = {uid: this.cluster.uid};

      // add value for each CHANGED simple field to the result
      SIMPLE_PROPERTIES.forEach(propertyName => {
        const property = this[propertyName];
        if (property.hasValue()) {
          result[propertyName] = property.value;
        }
      });
      if (this.additionalArguments.hasValue()) {
        result['additionalArguments'] = this.additionalArguments.value;
      }
      args.setValue(result);
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ClusterEditDialogModel;
});
