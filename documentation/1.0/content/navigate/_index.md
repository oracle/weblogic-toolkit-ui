+++
title = "Navigate the UI"
date = 2019-02-22T15:27:38-05:00
weight = 3
pre = "<b> </b>"
+++

#### Before you begin

Make sure you have read [About the WKT UI Application]({{< relref "/concepts/_index.md" >}}).

#### About the UI

To help you understand how to use the WKT UI, we will step you through it, section by section,
describing the important decisions to make and fields to populate.  The sections are listed in
the left side navigation pane.  Depending on the `Kubernetes Environment Target Type` field
on the `Project Settings` page, you will see either the `Kubernetes` or `Verrazzano` section.  

The UI sections are:

- [Project Settings]({{< relref "/navigate/project-settings.md" >}})
- [Model]({{< relref "/navigate/model.md" >}})
- [Image]({{< relref "/navigate/image.md" >}})
- [Kubernetes]({{< relref "/navigate/kubernetes/_index.md" >}})
  - [Client Configuration]({{< relref "/navigate/kubernetes/k8s-client-config.md" >}})
  - [WebLogic Operator]({{< relref "/navigate/kubernetes/k8s-wko.md" >}})
  - [WebLogic Domain]({{< relref "/navigate/kubernetes/k8s-weblogic-domain.md" >}})
  - [Ingress Controller]({{< relref "/navigate/kubernetes/k8s-ingress-controller.md" >}})
- [Verrazzano]({{< relref "/navigate/verrazzano.md" >}})
  - Client Configuration
  - Application

At the bottom of the page, the collapsed `Console` panel automatically appears and displays the `stdout` and `stderr`
streams when running certain actions, such as `Prepare Model`.
