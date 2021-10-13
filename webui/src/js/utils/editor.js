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

      this.getContent = () => {
        return _aceEditor.session.getValue();
      };

      this.showContent = (content) => {
        _aceEditor.session.setValue(content);
      };

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
    }
    return ModelEditor;
  }
);
