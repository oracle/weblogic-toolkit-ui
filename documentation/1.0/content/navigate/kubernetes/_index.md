+++
title = "Kubernetes"
date = 2019-02-22T15:27:38-05:00
weight = 5
pre = "<b> </b>"
+++

The `Kubernetes` section and its four subsections support deploying a WebLogic-based application to a
Kubernetes cluster where the WebLogic domain will be managed by the WebLogic Kubernetes Operator.  It includes sections
to help you:

1. [Configure]({{< relref "/navigate/kubernetes/k8s-client-config#client-configuration" >}})  your Kubernetes client (`kubectl`) to connect to the Kubernetes cluster.
1. [Install]({{< relref "/navigate/kubernetes/k8s-wko#install-operator" >}}) the WebLogic Kubernetes Operator.
1. [Deploy]({{< relref "/navigate/kubernetes/k8s-weblogic-domain#deploy-domain" >}}) the WebLogic domain's `Domain` resource configuration used by WebLogic Kubernetes Operator.
1. [Install]({{< relref "/navigate/kubernetes/k8s-ingress-controller#install-ingress-controller" >}}) an ingress controller, if needed, and add ingress routes to allow access to the WebLogic domain from
   outside the Kubernetes cluster.

{{% children style="h4" description="true" %}}
