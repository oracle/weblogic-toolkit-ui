/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'knockout', 'utils/screen-utils', 'models/wkt-project', 'utils/editor',
  'ojs/ojmodule-element-utils'],
function(accUtils, ko, screenUtils, project, ModelEditor, ModuleElementUtils) {
  function ModelCodeViewModel() {

    let _modelEditor;
    let subscriptions = [];

    this.connected = () => {
      accUtils.announce('Model code view loaded.', 'assertive');

      // update editor if project changes
      subscriptions.push(project.wdtModel.modelContent.subscribe((newContent) => {
        // if the new model content matches the editor content, don't update the editor content.
        // it's not necessary, and will invalidate the undo chain on blur / focus.
        if(newContent !== _modelEditor.getContent()) {
          _modelEditor.showContent(newContent);
        }
      }));

      _modelEditor = new ModelEditor('model-editor');
      _modelEditor.showContent(project.wdtModel.modelContent());

      // listen for events on the editor
      _modelEditor.addListener(this.editorListener);

      // editor needs to be explicitly resized when container size changes.
      // the container size changes when the UI console is resized.
      const editorElement = document.getElementById('model-editor');
      new ResizeObserver(() => {
        _modelEditor.resize();
      }).observe(editorElement);

      // initialize the horizontal and vertical sliders

      const hSlider = document.getElementById('leftRightSlider');
      const leftPane  = document.getElementById('wkt-model-editor-frame');
      const rightPane = document.getElementById('wkt-model-right');
      screenUtils.sliderPane(hSlider, leftPane, rightPane, 'modelMain', false);

      const vSlider = document.getElementById('upDownSlider');
      const topPane  = document.getElementById('wkt-model-properties-frame');
      const bottomPane = document.getElementById('wkt-model-archive-frame');
      screenUtils.sliderPane(vSlider, topPane, bottomPane, 'modelRight', true);
    };

    this.disconnected = () => {
      subscriptions.forEach((subscription) => {
        subscription.dispose();
      });

      _modelEditor.removeListener(this.editorListener);
    };

    this.editorListener = {
      onBlur: () => {
        // transfer editor content to project on blur
        let text = _modelEditor.getContent();
        project.wdtModel.modelContent(text);
      }
    };

    // Setup for properties module
    this.propertiesModuleConfig = ModuleElementUtils.createConfig({
      name: 'model-properties-view',
      params: {}
    });

    // Setup for archive module
    this.archiveModuleConfig = ModuleElementUtils.createConfig({
      name: 'model-archive-view',
      params: {}
    });
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return ModelCodeViewModel;
});
