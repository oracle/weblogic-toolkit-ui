+++
title = "WebLogic Kubernetes Operator"
date = 2019-02-22T15:27:38-05:00
weight =7
pre = "<b> </b>"
+++

These Quick Start guide sections are for users interested in using a Kubernetes cluster without Verrazzano.  Anyone using OpenShift should following this track.

1. [Configure]({{< relref "/setup/quickstart/qs-kubernetes/k8s-client-config.md" >}}) your Kubernetes client (`kubectl`)
   to connect to the Kubernetes cluster.
2. [Install WebLogic Kubernetes Operator]({{< relref "/setup/quickstart/qs-kubernetes/k8s-wko.md" >}}).
3. [Deploy the Domain]({{< relref "/setup/quickstart/qs-kubernetes/k8s-weblogic-domain.md" >}}).
4. [Install and Configure the Ingress Controller]({{< relref "/setup/quickstart/qs-kubernetes/k8s-ingress-controller.md" >}})
   and add ingress routes to allow access to the WebLogic domain from outside the Kubernetes cluster.
5. [Access the ToDo List application]({{< relref "/setup/quickstart/qs-kubernetes/k8s-access-app.md" >}}).
