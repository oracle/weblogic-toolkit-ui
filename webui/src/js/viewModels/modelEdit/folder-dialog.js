/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/modelEdit/instance-helper',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/alias-helper', 'utils/modelEdit/message-helper',
  'ojs/ojmodule-element-utils', 'ojs/ojarraydataprovider', 'ojs/ojbufferingdataprovider',
  'ojs/ojconverter-number', 'utils/validation-helper',
  'utils/view-helper', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog',
  'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, i18n, project, InstanceHelper, ModelEditHelper, AliasHelper, MessageHelper,
  ModuleElementUtils, ArrayDataProvider, BufferingDataProvider, ojConverterNumber, validationHelper, viewHelper) {

  function FolderDialogModel(args) {
    // for model folders with multiple instances, usually below the navigation tree level.
    // could also be used for single folders where space is limited.
    // display folder content (attributes, single folders, multiple folders).

    const DIALOG_SELECTOR = '#modelEditFolderDialog';
    const MODEL_PATH = args.modelPath;

    const IS_MULTIPLE = AliasHelper.isNamedPath(MODEL_PATH);
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);
    const INSTANCE_NAME = IS_MULTIPLE ? MODEL_PATH[MODEL_PATH.length - 1] : null;

    this.i18n = i18n;
    this.instanceName = ko.observable(INSTANCE_NAME);  // such as "myServer" for "Server/myServer"
    this.isMultiple = IS_MULTIPLE;
    this.nameLabel = MessageHelper.getInstanceNameLabel(ALIAS_PATH);
    this.helpLabel = MessageHelper.getInstanceNameHelp(ALIAS_PATH);

    this.nameValidators = InstanceHelper.getNameValidators(MODEL_PATH);

    this.connected = () => {
      accUtils.announce('Folder edit dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId, arg) => {
      return i18n.t(`domain-design-cluster-${labelId}`, arg);
    };

    this.getTitle = () => {
      return MessageHelper.getPageTitle(MODEL_PATH);
    };

    this.ok = () => {
      let tracker = document.getElementById('domainTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      // if no attributes were set, an empty instance folder must be established
      ModelEditHelper.findOrCreatePath(MODEL_PATH, this.modelCopy);

      if(IS_MULTIPLE && (this.instanceName() !== INSTANCE_NAME)) {
        const parentPath = MODEL_PATH.slice(0, -1);
        const instanceContent = ModelEditHelper.getFolder(MODEL_PATH, this.modelCopy);
        ModelEditHelper.deleteModelElement(parentPath, INSTANCE_NAME, this.modelCopy);
        const instanceFolder = ModelEditHelper.addFolder(parentPath, this.instanceName(), this.modelCopy);
        Object.assign(instanceFolder, instanceContent);

        InstanceHelper.folderWasRenamed(MODEL_PATH, this.instanceName());
      }

      ModelEditHelper.replaceModel(this.modelCopy);

      this.dialogContainer.close();
      args.setValue({});
    };

    this.cancel = () => {
      this.dialogContainer.close();
      args.setValue({});
    };

    this.modelCopy = ModelEditHelper.getModelCopy();

    this.folderContentModuleConfig = ModuleElementUtils.createConfig({
      name: 'modelEdit/folder-content',
      params: {
        modelPath: MODEL_PATH,
        model: this.modelCopy
      }
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return FolderDialogModel;
});
