---
title: "Configure Kubernetes Cluster Connectivity"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 1
description: "Client Configuration helps you get the necessary connectivity to your Kubernetes cluster."
---

First, you need to configure your Kubernetes Client (`kubectl`) to connect and authenticate to your Kubernetes cluster.  

Go to the `Verrazzano` > `Client Configuration` page, as shown in the following image.  

{{< img "VZ Kubernetes Client Connectivity" "images/vz-kubernetes-client-connectivity.png" >}}

By selecting the appropriate `Kubernetes Cluster Type`, the instructions panel will display the steps needed to properly configure `kubectl`.  Please select your `Kubernetes Cluster Type` and follow the instructions (including the linked instructions) until you can successfully connect using `kubectl` from the command line.  (Because these steps are generally well-documented and well-tested, we will not repeat them here.)  For those running on macOS, please remember to do any macOS-specific step, which is only visible when the WKTUI application is running on macOS.  For example, Step 4 in the preceding image.

Verrazzano supports multiple clusters and all Verrazzano installations have an administrative cluster, whose name is always `local`.  For our example, we will use the admin cluster with no managed clusters.  

After invoking `kubectl` from the command line, connects to the target Kubernetes cluster, fill out the rest of the form.  It is always best to select the appropriate `Kubectl Config Context to Use` for your project.  Because you may have multiple `Kubernetes Client Config Files`, select the appropriate one to use first.  Then, you can use either the Chooser icon or the Get Current Context icon to get the appropriate context value from the specified file.  In the preceding image, the context is named `vz` only because you edited the configuration file to change the OKE-generated context name to one you could recognize.  Prior to proceeding, please run **Verify Connectivity**.
