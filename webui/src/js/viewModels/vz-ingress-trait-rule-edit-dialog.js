/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'utils/observable-properties', 'utils/validation-helper',
  'ojs/ojarraydataprovider', 'ojs/ojconverter-number', 'utils/common-utilities', 'utils/wkt-logger',
  'ojs/ojselectcombobox', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout',
  'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, props, validationHelper, ArrayDataProvider, ojConverterNumber, utils, wktLogger) {
  function VerrazzanoIngressTraitRuleEditDialogModel(args) {
    const DIALOG_SELECTOR = '#vzIngressTraitEditRuleDialog';

    this.i18n = i18n;

    this._createProperty = (defaultValue) => {
      return defaultValue ? props.createProperty(defaultValue) : props.createProperty();
    };

    this._createArrayProperty = (defaultValue) => {
      return defaultValue ? props.createArrayProperty(defaultValue) : props.createArrayProperty();
    };

    this._initializeRuleUid = (defaultValue) => {
      const result = this._createProperty(defaultValue);
      if (!defaultValue) {
        result.value = utils.getShortUuid();
      }
      return result;
    };

    this._initializeHosts = (inputHosts) => {
      let result;
      if (inputHosts) {
        if (typeof inputHosts === 'string') {
          const hosts = inputHosts.split(',').map(host => host.trim());
          result = this._createArrayProperty(hosts);
        } else if (Array.isArray(inputHosts)) {
          result = this._createArrayProperty(inputHosts);
        } else {
          wktLogger.warn('Verrazzano IngressTrait rule with UID %s received hosts value of unexpected type %s',
            this.uid.value, typeof inputHosts);
          result = this._createArrayProperty();
        }
      } else {
        result = this._createArrayProperty();
      }
      return result;
    };

    this._initializePaths = (inputPaths) => {
      let result;
      const keys = ['uid', 'path', 'pathType'];
      if (Array.isArray(inputPaths) && inputPaths.length > 0) {
        result = props.createListProperty(keys).withDefaultValue(inputPaths);
      } else {
        result = props.createListProperty(keys);
      }
      return result;
    };

    this._initializeNumberField = (defaultValue) => {
      let result;

      switch (typeof defaultValue) {
        case 'number':
          result = props.createProperty(defaultValue);
          break;

        case 'string':
          if (defaultValue) {
            result = props.createProperty(parseInt(defaultValue));
          } else {
            result = props.createProperty(-1);
          }
          break;

        case 'undefined':
        default:
          result = props.createProperty(-1);
          break;
      }
      return result;
    };

    this._getScalarResult = (fieldName, result) => {
      if (this[fieldName].hasValue()) {
        result[fieldName] = this[fieldName].value;
      }
    };

    this._formatResult = () => {
      const result = {
        uid: this.uid.value,
      };

      if (this.hosts.hasValue()) {
        // Return the underlying delimited string instead of the array...
        result.hosts = this.hosts.observable();
      }
      if (this.paths.hasValue()) {
        result.paths = this.paths.value;
      }
      this._getScalarResult('destinationHost', result);
      this._getScalarResult('destinationPort', result);
      this._getScalarResult('destinationHttpCookieName', result);
      this._getScalarResult('destinationHttpCookiePath', result);
      this._getScalarResult('destinationHttpCookieTTL', result);

      return result;
    };

    this.uid = this._initializeRuleUid(args.uid);
    this.hosts = this._initializeHosts(args.hosts);
    this.paths = this._initializePaths(args.paths);
    this.destinationHost = this._createProperty(args.destinationHost);
    this.destinationPort = this._initializeNumberField(args.destinationPort);
    this.destinationHttpCookieName = this._createProperty(args.destinationHttpCookieName);
    this.destinationHttpCookiePath = this._createProperty(args.destinationHttpCookiePath);
    this.destinationHttpCookieTTL = this._initializeNumberField(args.destinationHttpCookieTTL);

    this.pathsDataProvider = new ArrayDataProvider(this.paths.observable, { keyAttributes: 'uid' });

    this.connected = () => {
      accUtils.announce('Verrazzano Ingress Trait Rule Edit dialog loaded.', 'assertive');
      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $(DIALOG_SELECTOR)[0].open();
      }, 1);
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`vz-application-design-ingress-trait-rule-edit-${labelId}`);
    };

    this.integerConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0
    });

    this.portNumberValidators = validationHelper.getPortNumberValidators();

    // this is dynamic to allow i18n fields to load correctly
    this.pathsColumns = [
      {
        'headerText': this.labelMapper('path-type-label'),
        'sortProperty': 'pathType'
      },
      {
        'headerText': this.labelMapper('path-label'),
        'sortProperty': 'path'
      },
      {
        'className': 'wkt-table-delete-cell',
        'headerClassName': 'wkt-table-add-header',
        'headerTemplate': 'headerTemplate',
        'template': 'actionTemplate',
        'sortable': 'disable'
      }
    ];

    this.pathTypeOptions = [
      { value: 'prefix', label: this.labelMapper('path-type-prefix-label') },
      { value: 'exact', label: this.labelMapper('path-type-exact-label') },
      { value: 'regex', label: this.labelMapper('path-type-regex-label') },
    ];
    this.pathTypesDataProvider = new ArrayDataProvider(this.pathTypeOptions, { keyAttributes: 'value' });

    this.handleAddPath = () => {
      this.paths.addNewItem({ uid: utils.getShortUuid() });
    };

    this.handleDeletePath = (event, context) => {
      this.paths.observable.remove(context.item.data);
    };

    this.okInput = () => {
      $(DIALOG_SELECTOR)[0].close();

      const result = { rule: this._formatResult() };
      args.setValue(result);
    };

    this.cancelInput = () => {
      $(DIALOG_SELECTOR)[0].close();
      args.setValue();
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return VerrazzanoIngressTraitRuleEditDialogModel;
});
