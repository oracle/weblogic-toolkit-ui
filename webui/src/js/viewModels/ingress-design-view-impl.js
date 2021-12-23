/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */

define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'models/wkt-project', 'utils/dialog-helper',
  'utils/ingress-routes-updater', 'utils/view-helper', 'ojs/ojtreeview',
  'ojs/ojformlayout', 'ojs/ojinputtext', 'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojswitch', 'ojs/ojtable',
  'ojs/ojcheckboxset'
],
function(i18n, accUtils, ko, ArrayDataProvider, BufferingDataProvider, project, dialogHelper,
  ingressRouteUpdater, viewHelper) {

  function IngressDesignViewModel() {

    this.connected = () => {
      accUtils.announce('Ingress Design View page loaded.', 'assertive');
    };

    this.chooseOpenSSL = () => {
      window.api.ipc.invoke('get-openssl-exe').then(opensslPath => {
        if (opensslPath) {
          this.project.ingress.opensslExecutableFilePath.observable(opensslPath);
        }
      });
    };

    this.labelMapper = (labelId, arg) => {
      const key = `ingress-design-${labelId}`;
      if (arg) {
        return i18n.t(key, arg);
      }
      return i18n.t(key);
    };

    this.anyLabelMapper = (labelId, arg) => {
      return i18n.t(labelId, arg);
    };

    this.project = project;
    this.editRow = ko.observable();
    this.ingressControllers = [
      {key: 'nginx', label: this.labelMapper('type-nginx-label')},
      {key: 'traefik', label: this.labelMapper('type-traefik-label')}
      //      {key: 'voyager', label: this.labelMapper('type-voyager-label')}
    ];
    this.ingressProviderDP = new ArrayDataProvider(this.ingressControllers, {keyAttributes: 'key'});

    this.isVoyager = () => {
      return this.project.ingress.ingressControllerProvider.value === 'voyager';
    };

    this.isNginx = () => {
      return this.project.ingress.ingressControllerProvider.value === 'nginx';
    };

    this.imageOnDockerHub = () => {
      return (this.project.ingress.ingressControllerProvider.value === 'voyager') ||
        (this.project.ingress.ingressControllerProvider.value === 'traefik');
    };

    this.createDockerHubSecret = () => {
      return project.ingress.specifyDockerRegSecret.value && project.ingress.createDockerRegSecret.value;
    };

    this.voyagerProviders = [
      {key: 'OKE', label: this.anyLabelMapper('kubectl-list-okeTitle')},
      {key: 'AKS', label: this.anyLabelMapper('kubectl-list-aksTitle')},
      {key: 'AWS', label: this.anyLabelMapper('kubectl-list-eksTitle')},
      {key: 'GKE', label: this.anyLabelMapper('kubectl-list-gkeTitle')},
      {key: 'K8S', label: this.anyLabelMapper('kubectl-list-k8sTitle')},
      {key: 'KND', label: this.anyLabelMapper('kubectl-list-kindTitle')}
    ];
    this.voyagerProvidersDP = new ArrayDataProvider(this.voyagerProviders, {keyAttributes: 'key'});

    this.createTlsSecret = () => {
      return this.project.ingress.specifyIngressTLSSecret.value && this.project.ingress.createTLSSecret.value;
    };

    this.generateTlsMaterial = () => {
      return this.createTlsSecret() && project.ingress.generateTLSFiles.value;
    };

    this.isAccessPointDefined = (route) => {
      if (typeof route === 'undefined') {
        return false;
      } else {
        return route.startsWith('http://') || route.startsWith('https://');
      }
    };

    this.chooseTLSKeyFile = () => {
      window.api.ipc.invoke('get-tls-keyfile')
        .then(tlsKeyFile => {
          // no value indicates the chooser was cancelled
          if(tlsKeyFile) {
            this.project.ingress.ingressTLSKeyFile.observable(tlsKeyFile);
          }
        });
    };

    this.chooseTLSCertFile = () => {
      window.api.ipc.invoke('get-tls-certfile')
        .then(tlsCertFile => {
          // no value indicates the chooser was cancelled
          if(tlsCertFile) {
            this.project.ingress.ingressTLSCertFile.observable(tlsCertFile);
          }
        });
    };

    // this is dynamic to allow i18n fields to load correctly
    this.columnData = [
      {
        'headerText': this.labelMapper('ingress-route-name-label'),
        'sortProperty': 'name'
      },
      {
        'headerText': this.labelMapper('ingress-route-virtualhost-label'),
        'sortProperty': 'virtualHost'
      },
      {
        'headerText': this.labelMapper('ingress-route-path-label'),
        'sortProperty': 'path'
      },
      {
        'headerText': this.labelMapper('ingress-route-targetservice-label'),
        'sortProperty': 'targetService'
      },
      {
        'headerText': this.labelMapper('ingress-route-targetport-label'),
        'sortProperty': 'targetPort'
      },
      {
        'headerText': this.labelMapper('ingress-route-accesspoint-label'),
        'sortProperty': 'targetServiceNameSpace'
      },
      {
        'className': 'wkt-table-delete-cell',
        'headerClassName': 'wkt-table-add-header',
        'headerTemplate': 'chooseHeaderTemplate',
        'template': 'actionTemplate',
        'sortable': 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
      {
        'className': 'wkt-table-delete-cell',
        'headerClassName': 'wkt-table-add-header',
        'headerTemplate': 'headerTemplate',
        'template': 'actionTemplate',
        'sortable': 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      }];

    const sortComparators = viewHelper.getSortComparators(this.columnData);

    this.routes = project.ingress.ingressRoutes;

    this.routesDataProvider = new ArrayDataProvider(this.routes.observable,
      {keyAttributes: 'uid', sortComparators: sortComparators});

    function getAnnotationUid(routeIndex) {
      return 'r' + routeIndex;
    }

    this.handleAddRoute = () => {
      const uids = [];
      this.routes.observable().forEach(route => {
        uids.push(route.uid);
      });

      let nextIndex = 0;
      while(uids.indexOf(getAnnotationUid(nextIndex)) !== -1) {
        nextIndex++;
      }

      const newRoute = {
        uid: getAnnotationUid(nextIndex),
        name: `new-route-${nextIndex}`,
        targetServiceNameSpace: this.project.k8sDomain.kubernetesNamespace.value,
        accessPoint: '',
        tlsOption: 'plain',
        isConsoleService: false
      };

      // if controller is Voyager and provider is baremetal only nodeport is supported, set the default in the UI
      if (project.ingress.ingressControllerProvider.value === 'voyager' &&
        this.project.ingress.voyagerProviderMappedValue(this.project.ingress.voyagerProvider.value) === 'baremetal') {
        newRoute.annotations = {'ingress.appscode.com/type': 'NodePort'};
      }
      // nginx 1.0.0 and above requires setting ingressClassName either at ingress object spec level or annotation.
      if (project.ingress.ingressControllerProvider.value === 'nginx') {
        newRoute.annotations = {'kubernetes.io/ingress.class': 'nginx'};
      }
      if (project.ingress.ingressControllerProvider.value === 'traefik') {
        newRoute.annotations = {'kubernetes.io/ingress.class': 'traefik'};
      }

      project.ingress.ingressRoutes.addNewItem(newRoute);
    };

    this.handleDeleteRoute = (event, context) => {
      const index = context.item.index;
      this.routes.observable.splice(index, 1);
      const title = i18n.t('ingress-installer-delete-route-warning-title');
      const message = i18n.t('ingress-installer-delete-route-warning-message');
      window.api.ipc.invoke('show-error-message', title, message);
    };

    this.handleEditRoute = (event, context) => {
      // using context.item.data directly was causing problems
      // when project data was reloaded with matching UIDs.
      const index = context.item.index;
      let route = this.routes.observable()[index];
      const options = {route: route};

      dialogHelper.promptDialog('route-edit-dialog', options)
        .then(result => {

          // no result indicates operation was cancelled
          if (result) {
            let changed = false;
            project.ingress.ingressRouteKeys.forEach(key => {
              if ((key !== 'uid') && result.hasOwnProperty(key)) {
                route[key] = result[key];
                changed = true;
              }
            });

            if (changed) {
              this.routes.observable.replace(route, route);
            }
          }
        });
    };

    this.handleCancel = () => {
      this.cancelEdit = true;
      this.editRow({ rowKey: null });
    };

    this.getEnabledText = (value) => {
      return this.anyLabelMapper(value ? 'dialog-button-yes' : 'dialog-button-no');
    };

  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return IngressDesignViewModel;
});
