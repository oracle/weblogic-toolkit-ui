/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project',  'utils/view-helper', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/observable-properties', 'ojs/ojconverter-number', 'utils/wkt-logger',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup',
  'ojs/ojselectcombobox'],
function(accUtils, ko, i18n, project, viewHelper, ArrayDataProvider, BufferingDataProvider, props,
  ojConverterNumber, wktLogger) {
  function RouteEditDialogModel(args) {
    const DIALOG_SELECTOR = '#routeEditDialog';

    const DEFAULT_ROUTE_PORT = undefined;

    // SIMPLE_PROPERTIES - names matching simple route fields
    let EXCLUDE_PROPERTIES = ['uid', 'annotations'];
    let SIMPLE_PROPERTIES = project.ingress.ingressRouteKeys.filter(key => !EXCLUDE_PROPERTIES.includes(key));

    this.project = project;
    this.route = args.route;
    this.serviceList = args.serviceList;

    this.connected = async () => {
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

    this.buildTargetSvcNames = () => {
      let options = [];
      for (const name in this.serviceList) {
        options.push( { id : name, value: name, text: name});
      }
      return options;
    };

    this.buildTargetSvcPorts = (svcName) => {
      let options = [];
      if (this.serviceList[svcName]) {
        for (const port of this.serviceList[svcName].ports) {
          options.push( { id : port.port, value: port.port, text: port.port} );
        }
      }

      return options;
    };

    this.askIfConsoleSvc = ko.observable(this.route.isConsoleService);
    this.targetSvcNames = this.buildTargetSvcNames();
    this.targetSvcPorts = ko.observableArray([] );

    if (this.route.targetService) {
      this.buildTargetSvcPorts(this.route.targetService).forEach(port => this.targetSvcPorts.push(port));
    }

    this.savedAnnotations = args.route.annotations || {};
    this.targetServicePorts = new ArrayDataProvider(this.targetSvcPorts, {keyAttributes: 'id'});

    this.tlsOptions = [
      { id: 'plain', value: 'plain', text: this.labelMapper('route-tlsoption-plain') },
      { id: 'ssl_terminate_ingress', value: 'ssl_terminate_ingress', text: this.labelMapper('route-tlsoption-ssl-terminate-ingress') },
      { id: 'ssl_passthrough', value: 'ssl_passthrough', text: this.labelMapper('route-tlsoption-ssl-passthrough') },
    ];

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

    this.getTargetServicePlaceholder = ko.computed(() => {
      if (Array.isArray(this.targetSvcNames) && this.targetSvcNames.length > 0) {
        return this.labelMapper('route-targetservice-placeholder');
      } else {
        return this.labelMapper('route-targetservice-placeholder-empty');
      }
    });

    this.getTargetPortPlaceholder = ko.computed(() => {
      console.log('targetSvcPorts is a ' + typeof(this.targetSvcPorts));
      const ports = this.targetSvcPorts();
      if (Array.isArray(ports) && ports.length > 0) {
        return this.labelMapper('route-targetport-placeholder');
      } else {
        return this.labelMapper('route-targetport-placeholder-empty');
      }
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

    function addOrDeleteAnnotation(annotations, addAction, key, value, deleteKey) {
      if (addAction) {
        annotations[key] = value;
      } else {
        if (key in annotations) {
          delete annotations[key];
        }
      }
      if (deleteKey in annotations) {
        delete annotations[deleteKey];
      }
    }

    this.askIfConsoleService = () => {
      return this.askIfConsoleSvc();
    };

    this.transportValueChanged = (event) => {
      if (event.detail.value === 'ssl_terminate_ingress') {
        this.askIfConsoleSvc(true);
      } else {
        this.askIfConsoleSvc(false);
      }
    };

    this.targetSvcNameChanged = (event) => {
      this.targetSvcPorts.removeAll();
      this.buildTargetSvcPorts(event.detail.value).forEach(port => this.targetSvcPorts.push(port));
    };

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

      const ingressClassKey = 'kubernetes.io/ingress.class';
      let tlsOption = result['tlsOption'];

      if (typeof tlsOption === 'undefined') {
        tlsOption = this.route.tlsOption;
      }

      if (this.project.ingress.ingressControllerProvider.value === 'traefik') {
        const sslKey = 'traefik.ingress.kubernetes.io/router.tls';
        changedAnnotations[ingressClassKey] = 'traefik';
        addOrDeleteAnnotation(changedAnnotations, (tlsOption !== 'plain'),
          sslKey, 'true', '');
        // if user switched to plain
        if (tlsOption === 'plain') {
          if (sslKey in changedAnnotations) {
            delete changedAnnotations[sslKey];
          }
        }
      }

      if (this.project.ingress.ingressControllerProvider.value === 'nginx') {
        const sslKey = 'nginx.ingress.kubernetes.io/backend-protocol';
        const sslPassThroughKey = 'nginx.ingress.kubernetes.io/ssl-passthrough';
        changedAnnotations[ingressClassKey] = 'nginx';
        addOrDeleteAnnotation(changedAnnotations, (tlsOption === 'ssl_terminate_ingress'),
          sslKey, 'HTTPS', sslPassThroughKey);
        // passthrough require both
        addOrDeleteAnnotation(changedAnnotations, (tlsOption === 'ssl_passthrough'), sslPassThroughKey, 'true', '');
        addOrDeleteAnnotation(changedAnnotations, (tlsOption === 'ssl_passthrough'), sslKey, 'HTTPS', '');
      }

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
