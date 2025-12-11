+++
title = "Quick Start Guide"
date = 2019-02-22T15:27:38-05:00
weight = 4
pre = "<b> </b>"
description = "Use the Quick Start guide to exercise WKT UI functionality and deploy a sample application."
+++

This Quick Start guide provides a comprehensive tutorial designed to step you through WebLogic Kubernetes Toolkit UI 
(WKTUI) functionality and familiarize you with its capabilities. WKTUI is a desktop application that helps you create
and deploy WebLogic domains into Kubernetes. Using this guide, you will deploy a sample WebLogic-based application to a
Kubernetes cluster.

Note that this walk-through is for demonstration purposes _only_, not for use in production. These instructions assume
that you are already familiar with Kubernetes. For this exercise, you’ll need a Kubernetes cluster. If you need help
setting one up, see these instructions for setting up an
[Oracle Cloud Infrastructure Container Engine for Kubernetes (OKE) cluster](https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengoverview.htm).

The Quick Start guide is divided into the following sections:

- [Prerequisites]({{< relref "/setup/quickstart/prereqs.md" >}})
- [Get the ToDo List sample application]({{< relref "/setup/quickstart/get-todo-app.md" >}})
- [Set up the WKTUI application]({{< relref "/setup/quickstart/set-up-wktui-app.md" >}})
- [Select the Project Settings]({{< relref "/setup/quickstart/project-settings.md" >}})
- [Create the WebLogic Deploy Tooling model]({{< relref "/setup/quickstart/create-wdt-model.md" >}})
- [Create images with the WebLogic Image Tool]({{< relref "/setup/quickstart/create-images-with-wit.md" >}})
- [WebLogic Kubernetes Operator (WKO)]({{< relref "/setup/quickstart/qs-kubernetes/" >}})
  - [Configure Kubernetes Cluster Connectivity]({{< relref "/setup/quickstart/qs-kubernetes/k8s-client-config.md" >}})
  - [Install the WebLogic Kubernetes Operator]({{< relref "/setup/quickstart/qs-kubernetes/k8s-wko.md" >}})
  - [Deploy the Domain]({{< relref "/setup/quickstart/qs-kubernetes/k8s-weblogic-domain.md" >}})
  - [Install and Configure the Ingress Controller]({{< relref "/setup/quickstart/qs-kubernetes/k8s-ingress-controller.md" >}})
  - [Access the ToDo List Application]({{< relref "/setup/quickstart/qs-kubernetes/k8s-access-app.md" >}})
- [Summary]({{< relref "/setup/quickstart/qs-summary/" >}})
- [Advanced]({{< relref "/setup/quickstart/qs-advanced/" >}})
  - [Offline Discover]({{< relref "/setup/quickstart/qs-advanced/offline-discover.md" >}})
  - [Online Remote Discover]({{< relref "/setup/quickstart/qs-advanced/online-remote-discover.md" >}})
