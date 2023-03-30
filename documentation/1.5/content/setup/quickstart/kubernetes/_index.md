+++
title = "WebLogic Kubernetes Operator"
date = 2019-02-22T15:27:38-05:00
weight = 9
pre = "<b> </b>"
+++

These sections in the Quick Start guide are for users interested in using a Kubernetes cluster without Verrazzano.  Anyone using OpenShift should following this track.

1. [Configure Kubernetes Cluster Connectivity]({{< relref "/setup/quickstart/kubernetes/k8s-client-config.md" >}}) for your Kubernetes client (`kubectl`) to connect to the Kubernetes cluster.
2. [Install the WebLogic Kubernetes Operator]({{< relref "/setup/quickstart/kubernetes/k8s-wko.md" >}}).
3. [Deploy the Domain]({{< relref "/setup/quickstart/kubernetes/k8s-weblogic-domain.md" >}}) to the WebLogic domain's `Domain` resource configuration used by WebLogic Kubernetes Operator.
4. [Install and Configure the Ingress Controller]({{< relref "/setup/quickstart/kubernetes/k8s-ingress-controller.md" >}}) and add ingress routes to allow access to the WebLogic domain from
   outside the Kubernetes cluster.
5. [Access the ToDo List application]({{< relref "/setup/quickstart/kubernetes/k8s-access-app.md" >}}).
