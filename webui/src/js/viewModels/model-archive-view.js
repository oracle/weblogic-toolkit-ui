/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/dialog-helper', 'utils/wdt-archive-helper',
  'utils/view-helper',
  'ojs/ojarraytreedataprovider', 'ojs/ojtoolbar', 'ojs/ojtreeview', 'ojs/ojmenu', 'ojs/ojoption'],
function(accUtils, ko, i18n, project, dialogHelper, archiveHelper, ViewHelper, ArrayTreeDataProvider) {
  function ModelArchiveViewModel() {
    let contextItem = null;

    this.themeClasses = ViewHelper.themeClasses;

    this.connected = () => {
      accUtils.announce('Archive view loaded.', 'assertive');
      this.archiveTree = document.getElementById('treeview');
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`model-archive-${labelId}`);
    };

    this.archiveLabel = ko.computed(() => {
      let filePath = project.wdtModel.archiveFile();
      if (filePath) {
        const result = filePath.replace('\\', '/');
        const lastSlash = result.lastIndexOf('/');
        return result.substring(lastSlash + 1);
      }
      return this.labelMapper('no-archive-label');
    }, this);

    this.archiveDataProvider = new ArrayTreeDataProvider(project.wdtModel.archiveRoots, {keyAttributes: 'id'});

    this.selectedItem = ko.observable(null);
    this.deleteMenuLabel = ko.observable('');

    this.selectionChanged = (event) => {
      const items = Array.from(event.detail.value.values());
      this.selectedItem(items[0]);
    };

    this.addFile = () => {
      dialogHelper.openDialog('add-to-archive-selection-dialog', {});
    };

    this.deleteSelected = () => {
      const path = this.selectedItem();
      archiveHelper.removeFromArchive(path);
    };

    this.beforeMenu = event => {
      // JET sets currentItem to the context-menu target, which need not be selected.
      contextItem = this.archiveTree.currentItem;
      if(!contextItem) {
        this.deleteMenuLabel('');
        event.preventDefault();
      } else {
        const name = contextItem.replace(/\/$/, '').split('/').pop();
        this.deleteMenuLabel(i18n.t('delete-label', { ns: 'modeledit', item: name }));
      }
    };

    this.menuAction = event => {
      if(event.detail.selectedValue === 'delete' && contextItem) {
        archiveHelper.removeFromArchive(contextItem);
        contextItem = null;
      }
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelArchiveViewModel;
});
