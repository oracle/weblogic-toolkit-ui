/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */

define(['utils/i18n', 'accUtils', 'knockout', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'models/wkt-project', 'utils/dialog-helper',
  'utils/ingress-routes-updater', 'utils/view-helper', 'utils/k8s-helper', 'ojs/ojtreeview',
  'ojs/ojformlayout', 'ojs/ojinputtext', 'ojs/ojcollapsible', 'ojs/ojselectsingle', 'ojs/ojswitch', 'ojs/ojtable',
  'ojs/ojcheckboxset'
],
function(i18n, accUtils, ko, ArrayDataProvider, BufferingDataProvider, project, dialogHelper,
  ingressRouteUpdater, viewHelper, k8sHelper) {

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

    this.ingressControllerServiceTypes = [
      {key: 'LoadBalancer', label: this.labelMapper('service-type-load-balancer-label')},
      {key: 'NodePort', label: this.labelMapper('service-type-node-port-label')}
      // {key: 'ClusterIP', label: this.labelMapper('service-type-cluster-ip-label')}
      // {key: 'ExternalName', label: this.labelMapper('service-type-external-name-label')}
    ];
    this.ingressServiceTypeDP = new ArrayDataProvider(this.ingressControllerServiceTypes, {keyAttributes: 'key'});

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
        headerText: this.labelMapper('ingress-route-name-label'),
        sortProperty: 'name',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('ingress-route-virtualhost-label'),
        sortProperty: 'virtualHost',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('ingress-route-path-label'),
        sortProperty: 'path',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('ingress-route-target-label'),
        sortProperty: 'targetService',
        resizable: 'enabled'
      },
      {
        headerText: this.labelMapper('ingress-route-accesspoint-label'),
        sortProperty: 'targetServiceNameSpace'
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
      }];

    const sortComparators = viewHelper.getSortComparators(this.columnData);

    this.routes = project.ingress.ingressRoutes;

    this.routesDataProvider = new ArrayDataProvider(this.routes.observable,
      {keyAttributes: 'uid', sortComparators: sortComparators});

    function getAnnotationUid(routeIndex) {
      return 'r' + routeIndex;
    }

    // display in the target column, example "host:port"
    this.getTargetText = (routeData) => {
      let result = routeData.targetService;
      if(result) {
        const port = routeData.targetPort;
        if(port != null) {
          result += `:${port}`;
        }
      }
      return result;
    };

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
      const title = i18n.t('ingress-design-delete-route-warning-title');
      const message = i18n.t('ingress-design-delete-route-warning-message');
      window.api.ipc.invoke('show-error-message', title, message);
    };

    async function getTargetServiceDetails(myProject) {
      const kubectlExe = k8sHelper.getKubectlExe();
      const kubectlOptions = k8sHelper.getKubectlOptions();
      const namespace = myProject.k8sDomain.kubernetesNamespace.value;
      const errTitle = i18n.t('ingress-design-ingress-routes-get-services-in-namespace-title');
      const errPrefix = 'ingress-design-ingress-routes';

      dialogHelper.openBusyDialog(i18n.t('ingress-design-route-get-services-title', { namespace: namespace }));
      const results =
        await k8sHelper.getServicesDetailsForNamespace(kubectlExe, kubectlOptions, namespace, errTitle, errPrefix);
      if (results) {
        const servicesList = {};
        for (const item of results.items) {
          servicesList[item.metadata.name] = { ports: item.spec.ports };
        }
        dialogHelper.closeBusyDialog();
        return Promise.resolve({ serviceList: servicesList });
      }
      return Promise.resolve(false);
    }

    this.handleEditRoute = async (event, context) => {
      // using context.item.data directly was causing problems
      // when project data was reloaded with matching UIDs.
      const index = context.item.index;
      let route = this.routes.observable()[index];

      const targetServiceDetails = await getTargetServiceDetails(this.project);
      if (targetServiceDetails) {
        const options = {route: route, serviceList: targetServiceDetails.serviceList};
        dialogHelper.promptDialog('route-edit-dialog', options).then(result => {
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
      }
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
