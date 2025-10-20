/**
 * @license
 * Copyright (c) 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/modelEdit/model-edit-helper'],
  function (ko, ModelEditHelper) {
    function MetaHandlers() {

      // return an observable, since this is dependent on another attribute's value
      this.notOracleDatabaseType = attributeMap => {
        const dbTypeAttribute = attributeMap['rcu_database_type'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(dbTypeAttribute.observable());
          return !['ORACLE', 'EBR'].includes(type);
        });
      };

      this.wtcDisableTpUsrFileField = attributeMap => {
        const appKeyPluginType = attributeMap['AppKey'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(appKeyPluginType.observable());
          return type !== 'TpUsrFile'
        });
      };

      this.wtcDisableUserGroupIDKeywordFields = attributeMap => {
        const appKeyPluginType = attributeMap['AppKey'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(appKeyPluginType.observable());
          return type !== 'LDAP'
        });
      };

      this.wtcDisableCustomAppKeyFields = attributeMap => {
        const appKeyPluginType = attributeMap['AppKey'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(appKeyPluginType.observable());
          return type !== 'Custom'
        });
      };
    }

    // return a singleton instance
    return new MetaHandlers();
  }
);
