/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/navigation-helper', 'utils/modelEdit/message-helper',
  'utils/wkt-logger', 'ojs/ojknockouttemplateutils'],
function(accUtils, ko, NavigationHelper, MessageHelper, wktLogger,
  KnockoutTemplateUtils) {

  function NavigationViewModel() {
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;

    this.navDataProvider = NavigationHelper.navDataProvider;
    this.menuExpanded = NavigationHelper.menuExpanded;
    this.menuKey = NavigationHelper.menuKey;

    this.t = (labelId, payload) => {
      return MessageHelper.t(labelId, payload);
    };
  }

  return NavigationViewModel;
});
