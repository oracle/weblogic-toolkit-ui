---
title: "Install the WebLogic Kubernetes Operator"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
description: "Install the WebLogic Kubernetes Operator in the target Kubernetes cluster."
---



The WebLogic Kubernetes Operator (WKO) manages WebLogic or FMW domains for a set of namespaces in a Kubernetes cluster.
While it is possible to install multiple operators that manage disparate sets of namespaces in a Kubernetes cluster,
typically, there is no need to do this.

To install the operator, go to the `Kubernetes` > `WebLogic Operator` page, verify the settings, and click
**Install Operator**.  For these exercises, you'll use the default values, as shown in the following image.

**WARNING**: Because WebLogic Kubernetes Operator installs Kubernetes Custom Resource Definitions and Kubernetes Web 
Hooks, the Kubernetes user will need cluster admin privileges run the installation directly from the WKT UI application.
If your account does not have sufficient privileges, please consult the WebLogic Kubernetes Operator
[documentation](https://oracle.github.io/weblogic-kubernetes-operator/managing-operators/preparation/#how-to-manually-install-the-d[…]ustom-resource-definitions-crd)
for more details.

{{< img "Install WKO" "images/install-wko.png" >}}

After the operator is installed successfully, you can move on to the next section.
