/**
 * @license
 * Copyright (c) 2024, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/wkt-logger', 'utils/modelEdit/model-edit-helper'],
  function (ko, WktLogger, ModelEditHelper) {
    function MetaHandlers() {

      this.getDisabledHandler = (attribute, attributeMap) => {
        let handler = false;
        const disabledText = attribute['disabled'];
        if (disabledText) {
          if(this.hasOwnProperty(disabledText)) {
            handler = this[disabledText](attributeMap);
          } else {
            WktLogger.error(`No method ${disabledText} found for MetaHandlers`);
          }
        }
        return ko.isObservable(handler) ? handler : ko.observable(handler);
      };

      // return an observable, since this is dependent on another attribute's value
      this.notOracleDatabaseType = attributeMap => {
        const dbTypeAttribute = attributeMap['rcu_database_type'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(dbTypeAttribute.observable());
          return !['ORACLE', 'EBR'].includes(type);
        });
      };

      this.wtcRemoteTuxedoDomainDisableTpUsrFileField = attributeMap => {
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

      this.jmsServerHostingTemporaryDestinationsFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'HostingTemporaryDestinations', true);
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
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'UsingCustomClusterConfigurationFile');
      };

      this.wldfRestNotUsingBasicAuth = attributeMap => {
        const authMode = attributeMap['HttpAuthenticationMode'];
        return ko.computed(() => {
          const mode = ModelEditHelper.getDerivedValue(authMode.observable());
          return mode !== 'Basic';
        });
      };

      this.secConfigCrossDomainSecurityFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'CrossDomainSecurityEnabled');
      };

      this.secConfigCertRevocCrlLdapFields = attributeMap => {
        const crlCacheType = attributeMap['CrlCacheType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(crlCacheType.observable());
          return type !== 'LDAP';
        });
      };

      this.secConfigCertRevocCrlFields = attributeMap => {
        const methodOrder = attributeMap['MethodOrder'];
        return ko.computed(() => {
          const order = ModelEditHelper.getDerivedValue(methodOrder.observable());
          return isUndefined(order) || order === 'OCSP';
        });
      };

      this.secConfigCertRevocCrlDpFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'CrlDpEnabled', true);
      };

      this.secConfigCertRevocOcspFields = attributeMap => {
        const methodOrder = attributeMap['MethodOrder'];
        return ko.computed(() => {
          const order = ModelEditHelper.getDerivedValue(methodOrder.observable());
          return isUndefined(order) || order === 'CRL';
        });
      };

      this.secConfigCertRevocOcspCacheFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'OcspResponseCacheEnabled', true);
      };

      this.secConfigCertRevocCACrlFields = this.secConfigCertRevocCrlFields;
      this.secConfigCertRevocCACrlDpFields = this.secConfigCertRevocCrlDpFields;
      this.secConfigCertRevocCAOcspFields = this.secConfigCertRevocOcspFields;

      this.secConfigRealmDeployableProviderSyncFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'DeployableProviderSynchronizationEnabled');
      };

      this.secConfigRealmIdentityAssertionCacheFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'IdentityAssertionCacheEnabled', true);
      };

      this.secConfigRealmWlsPrincipalValidatorCacheFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'EnableWebLogicPrincipalValidatorCache', true);
      };

      this.embeddedLdapCacheFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'CacheEnabled', true);
      };

      this.logRotationFileCountLimitedFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'NumberOfFilesLimited', true);
      };

      this.logRotationBySizeFields = attributeMap => {
        const rotationType = attributeMap['RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotationType.observable());
          return type !== 'bySize' && type !== 'bySizeOrTime';
        });
      };

      this.logRotationByTimeFields = attributeMap => {
        const rotationType = attributeMap['RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotationType.observable());
          return type !== 'byTime' && type !== 'bySizeOrTime';
        });
      };

      this.logMonitoringFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'LogMonitoringEnabled', true);
      };

      this.restfulManagementServicesCorsFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'CorsEnabled');
      };

      this.nodeManagerDomainsFileFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'DomainsFileEnabled');
      };

      this.nodeManagerDemoIdentityAndTrustFields = attributeMap => {
        const keystoresType = attributeMap['KeyStores'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(keystoresType.observable());
          return type !== 'DemoIdentityAndDemoTrust';
        });
      };

      this.nodeManagerJavaTrustFields = attributeMap => {
        const keystoresType = attributeMap['KeyStores'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(keystoresType.observable());
          return type !== 'CustomIdentityAndJavaStandardTrust' && type !== 'DemoIdentityAndDemoTrust';
        });
      };

      this.nodeManagerCustomIdentityFields = attributeMap => {
        const keystoresType = attributeMap['KeyStores'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(keystoresType.observable());
          return type !== 'CustomIdentityAndJavaStandardTrust' && type !== 'CustomIdentityAndCustomTrust';
        });
      };

      this.nodeManagerCustomTrustFields = attributeMap => {
        const keystoresType = attributeMap['KeyStores'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(keystoresType.observable());
          return type !== 'CustomIdentityAndCustomTrust';
        });
      };

      this.nodeManagerDomainKeystoresFields = attributeMap => {
        const keystoresType = attributeMap['KeyStores'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(keystoresType.observable());
          return type !== 'DomainKeystores';
        });
      };

      this.nodeManagerCoherenceStartScriptFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'coherence.StartScriptEnabled');
      };

      this.nodeManagerWebLogicStartScriptFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'weblogic.StartScriptEnabled');
      };

      this.nodeManagerWebLogicStopScriptFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'weblogic.StopScriptEnabled');
      };

      this.nodeManagerProcessRotationBySizeFields = attributeMap => {
        const rotationType = attributeMap['process.RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotationType.observable());
          return type !== undefined && type !== 'SIZE';
        });
      };

      this.nodeManagerProcessRotationByTimeFields = attributeMap => {
        const rotationType = attributeMap['process.RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotationType.observable());
          return type !== 'TIME';
        });
      };

      this.defaultAuditorRotateBySizeFields = attributeMap => {
        const rotationType = attributeMap['RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotationType.observable());
          return type !== 'bySize';
        });
      };

      this.defaultAuditorRotateByTimeFields = attributeMap => {
        const rotationType = attributeMap['RotationType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(rotationType.observable());
          return type !== 'byTime';
        });
      };

      this.defaultAuditorCustomSeverityFields = attributeMap => {
        const severityLevel = attributeMap['Severity'];
        return ko.computed(() => {
          const severity = ModelEditHelper.getDerivedValue(severityLevel.observable());
          return severity !== 'CUSTOM';
        });
      };

      this.ldapAuthenticatorsCacheFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'CacheEnabled', true);
      };

      this.activeDirectoryAuthenticatorEnableSIDtoGroupLookupCachingField = attributeMap => {
        const cachingEnabled = attributeMap['CacheEnabled'];
        const useTokenGroupsForGroupMembershipLookup = attributeMap['UseTokenGroupsForGroupMembershipLookup'];
        return ko.computed(() => {
          const cacheEnabled = ModelEditHelper.getDerivedValue(cachingEnabled.observable());
          const useTokenGroups = ModelEditHelper.getDerivedValue(useTokenGroupsForGroupMembershipLookup.observable());
          return !(cacheEnabled && useTokenGroups);
        });
      };

      this.activeDirectoryAuthenticatorSIDtoGroupLookupCachingFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'EnableSIDtoGroupLookupCaching');
      };

      this.authenticatorsGroupMembershipSearchFields = attributeMap => {
        const groupMembershipSearching = attributeMap['GroupMembershipSearching'];
        return ko.computed(() => {
          const searching = ModelEditHelper.getDerivedValue(groupMembershipSearching.observable());
          return searching !== 'limited';
        });
      };

      this.authenticatorGroupMembershipLookupHierarchyCachingFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'EnableGroupMembershipLookupHierarchyCaching', true);
      };

      this.defaultIdentityAsserterDefaultUserNameMapperFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'UseDefaultUserNameMapper');
      };

      this.defaultIdentityAsserterCustomUserNameMapperFields = attributeMap => {
        const useDefaultUserNameMapper = attributeMap['UseDefaultUserNameMapper'];
        return ko.computed(() => {
          return ModelEditHelper.getDerivedValue(useDefaultUserNameMapper.observable());
        });
      };

      this.defaultIdentityAsserterBase64EncodingFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'Base64DecodingRequired', true);
      };

      this.defaultIdentityAsserterDigestReplayDetectionFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'DigestReplayDetectionEnabled');
      };

      this.oracleUnifiedDirectoryAuthenticatorMemberUIDForGroupSearchFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'UseMemberuidForGroupSearch');
      };

      this.sqlAuthenticatorsGetDescriptionFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'DescriptionsSupported');
      };

      this.userLockoutManagerLockoutFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'LockoutEnabled', true);
      };

      this.clusterMigrationBasisDatabaseFields = attributeMap => {
        const migrationBasis = attributeMap['MigrationBasis'];
        return ko.computed(() => {
          const basis = ModelEditHelper.getDerivedValue(migrationBasis.observable());
          return !isUndefined(basis) && basis !== 'database';
        });
      };

      this.clusterMigrationBasisConsensusFields = attributeMap => {
        const migrationBasis = attributeMap['MigrationBasis'];
        return ko.computed(() => {
          const basis = ModelEditHelper.getDerivedValue(migrationBasis.observable());
          return basis !== 'consensus';
        });
      };

      this.clusterMessagingUnicastFields = attributeMap => {
        const clusterMessagingMode = attributeMap['ClusterMessagingMode'];
        return ko.computed(() => {
          const mode = ModelEditHelper.getDerivedValue(clusterMessagingMode.observable());
          return !isUndefined(mode) && mode !== 'unicast';
        });
      };

      this.clusterMessagingMulticastFields = attributeMap => {
        const clusterMessagingMode = attributeMap['ClusterMessagingMode'];
        return ko.computed(() => {
          const mode = ModelEditHelper.getDerivedValue(clusterMessagingMode.observable());
          return mode !== 'multicast';
        });
      };

      this.clusterTypeWANFields = attributeMap => {
        const clusterType = attributeMap['ClusterType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(clusterType.observable());
          return type !== 'wan';
        });
      };

      this.clusterCalculatedMachineNamesFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'CalculatedMachineNames');
      };

      this.nodeManagerShellTypeFields = attributeMap => {
        const nodeManagerType = attributeMap['NMType'];
        return ko.computed(() => {
          let nmType = ModelEditHelper.getDerivedValue(nodeManagerType.observable());
          if (!!nmType) {
            nmType = nmType.toLowerCase();
          }
          return nmType !== 'rsh' && nmType !== 'ssh';
        });
      };

      this.unixNodeManagerPostBindGIDFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'PostBindGIDEnabled');
      };

      this.unixNodeManagerPostBindUIDFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'PostBindUIDEnabled');
      };

      this.serverListenPortFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'ListenPortEnabled', true);
      };

      this.serverBuzzFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'BuzzEnabled');
      };

      this.serverTunnelingFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'TunnelingEnabled');
      };

      this.serverIIOPFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'IIOPEnabled', true);
      };

      this.serverTGIOPFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'TGIOPEnabled', true);
      };

      this.serverUse81StyleExecuteQueuesFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'Use81StyleExecuteQueues');
      };

      this.serverCOMNativeModeFields = attributeMap => {
        this._disableFieldsUsingBooleanAttribute(attributeMap, 'NativeModeEnabled');
      };

      this.serverHealthScoreServiceFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'Enabled');
      };

      this.serverNetworkAccessPointEnabledFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'Enabled', true);
      };

      this.serverNetworkAccessPointOutboundFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'OutboundEnabled');
      };

      this.serverNetworkAccessPointHostnameVerificationFields = attributeMap => {
        const hostnameVerificationIgnored = attributeMap['HostnameVerificationIgnored'];
        return ko.computed(() => {
          const ignored = ModelEditHelper.getDerivedValue(hostnameVerificationIgnored.observable());
          return !!ignored;
        });
      };

      this.serverDiagnosticConfigFileArchiveFields = attributeMap => {
        const archiveType = attributeMap['DiagnosticDataArchiveType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(archiveType.observable());
          return !isUndefined(type) && type !== 'FileStoreArchive';
        });
      };

      this.serverDiagnosticConfigJDBCArchiveFields = attributeMap => {
        const archiveType = attributeMap['DiagnosticDataArchiveType'];
        return ko.computed(() => {
          const type = ModelEditHelper.getDerivedValue(archiveType.observable());
          return type !== 'JDBCArchive';
        });
      };

      this.serverSSLListenPortFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'Enabled', true);
      };

      this.serverSSLClientCertFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'UseClientCertForOutbound');
      };

      this.serverWebServerKeepAliveFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'KeepAliveEnabled');
      };

      this.serverWebServerLogFormatExtendedFields = attributeMap => {
        const logFileFormat = attributeMap['LogFileFormat'];
        return ko.computed(() => {
          const format = ModelEditHelper.getDerivedValue(logFileFormat.observable());
          return format !== 'extended';
        });
      };

      this.serverWebServiceBufferingQueueFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'Enabled');
      };

      this.serverWebServiceLogicalStorePersistenceStrategyLocalAccessFields = attributeMap => {
        const persistenceStrategy = attributeMap['PersistenceStrategy'];
        return ko.computed(() => {
          const strategy = ModelEditHelper.getDerivedValue(persistenceStrategy.observable());
          return !isUndefined(strategy) && strategy !== 'LOCAL_ACCESS_ONLY';
        });
      };

      this.domainDbPassiveModeFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'DbPassiveMode');
      };

      this.jdbcXaParamsSetXaTransactionTimeoutFields = attributeMap => {
        return this._disableFieldsUsingBooleanAttribute(attributeMap, 'XaSetTransactionTimeout');
      };

      this.rcuDbInfoDbTypeEBRFields = attributeMap => {
        const rcuDbType = attributeMap['rcu_database_type'];
        return ko.computed(() => {
          const dbType = ModelEditHelper.getDerivedValue(rcuDbType.observable());
          return dbType !== 'EBR';
        });
      };

      this.rcuDbInfoDbTypeSQLServerFields = attributeMap => {
        const rcuDbType = attributeMap['rcu_database_type'];
        return ko.computed(() => {
          const dbType = ModelEditHelper.getDerivedValue(rcuDbType.observable());
          return dbType !== 'SQLSERVER';
        });
      };

      this._disableFieldsUsingBooleanAttribute = (attributeMap, booleanAttributeName, enableOnUndefined = false) => {
        const fieldObservable = attributeMap[booleanAttributeName];
        return ko.computed(() => {
          let enabled = ModelEditHelper.getDerivedValue(fieldObservable.observable());
          if (isUndefined(enabled) && enableOnUndefined) {
            enabled = true;
          }
          return !enabled;
        });
      };

      function isUndefined(value) {
        return (value === undefined) || (value === null);
      }
    }

    // return a singleton instance
    return new MetaHandlers();
  }
);
