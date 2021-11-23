---
title: "Prerequisites"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 1
description: "Install the prerequisite requirements."
---


WebLogic Kubernetes Toolkit UI has a number of prerequisites that must be installed locally to fully use the
WKT UI application functionality.  

These include:

- Java Development Kit (JDK) - Required by both WebLogic Deploy Tooling and WebLogic Image Tool.
  Install a JDK version that is compatible with your local WebLogic Server installation.
- WebLogic Server (WLS) - Required by WebLogic Deploy Tooling.  Install a WebLogic Server version
  12.2.1.3.0 or later; it is a best practice to install the latest Patch Set Updates (PSUs) and other recommended patches. The
  application uses WebLogic Server to gain access to the WebLogic Server Scripting Tool (WLST) and other related artifacts to use
  as a client.
- `docker` (or `podman`) - Required to create images locally and interact with image registries.
- `kubectl` - Required to interact with your Kubernetes cluster.  Install a version that is
  compatible with your Kubernetes cluster version.  For more information, see the Kubernetes `Client Configuration` page in the UI.
- Cloud Provider's Command-Line Interface (CLI) tool -  If your Kubernetes cluster is running in one of the cloud
  provider's managed Kubernetes services, then you will need to download and install the cloud provider's CLI.  This is
  typically required to configure `kubectl` to properly authenticate to the Kubernetes cluster. Again, see the Kubernetes
  `Client Configuration` page for more information about configuring `kubectl` to work with your cluster.
- `helm` - Helm version 3.3.2 or later. Required to install the WebLogic Kubernetes Operator and to install an ingress controller.
- `openssl` - Used to generate an X.509 TLS certificate for ingress routes, should you ask the application
  to generate one for you.

The WKT UI application is built using the Electron framework and as such, we support only the platforms and versions supported by [Electron](https://www.electronjs.org/docs/latest/tutorial/support#supported-platforms).  For example, because of the Electron requirement for Fedora 24 or newer, we support only versions 8.0 and higher of Oracle Linux, RedHat Linux, and CentOS Linux.

In addition to these local software dependencies, you will need a Kubernetes cluster to which you can deploy your
containerized WebLogic Server domain and its applications.  If you do not already have a model, then you can either write
one by hand using the WKT UI application or discover the model from an existing domain.  Most likely, you'll want to start
with a WebLogic domain that can be used to discover the model from the domain.

#### Linux Prerequisites

- For RPM-based systems, such as Oracle, RedHat, CentOS, and some others:

   - For storing credentials in the OS native credentials store, you must have a desktop environment. If your system does not have a graphical desktop environment, then you can install one; for example, installing GNOME Desktop on Oracle Linux:

   https://support.oracle.com/knowledge/Oracle%20Linux%20and%20Virtualization/2717454_1.html

   - For storing credentials as an encrypted project file, and for a minimum GUI requirement, make sure the following packages are installed in your system:
    ```
    sudo dnf update
    sudo dnf install libxshmfence libdrm.x86_64 libgbm alsa-lib xauth atk-devel.x86_64 java-atk-wrapper.x86_64
    sudo reboot
    ```
- For Debian-based systems, such as Ubuntu and Debian:

   - For storing credentials in the OS native credentials store, you must have a desktop environment. If your system does not have a graphical desktop environment, then you can install one; for example, installing GNOME on Ubuntu 20x:
   ```
   sudo apt install gnome-session gdm3
   sudo reboot
   ```
