---
title: "WebLogic Kubernetes Operator"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
description: "Install the WebLogic Kubernetes Operator in the target Kubernetes cluster."
---



### Contents
- [WebLogic Kubernetes Operator](#weblogic-kubernetes-operator)
- [Design View](#design-view)
    - [WebLogic Kubernetes Operator Image](#weblogic-kubernetes-operator-image)
    - [Image Pull Secret](#image-pull-secret)
    - [Kubernetes Namespace Selection Strategy](#kubernetes-namespace-selection-strategy)
    - [WebLogic Kubernetes Operator Role Bindings](#weblogic-kubernetes-operator-role-bindings)
    - [External REST API Access](#external-rest-api-access)
    - [Third Party Integrations](#third-party-integrations)
    - [Java Logging](#java-logging)
- [Code View](#code-view)
- [Install Operator](#install-operator)
- [Update Operator](#update-operator)
- [Uninstall Operator](#uninstall-operator)

### WebLogic Kubernetes Operator
This section provides support for installing the WebLogic Kubernetes Operator (the "operator") in the target Kubernetes cluster.
For detailed information about the operator, see the
[WebLogic Kubernetes Operator](https://oracle.github.io/weblogic-kubernetes-operator/) documentation.

### Design View
The `Design View` helps you specify the necessary data needed to install the WebLogic Kubernetes Operator to manage
WebLogic domains in one or more Kubernetes namespaces.  To install the operator using the default settings, simply
provide values for the following three fields:

- `Kubernetes Namespace` - The Kubernetes namespace to which to install the operator.
- `Kubernetes Service Account` - The Kubernetes service account for the operator to use when making Kubernetes API
  requests.
- `Helm Release Name to Use for Operator Installation` - The Helm release name to use to identify this installation.

{{% notice note %}}
The WKT UI application overrides a few default values in the operator Helm Chart.  Read the details of the parameters descriptions in
[Kubernetes Namespace Selection Strategy](#kubernetes-namespace-selection-strategy).  These panes and their fields are made visible by expanding the
`Advanced` portion of the page.
{{% /notice %}}

#### WebLogic Kubernetes Operator Image
By default, the operator's `Image Tag to Use` field is set to the image tag corresponding to the latest operator
release version on the GitHub Container Registry.  The `Image Pull Policy` field configures the operator deployment in
Kubernetes to tell it when to pull the image from the specified registry:

- `If Not Present` (default) - Only pull the image if it is not already present on the Kubernetes node.
- `Always` - Pull the image every time the image is needed to start a container.
- `Never` - Never pull the image; this will result in an error if the image is not already present on the Kubernetes node.

Because the GitHub Container Registry does not require image pull authentication to pull the official WebLogic Kubernetes
Operator image, `Image Pull Requires Authentication` is disabled by default.  If a custom
operator image is being used from a container image registry that requires pull authentication, then enable the option
and complete the appropriate fields described in the [Image Pull Secret](#image-pull-secret)
pane that follows.

#### Image Pull Secret
This pane is hidden unless the `Image Pull Requires Authentication` from the WebLogic Kubernetes Operator Image pane
is enabled.  To allow Kubernetes to pull the custom operator image requiring pull authentication, use the
`Kubernetes Image Pull Secret Name` field to provide the name of the Kubernetes secret to use for the credentials.  To
have the application create this secret, disable `Use Existing Secret` and provide the values for the following
fields:

- `Image Pull Secret Email Address` - The email address of the user.
- `Image Pull Secret Username` - The user name to use when authenticating to the container image registry.
- `Image Pull Secret Password` - The user's password to use when authenticating to the container image registry.

The read-only `Image Registry Address` field is parsed from the `Image Tag to Use` field.  If the
`Image Registry Address` field is empty, then the application will assume that Docker Hub is the target container image
registry to use when creating the pull secret.

#### Kubernetes Namespace Selection Strategy
The operator needs to know which WebLogic domains in the Kubernetes cluster that it will manage.  It does this at the
Kubernetes namespace level, so any WebLogic domain in a Kubernetes namespace the operator is configured to manage, will
be managed by the operator instance being installed.  Use the `Kubernetes Namespace Selection Strategy` field to choose
the desired namespace selection strategy from one of the supported values:

- `Label Selector` (default) - Any Kubernetes namespace with a specified label will be managed by this operator.
- `List` - Any Kubernetes namespace in the provided list will be managed by this operator.
- `Regular Expression` - Any Kubernetes namespace whose name matches the provided regular expression will be managed
    by this operator.
- `Dedicated` - Only the Kubernetes namespace where the operator is installed will be managed by this operator.

_**Note** that the operator Helm chart default is `List` but the application overrides this to specify `Label Selector` as
the default value._

Each namespace selection strategy takes different input values; the form fields will change based on the strategy
selected:

- When using the `Label Selector` strategy, the `Kubernetes Namespace Label Selector` field will appear with a default
value that aligns with the Helm chart default value.  
- The `Regular Expression` strategy uses the required
`Kubernetes Namespaces Regular Expression` field to specify the regular expression to use for matching the Kubernetes
namespaces that the operator should manage.  
- Selecting the `List` strategy will cause the `Kubernetes Namespaces to Manage` field to appear with a list containing
the `default` namespace; this aligns with the default value in the Helm chart.  
    - Removing the `default` namespace is fine and will result in an empty list.  
    - Note that when deploying the domain with an operator using the `List` strategy, the
application will automatically add the new domain's Kubernetes namespace to the list specified list, if needed.  As
such, specifying an empty list will not prevent your WebLogic domain from being managed by the operator.
- `Dedicated` is self-defining so no additional fields are necessary.

#### WebLogic Kubernetes Operator Role Bindings
When installing the operator, the operator Helm chart default is to create a Kubernetes Role and a Kubernetes RoleBinding
in each Kubernetes namespace being managed by the operator.  By enabling `Enable Cluster Role Binding`, the
operator installation will create a Kubernetes ClusterRole and ClusterRoleBinding that the operator will use for all managed
namespaces.  This ClusterRole and ClusterRoleBinding will be shared across all operator installations in the Kubernetes
cluster (assuming that those installations also enable cluster role binding).

Using the default namespace-specific roles and role bindings, the administrator follows the Principle of Least
Privilege to guarantee that the operator cannot perform any actions on other, non-managed namespaces.  The implication
of this configuration is that because the operator service account does not have permission to create roles and role
bindings, any new namespace added for the operator to manage does not have the necessary role and role binding needed
for the operator to manage the namespace.  Rerunning the operator Helm chart with the operator configured to manage the
new namespaces will cause the Helm chart to create the necessary Role and RoleBinding objects in each namespace,
as needed.

If the operator is using the ClusterRole and ClusterRoleBinding, then the new namespaces will be automatically picked up by
the operator when using either the `Label Selector` or `Regular Expression` namespace selection strategy without any
need to rerun the operator Helm chart.

As previously mentioned, the WKT UI application automatically reruns the operator Helm chart when deploying new WebLogic
domains to ensure that the new domain's namespace is being managed by the operator.

#### External REST API Access
By default, the operator's REST API is not exposed outside the Kubernetes cluster.  To enable the REST API to be
exposed, enable `Expose REST API Externally`, set the desired HTTPS port using the
`External REST API HTTPS Port` field, and name of the Kubernetes TLS secret to use in the
`External REST API Identity Secret Name` field.  For more information, see the WebLogic Kubernetes Operator
[Rest API](https://oracle.github.io/weblogic-kubernetes-operator/userguide/managing-operators/the-rest-api/) documentation.

#### Third Party Integrations
To enable integration with the Elasticsearch, Logstash, and Kibana (ELK) stack, enable `ELK Integration Enabled` and provide values for the
following fields.

- `Logstash Image Tag to Use` - The container image of `logstash` to use.
- `Elasticsearch Host Name` - The DNS name of IP address of the Elasticsearch server.
- `Elasticsearch Port` - The port number for the Elasticsearch server.

For more information, see [Elastic Stack integration](https://oracle.github.io/weblogic-kubernetes-operator/userguide/managing-operators/#optional-elastic-stack-elasticsearch-logstash-and-kibana-integration)
in the WebLogic Kubernetes Operator documentation.

#### Java Logging
This pane lets you override the operator's Java logging configuration, which can be useful when debugging issues
with the operator.  Use the `Logging Level` field to customize the minimum log level written to the log file.  The
`Log File Size Limit` field sets the maximum size of a single operator log file while the `Log File Count` limits the
maximum number of retained log files.  For more information, see
[Operator Helm configuration values](https://oracle.github.io/weblogic-kubernetes-operator/userguide/managing-operators/using-helm/#operator-helm-configuration-values)
in the WebLogic Kubernetes Operator documentation.

### Code View
The `WebLogic Operator` page's `Code View` displays a shell script that you can use as a starting point for automating the
operator installation process.  

If it is not already selected, then use the `Script Language` drop-down menu to choose the desired scripting language.  Note
that the application is providing a working sample script to show how the process might be automated.  Before
using the script, review the script and make any changes necessary for your environment. One typical change that
would be considered a best practice would be to change the script to accept either command-line arguments or externally
set environment variables to specify any credentials required by the script to eliminate hard-coding the credentials in
the script itself.  This change is left as an exercise for you because different environments typically will have
existing standards for securely handling such credentials.

### Install Operator
`Install Operator` installs the WebLogic Kubernetes Operator in the target Kubernetes cluster.
You access this action by using the `Install Operator` button on the
`WebLogic Operator` page or the `Go` > `Install WebLogic Kubernetes Operator` menu item.

At a high level, `Install Operator` performs the following steps:

1. Validates the input values necessary for running the action based on your selections.
2. Saves the WKT Project, if needed.
3. Creates the Kubernetes namespace for installing the operator, if needed.
4. Creates the Kubernetes service account for the operator to use, if needed.
5. Creates the operator image pull secret, if needed.
6. Adds the latest operator Helm chart to the local Helm repository.
7. Runs Helm to install the operator using the specified configuration.

### Update Operator

`Update Operator` updates the settings on a running WebLogic Kubernetes Operator by using the `helm upgrade` command.
You access this action by using the `Update Operator` button on the
`WebLogic Operator` page or the `Go` > `Update WebLogic Kubernetes Operator` menu item.

`Update Operator` applies all the changes to the operator that you have specified on the page. For example,
you can change the operator image version, the domain namespace selection strategy, Java logging level,
or the value of any field in the WebLogic Kubernetes Operator section.   

### Uninstall Operator

`Uninstall Operator` uses the `helm uninstall` command to remove the WebLogic Kubernetes Operator and its associated
resources from the Kubernetes cluster. In addition, you can choose whether to also delete the corresponding namespace.
You access these actions by using the `Uninstall Operator` button on the
`WebLogic Operator` page or the `Go` > `Uninstall WebLogic Kubernetes Operator` menu item.

Note that if you uninstall an operator, then any domains that it is managing will continue running; however,
any changes to a domain resource that was managed by the operator will not be detected or automatically handled,
and, if you want to clean up such a domain, then you will need to manually delete all of the domain's resources (domain, pods, services, and such).
