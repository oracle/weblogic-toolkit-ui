+++
title = "Release 1.6.2"
date = 2022-02-10T12:48:00-05:00
weight = 87
pre = "<b> </b>"
+++

### Changes in Release 1.6.2
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

#### Major New Features
None

#### Other Changes
- #287 - Added support for WebLogic Kubernetes Operator domain specification's `precreateService` setting.

#### Bug Fixes
- #286 - Fixed an issue related to SSL termination and pass through Ingress resource generation.

#### Known Issues
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- Verrazzano installation does not support a multicluster installation.
- Verrazzano Application components Ingress Trait Rules table's URL column does not properly account for multicluster
  applications.  The Update URL button will only get information from the admin (i.e., `local`) cluster.
