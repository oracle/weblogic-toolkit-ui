/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/modelEdit/model-edit-helper'],
  function (ko, ModelEditHelper) {
    function MetaOptions() {
      const TARGET_FOLDERS = ['Cluster', 'Server', 'MigratableTarget'];
      const JMS_TARGET_FOLDERS = ['JMSServer', 'SAFAgent'];

      /**
       * Get the options list (possibly an observableArray)
       * @param details the object containing options/optionsMap
       * @param attribute the attribute
       * @param attributeMap the attribute map
       * @param subscriptions the subscriptions
       */
      this.getOptions = (details, attribute, attributeMap, subscriptions) => {
        let options = details.options || [];
        const optionsMethod = details.optionsMethod;
        if(optionsMethod) {
          options = this[optionsMethod](attribute, attributeMap, subscriptions);
        }
        ModelEditHelper.updateOptionLabels(options);
        return options;
      };

      this.targetOptions = () => {
        const adminServerName = getAdminServerName();
        const options = [
          { value: adminServerName, label: adminServerName },
        ];
        TARGET_FOLDERS.forEach(folder => {
          const names = getInstanceNames(['topology', folder]);
          names.forEach(name => {
            if (name !== adminServerName) {
              options.push({ value: name, label: name });
            }
          });
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

      this.getServerGroupTargetOptions = () => {
        const options = [...this.getServerOptions()];

        const clustersModelPath = ['topology', 'Cluster'];
        const clusterNames = getInstanceNames(clustersModelPath);
        clusterNames.forEach(clusterName => {
          const dynamicServersFolder = ModelEditHelper.getFolder([...clustersModelPath, clusterName, 'DynamicServers']);
          if (!dynamicServersFolder || !dynamicServersFolder['ServerTemplate']) {
            options.push({ value: clusterName, label: clusterName });
          }
        });
        return options;
      };

      this.dynamicClusterServerGroupTargetOptions = () => {
        const options = [];
        const modelPath = ['topology', 'Cluster'];
        const clusterNames = getInstanceNames(modelPath);
        clusterNames.forEach(clusterName => {
          const dynamicServersFolder = ModelEditHelper.getFolder([...modelPath, clusterName, 'DynamicServers']);
          if (!!dynamicServersFolder && 'ServerTemplate' in dynamicServersFolder && !!dynamicServersFolder['ServerTemplate']) {
            options.push({ value: clusterName, label: clusterName });
          }
        });
        return options;
      };

      this.getDefaultRealmOptions = () => {
        const defaultRealmName = 'myrealm';
        const options = [
          { value: defaultRealmName, label: defaultRealmName },
        ];
        const realmNames = getInstanceNames(['topology', 'SecurityConfiguration', 'Realm']);
        realmNames.forEach(name => {
          if (name !== defaultRealmName) {
            options.push({ value: name, label: name });
          }
        });
        return options;
      };

      this.getCertIssuerPluginCredentialSetOptions = () => {
        const options = [];
        const credentialSetNames = getInstanceNames(['topology', 'SecurityConfiguration', 'CredentialSet']);
        credentialSetNames.forEach(credentialSetName => options.push({ value: credentialSetName, label: credentialSetName }));
        return options;
      };

      this.getCertIssuerPluginDeploymentOptions = () => {
        const defaultOciCertIssuerDeploymentName = 'cert-issuer-for-oci-cert-svc';
        const options = [
          { value: defaultOciCertIssuerDeploymentName, label: defaultOciCertIssuerDeploymentName }
        ];
        const pluginDeploymentNames = getInstanceNames(['appDeployments', 'PluginDeployment']);
        pluginDeploymentNames.forEach(pluginDeploymentName => {
          if (pluginDeploymentName !== defaultOciCertIssuerDeploymentName) {
            options.push({ value: pluginDeploymentName, label: pluginDeploymentName });
          }
        });
        return options;
      };

      this.getCertPathBuilderInRealmOptions = (attribute) => {
        const modelPath = attribute.path;
        const options = [];
        const certPathProviderNames = getInstanceNames([...modelPath, 'CertPathProvider']);
        certPathProviderNames.forEach(certPathProviderName => options.push({ value: certPathProviderName, label: certPathProviderName }));
        return options;
      };

      this.getLogFilterOptions = () => {
        const options = [];
        const logFilterNames = getInstanceNames(['topology', 'LogFilter']);
        logFilterNames.forEach(logFilterName => {
          options.push({ value: logFilterName, label: logFilterName });
        });
        return options;
      };

      this.getJmsServerOptions = () => {
        const options = [];
        const jmsServerNames = getInstanceNames(['resources', 'JMSServer']);
        jmsServerNames.forEach(jmsServerName => {
          options.push({ value: jmsServerName, label: jmsServerName });
        });
        return options;
      };

      this.getPersistentStoreOptions = () => {
        const options = [];
        const persistentFileStoreNames = getInstanceNames(['resources', 'FileStore']);
        persistentFileStoreNames.forEach(persistentFileStoreName => {
          options.push({ value: persistentFileStoreName, label: persistentFileStoreName });
        });
        const persistentJdbcStoreNames = getInstanceNames(['resources', 'JDBCStore']);
        persistentJdbcStoreNames.forEach(persistentJdbcStoreName => {
          options.push({ value: persistentJdbcStoreName });
        });
        return options;
      };

      this.getDataSourceOptions = () => {
        const options = [];
        const dataSourceNames = getInstanceNames(['resources', 'JDBCSystemResource']);
        dataSourceNames.forEach(dataSourceName => {
          options.push({ value: dataSourceName, label: dataSourceName });
        });
        return options;
      };

      this.getDataSourceForMultiDataSourceOptions = (attribute) => {
        const options = [];
        const thisDataSourceName = attribute.path[2];
        console.log(`thisDataSourceName: ${thisDataSourceName}`);
        const dataSourceNames = getInstanceNames(['resources', 'JDBCSystemResource']);
        dataSourceNames.forEach(dataSourceName => {
          console.log(`dataSourceName: ${dataSourceName}`);
          if (dataSourceName !== thisDataSourceName) {
            const thisJdbcResourceFolder =
              ModelEditHelper.getFolder(['resources', 'JDBCSystemResource', dataSourceName, 'JdbcResource']);
            const dataSourceType = thisJdbcResourceFolder['DatasourceType'];
            if (!dataSourceType || dataSourceType.toUpperCase() === 'GENERIC') {
              console.log(`adding dataSourceName ${dataSourceName} to the list of data sources`);
              options.push({ value: dataSourceName, label: dataSourceName });
            }
          }
        });
        return options;
      };

      this.getServerOptions = () => {
        const adminServerName = getAdminServerName();
        const options = [
          { value: adminServerName, label: adminServerName },
        ];
        const serverNames = getInstanceNames(['topology', 'Server']);
        serverNames.forEach(serverName => {
          if (serverName !== adminServerName) {
            options.push({ value: serverName, label: serverName });
          }
        });
        return options;
      };

      this.getServerTemplateOptions = () => {
        const options = [];
        const serverTemplateNames = getInstanceNames(['topology', 'ServerTemplate']);
        serverTemplateNames.forEach(serverTemplateName => {
          options.push({ value: serverTemplateName, label: serverTemplateName });
        });
        return options;
      };

      this.getClusterOptions = () => {
        const options = [];
        const clusterNames = getInstanceNames(['topology', 'Cluster']);
        clusterNames.forEach(clusterName => {
          options.push({ value: clusterName, label: clusterName });
        });
        return options;
      };

      this.getCoherenceClusterSystemResourceOptions = () => {
        const defaultCoherenceClusterName = 'defaultCoherenceCluster';
        const options = [
          { value: defaultCoherenceClusterName, label: defaultCoherenceClusterName }
        ];
        const coherenceClusterNames = getInstanceNames(['resources', 'CoherenceClusterSystemResource']);
        coherenceClusterNames.forEach(clusterName => {
          if (clusterName !== defaultCoherenceClusterName) {
            options.push({ value: clusterName, label: clusterName });
          }
        });
        return options;
      };

      this.getManagedServerOptions = () => {
        const adminServerName = getAdminServerName();
        const options = [];
        const serverNames = getInstanceNames(['topology', 'Server']);
        serverNames.forEach(serverName => {
          if (serverName !== adminServerName) {
            options.push({ value: serverName, label: serverName });
          }
        });
        return options;
      };

      // return an observableArray that changes with cluster selection.
      // add any subscriptions to the list to be cleaned up by caller.
      this.getServersInClusterOptions = (attribute, attributeMap, subscriptions) => {
        const clusterObservable = attributeMap['Cluster'].observable;
        const clusterName = clusterObservable();
        const optionsArray = ko.observableArray(getClusterServerOptions(clusterName));
        subscriptions.push(clusterObservable.subscribe(clusterName => {
          optionsArray(getClusterServerOptions(clusterName));
        }));
        return optionsArray;
      };

      this.getAllServersInClusterOptions = (attribute) => {
        const clusterName = attribute.path[2];
        const staticServerNames = getClusterServerOptions(clusterName);
        const dynamicServerNames = getClusterDynamicServersOptions(clusterName);
        return [...staticServerNames, ...dynamicServerNames];
      };

      this.getMachineOptions = () => {
        const options = [];
        const machineNames = getInstanceNames(['topology', 'Machine']);
        machineNames.forEach(machineName => {
          options.push({ value: machineName, label: machineName });
        });
        const unixMachineNames = getInstanceNames(['topology', 'UnixMachine']);
        unixMachineNames.forEach(unixMachineName => {
          options.push({ value: unixMachineName, label: unixMachineName });
        });
        return options;
      };

      this.getServerNetworkAccessPointOptions = (attribute) => {
        const modelPath = attribute.path;
        const options = [];
        const networkAccessPointNames = getInstanceNames([...modelPath, 'NetworkAccessPoint']);
        networkAccessPointNames.forEach(networkAccessPointName => {
          options.push({ value: networkAccessPointName, label: networkAccessPointName });
        });
        return options;
      };

      this.getWSReliableDeliveryPolicyOptions = () => {
        const options = [];
        const policyNames = getInstanceNames(['resources', 'WSReliableDeliveryPolicy']);
        policyNames.forEach(policyName => {
          options.push({ value: policyName, label: policyName });
        });
        return options;
      };

      this.getXmlEntityCacheOptions = () => {
        const options = [];
        const xmlEntityCacheNames = getInstanceNames(['topology', 'XMLEntityCache']);
        xmlEntityCacheNames.forEach(xmlEntityCacheName => {
          options.push({ value: xmlEntityCacheName, label: xmlEntityCacheName });
        });
        return options;
      };

      this.getXmlRegistryOptions = () => {
        const options = [];
        const xmlRegistryNames = getInstanceNames(['topology', 'XMLRegistry']);
        xmlRegistryNames.forEach(xmlRegistryName => {
          options.push({ value: xmlRegistryName, label: xmlRegistryName });
        });
        return options;
      };

      this.getAllNetworkAccessPointsOptions = () => {
        const options = [];
        const napNamesSet = new Set();

        const serverNames = getInstanceNames(['topology', 'Server']);
        serverNames.forEach(serverName => {
          const napNames = getInstanceNames(['topology', 'Server', serverName, 'NetworkAccessPoint']);
          napNames.forEach(napName => {
            napNamesSet.add(napName);
          });
        });

        const serverTemplateNames = getInstanceNames(['topology', 'ServerTemplate']);
        serverTemplateNames.forEach(serverTemplateName => {
          const napNames = getInstanceNames(['topology', 'ServerTemplate', serverTemplateName, 'NetworkAccessPoint']);
          napNames.forEach(napName => {
            napNamesSet.add(napName);
          });
        });

        const iterator = napNamesSet.values();
        for (let i = 0; i < napNamesSet.size; i++) {
          const name = iterator.next().value;
          options.push({ value: name, label: name });
        }
        return options;
      };

      this.getManagedExecutorServiceTemplateOptions = () => {
        const options = [];
        const mesTemplateNames = getInstanceNames(['resources', 'ManagedExecutorServiceTemplate']);
        mesTemplateNames.forEach(templateName => {
          options.push({ value: templateName, label: templateName });
        });
        return options;
      };

      this.getJmsSystemResourceOptions = () => {
        const options = [];
        const jmsSystemResourceNames = getInstanceNames(['resources', 'JMSSystemResource']);
        console.log(`jmsSystemResourceNames: ${JSON.stringify(jmsSystemResourceNames)}`);
        jmsSystemResourceNames.forEach(resourceName => {
          options.push({ value: resourceName, label: resourceName });
        });
        return options;
      };

      this.getTemplatesInJmsSystemResourceOptions = (attribute, attributeMap, subscriptions) => {
        const jmsSystemResourceObservable = attributeMap['TemporaryTemplateResource'].observable;
        const jmsSystemResourceName = jmsSystemResourceObservable();
        const optionsArray = ko.observableArray(getJmsModuleTemplateOptions(jmsSystemResourceName));
        subscriptions.push(jmsSystemResourceObservable.subscribe(jmsSystemResourceName => {
          optionsArray(getJmsModuleTemplateOptions(jmsSystemResourceName));
        }));
        return optionsArray;
      };

      this.getJmsSystemResourceSubDeploymentOptions = (attribute) => {
        const modelPath = attribute.path;
        // [ 'resources', 'JMSSystemResource', <module-name> ]
        const jmsSystemResourcePath = modelPath.slice(0, 3);
        const subDeploymentNames = getInstanceNames([...jmsSystemResourcePath, 'SubDeployment']);
        const options = [];
        subDeploymentNames.forEach(subDeploymentName => {
          options.push({ value: subDeploymentName, label: subDeploymentName });
        });
        return options;
      };

      this.getJmsSystemResourceDestinationKeyOptions = (attribute) => {
        return getJmsSystemResourceTypeOptions(attribute, 'DestinationKey');
      };

      this.getJmsSystemResourceQuotaOptions = (attribute) => {
        return getJmsSystemResourceTypeOptions(attribute, 'Quota');
      };

      this.getJmsSystemResourceTemplateOptions = (attribute) => {
        return getJmsSystemResourceTypeOptions(attribute, 'Template');
      };

      this.getJmsSystemResourceSAFErrorHandlingOptions = (attribute) => {
        return getJmsSystemResourceTypeOptions(attribute, 'SAFErrorHandling');
      };

      this.getJmsSystemResourceSAFRemoteContextOptions = (attribute) => {
        return getJmsSystemResourceTypeOptions(attribute, 'SAFRemoteContext');
      };

      this.getOdlHandlerOptions = (attribute) => {
        const modelPath = attribute.path;
        // [ 'resources', 'ODLConfiguration', <odl-config-name> ]
        const odlConfigurationPath = modelPath.slice(0, 3);
        const odlHandlerNames = getInstanceNames([...odlConfigurationPath, 'Handler']);
        const options = [];
        odlHandlerNames.forEach(handlerName => {
          options.push({ value: handlerName, label: handlerName });
        });
        return options;
      };

      this.getCapacityOptions = () => {
        const options = [];
        const capacityConstraintNames = getInstanceNames(['resources', 'SelfTuning', 'Capacity']);
        capacityConstraintNames.forEach(constraintName => {
          options.push({ value: constraintName, label: constraintName });
        });
        return options;
      };

      this.getContextRequestClassOptions = () => {
        const options = [];
        const contextRequestClassNames = getInstanceNames(['resources', 'SelfTuning', 'ContextRequestClass']);
        contextRequestClassNames.forEach(contextRequestClassName => {
          options.push({ value: contextRequestClassName, label: contextRequestClassName });
        });
        return options;
      };

      this.getFairShareRequestClassOptions = () => {
        const options = [];
        const fairShareRequestClassNames = getInstanceNames(['resources', 'SelfTuning', 'FairShareRequestClass']);
        fairShareRequestClassNames.forEach(className => {
          options.push({ value: className, label: className });
        });
        return options;
      };

      this.getMaxThreadsConstraintOptions = () => {
        const options = [];
        const maxThreadsConstraintNames = getInstanceNames(['resources', 'SelfTuning', 'MaxThreadsConstraint']);
        maxThreadsConstraintNames.forEach(constraintName => {
          options.push({ value: constraintName, label: constraintName });
        });
        return options;
      };

      this.getMinThreadsConstraintOptions = () => {
        const options = [];
        const minThreadsConstraintNames = getInstanceNames(['resources', 'SelfTuning', 'MinThreadsConstraint']);
        minThreadsConstraintNames.forEach(constraintName => {
          options.push({ value: constraintName, label: constraintName });
        });
        return options;
      };

      this.getResponseTimeRequestClassOptions = () => {
        const options = [];
        const responseTimeRequestClassNames = getInstanceNames(['resources', 'SelfTuning', 'ResponseTimeRequestClass']);
        responseTimeRequestClassNames.forEach(responseTimeRequestClassName => {
          options.push({ value: responseTimeRequestClassName, label: responseTimeRequestClassName });
        });
        return options;
      };

      this.getFairShareOrResponseTimeRequestClassOptions = () => {
        const options = [];
        const fairShareRequestClassNames = getInstanceNames(['resources', 'SelfTuning', 'FairShareRequestClass']);
        fairShareRequestClassNames.forEach(className => {
          options.push({ value: className, label: className });
        });
        const responseTimeRequestClassNames = getInstanceNames(['resources', 'SelfTuning', 'ResponseTimeRequestClass']);
        responseTimeRequestClassNames.forEach(className => {
          options.push({ value: className, label: className });
        });
        return options;
      };

      this.wldfSystemResourceWatchNotificationActionOptions = (attribute) => {
        const modelPath = attribute.path;
        const wldfWatchNotificationPath = [ ...modelPath.slice(0, 4), 'WatchNotification'];
        const heapDumpActionNames = getInstanceNames([...wldfWatchNotificationPath, 'HeapDumpAction']);
        const imageNotificationNames = getInstanceNames([...wldfWatchNotificationPath, 'ImageNotification']);
        const jmsNotificationNames = getInstanceNames([...wldfWatchNotificationPath, 'JMSNotification']);
        const jmxNotificationNames = getInstanceNames([...wldfWatchNotificationPath, 'JMXNotification']);
        const logActionNames = getInstanceNames([...wldfWatchNotificationPath, 'LogAction']);
        const restNotificationNames = getInstanceNames([...wldfWatchNotificationPath, 'RestNotification']);
        const scaleDownActionNames = getInstanceNames([...wldfWatchNotificationPath, 'ScaleDownAction']);
        const scaleUpActionNames = getInstanceNames([...wldfWatchNotificationPath, 'ScaleUpAction']);
        const scriptActionNames = getInstanceNames([...wldfWatchNotificationPath, 'ScriptAction']);
        const smtpNotificationNames = getInstanceNames([...wldfWatchNotificationPath, 'SMTPNotification']);
        const snmpNotificationNames = getInstanceNames([...wldfWatchNotificationPath, 'SNMPNotification']);
        const threadDumpActionNames = getInstanceNames([...wldfWatchNotificationPath, 'ThreadDumpAction']);

        const options = [];
        heapDumpActionNames.forEach(actionName => {
          options.push({ value: actionName, label: actionName });
        });
        imageNotificationNames.forEach(imageNotificationName => {
          options.push({ value: imageNotificationName, label: imageNotificationName });
        });
        jmsNotificationNames.forEach(jmsNotificationName => {
          options.push({ value: jmsNotificationName, label: jmsNotificationName });
        });
        jmxNotificationNames.forEach(jmxNotificationName => {
          options.push({ value: jmxNotificationName, label: jmxNotificationName });
        });
        logActionNames.forEach(logActionName => {
          options.push({ value: logActionName, label: logActionName });
        });
        restNotificationNames.forEach(restNotificationName => {
          options.push({ value: restNotificationName, label: restNotificationName });
        });
        scaleDownActionNames.forEach(scaleDownActionName => {
          options.push({ value: scaleDownActionName, label: scaleDownActionName });
        });
        scaleUpActionNames.forEach(scaleUpActionName => {
          options.push({ value: scaleUpActionName, label: scaleUpActionName });
        });
        scriptActionNames.forEach(scriptActionName => {
          options.push({ value: scriptActionName, label: scriptActionName });
        });
        smtpNotificationNames.forEach(smtpNotificationName => {
          options.push({ value: smtpNotificationName, label: smtpNotificationName });
        });
        snmpNotificationNames.forEach(snmpNotificationName => {
          options.push({ value: snmpNotificationName, label: snmpNotificationName });
        });
        threadDumpActionNames.forEach(threadDumpActionName => {
          options.push({ value: threadDumpActionName, label: threadDumpActionName });
        });
        return options;
      };

      function getJmsSystemResourceTypeOptions(attribute, typeName) {
        const modelPath = attribute.path;
        // [ 'resources', 'JMSSystemResource', <module-name>, 'JmsResource' ]
        const jmsResourcePath = modelPath.slice(0, 4);
        const options = [];
        const resourceTypeNames = getInstanceNames([...jmsResourcePath, typeName]);
        resourceTypeNames.forEach(resourceTypeName => {
          options.push({ value: resourceTypeName, label: resourceTypeName });
        });
        return options;
      }

      function getInstanceNames(modelPath) {
        const folder = ModelEditHelper.getFolder(modelPath);
        return Object.keys(folder);
      }

      function getAdminServerName() {
        let result = 'AdminServer';
        const folder = ModelEditHelper.getFolder(['topology']);
        if (folder.hasOwnProperty('AdminServerName') && folder.AdminServerName) {
          result = folder.AdminServerName;
        }
        return result;
      }

      function getJmsModuleTemplateOptions(jmsModuleName) {
        const templateOptions = [];
        if (jmsModuleName) {
          const templateNames = getInstanceNames(['resources', 'JMSSystemResource', jmsModuleName, 'JmsResource', 'Template']);
          templateNames.forEach(templateName => {
            templateOptions.push({ value: templateName, label: templateName });
          });
        }
        return templateOptions;
      }

      // return options for servers that are in the specified cluster
      function getClusterServerOptions(clusterName) {
        const serverOptions = [];
        if (clusterName) {
          const servers = ModelEditHelper.getFolder(['topology', 'Server']);
          Object.entries(servers).forEach(([name, server]) => {
            if (server['Cluster'] === clusterName) {
              serverOptions.push({value: name, label: name});
            }
          });
        }
        return serverOptions;
      }

      function getClusterDynamicServersOptions(clusterName) {
        const dynamicServerOptions = [];
        if (clusterName) {
          const dynamicServers = ModelEditHelper.getFolder(['topology', 'Cluster', clusterName, 'DynamicServers']);
          if (dynamicServers && 'DynamicClusterSize' in dynamicServers) {
            const serverNamePrefix = dynamicServers['ServerNamePrefix'] || `${clusterName}-`;
            const dynamicClusterSize = dynamicServers['DynamicClusterSize'] || `${clusterName}-`;
            const startingIndex = dynamicServers['ServerNameStartingIndex'] || 1;
            for (let idx = startingIndex; idx < (dynamicClusterSize + startingIndex); idx++) {
              const serverName = `${serverNamePrefix}${idx}`;
              dynamicServerOptions.push({value: serverName, label: serverName});
            }
          }
        }
        return dynamicServerOptions;
      }
    }

    // return a singleton instance
    return new MetaOptions();
  }
);
