/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'ojs/ojcontext'],
  function(ko, ojContext) {
    function ViewHelper() {

      // width of button column in WKT tables.
      // ideally this could be specified as 'auto', but oj-table will not set below 100px.
      this.BUTTON_COLUMN_WIDTH = '55px';

      const thisHelper = this;

      const observer = new MutationObserver(function(mutations) {
        for(const mutation of mutations) {
          for(const node of mutation.addedNodes) {
            if(node.classList && node.classList.contains('wkt-can-readonly-field')) {
              thisHelper.initializeReadOnlyField(node);
            } else if (node.classList && node.classList.contains('wkt-can-disabled-field')) {
              thisHelper.initializeDisabledField(node);
            }

            // if a dialog was added, notify electron when it opens or closes
            if(node.classList && node.classList.contains('oj-dialog')) {
              thisHelper.initializeDialog(node);
            }
          }
        }
      });

      this.appearanceMode = ko.observable();  // from user settings

      // load these once, when ScreenUtils is initialized, not on each invocation
      window.api.ipc.invoke('get-appearance-mode').then(mode => {
        this.appearanceMode(mode);
      });

      this.setAppearanceMode = mode => {
        this.appearanceMode(mode);
      };

      function updateField(field) {
        const readOnly = field.getProperty('readonly');
        const disabled = field.getProperty('disabled');
        const assistanceNode = field.querySelector('.oj-user-assistance-inline-container');

        if (assistanceNode) {
          // if the field is read-only, add the read-only hint node, otherwise remove it.

          if (readOnly || disabled) {
            const hint = field.getProperty('help.instruction');
            assistanceNode.innerHTML = '<div class="oj-helphints-inline-container wkt-readonly-hint">'
              + hint + '</div>';

          } else {
            const readOnlyHintNode = assistanceNode.querySelector('.wkt-readonly-hint');
            if(readOnlyHintNode) {
              readOnlyHintNode.remove();
            }
          }
        }
      }

      // listen for elements added to the DOM, such as a module assignment or oj-bind-if.
      // listen inside the element with containerId.
      this.listenForComponents = (containerId) => {
        const container = document.getElementById(containerId);
        observer.observe(container, {childList: true, subtree:true});
      };

      this.initializeReadOnlyField = (field) => {
        thisHelper.componentReady(field).then(function () {
          updateField(field);

          // update the field if either of these properties changes
          field.addEventListener('readonlyChanged', () => updateField(field), false);
          field.addEventListener('helpChanged', () => updateField(field), false);
        });
      };

      this.initializeDisabledField = (field) => {
        thisHelper.componentReady(field).then(function () {
          updateField(field);

          // update the field if either of these properties changes
          field.addEventListener('disabledChanged', () => updateField(field), false);
          field.addEventListener('helpChanged', () => updateField(field), false);
        });
      };

      this.initializeDialog = (dialog) => {
        this.updateDialogStatus(dialog.isOpen());
        thisHelper.componentReady(dialog).then(() => {
          // notify when the dialog is open or closed
          dialog.addEventListener('ojBeforeOpen', () => this.updateDialogStatus(true));
          dialog.addEventListener('ojBeforeClose', () => this.updateDialogStatus(false));
        });
      };

      this.updateDialogStatus = (isOpen) => {
        window.api.ipc.send('set-window-attribute', 'hasOpenDialog', isOpen);
      };

      function compareValues(a, b) {
        a = a ? a.toString() : '';
        b = b ? b.toString() : '';
        if (a === b) {
          return 0;
        }
        return a < b ? -1 : 1;
      }

      this.getSortComparators = (columnData) => {
        const map = new Map();
        for(const column of columnData) {
          let sortProperty = column['sortProperty'];
          if(sortProperty) {
            map.set(sortProperty, compareValues);
          }
        }
        return { comparators: map };
      };

      this.componentReady = (component) => {
        // return a Promise that is resolved when the component is ready
        const busyContext = ojContext.getContext(component).getBusyContext();
        return busyContext.whenReady();
      };

      this.getEventRootElement = () => {
        return document.getElementById('pageContent');
      };

      this.dispatchEventFromRootElement = (customEvent) => {
        this.getEventRootElement().dispatchEvent(customEvent);
      };

      this.addEventListenerToRootElement = (eventType, listener, options) => {
        this.getEventRootElement().addEventListener(eventType, listener, options);
      };

      this.removeEventListenerFromRootElement = (eventType, listener, options) => {
        this.getEventRootElement().removeEventListener(eventType, listener, options);
      };

      // ******************
      // dark mode support
      // ******************

      const updateTheme = () => {
        const assignedMode = this.appearanceMode();
        let isDarkMode;
        if(assignedMode === 'dark') {
          isDarkMode = true;
        } else if(assignedMode === 'light') {
          isDarkMode = false;
        } else {
          isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        this.isDarkMode(isDarkMode);
      };

      this.isDarkMode = ko.observable();
      this.themeClasses = ko.computed(() => {
        return this.isDarkMode() ? 'oj-bg-neutral-170 oj-color-invert oj-c-colorscheme-dependent' : '';
      });

      updateTheme();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        updateTheme();
      });
      this.appearanceMode.subscribe(() => {
        updateTheme();
      });
    }

    return new ViewHelper();
  }
);
