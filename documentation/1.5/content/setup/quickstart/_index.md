---
title: "Quick Start Guide"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 4
description: "Use the Quick Start guide to exercise WKT UI functionality and deploy a sample application."
---

This Quick Start guide provides a comprehensive tutorial designed to step you through WebLogic Kubernetes Toolkit UI (WKTUI)
functionality and familiarize you with its capabilities. WKTUI is a desktop application that helps you create and deploy WebLogic
domains into Kubernetes. Using this guide, you will deploy a sample WebLogic-based application to a Kubernetes cluster.

Note that this walk-through is for demonstration purposes _only_, not for use in production. These instructions assume that you are already familiar with Kubernetes.
For this exercise, you’ll need a Kubernetes cluster. If you need help setting one up, see these instructions for setting up an [Oracle Cloud Infrastructure
Container Engine for Kubernetes (OKE) cluster](https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengoverview.htm).

The Quick Start Guide is divided into the following sections:

- [Prerequisites]({{< relref "/setup/quickstart/prereqs.md" >}})
- [Get the ToDo List sample application]({{< relref "/setup/quickstart/get-todo-app.md" >}})
- [Set up the WKTUI application]({{< relref "/setup/quickstart/set-up-wktui-app.md" >}})
- [Select the Project Settings]({{< relref "/setup/quickstart/project-settings.md" >}})
- [Create the WebLogic Deploy Tooling model]({{< relref "/setup/quickstart/create-wdt-model.md" >}})
- [Create images with the WebLogic Image Tool]({{< relref "/setup/quickstart/create-images-with-wit.md" >}})
- WebLogic Kubernetes Operator (WKO) Track: follow these steps if you are interested in using a Kubernetes cluster without Verrazzano.
  - Configure Kubernetes cluster connectivity
  - Install the WebLogic Kubernetes Operator
  - Deploy the domain
  - Install and configure the ingress controller
  - Access the ToDo List application
- Verrazzano (VZ) Track: follow these steps if you are interested in using a Kubernetes cluster with Verrazzano.
  - Configure Kubernetes cluster connectivity
  - Install Verrazzano
  - Deploy the Verrazzano component for the WebLogic domain
  - Deploy the Verrazzano application
  - Access the ToDo List application
