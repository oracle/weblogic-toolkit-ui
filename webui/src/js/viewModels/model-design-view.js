/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'js-yaml', 'utils/i18n', 'utils/dialog-helper', 'utils/model-helper',
  'models/wkt-project', 'ojs/ojarraytreedataprovider', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter',
  'ojs/ojmodule-element-utils', 'ojs/ojknockouttemplateutils'],
function(accUtils, ko, jsYaml, i18n, dialogHelper, modelHelper,
  project, ArrayTreeDataProvider, ModuleRouterAdapter, KnockoutRouterAdapter, ModuleElementUtils,
  KnockoutTemplateUtils) {

  function ModelDesignViewModel() {
    const DEFAULT_PAGE_KEY = 'design-view';
    const SERVER_ID_PREFIX = 'model-design-server-';
    const SERVER_CHANNELS_ID_PREFIX = 'model-design-server-channels-';
    const SERVER_TRIGGER_ID_PREFIX = 'model-design-server-trigger-';
    const SERVER_NAME_PREFIX = 'Server-';

    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Model design view loaded.', 'assertive');

      this.loadModelObject(project.wdtModel.modelContent());

      // don't listen for changes to modelContent,
      // since this page will update it and cause a feedback loop.
      // just listen for the case where a new project is loaded.
      subscriptions.push(project.postOpen.subscribe(() => {
        // clear the page selection
        this.selection(DEFAULT_PAGE_KEY);
        this.loadModelObject(project.wdtModel.modelContent());
      }));

      this.selectPage(this.selection());

      subscriptions.push(this.selection.subscribe(selection => {
        this.selectPage(selection);
      }));
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-${labelId}`, payload);
    };

    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.modelObject = ko.observable({ });

    this.servers = ko.observableArray();

    this.loadModelObject = modelContent => {
      try {
        let modelObject = jsYaml.load(modelContent);
        modelObject = modelObject ? modelObject : {};
        this.modelObject(modelObject);

        const serverMap = modelHelper.getFolder(this.modelObject(), 'topology', 'Server');

        this.servers([]);
        for(const key in serverMap) {
          this.addServer(key);
        }

        // sometimes duplicate entries show up in navigation with multiple additions.
        // this seems to resolve it:
        this.servers(this.servers());

      } catch (e) {
        console.log('Unable to parse model');
      }
    };

    const pageMap = {
      'design-view': { nav: this },
      'domain-view': { nav: this },
      'server-view': { nav: this },
      'servers-view': { nav: this }
    };

    this.selectPage = (selection) => {
      this.moduleConfig(this.getModuleConfig(selection));
    };

    this.getModuleConfig = (pageKey) => {
      let pageParams = { };

      // page keys for multiple elements, such as Server,
      // are translated to a shared page key, and additional parameters are passed.
      const regex = new RegExp(SERVER_ID_PREFIX + '(\\d+)');
      if(pageKey && pageKey.match(regex)) {
        this.servers().forEach(thisServer => {
          if(thisServer.id === pageKey) {
            pageKey = 'server-view';
            pageParams = { server: thisServer };
          }
        });
      }

      pageKey = pageMap.hasOwnProperty(pageKey) ? pageKey : DEFAULT_PAGE_KEY;
      const params = pageMap[pageKey];
      Object.assign(pageParams, params);

      return ModuleElementUtils.createConfig({
        viewPath: `views/model/${pageKey}.html`,
        viewModelPath: `viewModels/model/${pageKey}`,
        params: pageParams
      });
    };

    this.selection = modelHelper.navSelection;

    this.expanded = modelHelper.navExpanded;

    // every item in the nav tree must have a unique ID
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
            children: this.servers
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

    this.moduleConfig = ko.observable(this.getModuleConfig(DEFAULT_PAGE_KEY));

    this.selectServer = navId => {
      this.selection(navId);

      if (!this.expanded().has('servers-view')) {
        this.expanded.add(['servers-view']);
      }
    };

    this.addServer = serverName => {
      // get an unused id for the server
      const ids = [];
      this.servers().forEach(server => {
        ids.push(server.id);
      });

      let index = 0;
      while(ids.includes(SERVER_ID_PREFIX + index)) {
        index++;
      }
      const navId = SERVER_ID_PREFIX + index;

      const server = {
        name: serverName,
        id: navId,
        icon: 'oj-ux-ico-server',
        children:[
          { name: this.labelMapper('channels'),
            id: SERVER_CHANNELS_ID_PREFIX + index,
            icon: 'oj-ux-ico-collections'
          },
          { name: this.labelMapper('serverFailureTrigger'),
            id: SERVER_TRIGGER_ID_PREFIX + index,
            icon: 'oj-ux-ico-assets'
          },
        ]
      };
      this.servers.push(server);
      return navId;
    };

    this.addNewServer = () => {
      // get an unused name for the server
      const names = [];
      this.servers().forEach(server => {
        names.push(server.name);
      });

      let index = 0;
      while(names.includes(SERVER_NAME_PREFIX + index)) {
        index++;
      }
      const serverName = SERVER_NAME_PREFIX + index;

      this.promptForName(this.labelMapper('server-type'), serverName)
        .then(newServerName => {
          if(newServerName) {
            // add to the object model and update the text model
            modelHelper.addFolder(this.modelObject(), 'topology', 'Server', newServerName);

            // add to the navigation list
            this.addServer(newServerName);
          }
        });
    };

    this.deleteServer = server => {
      this.servers().forEach(thisServer => {
        if(thisServer.id === server.id) {
          this.servers.remove(thisServer);
        }
      });

      // sometimes deletion gets the table rows out of sync.
      // this seems to resolve it:
      this.servers(this.servers());

      // remove from the object model and update the text model
      modelHelper.removeFolder(this.modelObject(), 'topology', 'Server', server.name);
    };

    // this can be used by all named types (Server, Cluster, etc.)
    this.promptForName = (typeName, defaultValue) => {
      return dialogHelper.promptDialog('text-input-dialog', {
        title: this.labelMapper('name-prompt', { typeName: typeName }),
        label: this.labelMapper('name-label'),
        help: this.labelMapper('name-help'),
        defaultValue: defaultValue
      });
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelDesignViewModel;
});
