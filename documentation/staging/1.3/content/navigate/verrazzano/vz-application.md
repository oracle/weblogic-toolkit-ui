---
title: "Application"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 4
description: "Define and deploy a Verrazzano application."
---

### Contents
- [Verrazzano Application](#verrazzano-application)
- [Design View](#design-view)
    - [Components](#components)
- [Code View](#code-view)
- [Deploy Application](#deploy-application)
- [Undeploy Application](#undeploy-application)


### Verrazzano Application
A Verrazzano application is comprised of Components. Components encapsulate application implementation details.
For detailed information, see [Applications](https://verrazzano.io/latest/docs/applications/) in the Verrazzano documentation.

### Design View
`Design View` lets you specify the data used to define an Verrazzano application.
Start by providing values for the following fields:

- `Application Name` - The name of the Verrazzano application.
- `Application Namespace` - The Kubernetes namespace to which the application will be deployed.
- `Application Version` - The version annotation value to add to the Verrazzano application.
- `Application Description` - The description annotation value to add to the Verrazzano application.
- `Verrazzano Version` - Provide the installed Verrazzano version. Click the icon to retrieve the value from the environment.
- `Use Multicluster Application` - Select whether to make this a multicluster application.
   - `Create Verrazzano Project` - To deploy a multicluster application, a Verrazzano Project that includes the current application's namespace must exist. Select whether to create
   a new Verrazzano Project.
   - `Secret Names` - The secret names in the current namespace to associate with the application. To edit this field, click `Choose Secrets`.
   - `Verrazzano Clusters for Application Placement` - The Verrazzano cluster names where the application should be placed. To edit this field, click `Choose Verrazzano Clusters`.

#### Components
You can apply Traits to customize Components for the environment. Traits customize Component workloads and generate related resources during deployment.

Use the `Add Components` button to apply Traits to your application:
- Ingress Trait - provides a simplified integration with the Istio Ingress Gateway included in the Verrazzano platform.
- Manual Scalar - lets you specify the desired replica count.
- Metrics Trait - provides a simplified integration with the Prometheus service included in the Verrazzano platform.
- Logging Trait - contains the configuration for an additional logging sidecar with a custom image and Fluentd configuration file.

### Code View
`Code View` displays a shell script for deploying the Verrazzano application for the WebLogic domain into Kubernetes
as well as the application YAML resource definition and project resource, if applicable.

If it is not already selected, then use the `Script Language` drop-down menu to choose the desired scripting language.  Note
that the application is providing a working sample script simply to show how the process might be automated.  Before
using the script, review the script and make any changes necessary for your environment. One typical change that
would be considered a best practice would be to change the script to accept either command-line arguments or externally
set environment variables to specify any credentials required by the script to eliminate hard-coding the credentials in
the script itself.  This change is left as an exercise for you because different environments typically will have
existing standards for securely handling such credentials.

### Deploy Application
`Deploy Application` deploys the application to Verrazzano. You access this action by using the `Deploy Domain` button
or the `Go` > `Deploy Verrazzano` menu item.

### Undeploy Application
`Undeploy Application` removes the Verrazzano application from the WebLogic domain and its
dependent objects in Kubernetes. Undeploying the application stops the pods associated with the application.
In addition, you can choose whether to also delete the corresponding namespace.
Removing the application namespace removes all applications, components, secrets, ConfigMaps, and other
Kubernetes objects that exist in the Kubernetes namespace. You access these actions by using the `Undeploy Domain` button
or the `Go` > `Undeploy Verrazzano Application` menu item.
