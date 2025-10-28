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
    'text!./DomainInfo.json',
    'text!./FileStore.json',
    'text!./JDBCStore.json',
    'text!./JDBCSystemResource.json',
    'text!./JMSBridgeDestination.json',
    'text!./JMSServer.json',
    'text!./JMSSystemResource.json',
    'text!./Library.json',
    'text!./MessagingBridge.json',
    'text!./OPSSInitialization.json',
    'text!./PluginDeployment.json',
    'text!./RCUDbInfo.json',
    'text!./SAFAgent.json',
    'text!./SelfTuning.json',
    'text!./Server.json',
    'text!./ShutdownClass.json',
    'text!./SingletonService.json',
    'text!./StartupClass.json',
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
