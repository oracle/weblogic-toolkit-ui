---
title: "WebLogic Domain"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 3
description: "Create and deploy the Kubernetes custom resource for the WebLogic domain."
---

### Contents
- [WebLogic Domain](#weblogic-domain)
- [Design View](#design-view)
    - [Primary Image to Use for the Domain](#primary-image-to-use-for-the-domain)
    - [Auxiliary Image to Use for the Domain](#auxiliary-image-to-use-for-the-domain)
    - [Clusters](#clusters)
    - [Model Variables Overrides](#model-variables-overrides)
    - [Secrets](#secrets)
    - [Runtime Encryption Secret](#runtime-encryption-secret)
    - [WebLogic Kubernetes Operator Introspection Configuration](#weblogic-kubernetes-operator-introspection-configuration)
    - [Domain-Wide Server Settings](#domain-wide-server-settings)
- [Code View](#code-view)
- [Prepare Model](#prepare-model)
- [Deploy Domain](#deploy-domain)
- [Get Domain Status](#get-domain-status)

### WebLogic Domain
The `WebLogic Domain` section provides support for creating and deploying the Kubernetes custom resource for the WebLogic domain as
defined by the WebLogic Kubernetes Operator.  For more information, see
[Domain Resource](https://oracle.github.io/weblogic-kubernetes-operator/userguide/managing-domains/domain-resource/)
in the WebLogic Kubernetes Operator documentation.

### Design View
The `Design View` helps you specify the necessary data needed to generate the Domain resource definition and deploy
that resource into a Kubernetes cluster.

The `Domain UID` field defines the name of the Kubernetes Domain custom resource object.  This name must be unique
within the Kubernetes namespace where it will be created, which is controlled by the `Kubernetes Namespace` field.

The default value of the `Domain UID` field is based on the WebLogic domain's name, as defined by the WDT model:  

- When using either "Model in Image" or "Domain in Image" [domain location]({{< relref "/navigate/project-settings#choosing-a-domain-location" >}}),
the `Domain Home Path` field is read-only and its value is set using the `Domain Home Directory` field under `Advanced`.  
- When using "Domain in PV", this field must be set to the fully
qualified path to the domain home directory in the persistent volume.  For example, if the persistent volume mount
path is set to `/shared` and the domain home is located in `/domains/mydomain` in the persistent volume, then the
`Domain Home Path` field must be set to `/shared/domains/mydomain`.

For "Model in Image", use the `Domain Type` field to specify the type of domain to create using the model.

Set the Kubernetes secret name where the WebLogic domain credentials will be stored using the
`WebLogic Credentials Secret Name` field.  Set the value of the WebLogic Server administration credentials using the
`WebLogic Admin Username` and `WebLogic Admin Password` fields.  Remember that these fields must be set appropriately
for the selected domain location:

- For "Model in Image", these fields are used to set the WebLogic Server credentials used to create the domain, and
  by the operator at runtime to perform actions on the domain (for example, start a server).
- For "Domain in Image", the domain was created using the WebLogic Image Tool using the credentials specified in the
  model.  These values must match the ones used during the image creation process.
- For "Domain in PV", the domain was created outside the application so the values provided in these fields must match
  the ones used when the domain was created.

When using "Domain in PV", three additional fields associated with the persistent volume will be shown:

- `Persistent Volume Name` - The name of the persistent volume to use in the Domain resource file.
- `Persistent Volume Claim Name` - The persistent volume claim to associate with the persistent volume.
- `Persistent Volume Mount Path` - The path to the persistent volume within the container(s).
- `Enable Log Home` - Enables the ability to separate the logs directory from the domain directory on the persistent
  volume.
- `Log Home Path` - The path to use for the log home when `Enable Log Home` is enabled.

The following sections describe the other panes that support configuring the generated Domain resource; they are:

- [Primary Image to Use for the Domain](#primary-image-to-use-for-the-domain)
- [Auxiliary Image to Use for the Domain](#auxiliary-image-to-use-for-the-domain)
- [Clusters](#clusters)
- [Model Variables Overrides](#model-variables-overrides)
- [Secrets](#secrets)
- [Runtime Encryption Secret](#runtime-encryption-secret)
- [WebLogic Kubernetes Operator Introspection Configuration](#weblogic-kubernetes-operator-introspection-configuration)
- [Domain-Wide Server Settings](#domain-wide-server-settings)

#### Primary Image to Use for the Domain
This pane focuses on the container primary image to use to run the WebLogic Server domain in a container.   
- When using either "Model in Image" or "Domain in Image" [domain location]({{< relref "/navigate/project-settings#choosing-a-domain-location" >}}), the `Primary Image Tag` field is read-only; its value is set using the
`Image Tag` field in the `Image` section.  
- In the case of "Domain in PV", the `Image Tag` field is not read-only and _is_
the place to specify the image to use to run the WebLogic domain's containers.  
- The read-only `Image Registry Address` field is populated by parsing the value of the `Image Tag` field
to extract any container image registry address.  If the tag has no image registry address, then it is assumed to reside on Docker Hub.

Use the `Primary Image Pull Policy` field to specify when Kubernetes should pull the image from the specified image registry.
The choices are:

- `If Not Present` (default) - Only pull the image if it is not already present on the Kubernetes node.
- `Always` - Pull the image every time the image is needed to start a container.
- `Never` - Never pull the image; this will result in an error if the image is not already present on the Kubernetes node.

If pulling the image from the specified image registry does not require authentication,
then `Specify Image Pull Credentials` should be disabled.  When enabled, use the `Use Existing Image Pull Secret` field to tell the application
whether to use an existing image pull secret or create a new one.  Specify the image pull secret name in the
`Image Pull Secret Name` field.  When creating a new secret, specify the secret data using the
`Image Registry Pull Username`, `Image Registry Pull Email Address`, and `Image Registry Pull Password` fields.  

#### Auxiliary Image to Use for the Domain

For "Model in Image" domains only, this pane focuses on the container auxiliary image to use for the domain.
- The `Auxiliary Image Tag` field is read-only; its value is set using the
`Auxiliary Image Tag` field in the `Auxiliary Image` page of the `Image` section.
- Use the `Auxiliary Image Pull Policy` field to specify when to pull the domain's auxiliary image from the image registry. The choices are:

   - `If Not Present` (default) - Only pull the image if it is not already present.
   - `Always` - Pull the image every time the image is needed to start a container.
   - `Never` - Never pull the image; this will result in an error if the image is not already present.

If pulling the image from the specified image registry does not require authentication,
then `Specify Auxiliary Image Pull Credentials` should be disabled.  When enabled, use the `Use Existing Auxiliary Image Pull Secret` field to tell the application
whether to use an existing image pull secret or create a new one.  Specify the image pull secret name in the
`Auxiliary Image Pull Secret Name` field.  When creating a new secret, specify the secret data using the
`Auxiliary Image Registry Pull Username`, `Auxiliary Image Registry Pull Email Address`, and `Auxiliary Image Registry Pull Password` fields.


#### Clusters
The Clusters pane lists the names of each cluster in the model and lets you adjust the WebLogic Server
startup configuration and Kubernetes resource requests and limits.  It is currently populated when `Prepare Model` is run,
which means that projects using "Domain in PV" will not have access to adjust the configuration at the cluster level.
"Domain in PV" projects can still use the `Domain-Wide Server Settings` pane under `Advanced`.

To view or edit the settings for a cluster, select the edit icon at the right end of the cluster's row in the
table.  This opens a dialog that shows all the cluster-related fields and their values.  The read-only
`Cluster Name` field shows the name of the cluster, as specified in the underlying model.  

Use the `Replicas` field to adjust the number of managed servers that the WebLogic Kubernetes Operator should start when the domain is deployed.
The default value for the `Replicas` field is set based on the maximum number of servers specified by the model:  
- In the case of a static cluster, it will be the number of servers that are configured to be part of the cluster.
- When using a dynamic cluster, the value is set based on the maximum number of servers that the dynamic cluster allows.  
- This default value also serves as the upper limit for the `Replicas` field. In other words, you may only reduce the number of
replicas.  It is not possible to increase the replica count above the maximum limit defined by the model.

Use the `Minimum Heap Size` and `Maximum Heap Size` fields to control the amount of Java heap space available for each
server in the cluster.  Specify any additional Java command-line options with the `Additional Java Options`
field.  

`Disable debug logging to standard out` disables WebLogic Server debug log messages from being
written to standard out.  In WebLogic Server 12.2.1.3.0, there is an issue that impacts the Oracle JDBC driver
processing FAN (Fast Application Notification) events from an Oracle Database.  To work around this issue, enable
`Disable Oracle JDBC Support for FAN Events`.  

`Use pseudo-random number generator` controls whether
WebLogic Server uses the pseudo-random number generator (that is, `/dev/urandom`) or the regular random number generator
(that is, `/dev/random`).  Because the latter is impacted by the available entropy, it can negatively impact performance when
running WebLogic Server on a virtual machine or in a container.  Because the servers being configured by this application
will always be running in a container, the default is set to use the pseudo-random number generator.

The Kubernetes resource requests and limits values help the Kubernetes scheduler determine which node to use to start
a container (to ensure there are sufficient resources available for the container to run).  The following fields allow
these values to be specified:

- `Kubernetes CPU Request` - The requested amount of CPU for each managed server's container.
- `Kubernetes CPU Limit` - The maximum amount of CPU each managed server's container is allowed to use.
- `Kubernetes Memory Request` - The requested amount of memory for each managed server's container.
- `Kubernetes Memory Limit` - The maximum amount of memory each managed server's container is allowed to use.

For more information about these fields and setting their values, see the [Kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#meaning-of-memory).

#### Model Variables Overrides
Use this pane to override values of model variables when using "Model in Image" to customize the model data already set
in the image.  For example, the image may contain a variable whose value refers to a JDBC URL to connect to a database.
Because the image may be used across development, test, and production environments, overriding the JDBC URL to point to
the correct database for the environment helps make the same image usable across all three environments.  All override
values are added to a Kubernetes ConfigMap that is passed to the WebLogic Kubernetes Operator so that it creates the
underlying WebLogic Server domain with the correct values for the environment.

If the model has one or more variables, then the `Kubernetes Config Map Name` field is visible and allows the name of the
Kubernetes ConfigMap name to be controlled.  The table will be populated with the model variables, as defined by the
model variables file.  Because the model variables file is typically already set in the image by the time you
reach this page, both the `Model Variable Name` and the `Model Variable File Value` entries are read-only.  Enter an
`Model Variable Override Value` for any variable whose `Model Variable File Value` should be overridden.  Note that the
ConfigMap will only be created if one or more variables have an override value specified.

#### Secrets
When using "Model in Image", use this pane to set the value of any secrets referenced in the model (other than the WebLogic administrator credentials
secret).  The secrets that appear in the table are pulled from the model file directly;
as such, the `Secret Name` field is read-only.  Set the appropriate `Username` and `Password` field values for each
secret in the table.  These values are required and will be used to create or update the secret with the specified
values.

#### Runtime Encryption Secret
When using "Model in Image", the WebLogic Kubernetes Operator requires a runtime encryption secret it uses to encrypt
sensitive WebLogic Server domain data stored in Kubernetes.  For more information, see
[Required runtime encryption secret](https://oracle.github.io/weblogic-kubernetes-operator/userguide/managing-domains/model-in-image/usage/#required-runtime-encryption-secret)
in the WebLogic Kubernetes Operator documentation.

Use the `Runtime Encryption Secret Name` field to control the name of the secret, if needed.  Typically, the default
name is sufficient.  The `Runtime Encryption Secret Value` field's default value is generated but may be changed, if
desired.  

#### WebLogic Kubernetes Operator Introspection Configuration
This pane controls the WebLogic Kubernetes Operator introspection job configuration.  Use the
`Introspection Job Active Deadline Seconds` field to control how long the operator waits for the introspection job to
complete.  The application sets the default to 900 seconds (15 minutes); this overrides the underlying default of 120
seconds (2 minutes) built into the operator.  As such, clearing the value of this field will cause the effective value
to be set to 120 seconds.

#### Domain-Wide Server Settings
This pane lets you adjust the WebLogic Server startup configuration and Kubernetes resource requests and
limits default values for every WebLogic Server container in the WebLogic Server domain.  Any fields set here will be
applied only if they are not overridden elsewhere.  For example, setting the `Minimum Heap Size` will set
WebLogic Server's minimum heap size to the specified value only if the cluster to which the server belongs does not
override the minimum heap size.  For typical domains with an Administration Server and one or more clusters, the best practice is
to use this section to configure the Administration Server and use the `Clusters` pane to configure each cluster explicitly.

The fields in this pane have similar meaning to the equivalent fields previously described in
[Clusters](#clusters); refer to that section for more information.

### Code View
The `Code View` displays a shell script for deploying the domain and creating its dependent resources as well as
the YAML definition for the Kubernetes custom resource (that is, the Domain resource) and the Model Variables Overrides
ConfigMap, if applicable.

If it is not already selected, then use the `Script Language` drop-down menu to choose the desired scripting language.  Note
that the application is providing a working sample script simply to show how the process might be automated.  Before
using the script, review the script and make any changes necessary for your environment. One typical change that
would be considered a best practice would be to change the script to accept either command-line arguments or externally
set environment variables to specify any credentials required by the script to eliminate hard-coding the credentials in
the script itself.  This change is left as an exercise for you because different environments typically will have
existing standards for securely handling such credentials.

### Prepare Model
`Prepare Model` is the same as was previously described in the [`Model`]({{< relref "/navigate/model#prepare-model" >}})  section.  It is only
surfaced here because the `Clusters` pane of the `Design View` is populated only when `Prepare Model` is run.

### Deploy Domain
`Deploy Domain` creates the Domain custom resource object and any of its dependent objects (for example,
namespace, secrets, ConfigMap) in Kubernetes.  You can access it by using the `Deploy Domain` button on the
`WebLogic Domain` page or `Go` > `Deploy WebLogic Domain to Kubernetes`.  As previously
mentioned, this action also updates the operator configuration, if needed, and reruns the operator Helm chart to ensure
that the new namespace is manageable by the WebLogic Kubernetes Operator configured for this project.  

`Deploy Domain` completes as soon as the objects are created and the operator Helm chart execution completes.  At some point
after the action completes, the operator will detect a new (or updated) version of the Domain custom resource object and
start a new introspection job to create the domain and start or restart the WebLogic Server containers.  `Get Domain Status`
provides the current status of the last `Deploy Domain` action.

### Get Domain Status
To view the current status of the last domain deployment, use the `Get Domain Status` button or the
`Go` > `Get WebLogic Domain Status`.  This action retrieves and displays the domain deployment
status, as provided by the WebLogic Kubernetes Operator.
