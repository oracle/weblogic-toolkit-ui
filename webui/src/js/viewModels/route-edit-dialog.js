/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/view-helper', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/observable-properties', 'ojs/ojconverter-number', 'ojs/ojinputtext',
  'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, viewHelper, ArrayDataProvider, BufferingDataProvider, props, ojConverterNumber) {
  function RouteEditDialogModel(args) {
    const DIALOG_SELECTOR = '#routeEditDialog';

    const DEFAULT_ROUTE_PORT = 0;

    // SIMPLE_PROPERTIES - names matching simple route fields
    let EXCLUDE_PROPERTIES = ['uid', 'annotations'];
    let SIMPLE_PROPERTIES = project.ingress.ingressRouteKeys.filter(key => !EXCLUDE_PROPERTIES.includes(key));

    this.connected = () => {
      accUtils.announce('Route edit dialog loaded.', 'assertive');

      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      setTimeout(function() {
        $(DIALOG_SELECTOR)[0].open();
      }, 1);
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`ingress-design-ingress-${labelId}`);
    };

    this.anyLabelMapper = (labelId, arg) => {
      return i18n.t(labelId, arg);
    };

    this.project = project;
    this.route = args.route;

    this.savedAnnotations = args.route.annotations || {};

    // this is dynamic to allow i18n fields to load correctly
    this.annotationColumns = [
      {
        'headerText': this.labelMapper('route-annotation-label'),
        'sortProperty': 'Name'
      },
      {
        'headerText': this.labelMapper('route-annotationValue-label'),
        'sortProperty': 'VirtualHost'
      },
      {
        'className': 'wkt-table-delete-cell',
        'headerClassName': 'wkt-table-add-header',
        'headerTemplate': 'headerTemplate',
        'template': 'actionTemplate',
        'sortable': 'disable'
      }
    ];

    this.portNumberConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0,
      useGrouping: false
    });

    this.annotations = props.createListProperty(['uid', 'key', 'value']);

    function getAnnotationUid(index) {
      return 'a' + index;
    }

    this.nextAnnotationIndex = (() => {
      const uids = [];
      this.annotations.observable().forEach(annotation => {
        uids.push(annotation.uid);
      });

      let nextIndex = 0;
      while(uids.indexOf(getAnnotationUid(nextIndex)) !== -1) {
        nextIndex++;
      }
      return nextIndex;
    });

    const annotations = this.route.annotations;
    if (annotations) {
      Object.keys(annotations).forEach(key => {
        const nextUid = getAnnotationUid(this.nextAnnotationIndex());
        const annotation = {uid: nextUid, key: key, value: annotations[key]};
        this.annotations.addNewItem(annotation);
      });
    }

    const annotationComparators = viewHelper.getSortComparators(this.annotationColumns);

    this.annotationsProvider = new BufferingDataProvider(new ArrayDataProvider(
      this.annotations.observable, {keyAttributes: 'uid', sortComparators: annotationComparators}));

    // create an observable property for each simple field
    SIMPLE_PROPERTIES.forEach(propertyName => {
      let defaultValue = this.route[propertyName];
      if((propertyName === 'targetPort') && (defaultValue === undefined)) {
        defaultValue = DEFAULT_ROUTE_PORT;
      }
      this[propertyName] = props.createProperty(defaultValue);
    });

    this.handleAddAnnotation = () => {
      const nextIndex = this.nextAnnotationIndex();
      const annotation = {uid: getAnnotationUid(nextIndex), key: `annotation-${nextIndex}`};
      this.annotations.addNewItem(annotation);
    };

    this.handleDeleteAnnotation = (event, context) => {
      this.annotations.observable.remove(context.item.data);
    };

    // return 0 if objects have same keys and values
    function compareObjects(one, two) {
      return Object.entries(one).sort().toString() !== Object.entries(two).sort().toString();
    }

    this.okInput = () => {
      let tracker = document.getElementById('ingressTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      $(DIALOG_SELECTOR)[0].close();

      const result = {uid: this.route.uid};

      // add value for each CHANGED simple field to the result
      SIMPLE_PROPERTIES.forEach(propertyName => {
        const property = this[propertyName];
        if(property.hasValue()) {
          result[propertyName] = property.value;
        }
      });

      // add annotations if any value has changed
      const changedAnnotations = {};
      this.annotations.observable().forEach(annotation => {
        changedAnnotations[annotation.key] = annotation.value ? annotation.value : '';
      });
      if(compareObjects(changedAnnotations, this.savedAnnotations)) {
        result['annotations'] = changedAnnotations;
      }

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
  return RouteEditDialogModel;
});
