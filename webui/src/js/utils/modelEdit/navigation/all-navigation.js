/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['text!./domain-info.json', 'text!./topology.json', 'text!./resources.json', 'text!./deployments.json'],
  function(domainInfo, topology, resources, deployments) {
    return [
      JSON.parse(domainInfo),
      JSON.parse(topology),
      JSON.parse(resources),
      JSON.parse(deployments)
    ];
  }
);
