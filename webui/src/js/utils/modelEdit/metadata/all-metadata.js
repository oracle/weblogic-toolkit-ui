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
    'text!./DomainInfo.json',
    'text!./JDBCSystemResource.json',
    'text!./Library.json',
    'text!./OPSSInitialization.json',
    'text!./RCUDbInfo.json',
    'text!./Server.json',
    'text!./Topology.json',
    'text!./WLSPolicies.json',
    'text!./WLSRoles.json',
    'text!./WLSUserPasswordCredentialMappings.json'
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
