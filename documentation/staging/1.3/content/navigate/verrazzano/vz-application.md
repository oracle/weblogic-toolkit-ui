---
title: "Application"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 4
description: "Define and deploy a Verrazzano application."
---

### Contents
- [Design View](#design-view)
    - [Components](#components)
- [Code View](#code-view)
- [Deploy Application](#deploy-application)
- [Undeploy Application](#undeploy-application)


### Design View
`Design View` lets you specify the data used to define the Verrazzano application.
Simply provide values for the following fields:

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


### Code View
`Code View` displays shell scripts for installing an ingress controller and for updating ingress routes.  It also
displays the YAML definitions of the routes to be added, if applicable.

If it is not already selected, then use the `Script Language` drop-down menu to choose the desired scripting language.  Note
that the application is providing a working sample script simply to show how the process might be automated.  Before
using the script, review the script and make any changes necessary for your environment. One typical change that
would be considered a best practice would be to change the script to accept either command-line arguments or externally
set environment variables to specify any credentials required by the script to eliminate hard-coding the credentials in
the script itself.  This change is left as an exercise for you because different environments typically will have
existing standards for securely handling such credentials.

### Deploy Application
`Deploy Application` creates the Domain custom resource object and any of its dependent objects (for example,
namespace, secrets, ConfigMap) in Kubernetes.  You access this action by using the `Deploy Domain` button on the
`WebLogic Domain` page or the `Go` > `Deploy WebLogic Domain to Kubernetes` menu item.

### Undeploy Application
`Undeploy Application` removes the Kubernetes custom resource for the WebLogic domain and its
dependent objects in Kubernetes. In addition, you can choose whether to also delete the corresponding namespace.
You access these actions by using the `Undeploy Domain` button on the
`WebLogic Domain` page or the `Go` > `Undeploy WebLogic Domain to Kubernetes` menu item.
