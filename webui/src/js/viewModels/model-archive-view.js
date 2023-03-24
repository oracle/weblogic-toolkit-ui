/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/i18n', 'models/wkt-project', 'utils/dialog-helper', 'utils/wdt-archive-helper',
  'ojs/ojarraytreedataprovider', 'ojs/ojtoolbar', 'ojs/ojtreeview'],
function(accUtils, ko, i18n, project, dialogHelper, archiveHelper, ArrayTreeDataProvider) {
  function ModelArchiveViewModel() {

    this.connected = () => {
      accUtils.announce('Archive view loaded.', 'assertive');
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
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelArchiveViewModel;
});
