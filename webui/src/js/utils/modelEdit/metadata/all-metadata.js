/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(
  [
    'text!./Application.json',
    'text!./Cluster.json',
    'text!./CoherenceClusterSystemResource.json',
    'text!./DbClientDataDirectory.json',
    'text!./Deployments.json',
    'text!./DomainInfo.json',
    'text!./EJBContainer.json',
    'text!./ForeignJNDIProvider.json',
    'text!./FileStore.json',
    'text!./JDBCStore.json',
    'text!./JDBCSystemResource.json',
    'text!./JMSBridgeDestination.json',
    'text!./JMSServer.json',
    'text!./JMSSystemResource.json',
    'text!./JoltConnectionPool.json',
    'text!./Library.json',
    'text!./MailSession.json',
    'text!./ManagedExecutorServiceTemplate.json',
    'text!./ManagedScheduledExecutorServiceTemplate.json',
    'text!./ManagedThreadFactoryTemplate.json',
    'text!./MessagingBridge.json',
    'text!./OPSSInitialization.json',
    'text!./ODLConfiguration.json',
    'text!./PathService.json',
    'text!./PluginDeployment.json',
    'text!./RCUDbInfo.json',
    'text!./Resources.json',
    'text!./SAFAgent.json',
    'text!./SelfTuning.json',
    'text!./Server.json',
    'text!./ShutdownClass.json',
    'text!./SingletonService.json',
    'text!./SNMPAgent.json',
    'text!./SnmpAgentDeployment.json',
    'text!./StartupClass.json',
    'text!./SystemComponent.json',
    'text!./Topology.json',
    'text!./WLDFSystemResource.json',
    'text!./WLSPolicies.json',
    'text!./WLSRoles.json',
    'text!./WLSUserPasswordCredentialMappings.json',
    'text!./WTCServer.json',
  ],
  function() {
    const allMetadata = {};
    for (const arg of arguments) {
      const jsonData = JSON.parse(arg);
      for (const key in jsonData) {
        allMetadata[key] = jsonData[key];
      }
    }
    return allMetadata;
  }
);
