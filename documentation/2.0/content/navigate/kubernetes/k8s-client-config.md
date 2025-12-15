---
title: "Client Configuration"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 1
description: "Client Configuration helps you get the necessary connectivity to your Kubernetes cluster."
---



### Contents

- [Client Configuration](#client-configuration)
    - [Authentication with Managed Kubernetes Clusters](#authentication-with-managed-kubernetes-clusters)
    - [Verify Connectivity](#verify-connectivity)

### Client Configuration
`Client Configuration` helps you get the necessary connectivity to your Kubernetes
cluster.  Use the `Kubernetes Cluster Type` field to select the target Kubernetes cluster type to show instructions for
configuring `kubectl` to successfully connect to the cluster.

- The `Kubectl Executable to Use` field tells the WKT UI application where to find the correct version of `kubectl`
to use.
- By using the `Kubernetes Client Config File(s)` field, you can specify a different Kubernetes client configuration
file instead of, or in addition to, the default `.kube/config` file from your home directory.  
- For environments where the client is configured to connect to multiple clusters, use the
`Kubernetes Config Context to Use` field to specify the configuration file's context associated with the cluster to
which you want to connect.  
- The `Helm Executable to Use` field tells the application where to find Helm, which is used to install the WebLogic
Kubernetes Operator and ingress controllers.  For more information
about Helm, see the [Helm](https://helm.sh/) documentation.

#### Authentication with Managed Kubernetes Clusters
Most cloud vendors require the use of their command-line tooling to authenticate `kubectl` connections to their managed
Kubernetes clusters.  For example, after `kubectl` is configured to connect to a Kubernetes cluster managed by the
Oracle Kubernetes Engine (OKE), the Kubernetes client configuration file will have a section that looks similar to the
one shown here.

```
users:
- name: user-abcdefghi8d
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: oci
      args:
      - ce
      - cluster
      - generate-token
      - --cluster-id
      - ocid1.cluster.oc1.phx.aaaaaaaaahdirjdmcjfpogfkdhjsdhshssk2abcdefghijk2d
      - --region
      - us-phoenix-1
      env: []
```

This configuration causes each `kubectl` invocation that references this user definition to execute the `oci` command
(the Oracle Cloud command-line tool) to get the credentials necessary to successfully authenticate to the cluster.
If the `oci` executable is not in a directory in the `PATH` environment variable when the `kubectl` command is executed,
then an error similar to the one shown here will occur.

```
Failed to verify Kubernetes client connectivity: Unable to verify Kubernetes client connectivity:
Command failed: /Users/rpatrick/bin/kubectl version --short
Unable to connect to the server: getting credentials: exec: executable oci not found

It looks like you are trying to use a client-go credential plugin that is not installed.

To learn more about this feature, consult the documentation available at:
https://kubernetes.io/docs/reference/access-authn-authz/authentication/#client-go-credential-plugins.
```

#### Verify Connectivity
To verify the application configuration for connecting to the specified Kubernetes cluster,
use the `Verify Connectivity` button on the `Client Configuration` page or
`Go` > `Verify Kubernetes Client Connection`.
