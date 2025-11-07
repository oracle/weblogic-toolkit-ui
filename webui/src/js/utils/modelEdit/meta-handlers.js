/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
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
          return type !== 'TpUsrFile';
        });
      };

      this.wtcDisableUserGroupIDKeywordFields = attributeMap => {
        const appKeyPluginType = attributeMap['AppKey'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(appKeyPluginType.observable());
          return type !== 'LDAP';
        });
      };

      this.wtcDisableCustomAppKeyFields = attributeMap => {
        const appKeyPluginType = attributeMap['AppKey'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(appKeyPluginType.observable());
          return type !== 'Custom';
        });
      };

      this.fileStoreDisableDirectWriteWithCacheFields = attributeMap => {
        const syncWritePolicy = attributeMap['SynchronousWritePolicy'];
        return ko.computed(() => {
          const policy = ModelEditHelper.getDerivedValue(syncWritePolicy.observable());
          return policy !== 'Direct-Write-With-Cache';
        });
      };

      this.persistentStoreDisableRestartFields = attributeMap => {
        const restartInPlace = attributeMap['RestartInPlace'];
        return ko.computed(() => {
          const restart = ModelEditHelper.getDerivedValue(restartInPlace.observable());
          return restart !== true;
        });
      };

      this.jmsMessageLogRotateTimeFields = attributeMap => {
        const rotateType = attributeMap['RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotateType.observable());
          return type !== 'byTime' && type !== 'bySizeOrTime';
        });
      };

      this.jmsMessageLogRotateSizeFields = attributeMap => {
        const rotateType = attributeMap['RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotateType.observable());
          return type !== 'bySize' && type !== 'bySizeOrTime';
        });
      };

      this.coherenceMulticastClusteringModeFields = attributeMap => {
        const clusteringMode = attributeMap['ClusteringMode'];
        return ko.computed(() => {
          const mode = ModelEditHelper.getDerivedValue(clusteringMode.observable());
          return mode !== 'multicast';
        });
      };

      this.coherenceNotUsingCustomClusterConfig = attributeMap => {
        const clusteringMode = attributeMap['UsingCustomClusterConfigurationFile'];
        return ko.computed(() => {
          const usesConfig = ModelEditHelper.getDerivedValue(clusteringMode.observable());
          return !usesConfig;
        });
      };

      this.wldfRestNotUsingBasicAuth = attributeMap => {
        const authMode = attributeMap['HttpAuthenticationMode'];
        return ko.computed(() => {
          const mode = ModelEditHelper.getDerivedValue(authMode.observable());
          return mode !== 'Basic';
        });
      };

      this.secConfigCrossDomainSecurityFields = attributeMap => {
        const crossDomainSecurityEnabled = attributeMap['CrossDomainSecurityEnabled'];
        return ko.computed(() => {
          const enabled = ModelEditHelper.getDerivedValue(crossDomainSecurityEnabled.observable());
          return !enabled;
        });
      };

      this.secConfigCertRevocCrlLdapFields = attributeMap => {
        const crlCacheType = attributeMap['CrlCacheType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(crlCacheType.observable());
          return type !== 'LDAP'
        });
      };

      this.secConfigCertRevocCrlFields = attributeMap => {
        const methodOrder = attributeMap['MethodOrder'];
        return ko.computed(() => {
          const order = ModelEditHelper.getDerivedValue(methodOrder.observable());
          return order === undefined || order === 'OCSP';
        });
      };

      this.secConfigCertRevocCrlDpFields = attributeMap => {
        const crlDpEnabled = attributeMap['CrlDpEnabled'];
        return ko.computed(() => {
          const enabled = ModelEditHelper.getDerivedValue(crlDpEnabled.observable());
          return !enabled;
        });
      };

      this.secConfigCertRevocOcspFields = attributeMap => {
        const methodOrder = attributeMap['MethodOrder'];
        return ko.computed(() => {
          const order = ModelEditHelper.getDerivedValue(methodOrder.observable());
          return order === undefined || order === 'CRL';
        });
      };

      this.secConfigCertRevocOcspCacheFields = attributeMap => {
        const ocspCacheEnabled = attributeMap['OcspResponseCacheEnabled'];
        return ko.computed(() => {
          const enabled = ModelEditHelper.getDerivedValue(ocspCacheEnabled.observable());
          return !enabled;
        });
      };

      this.secConfigCertRevocCACrlFields = this.secConfigCertRevocCrlFields;
      this.secConfigCertRevocCACrlDpFields = this.secConfigCertRevocCrlDpFields;
      this.secConfigCertRevocCAOcspFields = this.secConfigCertRevocOcspFields;

      this.secConfigRealmDeployableProviderSyncFields = attributeMap => {
        const providerSyncEnabled = attributeMap['DeployableProviderSynchronizationEnabled'];
        return ko.computed(() => {
          const enabled = ModelEditHelper.getDerivedValue(providerSyncEnabled.observable());
          return !enabled;
        });
      };

      this.secConfigRealmIdentityAssertionCacheFields = attributeMap => {
        const identityAssertionCacheEnabled = attributeMap['IdentityAssertionCacheEnabled'];
        return ko.computed(() => {
          const enabled = ModelEditHelper.getDerivedValue(identityAssertionCacheEnabled.observable());
          return !enabled;
        });
      };

      this.secConfigRealmWlsPrincipalValidatorCacheFields = attributeMap => {
        const wlsPrincipalValidatorCacheEnabled = attributeMap['EnableWebLogicPrincipalValidatorCache'];
        return ko.computed(() => {
          const enabled = ModelEditHelper.getDerivedValue(wlsPrincipalValidatorCacheEnabled.observable());
          return !enabled;
        });
      };
    }

    // return a singleton instance
    return new MetaHandlers();
  }
);
