+++
title = "Release 1.6.1"
date = 2022-11-03T12:48:00-05:00
weight = 89
pre = "<b> </b>"
+++

### Changes in Release 1.6.1
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

#### Major New Features
None

#### Other Changes
None

#### Bug Fixes
- #281 - Fixed issue with Ingress Controller shell script not using `elif`.
- #282 - Fixed issue with busy dialog referencing "auxiliary image" while building a domain creation image.
- #283 - Fixed a typo in the Verrazzano application page in its reference to the Manual Scaler trait.
- #285 - Fixed issues with the Domain shell script when using JRF domains on a persistent volume.

#### Known Issues
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- Verrazzano installation does not support a multicluster installation.
- Verrazzano Application components Ingress Trait Rules table's URL column does not properly account for multicluster
  applications.  The Update URL button will only get information from the admin (i.e., `local`) cluster.
