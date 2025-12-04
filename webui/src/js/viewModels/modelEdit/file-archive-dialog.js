/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper', 'utils/view-helper',
  'oj-c/radioset', 'oj-c/button', 'ojs/ojdialog', 'ojs/ojvalidationgroup'],
function(accUtils, ko, MessageHelper, AliasHelper, viewHelper) {

  function FileArchiveDialog(args) {
    const FILE_CHOSEN = args.fileChosen;
    const ATTRIBUTE = args.attribute;
    const SELECT_OPTION = args.selectOption;

    const MODEL_PATH = ATTRIBUTE.path;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    const DIALOG_SELECTOR = '#fileArchiveDialog';

    this.connected = () => {
      accUtils.announce('File archive dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.t = (labelId, arg) => {
      return MessageHelper.t(labelId, arg);
    };

    this.labelMapper = (labelId, arg) => {
      return MessageHelper.t('file-select-' + labelId, arg);
    };

    const attributeLabel = MessageHelper.getAttributeLabel(ATTRIBUTE, ALIAS_PATH);
    this.title = this.labelMapper('archive-title', { attribute: attributeLabel });

    const isDir = SELECT_OPTION.type === 'dir';
    const pathLabelKey = isDir ? 'type-dir' : 'type-file';
    this.pathLabel = this.labelMapper(pathLabelKey);
    this.pathText = FILE_CHOSEN;

    const archiveKey = isDir ? 'add-dir-to-archive' : 'add-file-to-archive';
    const fileKey = isDir ? 'use-dir-location' : 'use-file-location';
    this.archiveOptions = [
      { value: true, label: this.labelMapper(archiveKey) },
      { value: false, label: this.labelMapper(fileKey) }
    ];

    this.archiveOption = ko.observable(true);

    const segregateName = SELECT_OPTION.segregateName;

    // may need to request the segregate name
    this.showSegregate = SELECT_OPTION.segregateLabel && !segregateName;
    this.segregateLabel = SELECT_OPTION.segregateLabel;
    this.segregateHelp = SELECT_OPTION.segregateHelp;

    this.segregateName = ko.observable(segregateName);

    this.okInput = () => {
      let tracker = document.getElementById('modelEditFileArchiveTracker');
      if (tracker.valid !== 'valid') {
        // show messages on all the components that have messages hidden.
        tracker.showMessages();
        tracker.focusOn('@firstInvalidShown');
        return;
      }

      this.dialogContainer.close();

      args.setValue({
        addToArchive: this.archiveOption(),
        segregateName: this.segregateName()
      });
    };

    this.cancelInput = () => {
      this.dialogContainer.close();
      args.setValue(null);
    };
  }

  return FileArchiveDialog;
});
