/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/model-edit-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper',
  'ojs/ojtable', 'oj-c/button', 'oj-c/labelled-link'
],
function(accUtils, ko, ModelEditHelper, MessageHelper, AliasHelper) {

  function InstancesSectionViewModel(args) {
    // for model folders with multiple instances (such as Server/myServer).

    const MODEL_PATH = args.modelPath;
    const META_SECTION = args.metaSection;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.connected = () => {
      accUtils.announce('Instances section loaded.', 'assertive');
    };

    const labelKey = META_SECTION.labelKey;
    const label = labelKey ? MessageHelper.t(labelKey) : null;
    this.title = label || MessageHelper.getFolderLabel(ALIAS_PATH);

    this.tableConfig = ModelEditHelper.createInstancesTableConfig(MODEL_PATH);
  }

  return InstancesSectionViewModel;
});
