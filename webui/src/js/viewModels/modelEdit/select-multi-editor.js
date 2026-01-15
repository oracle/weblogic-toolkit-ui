/**
 * @license
 * Copyright (c) 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/wkt-logger', 'utils/modelEdit/model-edit-helper', 'ojs/ojarraydataprovider',
  'oj-c/select-multiple'
],
function(accUtils, ko, WktLogger, ModelEditHelper, ArrayDataProvider) {

  /**
   * Create a wrapper for oj-c-select-multiple to convert between Set and list,
   * and to prevent invalid values from being specified, which causes errors.
   */
  function SelectMultiEditor(args) {
    const ATTRIBUTE = args.attribute;
    const MODEL_OBSERVABLE = args.observable;  // read/write to model
    const OPTIONS = args.options;
    this.disabled = args.disabled;
    this.readOnly = args.readonly;
    this.label = args.label;
    this.help = args.help;

    this.optionsProvider = new ArrayDataProvider(OPTIONS, { keyAttributes: 'value' });

    this.controlObservable = ko.observable();  // read/write to Jet control

    const subscriptions = [];

    this.connected = () => {
      subscriptions.push(MODEL_OBSERVABLE.subscribe(this.modelChanged));
      subscriptions.push(this.controlObservable.subscribe(this.controlChanged));
      this.modelChanged();
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    let changing = false;  // prevent circular updates

    this.modelChanged = () => {
      if(!changing) {
        changing = true;

        // value may be from a token, which may be a delimited string
        let value = ModelEditHelper.getDerivedValue(MODEL_OBSERVABLE());
        value = ModelEditHelper.getObservableValue(ATTRIBUTE, value);

        const modelList = this.filterList(value);
        this.controlObservable(modelList ? new Set(modelList) : null);

        changing = false;
      }
    };

    this.controlChanged = () => {
      if(!changing) {
        // if model value is a string, it was tokenized, so don't overwrite
        if(typeof MODEL_OBSERVABLE() === 'string') {
          return;
        }

        changing = true;
        const controlSet = this.controlObservable();
        MODEL_OBSERVABLE(controlSet ? [...controlSet] : null);
        changing = false;
      }
    };

    this.filterList = list => {
      if(!list) {
        return list;
      }

      const currentOptions = ko.isObservable(OPTIONS) ? OPTIONS() : OPTIONS;
      const validValues = currentOptions.map(option => option.value);

      const newList = [];
      for (const value of list) {
        if(validValues.includes(value)) {
          newList.push(value);
        } else {
          WktLogger.warn(`Not a valid option for ${this.label}: ` + value);
        }
      }
      return newList;
    };
  }

  return SelectMultiEditor;
});
