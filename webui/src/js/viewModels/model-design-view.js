/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'ojs/ojarraydataprovider', 'ojs/ojarraytreedataprovider',
  'ojs/ojcorerouter', 'ojs/ojmodule-element-utils', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter',
  'ojs/ojurlparamadapter', 'ojs/ojoffcanvas', 'ojs/ojknockouttemplateutils', 'utils/view-helper',

  'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout',
  'ojs/ojselectsingle', 'ojs/ojvalidationgroup', 'ojs/ojcollapsible'],
function(accUtils, ko, i18n, ArrayDataProvider, ArrayTreeDataProvider,
  CoreRouter, ModuleElementUtils, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter, OffCanvasUtils,
  KnockoutTemplateUtils, viewHelper) {

  function ModelDesignViewModel(args) {
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.connected = () => {
      accUtils.announce('Model design view loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      return i18n.t(`model-design-${labelId}`, payload);
    };

    let routeData = [
      { path: '', redirect: 'design-view' },
      { path: 'design-view'},
      { path: 'domain-view'},
      { path: 'servers-view'},
      { path: 'server-view'}
    ];

    // Router setup
    let router = args.parentRouter.createChildRouter(routeData, { history: 'skip' });
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router, {
      viewPath: 'views/model/',
      viewModelPath: 'viewModels/model/',
    });

    this.selection = new KnockoutRouterAdapter(router);

    const navData = ko.observableArray([
      { name: this.labelMapper('environment'),
        id: 'model-no-page-1',
        icon: 'oj-ux-ico-settings',
        children:[
          { name: this.labelMapper('domain'),
            id: 'domain-view',
            icon: 'oj-ux-ico-settings'
          },
          { name: this.labelMapper('servers'),
            id: 'servers-view',
            icon: 'oj-ux-ico-model-change-mgmt'
          },
          { name: this.labelMapper('coherence-cluster-system-resources'),
            id: 'coherence-cluster-view',
            icon: 'oj-ux-ico-model-change-mgmt'
          }
        ]
      },
      { name: this.labelMapper('scheduling'),
        id: 'model-no-page-2',
        icon: 'oj-ux-ico-settings',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-1',
            icon: 'oj-ux-ico-user-configuration'
          }
        ]
      },
      { name: this.labelMapper('deployments'),
        id: 'model-no-page-3',
        icon: 'oj-ux-ico-settings',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-2',
            icon: 'oj-ux-ico-user-configuration'
          }
        ]
      },
      { name: this.labelMapper('services'),
        id: 'model-no-page-4',
        icon: 'oj-ux-ico-settings',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-3',
            icon: 'oj-ux-ico-user-configuration'
          }
        ]
      },
      { name: this.labelMapper('security'),
        id: 'model-no-page-5',
        icon: 'oj-ux-ico-settings',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-4',
            icon: 'oj-ux-ico-user-configuration'
          }
        ]
      },
      { name: this.labelMapper('interoperability'),
        id: 'model-no-page-6',
        icon: 'oj-ux-ico-settings',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-5',
            icon: 'oj-ux-ico-user-configuration'
          }
        ]
      },
      { name: this.labelMapper('diagnostics'),
        id: 'model-no-page-7',
        icon: 'oj-ux-ico-settings',
        children:[
          { name: this.labelMapper('tbd'),
            id: 'model-tbd-6',
            icon: 'oj-ux-ico-user-configuration'
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
