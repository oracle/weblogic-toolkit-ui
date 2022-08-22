/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'models/wkt-console', 'utils/dialog-helper',
  'utils/view-helper', 'utils/screen-utils', 'ojs/ojarraydataprovider', 'ojs/ojarraytreedataprovider', 'ojs/ojcorerouter',
  'ojs/ojmodule-element-utils', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter',
  'ojs/ojoffcanvas', 'ojs/ojknockouttemplateutils', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils',
  'utils/wkt-logger', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog',
  'ojs/ojformlayout', 'ojs/ojselectsingle', 'ojs/ojvalidationgroup', 'ojs/ojcollapsible'],
function(accUtils, ko, i18n, project, wktConsole, dialogHelper, viewHelper, screenUtils, ArrayDataProvider,
  ArrayTreeDataProvider, CoreRouter, ModuleElementUtils, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter,
  OffCanvasUtils, KnockoutTemplateUtils, ResponsiveUtils, ResponsiveKnockoutUtils, wktLogger) {

  function AppMainModel() {

    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.connected = () => {
      accUtils.announce('Application main loaded.', 'assertive');

      // in case of page reload, clear dialog status in electron
      window.api.ipc.send('set-has-open-dialog', false);

      // listen for components that need special handling
      viewHelper.listenForComponents('wktMainPane');
      viewHelper.listenForComponents('mainDialogModule');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`nav-${labelId}`);
    };

    // Set up for drag and drop events.

    const getDroppedFile = (event) => event.dataTransfer.files[0];
    document.addEventListener('dragstart', event => event.preventDefault());
    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('dragleave', event => event.preventDefault());
    document.addEventListener('drop', (event) => {
      event.preventDefault();
      const file = getDroppedFile(event);
      wktLogger.debug(`dropped file path = ${file.path}`);
      if (window.api.path.extname(file.name).toLowerCase() === '.wktproj') {
        window.api.ipc.send('open-project', file.path, project.isDirty());
      } else {
        wktLogger.warn(`Dropped file ${file.path} extension was not recognized as a wktproj file`);
      }
    });

    // detect when the screen size is narrow, and use collapsed navigation

    const mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
    this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

    this.mdScreen.subscribe(isWide => {
      this.navCollapsed(!isWide);
    });

    this.copyrightTextForFooter = ko.observable(i18n.t('copyright-footer-text',
      { currentYear: new Date().getUTCFullYear() }));

    // route data for page content views

    let routeData = [
      { path: '', redirect: 'project-settings-page' },
      { path: 'project-settings-page'},
      { path: 'model-page'},
      { path: 'image-page'},
      { path: 'kubectl-page'},
      { path: 'operator-page'},
      { path: 'domain-page'},
      { path: 'ingress-page'},
      { path: 'vz-app-page'},
      { path: 'vz-config-page'},
      { path: 'v8o-install-page'},
      { path: 'empty-view'}
    ];

    // Router setup
    screenUtils.createMainNavigationRouter(routeData, {
      urlAdapter: new UrlParamAdapter(),
      history: 'skip'
    });
    const router = screenUtils.getMainNavigationRouter();
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router);

    this.selection = new KnockoutRouterAdapter(router);

    // sections in the nav that are added or removed based on target type
    const targetNavData = {};

    targetNavData.wko = {
      name: this.labelMapper('kubernetes'),
      id: 'no-page',
      icon: 'oj-ux-ico-folder',
      children:[
        { name: this.labelMapper('kubectl'),
          id: 'kubectl-page',
          icon: 'oj-ux-ico-user-configuration'
        },
        { name: this.labelMapper('operator'),
          id: 'operator-page',
          icon: 'oj-ux-ico-arrow-circle-down'
        },
        { name: this.labelMapper('domain'),
          id: 'domain-page',
          icon: 'oj-ux-ico-manage-work-definitions'
        },
        { name: this.labelMapper('ingress'),
          id: 'ingress-page',
          icon: 'oj-ux-ico-router'
        }
      ]
    };

    targetNavData.vz = {
      name: this.labelMapper('verrazzano'),
      id: 'no-page',
      icon: 'oj-ux-ico-folder',
      children:[
        { name: this.labelMapper('vz-config'),
          id: 'kubectl-page',
          icon: 'oj-ux-ico-user-configuration'
        },
        { name: this.labelMapper('vz-install'),
          id: 'v8o-install-page',
          icon: 'oj-ux-ico-arrow-circle-down'
        },
        { name: this.labelMapper('vz-application'),
          id: 'vz-app-page',
          icon: 'oj-ux-ico-manage-work-definitions'
        }
      ]
    };

    const navData = ko.observableArray([
      { name: this.labelMapper('project-settings'),
        id: 'project-settings-page',
        icon: 'oj-ux-ico-settings'
      },
      { name: this.labelMapper('model'),
        id: 'model-page',
        icon: 'oj-ux-ico-model-change-mgmt'
      },
      { name: this.labelMapper('image'),
        id: 'image-page',
        icon: 'oj-ux-ico-page-template'
      }
    ]);

    this.navDataProvider = new ArrayTreeDataProvider(navData, {
      keyAttributes: 'id'
    });

    navData.push(targetNavData[project.settings.wdtTargetType.value]);

    project.settings.wdtTargetType.observable.subscribe(() => {
      this.rebuildNav();
    });

    // rebuild the navigation based on the target type.
    // if the navigation is collapsed, build a flattened list.
    this.rebuildNav = () => {
      // remove all target-specific items
      const targetType = project.settings.wdtTargetType.value;
      Object.getOwnPropertyNames(targetNavData).forEach(key => {
        navData.remove(targetNavData[key]);
        targetNavData[key].children.forEach((child) => {
          navData.remove(child);
        });
      });

      if(this.navCollapsed()) {
        // for collapsed view, add each child for the target type
        targetNavData[targetType].children.forEach((child) => {
          navData.push(child);
        });

      } else {
        // for expanded view, add the target type folder
        navData.push(targetNavData[targetType]);
      }

      // avoid transient combination of icons + collapsible
      this.navDrillMode('none');
      this.navDisplay(this.navCollapsed() ? 'icons' : 'all');
      this.navDrillMode(this.navCollapsed() ? 'none' : 'collapsible');
    };

    // expand / collapse the left navigation

    this.navCollapsed = ko.observable(!this.mdScreen());
    this.navDrillMode = ko.observable();
    this.navDisplay = ko.observable();
    this.rebuildNav();

    this.navCollapsed.subscribe(() => {
      this.rebuildNav();
    });

    this.collapseArrowClass = ko.computed(() => {
      return this.navCollapsed() ? 'oj-ux-ico-arrow-right' : 'oj-ux-ico-arrow-left';
    }, this);

    this.collapseNav = () => {
      this.navCollapsed(!this.navCollapsed());

      // update user setting only when nav collapsed is explicitly set.
      window.api.ipc.send('set-navigation-collapsed', this.navCollapsed());
    };

    // load this once, when app is initialized
    window.api.ipc.invoke('get-navigation-collapsed').then(collapsed => {
      this.navCollapsed(collapsed);
    });

    // console section

    // view uses 'wktConsole.show' directly
    this.wktConsole = wktConsole;

    this.consoleLabel = i18n.t('page-console');

    wktConsole.lines.subscribe((lines) => {
      let $content = $('#wkt-console-content');
      let $newSpan;
      $content.html('');
      lines.forEach((value) => {
        let text = value['text'];
        let outputType = value['type'];
        $newSpan = $('<span></span>');
        $newSpan.text(text);
        if (outputType === 'err') {
          $newSpan.addClass('consoleError');
        }
        $content.append($newSpan);
        $content.append($('<br/>'));
      });

      if ($newSpan) {
        $newSpan.get(0).scrollIntoView();
      }
    });

    // dialog configuration

    this.dialogModuleConfig = ko.observable();

    this.updateDialog = (options) => {
      const viewName = options['viewName'];
      const viewOptions = options['viewOptions'];
      this.dialogModuleConfig(ModuleElementUtils.createConfig({name: viewName, params: viewOptions}));
    };

    // initialize the dialog module, in case dialog was already specified (quickstart)
    this.updateDialog(dialogHelper.showDialog());

    // update the dialog module if the current dialog changes
    dialogHelper.showDialog.subscribe((options) => {
      if(options) {
        this.updateDialog(dialogHelper.showDialog());
      }
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return AppMainModel;
});
