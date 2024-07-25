+++
title = "Release 1.7.1"
date = 2022-11-03T12:48:00-05:00
weight = 87
pre = "<b> </b>"
+++

### Changes in Release 1.7.1
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

#### Major New Features
None

#### Other Changes
- #297 - Removed the default value for the WebLogic Kubernetes Operator image tag so that the default image 
  specified by the Helm chart is used.

#### Bug Fixes
- #296 - Changed the API Group for traefik to be compatible with Traefik 3.0 

#### Known Issues
- On Mac, the embedded version of WDT 4.1.0 does not include the jansi-2.4.1 JAR file that WDT's interactive Model Help
  tool requires due to an Apple requirement to sign the native code inside this third-party JAR file. User's can either
  install their own version of WDT or copy the jar file from another install if they really need to use it from the
  embedded location.
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- Verrazzano installation does not support a multicluster installation.
- Verrazzano Application components Ingress Trait Rules table's URL column does not properly account for multicluster
  applications.  The Update URL button will only get information from the admin (i.e., `local`) cluster.
