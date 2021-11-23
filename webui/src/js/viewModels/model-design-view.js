/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'js-yaml', 'utils/i18n', 'utils/model-helper', 'models/wkt-project',
  'ojs/ojarraytreedataprovider', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter',
  'ojs/ojknockouttemplateutils'],
function(accUtils, ko, jsYaml, i18n, modelHelper, project,
  ArrayTreeDataProvider, ModuleRouterAdapter, KnockoutRouterAdapter, KnockoutTemplateUtils) {

  function ModelDesignViewModel(args) {
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.connected = () => {
      accUtils.announce('Model design view loaded.', 'assertive');

      this.loadModelObject(project.wdtModel.modelContent());
      project.wdtModel.modelContent.subscribe(modelContent => {
        this.loadModelObject(modelContent);
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-${labelId}`, payload);
    };

    this.modelObject = ko.observable({ });

    this.servers = ko.observableArray();

    this.loadModelObject = modelContent => {
      try {
        this.modelObject(jsYaml.load(modelContent));
        // console.log('modelObject: ' + this.modelObject());

        const serverMap = modelHelper.navigate(this.modelObject(), 'topology', 'Server');
        // console.log('serverMap: ' + JSON.stringify(serverMap));

        this.servers.removeAll();
        for(const key in serverMap) {
          this.servers.push(key);
        }
      } catch (e) {
        console.log('Unable to parse model');
      }
    };

    // if server list changes, rebuild the navigation servers list
    this.servers.subscribe(servers => {
      this.navServers.removeAll();
      servers.forEach((serverName, index) => {
        const navServer = {
          name: serverName,
          id: 'model-design-server-' + index,
          icon: 'oj-ux-ico-server',
          children:[
            { name: this.labelMapper('channels'),
              id: 'model-design-server-channels' + index,
              icon: 'oj-ux-ico-collections'
            },
            { name: this.labelMapper('serverFailureTrigger'),
              id: 'model-design-server-trigger' + index,
              icon: 'oj-ux-ico-assets'
            },
          ]
        };
        this.navServers.push(navServer);
      });
    });

    const detail = {
      model: this.modelObject
    };

    let routeData = [
      { path: '', redirect: 'design-view' },
      { path: 'design-view', detail: detail},
      { path: 'domain-view', detail: detail},
      { path: 'servers-view', detail: { model: this.modelObject, servers: this.servers } },
      { path: 'server-view', detail: detail}
    ];

    // Router setup
    let router = args.parentRouter.createChildRouter(routeData, { history: 'skip' });
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router, {
      viewPath: 'views/model/',
      viewModelPath: 'viewModels/model/',
    });

    this.selection = new KnockoutRouterAdapter(router);

    this.navServers = ko.observableArray();

    const navData = ko.observableArray([
      { name: this.labelMapper('environment'),
        id: 'model-no-page-1',
        icon: 'oj-ux-ico-bag',
        children:[
          { name: this.labelMapper('domain'),
            id: 'domain-view',
            icon: 'oj-ux-ico-domain'
          },
          { name: this.labelMapper('servers'),
            id: 'servers-view',
            icon: 'oj-ux-ico-collections',
            children: this.navServers
          },
          { name: this.labelMapper('coherence-cluster-system-resources'),
            id: 'coherence-cluster-view',
            icon: 'oj-ux-ico-collections'
          }
        ]
      },
      { name: this.labelMapper('scheduling'),
        id: 'model-no-page-2',
        icon: 'oj-ux-ico-bag',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-1',
            icon: 'oj-ux-ico-collections'
          }
        ]
      },
      { name: this.labelMapper('deployments'),
        id: 'model-no-page-3',
        icon: 'oj-ux-ico-bag',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-2',
            icon: 'oj-ux-ico-collections'
          }
        ]
      },
      { name: this.labelMapper('services'),
        id: 'model-no-page-4',
        icon: 'oj-ux-ico-bag',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-3',
            icon: 'oj-ux-ico-collections'
          }
        ]
      },
      { name: this.labelMapper('security'),
        id: 'model-no-page-5',
        icon: 'oj-ux-ico-bag',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-4',
            icon: 'oj-ux-ico-collections'
          }
        ]
      },
      { name: this.labelMapper('interoperability'),
        id: 'model-no-page-6',
        icon: 'oj-ux-ico-bag',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-5',
            icon: 'oj-ux-ico-collections'
          }
        ]
      },
      { name: this.labelMapper('diagnostics'),
        id: 'model-no-page-7',
        icon: 'oj-ux-ico-bag',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-6',
            icon: 'oj-ux-ico-collections'
          }
        ]
      },
    ]);

    this.navDataProvider = new ArrayTreeDataProvider(navData, {
      keyAttributes: 'id'
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelDesignViewModel;
}
);
