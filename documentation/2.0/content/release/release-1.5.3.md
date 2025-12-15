+++
title = "Release 1.5.3"
date = 2022-02-07T12:48:00-05:00
weight = 90
pre = "<b> </b>"
+++

### Changes in Release 1.5.3
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)


#### Major New Features
None

#### Other Changes
- #242 - Added initial (very minimal) internationalization support bundles.
- #245 - Added an Ingress Controller Service Type field that can be used when installing an ingress controller to
         a Kubernetes cluster without a load balancer.

#### Bug Fixes
- #241 - Fixed a bug with the WebLogic Image Tool's `--wdtHome` argument when it ended with `weblogic-deploy`.
- #246 - Worked around a WebLogic Kubernetes Operator issue where the `javaLoggingFileSizeLimit` value was not working
         due to [Helm issue 1707](https://github.com/helm/helm/issues/1707).
- #247 - Fixed issue with Open Project when storing the credentials in the project and entering the wrong passphrase
         that was causing the UI to not allow re-opening the project.

#### Known Issues
- In the Model Design View when creating an App Deployment or Shared Library, changing the `Source` field back to an empty value
  results in a bogus error message about not removing the deployment from the archive file.  This error is harmless so simply
  dismiss the error dialog and continue.
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- Verrazzano installation does not support a multicluster installation.
