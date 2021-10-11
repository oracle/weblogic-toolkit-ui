## Contents
- [Kubernetes](#kubernetes)
- [Client Configuration](#client-configuration)
    - [Authentication with Managed Kubernetes Clusters](#authentication-with-managed-kubernetes-clusters)
    - [Verify Connectivity](#verify-connectivity)
- [WebLogic Kubernetes Operator](site/k8s-wko.md)
- [WebLogic Domain](site/k8s-weblogic-domain.md)
- [Ingress Controller](site/k8s-ingress-controller.md)


## Kubernetes
The `Kubernetes` section and its four subsections support deploying a WebLogic-based application to a
Kubernetes cluster where the WebLogic domain will be managed by the WebLogic Kubernetes Operator.  It includes sections
to help you:

1. [Configure](#client-configuration) your Kubernetes client (`kubectl`) to connect to the Kubernetes cluster.
2. [Install](k8s-wko.md#install-operator) the WebLogic Kubernetes Operator.
3. [Deploy](k8s-weblogic-domain.md#deploy-domain) the WebLogic domain's `Domain` resource configuration used by WebLogic Kubernetes Operator.
4. [Install](k8s-ingress-controller.md#install-ingress-controller) an ingress controller, if needed, and add ingress routes to allow access to the WebLogic domain from
   outside the Kubernetes cluster.

## Client Configuration
`Client Configuration` helps you get the necessary connectivity to your Kubernetes
cluster.  Use the `Kubernetes Cluster Type` field to select the target Kubernetes cluster type to show instructions for
configuring `kubectl` to successfully connect to the cluster.

- The `Kubectl Executable to Use` field tells the WKT UI application where to find the correct version of `kubectl` to use.
- By using the `Kubernetes Client Config File(s)` field, you can specify a different Kubernetes client configuration
file instead of, or in addition to, the default `.kube/config` file from your home directory.  
- For environments where the client is configured to connect to multiple clusters, use the `Kubernetes Config Context to Use` field to
specify the configuration file's context associated with the cluster to which you want to connect.  
- The `Helm Executable to Use` field tells the application where to find Helm, which is used to install the WebLogic
Kubernetes Operator and ingress controllers.  For more information
about Helm, see the [Helm](https://helm.sh/) documentation.

### Authentication with Managed Kubernetes Clusters
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

When running the application on Windows or Linux, add the appropriate directory to the `PATH` environment variable and make sure to
run the application with that environment.  On MacOS, things are a bit more complicated.

When running the WKT UI application on MacOS, the application inherits the environment of a daemon process called `launchd` instead
of your environment.  By default, the `launchd` environment contains only a few core directories on the `PATH`
(that is, `/usr/bin`, `/bin`, `/usr/sbin`, and `/sbin`).  This will cause `kubectl` invocations requiring access to one of
the cloud providers' command-line tooling to fail if the tool is not found in one of those locations.  While it is
possible for an administrative user to change the environment that `launchd` uses to address this issue, the application
provides the `Extra Kubernetes Client Path Directories` field to explicitly add the directory where the cloud providers'
command-line tooling is installed, to the `PATH` that the application uses to invoke `kubectl`.  Note that this field
is only visible when running the application on MacOS.

### Verify Connectivity
To verify the application configuration for connecting to the specified Kubernetes cluster,
use the `Verify Connectivity` button on the `Client Configuration` page or
`Go` > `Verify Kubernetes Client Connection`.
