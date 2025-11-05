/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/modelEdit/model-edit-helper'],
  function (ko, ModelEditHelper) {
    function MetaOptions() {
      const TARGET_FOLDERS = ['Cluster', 'Server', 'MigratableTarget'];
      const JMS_TARGET_FOLDERS = ['JMSServer', 'SAFAgent'];

      this.targetOptions = () => {
        const options = [];
        TARGET_FOLDERS.forEach(folder => {
          const names = getInstanceNames(['topology', folder]);
          names.forEach(name => options.push({ value: name, label: name }));
        });
        return options;
      };

      this.jmsTargetOptions = () => {
        const options = this.targetOptions();
        JMS_TARGET_FOLDERS.forEach(folder => {
          const names = getInstanceNames(['resources', folder]);
          names.forEach(name => options.push({ value: name, label: name }));
        });
        return options;
      };

      function getInstanceNames(modelPath) {
        const folder = ModelEditHelper.getFolder(modelPath);
        return Object.keys(folder);
      }
    }

    // return a singleton instance
    return new MetaOptions();
  }
);
