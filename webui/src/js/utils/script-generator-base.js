/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/sh-script-adapter', 'utils/powershell-script-adapter', 'utils/cmd-script-adapter'],
  function(project, ShAdapter, PsAdapter, CmdAdapter) {
    const isWindows = window.api.process.isWindows();

    class ScriptGeneratorBase {
      constructor(scriptType) {
        this.credentialMask = '<provide-credential-value>';
        this.fillMeInMask = '<fill-me-in>';
        this.fillInFileNameMask = '<provide-path-to-the-file-you-created>';
        this.project = project;
        this.adapter = this._getAdapter(scriptType);
      }

      static getDefaultScriptingLanguage() {
        return isWindows ? 'ps1' : 'sh';
      }

      getTempDirectoryEnvironmentVariableReference() {
        let tempDirVariableName = 'TMPDIR';
        if (isWindows) {
          tempDirVariableName = 'TEMP';
        }
        return this.adapter.getEnvironmentVariableReference(tempDirVariableName);
      }

      isModelInImage() {
        return this.project.settings.targetDomainLocation.value === 'mii';
      }

      isDomainOnPV() {
        return this.project.settings.targetDomainLocation.value === 'pv';
      }

      usingAuxImage() {
        return this.project.settings.targetDomainLocation.value === 'mii' && this.project.image.useAuxImage.value;
      }

      _getAdapter(scriptType) {
        switch (scriptType) {
          case 'sh':
            return new ShAdapter();

          case 'ps1':
            return new PsAdapter();

          case 'cmd':
            return new CmdAdapter();

          default:
            throw new Error(`Cannot generate shell script adapter for unknown type ${scriptType}`);
        }
      }

      _getAbsolutePaths(baseDirectory, ...paths) {
        const results = [];
        for (const path of paths) {
          let absolutePath = path;
          if (!window.api.path.isAbsolute(path)) {
            absolutePath = window.api.path.join(baseDirectory, path);
          }
          results.push(absolutePath);
        }
        return results;
      }

      _isSet(property) {
        let result = false;
        if (Array.isArray(property.default) && Array.isArray(property.value)) {
          if (property.default.length !== property.value.length) {
            result = true;
          } else {
            for (let propertyDefaultValue of property.default) {
              if (!property.value.includes(propertyDefaultValue)) {
                result = true;
                break;
              }
            }
          }
        } else {
          const defaultValue = this._normalizeStringValue(property.default);
          const fieldValue = this._normalizeStringValue(property.value);
          result = defaultValue !== fieldValue;
        }
        return result;
      }

      _normalizeStringValue(value) {
        let result;
        if (value !== undefined && value !== null) {
          if (typeof value === 'string') {
            if (value.length > 0) {
              result = value;
            }
          } else {
            result = value.toString();
          }
        }
        return result;
      }
    }

    return ScriptGeneratorBase;
  }
);
