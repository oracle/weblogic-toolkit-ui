/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['js-yaml', 'ace'],
  function (jsyaml) {
    function ModelEditor(element, {
      defaultTheme = 'twilight',
      defaultMode = 'yaml'
    } = {} ) {
      const getAceTheme = (theme) => `ace/theme/${theme}`;
      const getAceMode = (mode) => `ace/mode/${mode}`;

      let _aceTheme = getAceTheme(defaultTheme);
      let _aceMode = getAceMode(defaultMode);

      const _aceEditor = ace.edit(element, {
        theme: _aceTheme,
        mode: _aceMode
      });

      // eslint-disable-next-line no-unused-vars
      let _modelFileName = null;
      let _modelFileSavedContent = '';
      const _listeners = [];

      let getYamlCodeValidationErrors = (code) => {
        let error = '';
        try {
          jsyaml.load(code);
        } catch (e) {
          error = e;
        }
        return error;
      };

      _aceEditor.on('change', () => {
        let code = _aceEditor.getValue();
        let error = getYamlCodeValidationErrors(code);

        if (error) {
          _aceEditor.getSession().setAnnotations([{
            row: error.mark ? error.mark.line : 0,
            column: error.mark ? error.mark.column : 0,
            text: error.reason,
            type: 'error'
          }]);
        } else {
          _aceEditor.getSession().setAnnotations([]);
        }
      });

      _aceEditor.on('blur', () => {
        for(const listener of _listeners) {
          listener.onBlur();
        }
      });

      this.setMode = (mode) => {
        _aceEditor.setMode(getAceMode(mode));
      };

      this.setTheme = (theme) => {
        _aceEditor.setTheme(getAceTheme(theme));
      };

      this.hasUnsavedChanges = () => {
        return _aceEditor.session.getValue() !== _modelFileSavedContent;
      };

      this.getContent = () => {
        return _aceEditor.session.getValue();
      };

      this.showContent = (content) => {
        _aceEditor.session.setValue(content);
      };

      // // Handle save-model from a menu
      // //
      // window.api.ipc.receive('save-model', () => {
      //   let modelFileCurrentContent = _aceEditor.session.getValue();
      //   if (_modelFileName && modelFileCurrentContent !== _modelFileSavedContent) {
      //     window.api.ipc.send('save-model-file', _modelFileName, modelFileCurrentContent);
      //   }
      // });
      //
      // // Handle model-file-opened message
      // //
      // window.api.ipc.receive('model-file-opened', (file, content) => {
      //   // TODO - test to see if currentWindow.isDocumentEdited() is true and prompt the user if they want to discard their unsaved changes
      //   renderFile(file, content);
      // });
      //
      // // Handle model-file-changed message
      // //
      // window.api.ipc.receive('model-file-changed', (file, content) => {
      //   // TODO - another application/window has changed this file, prompt the user if they want to discard their unsaved changes
      //
      // });

      // Handle model-file-saved message
      //
      // window.api.ipc.receive('model-file-saved', (file, content) => {
      //   _modelFileName = file;
      //   _modelFileSavedContent = content;
      // });

      // the editor may need to be explicitly resized if its container size changes,
      // but the window size does not (such as UI console open / close).
      //
      // eslint-disable-next-line no-unused-vars
      this.resize = (content) => {
        _aceEditor.resize();
      };

      this.addListener = (listener) => {
        _listeners.push(listener);
      };

      this.removeListener = (listener) => {
        const index = _listeners.indexOf(listener);
        if (index > -1) {
          _listeners.splice(index, 1);
        }
      };

      // eslint-disable-next-line no-unused-vars
      const renderFile = (file, content) => {
        _modelFileName = file;
        _modelFileSavedContent = content;

        _aceEditor.session.setValue(content);
      };
    }
    return ModelEditor;
  }
);
