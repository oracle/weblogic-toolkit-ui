---
title: "Install and Configure the Ingress Controller"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 4
description: "Install and configure an ingress controller."
---

While the domain is up and running, it is only accessible from inside the Kubernetes cluster.  Before you can expose your application, you need to install an ingress controller.  WKTUI can install the Traefik or NGINX ingress controllers.  In this exercise, you will use Traefik.  

Go to the `Kubernetes` > `Ingress Controller` page.  Even though the default settings should be sufficient, you will create an image pull secret for Docker Hub, as shown in the following image, to make sure that your cluster doesn’t encounter an error due to Docker Hub rate limiting of anonymous pull requests.  When ready, click **Install Ingress Controller**.  

{{< img "Ingress Controller" "images/ingress-controller.png" >}}

After the ingress controller is installed, next you will expose your application by creating an ingress route.

At the bottom of the page, click the plus sign on the `Ingress Routes Configuration` table to add a new route.  When the row appears, click the pencil icon to edit the route.  Set the fields of the route, as shown in the following image.

{{< img "Ingress Route" "images/ingress-route.png" >}}

 Notice that WKTUI has queried the services in the domain’s namespace and provides a drop-down menu from which to choose.  To route to your `mycluster` cluster, set the `Target Service` field to the `todolist-domain-cluster-mycluster` service, which the operator created automatically when deploying the domain.  This service is exposing only port `7100` so select that for the `Target Port`.  When finished, click **OK** to update the `Ingress Routes Configuration` table.

 Now that the ingress route is ready, click **Update Ingress Routes** to create the route.  The Update Ingress Routes action is a little different from other actions in WKTUI.  Most Kubernetes clusters use a single ingress controller that routes traffic for all applications in the Kubernetes cluster.  Because of the complexities of ingress controllers and their varying implementations, it is very difficult to know how to update an existing rule so WKTUI can only replace it.  Therefore, when WKTUI detects that one or more of the rules that you are trying to create already exists, it prompts you to verify that you want to overwrite the existing rule.
