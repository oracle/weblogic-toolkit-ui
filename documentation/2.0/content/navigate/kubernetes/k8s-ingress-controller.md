---
title: "Ingress Controller"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 4
description: "Install an ingress controller, if needed, and add ingress routes to allow access to the WebLogic domain from outside the Kubernetes cluster."
---

### Contents
- [Ingress Controller](#ingress-controller)
- [Design View](#design-view)
    - [Ingress Controller Configuration](#ingress-controller-configuration)
    - [TLS Secret for Ingress Routes](#tls-secret-for-ingress-routes)
    - [Ingress Routes Configuration](#ingress-routes-configuration)
- [Code View](#code-view)
- [Install Ingress Controller](#install-ingress-controller)
- [Update Ingress Routes](#update-ingress-routes)
- [Uninstall Ingress Controller](#uninstall-ingress-controller)

### Ingress Controller
This section supports two distinct functions related to an ingress controller.  First, it supports installing an ingress
controller to a Kubernetes cluster.  Second, it supports adding the necessary routes to an ingress controller to make
a deployed WebLogic domain's endpoints accessible.

### Design View
`Design View` helps you specify the data needed to install an ingress controller, if desired, and
specify the data needed to expose one or more endpoints for a deployed WebLogic domain.  This page contains three panes:

- [Ingress Controller Configuration](#ingress-controller-configuration)
- [TLS Secret for Ingress Routes](#tls-secret-for-ingress-routes)
- [Ingress Routes Configuration](#ingress-routes-configuration)

#### Ingress Controller Configuration
The most important field in this pane is the `Ingress Provider` field.  This fields tells the WKT UI application with
which of the supported ingress controllers it will need to work.  The current release supports two ingress
controllers:

- NGINX
- Traefik

To install the ingress controller, enable `Install Ingress Controller`.  
- To set the release name used by the Helm install process, use the `Helm Release Name to Use` field.  
- Set the Kubernetes namespace to which the ingress controller should be installed with the
`Ingress Controller Namespace` field.  

The container image for the Traefik ingress controller resides in Docker Hub.  Due to changes made
to Docker Hub, anonymous pull requests are throttled.  This can result in pull requests being denied when the Kubernetes
cluster attempts to pull the image and start the container.  
- To work around this limitation, enable the `Use Docker Hub Secret` field to provide login credentials for Docker Hub.  
- The `Docker Registry Secret Name` field specifies the name of the Kubernetes pull secret to use when pulling the image.
To create this secret, enable `Create Docker Hub Secret` and fill in the `Docker Hub Image Registry Pull Credentials`
field, using `Add Image Registry Credentials` button so create a new entry, as needed.
- For the NGINX ingress controller, if you want to have SSL pass through the ingress route, enable 
`Allow SSL pass through to target service`.  

#### TLS Secret for Ingress Routes
Use this pane to configure the Transport Layer Security (TLS) secret containing the certificate and private key data
that will be used by the ingress controller when establishing HTTPS connections from clients to the ingress controller.
The TLS connection will be terminated at the ingress controller, so traffic between the ingress controller and 
services/pods will not be encrypted.  In the current release, only a single TLS certificate is supported for the routes
being defined.

- To use TLS-enabled routes, enable `Use Ingress TLS Secret` and provide the secret name using the
`Ingress TLS Secret Name` field.  
- To have the application create this secret, enable `Create Ingress TLS Secret`.  
- If you already have a certificate file and its corresponding private key file, then use the `TLS Certificate File`
and `TLS Private Key File` fields to provide them.  
- To create these files automatically, enable `Generate a TLS Certificate and Private Key`.  
   - Provide the path to the OpenSSL executable using the
`OpenSSL Executable to Use` field.  
   - Use the `Subject to Use for the Generated TLS Certificate` field to specify the data
to put into the subject of the certificate.  
      - For example, if your ingress route will use the virtual host name
`www.myapp.com`, you might specify the subject contents as `/CN=www.myapp.com`.  
      - The subject data will support multiple
key/value pairs using a comma-separated syntax, like `/key1=value1,/key2=value2,/key3=value3`.

#### Ingress Routes Configuration
Use the table in this section to define the ingress routes to be added by the application.  _Note that this table does
not currently display existing routes already defined._  Any routes defined in or removed from the table will happen in
the WKT Project object.  When applying or updating the routes, only the fields currently in the table will be
considered.  If the routes do not exist, then they will be added.  If one or more of the routes already exists, then the
application will warn you to confirm whether you want to update the existing route or routes before performing the
operation.

To add a new route, click the plus (`+`) button in the table header.  To edit a route, use the edit button on the
corresponding route row.  To remove a route, use the delete icon on the corresponding route row.

When editing a route:
- Use the `Name` field to set the route name.  
- Use the `Virtual Host` and `Path Expression` fields to define the matching rules that determine which requests match
this route.  
- All requests in the defined rules are routed to the service specified by the `Target Service` field that resides in
  the namespace specified by the read-only `Target Service Namespace` field and the port specified by the `Target Port` 
  field. After the domain has been deployed, you can select the `Target Service` value from the drop-down list of
  available services in the WebLogic Kubernetes Operator domain's namespace. After the `Target Service` is selected,
  you can select the `Target Port` from the list of available ports in the selected target service.
- Specify the `Transport Option` for the ingress route:
    * Select `Plain HTTP` for unencrypted traffic from the client through the ingress controller to the target service.
    * Select `SSL terminate at ingress controller` for SSL
      terminating
      at the ingress controller and then unencrypted traffic from the ingress controller to the target service.  
      * Enable `Is target service WebLogic Console?` if the target service is the `WebLogic Console` service.  
    * Select `SSL pass through` for SSL traffic to pass through the ingress
      controller and then terminate at the target service.  
      * If you select this option, you must also specify a valid DNS value in 'Virtual Host', and all SSL traffic from
        the`Virtual Host` will be routed to the target service.  
      * Make sure that the `Target Port` supports SSL.
- Use the `Ingress Route Annotations` table to
add annotations to the ingress route, as needed.  Do not remove any pre-populated annotations.

### Code View
`Code View` displays shell scripts for installing an ingress controller and for updating ingress routes.  It also
displays the YAML definitions of the routes to be added, if applicable.

If it is not already selected, then use the `Script Language` drop-down menu to choose the desired scripting language.
Note that the application is providing a working sample script simply to show how the process might be automated.
Before using the script, review the script and make any changes necessary for your environment. One typical change that
would be considered a best practice would be to change the script to accept either command-line arguments or externally
set environment variables to specify any credentials required by the script to eliminate hard-coding the credentials in
the script itself.  This change is left as an exercise for you because different environments typically will have
existing standards for securely handling such credentials.

### Install Ingress Controller
`Install Ingress Controller` creates any namespace and secret specified and runs the ingress controller's Helm
chart to install the ingress controller.  You access this action by using the `Install Ingress Controller` button on the
`Ingress Controller` page or the `Go` > `Install Ingress Controller` menu item.

### Update Ingress Routes
`Update Ingress Routes` creates the TLS secret, if needed, and adds or updates the specified ingress routes. You access
this action by using the `Update Ingress Routes` button on the `Ingress Controller` page or
the `Go` > `Update Ingress Routes to Domain` menu item.

### Uninstall Ingress Controller
`Uninstall Ingress Controller` uses the `helm uninstall` command to remove all the ingress resources
and uninstall the ingress controller. In addition, you can choose whether to also delete the corresponding namespace.
You access these actions by using the `Uninstall Ingress Controller` button on the
`Ingress Controller` page or the `Go` > `Uninstall Ingress Controller` menu item.
