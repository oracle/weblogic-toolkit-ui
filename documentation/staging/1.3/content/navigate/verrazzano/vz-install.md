---
title: "Install Verrazzano"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
description: "Install Verrazzano in the target Kubernetes cluster."
---



### Contents
- [Verrazzano](#verrazzano)
- [Design View](#design-view)
- [Code View](#code-view)
- [Install Verrazzano](#install-verrazzano)
- [Check Verrazzano Installation Status](#check-verrazzano-installation-status)

### Verrazzano
This section provides support for installing Verrazzano in the target Kubernetes cluster.
For detailed information about Verrazzano, see the
[Verrazzano](https://verrazzano.io/latest/docs/) documentation.

### Design View
The `Design View` helps you specify the data needed to install Verrazzano to manage
WebLogic domains in one or more Kubernetes namespaces.  To install Verrazzano, simply
provide values for the following fields:

- `Install Name` - The name to give the Verrazzano object during installation.
- `Install Profile` - The Verrazzano installation profile; the choices are: `Dev` (default) and `Production`.
- `Release Version` - Required. Select a Verrazzano release version.
- `Install Jaeger` - Optional. Select whether to install the Jaeger transaction tracing component. If selected, then provide
   the percentage of Istio requests to be traced in Jaeger in the `Istio Tracing Sampling Rate` field.


### Code View
The `Install Script` displays a shell script that you can use as a starting point for automating the
Verrazzano installation process.   

If it is not already selected, then use the `Script Language` drop-down menu to choose the desired scripting language.  Note
that the application is providing a working sample script to show how the process might be automated.  Before
using the script, review the script and make any changes necessary for your environment. One typical change that
would be considered a best practice would be to change the script to accept either command-line arguments or externally
set environment variables to specify any credentials required by the script to eliminate hard-coding the credentials in
the script itself.  This change is left as an exercise for you because different environments typically will have
existing standards for securely handling such credentials.

The `Verrazzano Resource` displays the Verrazzano resource definition that you've specified.

### Install Verrazzano
`Install Verrazzano` installs Verrazzano in the target Kubernetes cluster.
You access this action by using the `Install Verrazzano` button on the
`Verrazzano` page or the `Go` > `Install Verrazzano` menu item.

### Check Verrazzano Installation Status

Initial Verrazzano installation proceeds quickly, however, to reach completion takes a somewhat longer time. Use
the `Check Verrazzano Install Status` button or the `Go` > `Check Verrazzano Install Status` menu item
to monitor its progress.
